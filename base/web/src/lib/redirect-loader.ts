// No `@/` and no relative value imports: that keeps it runnable under type stripping
// (`redirect-loader.test.mts`). Fail open: `null` means "no redirects", never "no site".

export interface RedirectLoaderOptions<TPayload> {
  read: () => Promise<TPayload>;
  now: () => number;
  ttlMs: number;
  retryMs: number;
  onError: (error: unknown) => void;
}

export const createRedirectLoader = <TPayload>({
  read,
  now,
  ttlMs,
  retryMs,
  onError,
}: RedirectLoaderOptions<TPayload>): (() => Promise<TPayload | null>) => {
  let memo: { value: TPayload; expiresAt: number } | null = null;
  let retryAt = 0;
  let inFlight: Promise<TPayload | null> | null = null;

  const refresh = async (): Promise<TPayload | null> => {
    try {
      const value = await read();

      memo = { value, expiresAt: now() + ttlMs };
      retryAt = 0;
    } catch (error) {
      onError(error);
      retryAt = now() + retryMs;
      // Serve what we last had, and try again shortly rather than after the TTL.
      if (memo) memo = { ...memo, expiresAt: retryAt };
    }

    return memo?.value ?? null;
  };

  return () => {
    const current = now();

    if (memo && current < memo.expiresAt) return Promise.resolve(memo.value);
    if (!memo && current < retryAt) return Promise.resolve(null);

    inFlight ??= refresh().finally(() => {
      inFlight = null;
    });

    return inFlight;
  };
};

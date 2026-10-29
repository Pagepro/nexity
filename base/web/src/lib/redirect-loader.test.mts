import assert from "node:assert/strict";
import test from "node:test";

import { createRedirectLoader } from "./redirect-loader.ts";

const TTL_MS = 60_000;
const RETRY_MS = 5_000;

/** A loader over a controllable clock and a read that records every call. */
const setup = (read: () => Promise<string>) => {
  const clock = { time: 1_000 };
  const calls = { count: 0, errors: 0 };
  const load = createRedirectLoader({
    read: () => {
      calls.count++;
      return read();
    },
    now: () => clock.time,
    ttlMs: TTL_MS,
    retryMs: RETRY_MS,
    onError: () => {
      calls.errors++;
    },
  });

  return { load, clock, calls };
};

test("concurrent callers share one read", async () => {
  let release: (value: string) => void = () => {};
  const { load, calls } = setup(
    () =>
      new Promise<string>((resolve) => {
        release = resolve;
      }),
  );

  const pending = [load(), load(), load()];
  release("map");

  assert.deepEqual(await Promise.all(pending), ["map", "map", "map"]);
  assert.equal(calls.count, 1);
});

test("a good payload is reused until the TTL, then read again", async () => {
  const { load, clock, calls } = setup(async () => "map");

  await load();
  clock.time += TTL_MS - 1;
  await load();
  assert.equal(calls.count, 1);

  clock.time += 1;
  await load();
  assert.equal(calls.count, 2);
});

test("a failure with no map returns null and does not re-read before the retry time", async () => {
  const { load, clock, calls } = setup(async () => {
    throw new Error("down");
  });

  assert.equal(await load(), null);
  assert.equal(calls.count, 1);
  assert.equal(calls.errors, 1);

  clock.time += RETRY_MS - 1;
  assert.equal(await load(), null);
  assert.equal(calls.count, 1);

  clock.time += 1;
  assert.equal(await load(), null);
  assert.equal(calls.count, 2);
});

test("a failure with a map serves the stale map and retries after the backoff", async () => {
  let shouldFail = false;
  const { load, clock, calls } = setup(async () => {
    if (shouldFail) throw new Error("down");
    return "map";
  });

  await load();
  shouldFail = true;
  clock.time += TTL_MS;

  assert.equal(await load(), "map");
  assert.equal(calls.count, 2);

  clock.time += RETRY_MS - 1;
  assert.equal(await load(), "map");
  assert.equal(calls.count, 2);

  shouldFail = false;
  clock.time += 1;
  assert.equal(await load(), "map");
  assert.equal(calls.count, 3);
});

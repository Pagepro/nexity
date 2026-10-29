const MAX_EMAIL_LENGTH = 254; // RFC 5321 max
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// STUB: validates and acknowledges, nothing is delivered. Real ESP delivery needs its
// API key in web/src/setup/envVariables.ts, plus rate limiting.
export async function POST(request: Request) {
  let email: unknown;

  try {
    const body = (await request.json()) as { email?: unknown };
    email = body.email;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const normalized = typeof email === "string" ? email.trim() : "";

  if (
    !normalized ||
    normalized.length > MAX_EMAIL_LENGTH ||
    !EMAIL_PATTERN.test(normalized)
  ) {
    return Response.json(
      { error: "Please enter a valid email address." },
      {
        status: 400,
      },
    );
  }

  // Deliver to the ESP here.
  return Response.json({ ok: true });
}

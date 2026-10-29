import { type NextRequest } from "next/server";
import { createHash, timingSafeEqual as cryptoTimingSafeEqual } from "node:crypto";

const [AUTH_USER, AUTH_PASS] = (process.env.HTTP_BASIC_AUTH || ":").split(":");

// Hashed first: timingSafeEqual throws on mismatched lengths, and the secret's length
// must not leak through timing. Needs the Node.js runtime (`node:crypto`).
function timingSafeEqual(left: string, right: string) {
  const leftDigest = createHash("sha256").update(left).digest();
  const rightDigest = createHash("sha256").update(right).digest();

  return cryptoTimingSafeEqual(leftDigest, rightDigest);
}

export function isAuthenticated(req: NextRequest) {
  if (!AUTH_USER || !AUTH_PASS) return true;

  const authheader = req.headers.get("authorization") || req.headers.get("Authorization");

  if (!authheader) {
    return false;
  }

  const auth = Buffer.from(authheader.split(" ")[1], "base64").toString().split(":");
  const user = auth[0] ?? "";
  const pass = auth[1] ?? "";

  // No short-circuit: a wrong user must not be distinguishable from a wrong password by timing.
  const userMatches = timingSafeEqual(user, AUTH_USER);
  const passMatches = timingSafeEqual(pass, AUTH_PASS);

  return userMatches && passMatches;
}

export const authenticationErrorHtml = `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Authentication Required</title>
			<style>
				* {
					margin: 0;
					padding: 0;
					box-sizing: border-box;
				}
				body {
					font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
					background-color: #fff;
					color: #000;
					min-height: 100vh;
					display: flex;
					align-items: center;
					justify-content: center;
					line-height: 1.6;
				}
				.container {
					max-width: 400px;
					padding: 2rem;
					text-align: center;
				}
				.error-code {
					font-size: 4rem;
					font-weight: 700;
					margin-bottom: 1rem;
					color: #666;
				}
				.error-title {
					font-size: 1.5rem;
					font-weight: 600;
					margin-bottom: 1rem;
				}
				.error-message {
					font-size: 1rem;
					color: #666;
					margin-bottom: 2rem;
				}
				.auth-prompt {
					padding: 1rem;
					background-color: #f8f9fa;
					border-radius: 8px;
					border: 1px solid #e9ecef;
					font-size: 0.875rem;
					color: #495057;
				}
				@media (max-width: 480px) {
					.container {
						padding: 1rem;
					}
					.error-code {
						font-size: 3rem;
					}
					.error-title {
						font-size: 1.25rem;
					}
				}
			</style>
		</head>
		<body>
			<div class="container">
				<div class="error-code">401</div>
				<h1 class="error-title">Authentication Required</h1>
				<p class="error-message">
					This area is protected and requires authentication to access.
				</p>
				<div class="auth-prompt">
					Please provide valid credentials to continue.
				</div>
			</div>
		</body>
		</html>`;

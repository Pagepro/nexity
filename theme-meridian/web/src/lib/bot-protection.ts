// BotID's challenge script and its server check exist only on Vercel: anywhere else (`next start`,
// self-hosting) the patched fetch and checkBotId() both throw, so the two halves switch on together.
export const IS_BOT_PROTECTED = process.env.VERCEL === "1";

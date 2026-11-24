import { initBotId } from "botid/client/core";

let isInitialized = false;

// A server action POSTs to the page it runs on, and the form can sit on any CMS page, so every
// same-origin POST carries the challenge (the script loads on the first one, not on page load).
export const protectFormSubmits = () => {
  if (isInitialized) return;
  isInitialized = true;
  initBotId({ protect: [{ path: "/*", method: "POST" }] });
};

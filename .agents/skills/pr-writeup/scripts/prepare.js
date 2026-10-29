// Returns a string so every driver (agent-browser eval, Playwright, DevTools MCP) prints something.
// Smooth scrolling off so scrollTo() lands before the screenshot; the scroll to the bottom
// and back makes lazy images and sections render.
(() => {
  const OVERLAY_SELECTORS = [
    "nextjs-portal",
    "vite-error-overlay",
    "astro-dev-toolbar",
    "nuxt-devtools-container",
    "#webpack-dev-server-client-overlay",
  ];

  const style = document.createElement("style");
  style.textContent = `${OVERLAY_SELECTORS.join(",")} { display: none !important; }`;
  document.head.appendChild(style);

  document.documentElement.style.scrollBehavior = "auto";
  window.scrollTo(0, document.documentElement.scrollHeight);
  window.scrollTo(0, 0);

  return `prepared ${window.innerWidth}x${window.innerHeight}`;
})();

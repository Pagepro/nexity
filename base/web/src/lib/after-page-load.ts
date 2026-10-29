// Lighthouse's simulated LCP counts every request finished before LCP (one 8 KB chunk
// added ~0.4 s). `load` alone can fire before a late first paint, hence the LCP wait.
export const afterPageLoad = (): Promise<void> =>
  Promise.all([whenLoaded(), whenLargestContentPainted()]).then(whenIdle);

const whenLoaded = () =>
  new Promise<void>((resolve) => {
    if (document.readyState === "complete") resolve();
    else window.addEventListener("load", () => resolve(), { once: true });
  });

const LCP_WAIT_LIMIT_MS = 3000;

const whenLargestContentPainted = () =>
  new Promise<void>((resolve) => {
    if (!PerformanceObserver.supportedEntryTypes?.includes("largest-contentful-paint")) {
      resolve();
      return;
    }

    const observer = new PerformanceObserver(() => finish());
    const timeout = setTimeout(() => finish(), LCP_WAIT_LIMIT_MS);
    const finish = () => {
      clearTimeout(timeout);
      observer.disconnect();
      resolve();
    };

    observer.observe({ type: "largest-contentful-paint", buffered: true });
  });

const whenIdle = () =>
  new Promise<void>((resolve) => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => resolve(), { timeout: 1000 });
    } else {
      setTimeout(resolve, 1);
    }
  });

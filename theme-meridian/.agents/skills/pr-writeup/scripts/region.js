// Usage: (<this file>)("h2|Key takeaways", "ul.checklist", 32). An anchor is a CSS selector,
// optionally "|<text>" (first match whose text starts with it). Returns CSS px from the
// document top; crop.py multiplies by `dpr`.
(start, end = start, padding = 32) => {
  const find = (anchor) => {
    const [selector, text] = anchor.split("|");
    const matches = [...document.querySelectorAll(selector)];
    const element = text
      ? matches.find((match) =>
          match.textContent.trim().toLowerCase().startsWith(text.trim().toLowerCase()),
        )
      : matches[0];

    if (!element) throw new Error(`region.js: no element for "${anchor}"`);
    return element;
  };

  const startElement = find(start);
  const endElement = find(end);
  const startBox = startElement.getBoundingClientRect();
  const endBox = endElement.getBoundingClientRect();
  const parentBox = (startElement.parentElement ?? startElement).getBoundingClientRect();

  return JSON.stringify({
    left: Math.max(0, Math.round(Math.min(startBox.left, endBox.left, parentBox.left) - padding)),
    top: Math.max(0, Math.round(startBox.top + window.scrollY - padding)),
    right: Math.round(Math.max(startBox.right, endBox.right, parentBox.right) + padding),
    bottom: Math.round(endBox.bottom + window.scrollY + padding),
    dpr: window.devicePixelRatio,
  });
}

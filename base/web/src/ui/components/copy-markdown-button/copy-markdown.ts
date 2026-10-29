// Safari allows a clipboard write only inside the click's user gesture, which the
// fetch ends; a `ClipboardItem` built from a promise keeps it.
const fetchMarkdown = async (markdownPath: string): Promise<string> => {
  const response = await fetch(markdownPath, { headers: { Accept: "text/markdown" } });
  if (!response.ok) throw new Error(`Markdown request failed: ${response.status}`);

  return response.text();
};

export const copyMarkdown = async (markdownPath: string): Promise<void> => {
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    const blob = fetchMarkdown(markdownPath).then(
      (text) => new Blob([text], { type: "text/plain" }),
    );
    await navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);

    return;
  }

  await navigator.clipboard.writeText(await fetchMarkdown(markdownPath));
};

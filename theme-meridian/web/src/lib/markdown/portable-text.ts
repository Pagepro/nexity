import { blockquote, heading, imageHint, inlineLink, joinBlocks, table } from "./blocks";
import { cleanInline, cleanText, escapeMarkdown, markdownText } from "./escape";
import { ctaLink, linkHref } from "./links";
import type { MarkdownContext, MarkdownCta, MarkdownImage, MarkdownLink } from "./types";

// Mirrors `ui/RichText/index.tsx`: the same heading tags, the same custom blocks.

interface PortableTextSpan {
  _type?: string;
  text?: string | null;
  marks?: (string | null)[] | null;
}

interface PortableTextMarkDef extends MarkdownLink {
  _key?: string | null;
  _type?: string | null;
}

interface PortableTextBlock {
  _type?: string;
  _key?: string | null;
  style?: string | null;
  listItem?: string | null;
  level?: number | null;
  children?: (PortableTextSpan | null)[] | null;
  markDefs?: (PortableTextMarkDef | null)[] | null;
  [field: string]: unknown;
}

// `#` is the document title, so `heading-1` drops to `##`. The rest follow RichText's tags.
const HEADING_LEVELS: Record<string, number> = {
  "heading-1": 2,
  "heading-2": 2,
  "heading-3": 3,
  "heading-4": 4,
  "heading-5": 5,
  "heading-6": 6,
  "alt-heading-1": 2,
  "alt-heading-2": 2,
  "alt-heading-3": 3,
  "alt-heading-4": 4,
  "alt-heading-5": 5,
  "alt-heading-6": 6,
  "section-heading-xl": 2,
  "section-heading-lg": 2,
  "section-heading-md": 3,
  "section-heading-sm": 4,
};

// Outermost first.
const DECORATOR_MARKERS = {
  strong: "**",
  em: "*",
  "strike-through": "~~",
} as const;

type Decorator = keyof typeof DECORATOR_MARKERS;

const DECORATORS = Object.keys(DECORATOR_MARKERS) as Decorator[];

const asBlocks = (value: unknown): PortableTextBlock[] =>
  Array.isArray(value)
    ? value.filter(
        (block): block is PortableTextBlock =>
          typeof block === "object" && block !== null,
      )
    : [];

const isTextBlock = (block: PortableTextBlock) =>
  (block._type ?? "block") === "block" && Array.isArray(block.children);

export const blockPlainText = (block: PortableTextBlock): string =>
  cleanText((block.children ?? []).map((span) => span?.text ?? "").join(""));

export const portableTextToPlainText = (value: unknown): string =>
  asBlocks(value).filter(isTextBlock).map(blockPlainText).filter(Boolean).join("\n");

// By default only a `heading-1` qualifies; `anyLevel` accepts any heading style.
export const leadingHeading = (
  value: unknown,
  { anyLevel = false }: { anyLevel?: boolean } = {},
): { key: string | null; text: string } | null => {
  const first = asBlocks(value)[0];
  const style = first && isTextBlock(first) ? cleanText(first.style) : "";
  const qualifies = anyLevel ? Boolean(HEADING_LEVELS[style]) : style === "heading-1";
  if (!first || !qualifies) return null;

  const text = blockPlainText(first);

  return text ? { key: first._key ?? null, text } : null;
};

// Markers open/close only where the decoration changes; CommonMark needs edge
// whitespace outside the markers.
const renderDecoratedSpans = (spans: PortableTextSpan[]): string => {
  const open: Decorator[] = [];
  let output = "";
  let pendingWhitespace = "";

  const closeFrom = (index: number) => {
    const closers = open
      .slice(index)
      .reverse()
      .map((decorator) => DECORATOR_MARKERS[decorator])
      .join("");
    open.length = index;

    return closers;
  };

  for (const span of spans) {
    const text = escapeMarkdown(cleanInline(span.text));
    if (!text) continue;

    if (!text.trim()) {
      pendingWhitespace += text;
      continue;
    }

    const [, leading = "", core = "", trailing = ""] =
      /^(\s*)([\s\S]*?)(\s*)$/.exec(text) ?? [];
    const marks = (span.marks ?? []).map((mark) => cleanText(mark));
    const wanted = DECORATORS.filter((decorator) => marks.includes(decorator));

    let shared = 0;
    while (
      shared < open.length &&
      shared < wanted.length &&
      open[shared] === wanted[shared]
    ) {
      shared += 1;
    }

    output += closeFrom(shared) + pendingWhitespace + leading;
    for (const decorator of wanted.slice(shared)) {
      open.push(decorator);
      output += DECORATOR_MARKERS[decorator];
    }
    output += core.replace(/\n/g, "  \n");
    pendingWhitespace = trailing;
  }

  return output + closeFrom(0) + pendingWhitespace;
};

const renderInline = (block: PortableTextBlock, context: MarkdownContext): string => {
  const linkDefs = new Map(
    (block.markDefs ?? [])
      .filter((definition): definition is PortableTextMarkDef =>
        Boolean(definition?._key),
      )
      .filter((definition) => cleanText(definition._type) === "link")
      .map((definition) => [definition._key as string, definition]),
  );
  const linkKeyOf = (span: PortableTextSpan) =>
    (span.marks ?? []).find((mark) => mark && linkDefs.has(mark)) ?? null;

  const runs: { linkKey: string | null; spans: PortableTextSpan[] }[] = [];
  for (const span of block.children ?? []) {
    if (!span || typeof span.text !== "string") continue;

    const linkKey = linkKeyOf(span);
    const last = runs[runs.length - 1];
    if (last && last.linkKey === linkKey) last.spans.push(span);
    else runs.push({ linkKey, spans: [span] });
  }

  return runs
    .map(({ linkKey, spans }) => {
      const text = renderDecoratedSpans(spans);
      if (!linkKey) return text;

      return inlineLink(text, linkHref(linkDefs.get(linkKey), context));
    })
    .join("")
    .trim();
};

interface ListLevel {
  type: string;
  count: number;
  indent: number;
  markerWidth: number;
}

const renderList = (items: PortableTextBlock[], context: MarkdownContext): string => {
  const levels: ListLevel[] = [];
  const lines: string[] = [];

  for (const item of items) {
    const content = renderInline(item, context);
    if (!content) continue;

    const depth = Math.max(1, Math.round(item.level ?? 1));
    const type = cleanText(item.listItem) === "number" ? "number" : "bullet";
    levels.length = Math.min(levels.length, depth);

    const parent = levels[depth - 2];
    const indent = parent ? parent.indent + parent.markerWidth + 1 : 0;
    const current = levels[depth - 1];
    const count = current && current.type === type ? current.count + 1 : 1;
    const marker = type === "number" ? `${count}.` : "-";

    levels[depth - 1] = { type, count, indent, markerWidth: marker.length };
    const continuation = `\n${" ".repeat(indent + marker.length + 1)}`;
    lines.push(`${" ".repeat(indent)}${marker} ${content.replace(/\n/g, continuation)}`);
  }

  return lines.join("\n");
};

const renderTextBlock = (block: PortableTextBlock, context: MarkdownContext): string => {
  const content = renderInline(block, context);
  if (!content) return "";

  const level = HEADING_LEVELS[cleanText(block.style)];
  if (level) return heading(level, content);
  if (cleanText(block.style) === "blockquote") return blockquote(content);

  return content;
};

const renderCode = (block: PortableTextBlock): string => {
  const code = typeof block.code === "string" ? block.code.replace(/\s+$/, "") : "";
  if (!code) return "";

  const language = cleanText(block.language);
  const filename = cleanText(block.filename);
  const fence = code.includes("```") ? "````" : "```";

  return joinBlocks([
    filename ? `\`${filename}\`` : "",
    `${fence}${language}\n${code}\n${fence}`,
  ]);
};

const renderTable = (block: PortableTextBlock): string => {
  const rows = Array.isArray(block.rows)
    ? (block.rows as { cells?: (string | null)[] | null }[]).map((row) =>
        (row?.cells ?? []).map((cell) => markdownText(cell)),
      )
    : [];
  if (rows.length === 0) return "";

  const [header, ...body] = rows;

  return table(header, body);
};

const renderPullquote = (block: PortableTextBlock): string => {
  const quote = markdownText(block.quote);
  if (!quote) return "";

  const attribution = [markdownText(block.author), markdownText(block.role)]
    .filter(Boolean)
    .join(", ");

  return blockquote(joinBlocks([quote, attribution ? `— ${attribution}` : ""]));
};

const renderCallout = (block: PortableTextBlock, context: MarkdownContext): string =>
  blockquote(
    joinBlocks([
      portableTextToMarkdown(block.content, context),
      ctaLink(block.cta as MarkdownCta | null, context),
    ]),
  );

const renderVideo = (block: PortableTextBlock): string => {
  const url = cleanText(block.url);
  if (!url) return "";

  const caption = markdownText(block.caption);

  return inlineLink(caption ? `Video: ${caption}` : "Video", url);
};

const renderChecklist = (block: PortableTextBlock): string => {
  const items = Array.isArray(block.items)
    ? (block.items as {
        tone?: string | null;
        title?: string | null;
        description?: string | null;
      }[])
    : [];

  return items
    .map((item) => {
      const title = markdownText(item?.title);
      const description = markdownText(item?.description);
      if (!title && !description) return "";

      const tone = cleanText(item?.tone) === "dont" ? "Don't" : "Do";
      const text = [title && `**${title}**`, description].filter(Boolean).join(": ");

      return `- ${tone}: ${text}`;
    })
    .filter(Boolean)
    .join("\n");
};

const renderObjectBlock = (
  block: PortableTextBlock,
  context: MarkdownContext,
): string => {
  switch (cleanText(block._type)) {
    case "img":
      return imageHint(block as MarkdownImage);
    case "pullquote":
      return renderPullquote(block);
    case "callout":
      return renderCallout(block, context);
    case "code":
      return renderCode(block);
    case "table":
      return renderTable(block);
    case "videoEmbed":
      return renderVideo(block);
    case "checklist":
      return renderChecklist(block);
    default:
      // A block type with no Markdown form yet. Its text would be a guess.
      if (process.env.NODE_ENV === "development") {
        console.warn(`[markdown] no Portable Text serializer for "${block._type}"`);
      }

      return "";
  }
};

export const portableTextToMarkdown = (
  value: unknown,
  context: MarkdownContext,
): string => {
  const blocks = asBlocks(value).filter(
    (block) => !context.skipBlockKey || block._key !== context.skipBlockKey,
  );
  const output: string[] = [];

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];

    if (isTextBlock(block) && block.listItem) {
      const items: PortableTextBlock[] = [];
      while (
        index < blocks.length &&
        isTextBlock(blocks[index]) &&
        blocks[index].listItem
      ) {
        items.push(blocks[index]);
        index += 1;
      }
      index -= 1;
      output.push(renderList(items, context));
      continue;
    }

    output.push(
      isTextBlock(block)
        ? renderTextBlock(block, context)
        : renderObjectBlock(block, context),
    );
  }

  return joinBlocks(output);
};

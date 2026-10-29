import { createHash } from "node:crypto";

export const PREVIEW_WIDTH = 640;
export const LONG_ALT = 125;

const HEADING_FIELDS = ["title", "heading", "pretitle", "name", "label", "question"];
const CONTEXT_FIELDS = [
  "pretitle",
  "title",
  "heading",
  "subtitle",
  "name",
  "firstName",
  "lastName",
  "role",
  "position",
  "company",
  "label",
  "question",
  "quote",
  "description",
  "excerpt",
  "text",
  "content",
  "caption",
];

// Roles of the starter's image fields. Add a project's own image fields here.
export const FIELD_HINTS = [
  {
    test: ({ fieldName }) => /background/i.test(fieldName),
    decorative: true,
    hint: "Background behind text or a card: decorative, leave the alt empty",
  },
  {
    test: ({ ownerType, fieldName }) => ownerType === "footer" && fieldName === "wordmark",
    decorative: true,
    hint: "Faint wordmark across the footer: decorative",
  },
  {
    test: ({ fieldName }) => fieldName === "avatar",
    hint: "Headshot shown next to the person's name: usually decorative, since the name is text right beside it",
  },
  {
    test: ({ ownerType, fieldName }) => ownerType === "integration" && fieldName === "logo",
    hint: "Logo tile next to the product name: usually decorative; otherwise the product name",
  },
  {
    test: ({ fieldName }) => /logo/i.test(fieldName),
    hint: "Logo: the organization's or product's name only, without the word 'logo'",
  },
  {
    test: ({ ownerType, fieldName }) => ownerType === "metadata" && fieldName === "image",
    hint: "Social sharing image: not shown on the page; its alt goes into structured data",
  },
  {
    test: ({ ownerType, fieldName }) => ownerType === "videoEmbed" && fieldName === "poster",
    hint: "Video poster frame: what the video shows; the caption sits next to it",
  },
];

export const variantOf = (id) => {
  if (id.startsWith("drafts.")) return "draft";
  if (id.startsWith("versions.")) return "version";
  return "published";
};

export const baseIdOf = (id) =>
  id.startsWith("drafts.")
    ? id.slice("drafts.".length)
    : id.startsWith("versions.")
      ? id.split(".").slice(2).join(".")
      : id;

const collapse = (text) => text.replace(/\s+/g, " ").trim();

export const truncate = (text, max) =>
  text && text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

export const plainText = (value) => {
  if (typeof value === "string") return collapse(value);
  if (!Array.isArray(value)) return "";
  return collapse(
    value
      .map((block) =>
        block?._type === "block" && Array.isArray(block.children)
          ? block.children.map((child) => (typeof child?.text === "string" ? child.text : "")).join("")
          : "",
      )
      .join(" "),
  );
};

const segmentToString = (segment) =>
  typeof segment === "number"
    ? `[${segment}]`
    : typeof segment === "object"
      ? `[_key==${JSON.stringify(segment.key)}]`
      : `.${segment}`;

export const toPatchPath = (segments) => segments.map(segmentToString).join("").replace(/^\./, "");

const isImageRef = (value) =>
  Boolean(value) &&
  typeof value === "object" &&
  typeof value.asset?._ref === "string" &&
  value.asset._ref.startsWith("image-");

const isImg = (value) =>
  Boolean(value) &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  value._type !== "responsive" &&
  (value._type === "img" || isImageRef(value.image));

const imgAssetId = (value) =>
  value.image?.asset?._ref ??
  (Array.isArray(value.responsive) ? value.responsive.find((item) => isImageRef(item?.image)) : null)
    ?.image.asset._ref ??
  null;

export const documentTitle = (document) =>
  plainText(document.metadata?.title) ||
  plainText(document.title) ||
  plainText(document.name) ||
  collapse([document.firstName, document.lastName].filter((part) => typeof part === "string").join(" ")) ||
  truncate(plainText(document.quote), 80) ||
  null;

const headingOf = (node) => {
  for (const field of HEADING_FIELDS) {
    const text = plainText(node?.[field]);
    if (text) return truncate(text, 160);
  }
  return null;
};

const textFieldsOf = (node, skipKey) => {
  const fields = {};
  for (const key of CONTEXT_FIELDS) {
    if (key === skipKey) continue;
    const text = plainText(node?.[key]);
    if (text) fields[key] = truncate(text, 200);
  }
  return Object.keys(fields).length ? fields : null;
};

const neighbourText = (items, index, step) => {
  for (let position = index + step; position >= 0 && position < items.length; position += step) {
    if (items[position]?._type !== "block") continue;
    const text = plainText([items[position]]);
    if (text) return truncate(text, 300);
  }
  return null;
};

export const hintFor = (usage) => FIELD_HINTS.find((entry) => entry.test(usage)) ?? null;

/**
 * Every image the site can render from one document: `img` objects (the starter's image
 * type; its `alt` is what the site reads first) and bare `image` fields, which have no
 * alt field unless the project added one.
 */
export const findImageUsages = (document) => {
  const usages = [];

  const visit = (value, segments, labels, ancestors) => {
    if (Array.isArray(value)) {
      value.forEach((item, position) => {
        const keyed = item && typeof item === "object" && typeof item._key === "string";
        const segment = keyed ? { key: item._key } : position;
        const label = item?._type && item._type !== "block" ? item._type : `#${position + 1}`;
        visit(item, [...segments, segment], [...labels, label], [
          ...ancestors,
          { node: item, array: value, position, keyed },
        ]);
      });
      return;
    }
    if (!value || typeof value !== "object") return;

    const isUsage = isImg(value) || (value._type === "image" && isImageRef(value));
    if (isUsage && segments.length) {
      const assetId = isImg(value) ? imgAssetId(value) : value.asset._ref;
      if (assetId) usages.push(describeUsage(document, value, segments, labels, ancestors, assetId));
      return;
    }

    for (const [key, child] of Object.entries(value)) {
      if (key.startsWith("_") || !child || typeof child !== "object") continue;
      visit(child, [...segments, key], [...labels, key], ancestors.concat({ node: child, key }));
    }
  };

  visit(document, [], [], [{ node: document }]);
  return usages;
};

const describeUsage = (document, value, segments, labels, ancestors, assetId) => {
  const kind = isImg(value) ? "img" : "image";
  const self = ancestors[ancestors.length - 1];
  const fieldName = [...segments].reverse().find((segment) => typeof segment === "string") ?? null;
  const ownerIndex = (() => {
    for (let index = ancestors.length - 2; index >= 0; index -= 1)
      if (!Array.isArray(ancestors[index].node) && ancestors[index].node?._type) return index;
    return 0;
  })();
  const owner = ancestors[ownerIndex].node;
  const ownerType = owner?._type ?? document._type;
  const inRichText = Boolean(self.array?.some((item) => item?._type === "block"));
  const sectionEntry = ancestors
    .slice(1, -1)
    .find((entry) => entry.keyed && entry.node?._type && entry.node._type !== "block");
  const caption = plainText(value.caption) || (owner !== document ? plainText(owner?.caption) : "") || null;
  const ownerFields = owner !== document ? textFieldsOf(owner, fieldName) : null;

  const usage = {
    path: toPatchPath(segments),
    altPath: `${toPatchPath(segments)}.alt`,
    where: labels.join(" › "),
    kind,
    fieldName,
    ownerType,
    inRichText,
    assetId,
    alt: typeof value.alt === "string" ? value.alt : null,
    writable: kind === "img" || "alt" in value,
    context: {
      section: sectionEntry
        ? { type: sectionEntry.node._type, heading: headingOf(sectionEntry.node) }
        : null,
      parent: ownerFields,
      before: inRichText ? neighbourText(self.array, self.position, -1) : null,
      after: inRichText ? neighbourText(self.array, self.position, 1) : null,
      caption,
    },
  };
  const hint = hintFor(usage);
  return { ...usage, hint: hint?.hint ?? null, decorativeHint: Boolean(hint?.decorative) };
};

const stableStringify = (value) =>
  Array.isArray(value)
    ? `[${value.map(stableStringify).join(",")}]`
    : value && typeof value === "object"
      ? `{${Object.keys(value)
          .sort()
          .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
          .join(",")}}`
      : JSON.stringify(value ?? null);

export const contextHash = (usage, asset) =>
  createHash("sha1")
    .update(
      stableStringify({
        assetId: usage.assetId,
        docTitle: usage.docTitle ?? null,
        hint: usage.hint ?? null,
        context: usage.context,
        asset: asset
          ? { title: asset.title, description: asset.description, altText: asset.altText }
          : null,
      }),
    )
    .digest("hex")
    .slice(0, 16);

export const usageKey = (documentId, path) => `${documentId}#${path}`;

export const studioLink = (studioUrl, usage) =>
  studioUrl
    ? `${studioUrl.replace(/\/+$/, "")}/intent/edit/id=${encodeURIComponent(usage.documentId)};type=${encodeURIComponent(usage.documentType)}`
    : null;

export const cachedProposal = (cache, usage) => {
  const entry = cache?.usages?.[usage.key];
  return entry && entry.assetId === usage.assetId && entry.contextHash === usage.contextHash
    ? entry
    : null;
};

export const statusOf = (usage, cache) => {
  if (usage.alt && usage.alt.trim()) return "has-alt";
  if (usage.decorativeHint || cachedProposal(cache, usage)?.decorative) return "decorative";
  return "missing";
};

/**
 * One usage per (document, path). The draft wins over the published document because it is
 * what gets published next; release versions are counted and left out.
 */
export const buildManifest = ({ documents, assets, cache, dataset, projectId, studioUrl, lang, generatedAt }) => {
  const byId = new Map(documents.map((document) => [document._id, document]));
  const baseIds = [...new Set(documents.filter((d) => variantOf(d._id) !== "version").map((d) => baseIdOf(d._id)))].sort();
  const versionsSkipped = documents.filter((d) => variantOf(d._id) === "version").length;
  const usages = [];

  for (const baseId of baseIds) {
    const published = byId.get(baseId);
    const draft = byId.get(`drafts.${baseId}`);
    const effective = draft ?? published;
    const publishedAlts = new Map(
      published ? findImageUsages(published).map((usage) => [usage.path, usage.alt]) : [],
    );

    for (const found of findImageUsages(effective)) {
      const usage = {
        key: usageKey(baseId, found.path),
        documentId: baseId,
        documentType: effective._type,
        docTitle: documentTitle(effective),
        slug: effective.metadata?.slug?.current ?? effective.slug?.current ?? null,
        ...found,
        alt: found.alt ?? "",
        variants: {
          ...(published ? { published: publishedAlts.has(found.path) ? (publishedAlts.get(found.path) ?? "") : null } : {}),
          ...(draft ? { draft: found.alt ?? "" } : {}),
        },
      };
      usage.studio = studioLink(studioUrl, usage);
      usage.contextHash = contextHash(usage, assets[usage.assetId]);
      usage.status = statusOf(usage, cache);
      usages.push(usage);
    }
  }

  const referenced = new Set(usages.map((usage) => usage.assetId));
  const count = (status) => usages.filter((usage) => usage.status === status).length;

  return {
    generatedAt,
    dataset,
    projectId,
    studioUrl,
    lang: lang ?? null,
    counts: {
      usages: usages.length,
      assets: referenced.size,
      documents: new Set(usages.map((usage) => usage.documentId)).size,
      missing: count("missing"),
      hasAlt: count("has-alt"),
      decorative: count("decorative"),
      notWritable: usages.filter((usage) => !usage.writable).length,
      versionsSkipped,
    },
    assets: Object.fromEntries([...referenced].sort().map((id) => [id, assets[id] ?? { _id: id }])),
    usages,
  };
};

export const previewUrl = (asset, width = PREVIEW_WIDTH) => {
  if (!asset?.url) return null;
  if (asset.mimeType === "image/svg+xml" || /\.svg$/i.test(asset.url)) return { url: asset.url, ext: "svg" };
  const format = asset.hasAlpha ? "png" : "jpg";
  const quality = format === "jpg" ? "&q=75" : "";
  return { url: `${asset.url}?w=${width}&fit=max&fm=${format}${quality}`, ext: format };
};

export const selectUsages = (manifest, { includeExisting = false } = {}) =>
  manifest.usages.filter(
    (usage) => usage.writable && (includeExisting || usage.status !== "has-alt"),
  );

export const pendingUsages = (manifest, cache, options) =>
  selectUsages(manifest, options).filter((usage) => !cachedProposal(cache, usage));

/** Batches hold whole assets, so one image is looked at once however often it is used. */
export const makeBatches = (usages, size) => {
  const byAsset = new Map();
  for (const usage of usages) byAsset.set(usage.assetId, [...(byAsset.get(usage.assetId) ?? []), usage]);
  const groups = [...byAsset.entries()];
  const batches = [];
  for (let start = 0; start < groups.length; start += size) batches.push(groups.slice(start, start + size));
  return batches.map((group) => ({
    assetIds: group.map(([assetId]) => assetId),
    usages: group.flatMap(([, list]) => list),
  }));
};

export const batchPayload = ({ manifest, cache, batch, imageFile, proposalsFile, name }) => ({
  batch: name,
  lang: manifest.lang,
  proposalsFile,
  rules: ".agents/skills/generate-alts/SKILL.md → \"Writing the alts\"",
  assets: Object.fromEntries(
    batch.assetIds.map((assetId) => {
      const asset = manifest.assets[assetId] ?? {};
      return [
        assetId,
        {
          image: imageFile(assetId),
          title: asset.title ?? null,
          description: asset.description ?? null,
          altText: asset.altText ?? null,
          creditLine: asset.creditLine ?? null,
          originalFilename: asset.originalFilename ?? null,
          width: asset.width ?? null,
          height: asset.height ?? null,
          cachedAlt: cache?.assets?.[assetId]?.alt ?? null,
        },
      ];
    }),
  ),
  usages: batch.usages.map((usage) => ({
    key: usage.key,
    assetId: usage.assetId,
    documentType: usage.documentType,
    docTitle: usage.docTitle,
    where: usage.where,
    inRichText: usage.inRichText,
    hint: usage.hint,
    currentAlt: usage.alt,
    context: usage.context,
  })),
});

const FILLER = /^(an? )?(image|picture|photo|photograph|graphic|screenshot|illustration|icon) (of|showing)\b/i;
const FILENAME = /\.(jpe?g|png|gif|webp|avif|svg)$|^(img|dsc|image)[-_ ]?\d+/i;

export const checkProposal = (proposal, usage) => {
  const problems = [];
  const alt = typeof proposal.alt === "string" ? collapse(proposal.alt) : "";
  if (proposal.decorative) {
    if (alt) problems.push("decorative but has text; the alt was emptied");
    return { alt: "", problems };
  }
  if (!alt) return { alt, problems: ["empty alt without decorative: true"], invalid: true };
  if (FILLER.test(alt)) problems.push("starts with 'image of'-style filler");
  if (FILENAME.test(alt)) problems.push("looks like a file name");
  if (alt.length > LONG_ALT) problems.push(`long (${alt.length} characters)`);
  const caption = usage?.context?.caption;
  if (caption && caption.toLowerCase() === alt.toLowerCase()) problems.push("repeats the caption verbatim");
  return { alt, problems };
};

export const mergeProposals = ({ cache, manifest, proposals, now }) => {
  const next = { assets: { ...(cache?.assets ?? {}) }, usages: { ...(cache?.usages ?? {}) } };
  const byKey = new Map(manifest.usages.map((usage) => [usage.key, usage]));
  const warnings = [];
  let merged = 0;

  for (const { file, data } of proposals) {
    for (const [assetId, entry] of Object.entries(data?.assets ?? {})) {
      if (!manifest.assets[assetId]) {
        warnings.push(`${file}: unknown asset ${assetId}`);
        continue;
      }
      if (typeof entry?.alt === "string" && entry.alt.trim())
        next.assets[assetId] = { ...next.assets[assetId], alt: collapse(entry.alt), describedAt: now };
    }
    for (const proposal of data?.usages ?? []) {
      const usage = byKey.get(proposal?.key);
      if (!usage) {
        warnings.push(`${file}: unknown usage ${proposal?.key} (re-run scan?)`);
        continue;
      }
      const checked = checkProposal(proposal, usage);
      if (checked.invalid) {
        warnings.push(`${file}: ${usage.key}: ${checked.problems[0]}`);
        continue;
      }
      next.usages[usage.key] = {
        assetId: usage.assetId,
        contextHash: usage.contextHash,
        alt: checked.alt,
        decorative: Boolean(proposal.decorative),
        reason: typeof proposal.reason === "string" ? proposal.reason : null,
        sources: Array.isArray(proposal.sources) ? proposal.sources.map(String) : [],
        problems: checked.problems,
        proposedAt: now,
      };
      merged += 1;
    }
  }

  return { cache: next, merged, warnings };
};

const readNodeAt = (document, path) => findImageUsages(document).find((usage) => usage.path === path) ?? null;

const stripSystem = (document) => {
  const { _rev, _updatedAt, _createdAt, ...rest } = document;
  return rest;
};

/**
 * Raw mutations per document. Default: into the draft (created from the published
 * document when there is none), so an editor publishes. `live`: the published document
 * and its open draft, so publishing the draft later does not bring the old alt back.
 */
export const planApply = (items, documents, { live = false } = {}) => {
  const byId = new Map(documents.map((document) => [document._id, document]));
  const plans = new Map();
  const skipped = [];

  for (const item of items) {
    const published = byId.get(item.documentId);
    const draft = byId.get(`drafts.${item.documentId}`);
    const next = item.decorative ? "" : collapse(String(item.alt ?? ""));
    if (!item.decorative && !next) {
      skipped.push({ item, reason: "empty alt and not decorative" });
      continue;
    }

    const targets = live
      ? [published, draft].filter(Boolean).map((document) => ({ document, create: false }))
      : draft
        ? [{ document: draft, create: false }]
        : published
          ? [{ document: published, create: true }]
          : [];
    if (!targets.length) {
      skipped.push({ item, reason: "document not found" });
      continue;
    }

    for (const { document, create } of targets) {
      const variant = variantOf(document._id);
      const usage = readNodeAt(document, item.path);
      const current = usage?.alt ?? "";
      const reason = !usage
        ? "image no longer at this path"
        : usage.assetId !== item.assetId
          ? "image replaced since the review"
          : !usage.writable
            ? "field has no alt"
            : current === next
              ? "already set"
              : current.trim() && !item.overwrite
                ? `has an alt ("${current}"), not approved to replace`
                : item.overwrite && current !== (item.currentAlt ?? "")
                  ? `alt changed since the review (now "${current}")`
                  : null;
      if (reason) {
        skipped.push({ item, variant, reason });
        continue;
      }

      const targetId = create ? `drafts.${item.documentId}` : document._id;
      const plan = plans.get(targetId) ?? {
        documentId: targetId,
        documentType: document._type,
        create: create ? { ...stripSystem(document), _id: targetId } : null,
        rev: create ? null : document._rev,
        set: {},
        changes: [],
      };
      plan.set[item.altPath] = next;
      plan.changes.push({ key: item.key, where: usage.where, from: current, to: next, decorative: Boolean(item.decorative) });
      plans.set(targetId, plan);
    }
  }

  const transactions = [...plans.values()].map((plan) => ({
    ...plan,
    mutations: [
      ...(plan.create ? [{ createIfNotExists: plan.create }] : []),
      { patch: { id: plan.documentId, ...(plan.rev ? { ifRevisionID: plan.rev } : {}), set: plan.set } },
    ],
  }));

  return { transactions, skipped };
};

export const fallbackWarnings = (items, assets) =>
  items
    .filter((item) => item.decorative && assets[item.assetId]?.altText?.trim())
    .map(
      (item) =>
        `${item.key}: decorative, but the site falls back to the asset's alt text ("${assets[item.assetId].altText}") when the field is empty`,
    );

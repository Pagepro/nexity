export default function resolveSlug({
  internal,
  internalPath,
  params,
  external,
  type,
  fileLabel,
  fileOriginalFilename,
}: {
  type: "internal" | "path" | "external" | "download";
  internal?: string;
  internalPath?: string;
  params?: string;
  external?: string;
  fileLabel?: string;
  fileOriginalFilename?: string;
}) {
  if (type === "external" && external) return external;

  if (type === "path" && internalPath) {
    return [internalPath, params].filter(Boolean).join("");
  }

  if (type === "internal" && internal) {
    const segment = "/";
    const path = internal === "/" ? null : internal;

    return [segment, path, params].filter(Boolean).join("");
  }

  if (type === "download" && (fileLabel || fileOriginalFilename))
    return fileLabel || fileOriginalFilename;

  return undefined;
}

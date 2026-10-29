import { stegaClean } from "next-sanity";

export default function resolveUrl(
  page?: { _type?: string; metadata?: { slug?: { current?: string } } },
  {
    base = true,
    params,
  }: {
    base?: boolean;
    params?: string;
  } = {},
) {
  const segment = "/";
  const slug = page?.metadata?.slug?.current;
  const path = slug === "/" ? null : slug;

  return [base && process.env.NEXT_PUBLIC_BASE_URL, segment, path, stegaClean(params)]
    .filter(Boolean)
    .join("");
}

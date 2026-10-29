import { parseBody } from "next-sanity/webhook";
import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

import { tagsForDocumentType } from "@/sanity/lib/tags";

// The Sanity webhook must project `_type`, `_id`, `slug` and `metadata.slug`
// (detail documents use the first, catchall pages the second). A webhook without
// `contentOnly` still works: every edit then purges the whole type.
type WebhookPayload = {
  _type?: string;
  _id?: string;
  slug?: { current?: string } | null;
  metadata?: { slug?: { current?: string } | null } | null;
  contentOnly?: boolean | null;
};

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SANITY_REVALIDATE_SECRET) {
      return new Response("Missing environment variable SANITY_REVALIDATE_SECRET", {
        status: 500,
      });
    }

    const { isValidSignature, body } = await parseBody<WebhookPayload>(
      req,
      process.env.SANITY_REVALIDATE_SECRET,
      true, // delay revalidation so useCdn queries pick up the fresh data
    );

    if (!isValidSignature) {
      console.warn(
        "[revalidate] 401 — invalid signature (check SANITY_REVALIDATE_SECRET)",
      );
      return new Response(
        JSON.stringify({ message: "Invalid signature", isValidSignature }),
        { status: 401 },
      );
    }

    if (!body?._type) {
      console.warn(
        "[revalidate] 400 — missing _type in payload (check webhook projection)",
      );
      return new Response(JSON.stringify({ message: "Bad Request", body }), {
        status: 400,
      });
    }

    const slug = body.metadata?.slug?.current ?? body.slug?.current;
    const tags = tagsForDocumentType(body._type, slug, {
      contentOnly: body.contentOnly === true,
    });

    // revalidateTag needs a cache profile; "max" keeps the classic on-demand purge.
    for (const tag of tags) {
      revalidateTag(tag, "max");
    }

    // oxlint-disable-next-line no-console
    console.log(
      `[revalidate] _type=${body._type} slug=${slug ?? "—"} → tags: ${tags.join(", ")}`,
    );

    return NextResponse.json({
      revalidated: tags,
      type: body._type,
      slug: slug ?? null,
    });
  } catch (err) {
    console.error(err);

    return new Response((err as Error).message, { status: 500 });
  }
}

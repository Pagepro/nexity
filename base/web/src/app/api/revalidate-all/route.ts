import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

import { GLOBAL_TAG } from "@/sanity/lib/tags";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SANITY_REVALIDATE_SECRET) {
      return new Response("Missing environment variable SANITY_REVALIDATE_SECRET", {
        status: 500,
      });
    }

    if (
      req.headers.get("x-vercel-webhook-secret") !== process.env.SANITY_REVALIDATE_SECRET
    ) {
      return new Response("Invalid signature", { status: 401 });
    }

    revalidateTag(GLOBAL_TAG, "max");

    // oxlint-disable-next-line no-console
    console.log(`[revalidate-all] → tag: ${GLOBAL_TAG}`);

    return NextResponse.json({
      revalidated: [GLOBAL_TAG],
      message: `Triggered revalidation for all Sanity-backed content`,
    });
  } catch (err) {
    console.error(err);

    return new Response((err as Error).message, { status: 500 });
  }
}

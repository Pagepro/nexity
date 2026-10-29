import { defineEnableDraftMode } from "next-sanity/draft-mode";

import { client } from "@/sanity/lib/client";
import { token } from "@/sanity/lib/token";

const handleMissingToken = () =>
  new Response(
    "Draft mode needs SANITY_API_READ_TOKEN (a Viewer token from sanity.io/manage → API → Tokens). Set it and restart the server.",
    { status: 500 },
  );

export const GET = token
  ? defineEnableDraftMode({ client: client.withConfig({ token }) }).GET
  : handleMissingToken;

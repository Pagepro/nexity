"use server";

import { checkBotId } from "botid/server";
import type { ReactNode } from "react";
import { Resend } from "resend";
import { z } from "zod";

import { IS_BOT_PROTECTED } from "@/lib/bot-protection";
import { FORM_LIMITS } from "@/lib/form-limits";
import { fetchSanity } from "@/sanity/lib/fetch";
import { GATED_RESOURCE_QUERY } from "@/sanity/lib/queries/gated-resource";
import type { GATED_RESOURCE_QUERY_RESULT } from "@/types/sanity.types";
import GatedResourceContent from "@/ui/sections/FormSection/gated-resource-content";

const leadFields = {
  name: z.string().trim().min(1).max(FORM_LIMITS.field),
  email: z.string().trim().email().max(FORM_LIMITS.email),
  company: z.string().trim().min(1).max(FORM_LIMITS.field),
  teamSize: z.string().trim().max(FORM_LIMITS.field).optional(),
  message: z.string().trim().max(FORM_LIMITS.message).optional(),
  honeypot: z.string().max(0).optional(),
};

const formSubmissionSchema = z.discriminatedUnion("formType", [
  z.object({ formType: z.literal("contact"), ...leadFields }),
  z.object({
    formType: z.literal("gated"),
    resourceId: z.string().trim().min(1).max(FORM_LIMITS.field),
    ...leadFields,
  }),
]);

export type FormSubmission = z.input<typeof formSubmissionSchema>;

export type FormSubmitResult =
  | { success: true; unlocked?: ReactNode }
  | { success: false; error: string };

type Lead = z.output<typeof formSubmissionSchema>;

const GENERIC_ERROR = "Something went wrong. Please try again later.";

// Sent via Resend: RESEND_API_KEY, CONTACT_FORM_RECIPIENT_EMAIL, CONTACT_FORM_FROM_EMAIL.
const sendLeadEmail = async (lead: Lead, subject: string): Promise<boolean> => {
  const apiKey = process.env.RESEND_API_KEY;
  const recipientEmail = process.env.CONTACT_FORM_RECIPIENT_EMAIL;
  const fromEmail = process.env.CONTACT_FORM_FROM_EMAIL;

  if (!apiKey || !recipientEmail || !fromEmail) {
    console.error("Missing Resend environment variables");
    return false;
  }

  try {
    await new Resend(apiKey).emails.send({
      from: fromEmail,
      to: recipientEmail,
      replyTo: lead.email,
      subject,
      text: [
        `Name: ${lead.name}`,
        `Email: ${lead.email}`,
        `Company: ${lead.company}`,
        lead.teamSize ? `Team size: ${lead.teamSize}` : "",
        lead.message ? `\nMessage:\n${lead.message}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    });
    return true;
  } catch (error) {
    console.error("Resend email error:", error);
    return false;
  }
};

// Fails open: a BotID outage, or OIDC turned off in the Vercel project, must not cost a lead.
const isBotSubmission = async (): Promise<boolean> => {
  if (!IS_BOT_PROTECTED) return false;

  try {
    return (await checkBotId()).isBot;
  } catch (error) {
    console.error("BotID check failed:", error);
    return false;
  }
};

// Rate limiting is a Vercel WAF rule, not code: docs/guides/before-release.md → 8.5.
export async function submitForm(input: FormSubmission): Promise<FormSubmitResult> {
  // Honeypot and BotID: succeed silently so bots don't learn about the trap.
  if (input?.honeypot) {
    return { success: true };
  }

  const parsed = formSubmissionSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Please check your name, work email and company." };
  }

  if (await isBotSubmission()) {
    return { success: true };
  }

  const lead = parsed.data;

  if (lead.formType === "contact") {
    const sent = await sendLeadEmail(
      lead,
      `Sales inquiry: ${lead.name} (${lead.company})`,
    );
    return sent ? { success: true } : { success: false, error: GENERIC_ERROR };
  }

  const resource = await fetchSanity<GATED_RESOURCE_QUERY_RESULT>({
    query: GATED_RESOURCE_QUERY,
    params: { id: lead.resourceId },
    tags: ["gated-resource"],
  });

  if (!resource?.files?.length) {
    return { success: false, error: "This download isn't available right now." };
  }

  const sent = await sendLeadEmail(
    lead,
    `Download: ${resource.title} – ${lead.name} (${lead.company})`,
  );

  if (!sent) {
    return { success: false, error: GENERIC_ERROR };
  }

  return { success: true, unlocked: <GatedResourceContent resource={resource} /> };
}

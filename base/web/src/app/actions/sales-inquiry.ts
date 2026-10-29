"use server";

import { Resend } from "resend";
import { z } from "zod";

import { SALES_INQUIRY_LIMITS } from "@/lib/sales-inquiry";

const salesInquirySchema = z.object({
  name: z.string().trim().min(1).max(SALES_INQUIRY_LIMITS.field),
  email: z.string().trim().email().max(SALES_INQUIRY_LIMITS.email),
  company: z.string().trim().min(1).max(SALES_INQUIRY_LIMITS.field),
  teamSize: z.string().trim().max(SALES_INQUIRY_LIMITS.field).optional(),
  message: z.string().trim().max(SALES_INQUIRY_LIMITS.message).optional(),
  honeypot: z.string().max(0).optional(),
});

export type SalesInquiry = z.input<typeof salesInquirySchema>;

export type SalesInquiryResult = { success: true } | { success: false; error: string };

// Sent via Resend: RESEND_API_KEY, CONTACT_FORM_RECIPIENT_EMAIL, CONTACT_FORM_FROM_EMAIL.
// No rate limiting yet: add it before heavy traffic.
export async function submitSalesInquiry(
  input: SalesInquiry,
): Promise<SalesInquiryResult> {
  // Honeypot: succeed silently so bots don't learn about the trap.
  if (input?.honeypot) {
    return { success: true };
  }

  const parsed = salesInquirySchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Please check your name, work email and company." };
  }

  const { name, email, company, teamSize, message } = parsed.data;

  const apiKey = process.env.RESEND_API_KEY;
  const recipientEmail = process.env.CONTACT_FORM_RECIPIENT_EMAIL;
  const fromEmail = process.env.CONTACT_FORM_FROM_EMAIL;

  if (!apiKey || !recipientEmail || !fromEmail) {
    console.error("Missing Resend environment variables");

    return { success: false, error: "Something went wrong. Please try again later." };
  }

  try {
    await new Resend(apiKey).emails.send({
      from: fromEmail,
      to: recipientEmail,
      replyTo: email,
      subject: `Sales inquiry: ${name} (${company})`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Company: ${company}`,
        teamSize ? `Team size: ${teamSize}` : "",
        message ? `\nMessage:\n${message}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    });

    return { success: true };
  } catch (error) {
    console.error("Resend email error:", error);

    return { success: false, error: "Something went wrong. Please try again later." };
  }
}

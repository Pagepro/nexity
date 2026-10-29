"use client";

import clsx from "clsx";
import { stegaClean } from "next-sanity";
import { useState } from "react";

import { isValidEmail } from "@/lib/email";
import Button from "@/ui/components/button";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

interface NewsletterFormProps {
  emailPlaceholder?: string | null;
  submitLabel?: string | null;
  successMessage?: string | null;
}

const NewsletterForm = ({
  emailPlaceholder,
  submitLabel,
  successMessage,
}: NewsletterFormProps) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isValidEmail(email)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        throw new Error("Subscription failed");
      }

      setStatus("success");
      setMessage(stegaClean(successMessage) || "Thanks! Check your inbox to confirm.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  const isSubmitting = status === "submitting";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-1.5">
      <div className="flex w-full items-center gap-2 rounded-full border border-input bg-background py-1.5 pr-1.5 pl-4">
        <input
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (status === "error") {
              setStatus("idle");
              setMessage("");
            }
          }}
          placeholder={stegaClean(emailPlaceholder) || "your@email.com"}
          aria-label="Email address"
          autoComplete="email"
          disabled={isSubmitting}
          className="min-w-0 flex-1 bg-transparent text-16 text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <Button variant="primary" size="md" loading={isSubmitting}>
          {stegaClean(submitLabel) || "Start free trial"}
        </Button>
      </div>

      {message && (
        <p
          aria-live="polite"
          className={clsx(
            "px-4 text-12",
            status === "error" ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {message}
        </p>
      )}
    </form>
  );
};

export default NewsletterForm;

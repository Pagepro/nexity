"use client";

import clsx from "clsx";
import { ArrowRight, ChevronDown } from "lucide-react";
import { stegaClean } from "next-sanity";
import { useId, useState } from "react";

import { submitSalesInquiry } from "@/app/actions/sales-inquiry";
import { isValidEmail } from "@/lib/email";
import { SALES_INQUIRY_LIMITS } from "@/lib/sales-inquiry";
import Button from "@/ui/components/button";

import { ContactFormProps } from "./types";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

type ContactFormClientProps = Pick<
  ContactFormProps,
  | "nameField"
  | "emailField"
  | "companyField"
  | "teamSizeField"
  | "messageField"
  | "submitLabel"
  | "successMessage"
>;

// Text size lives on the field wrapper (16px on mobile, or iOS zooms on focus). No height
// here: clsx doesn't resolve conflicts, so each control adds its own.
const INPUT_CLASS =
  "w-full rounded-md border border-input bg-background px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:scheme-dark";

const {
  field: MAX_FIELD_LENGTH,
  email: MAX_EMAIL_LENGTH,
  message: MAX_MESSAGE_LENGTH,
} = SALES_INQUIRY_LIMITS;

const Field = ({
  id,
  label,
  className,
  children,
}: {
  id: string;
  label: string | null | undefined;
  className?: string;
  children: React.ReactNode;
}) => (
  <div className={clsx("flex flex-col gap-2 text-16 md:text-14", className)}>
    <label htmlFor={id} className="font-medium text-foreground">
      {label}
    </label>
    {children}
  </div>
);

export const ContactFormClient = ({
  nameField,
  emailField,
  companyField,
  teamSizeField,
  messageField,
  submitLabel,
  successMessage,
}: ContactFormClientProps) => {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const choices = (teamSizeField?.choices ?? []).map((choice) => stegaClean(choice));
  const [values, setValues] = useState({
    name: "",
    email: "",
    company: "",
    teamSize: choices[0] ?? "",
    message: "",
    honeypot: "",
  });
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [error, setError] = useState("");

  const update =
    (key: keyof typeof values) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      setValues((previous) => ({ ...previous, [key]: event.target.value }));
      if (status === "error") {
        setStatus("idle");
        setError("");
      }
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!values.name.trim() || !values.company.trim()) {
      setStatus("error");
      setError("Please fill in your name and company.");
      return;
    }
    if (!isValidEmail(values.email)) {
      setStatus("error");
      setError("Please enter a valid work email.");
      return;
    }

    setStatus("submitting");
    setError("");

    try {
      const result = await submitSalesInquiry(values);
      if (result.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setError(result.error);
      }
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <output
        ref={(node) => node?.focus()}
        tabIndex={-1}
        className="block py-12 text-center text-16 text-foreground focus:outline-none"
      >
        {stegaClean(successMessage) || "Thanks! We'll be in touch shortly."}
      </output>
    );
  }

  const isSubmitting = status === "submitting";

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
      <Field id={`${fieldId}-name`} label={nameField?.label}>
        <input
          id={`${fieldId}-name`}
          name="name"
          autoComplete="name"
          value={values.name}
          onChange={update("name")}
          maxLength={MAX_FIELD_LENGTH}
          aria-describedby={errorId}
          placeholder={stegaClean(nameField?.placeholder) || undefined}
          className={clsx(INPUT_CLASS, "h-10")}
          required
        />
      </Field>
      <Field id={`${fieldId}-email`} label={emailField?.label}>
        <input
          id={`${fieldId}-email`}
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={update("email")}
          maxLength={MAX_EMAIL_LENGTH}
          aria-describedby={errorId}
          placeholder={stegaClean(emailField?.placeholder) || undefined}
          className={clsx(INPUT_CLASS, "h-10")}
          required
        />
      </Field>
      <Field id={`${fieldId}-company`} label={companyField?.label}>
        <input
          id={`${fieldId}-company`}
          name="company"
          autoComplete="organization"
          value={values.company}
          onChange={update("company")}
          maxLength={MAX_FIELD_LENGTH}
          aria-describedby={errorId}
          placeholder={stegaClean(companyField?.placeholder) || undefined}
          className={clsx(INPUT_CLASS, "h-10")}
          required
        />
      </Field>
      {choices.length > 0 && (
        <Field id={`${fieldId}-team`} label={teamSizeField?.label}>
          <div className="relative">
            <select
              id={`${fieldId}-team`}
              name="teamSize"
              value={values.teamSize}
              onChange={update("teamSize")}
              className={clsx(INPUT_CLASS, "h-10 appearance-none pr-10")}
            >
              {choices.map((choice, index) => (
                <option key={`${index}-${choice}`} value={choice}>
                  {choice}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
          </div>
        </Field>
      )}
      <Field
        id={`${fieldId}-message`}
        label={messageField?.label}
        className="sm:col-span-2"
      >
        <textarea
          id={`${fieldId}-message`}
          name="message"
          rows={3}
          value={values.message}
          onChange={update("message")}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder={stegaClean(messageField?.placeholder) || undefined}
          className={clsx(INPUT_CLASS, "min-h-20 py-2")}
        />
      </Field>

      {/* Honeypot: hidden from people, filled in by bots. */}
      <input
        type="text"
        name="website"
        value={values.honeypot}
        onChange={update("honeypot")}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
      />

      <div className="flex flex-col items-start gap-2 sm:col-span-2">
        <Button variant="primary" size="md" loading={isSubmitting}>
          <span className="inline-flex items-center gap-1.5">
            {stegaClean(submitLabel) || "Submit"}
            <ArrowRight className="size-4" aria-hidden />
          </span>
        </Button>
        <p id={errorId} role="alert" className="min-h-4 text-12 text-destructive">
          {error}
        </p>
      </div>
    </form>
  );
};

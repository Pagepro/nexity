import Link from "next/link";

import { cn } from "@/lib/utils";
import type { SetupStatus } from "@/sanity/lib/queries/setup-status";
import { getMissingRecommendedEnv } from "@/setup/env-recommendations";

interface GettingStartedProps {
  status: SetupStatus;
}

const REQUIRED_DOCUMENTS = [
  { key: "hasSite", label: "Site settings", hint: "Settings → site title" },
  { key: "hasHeader", label: "Header", hint: "Header → navigation, may stay empty" },
  { key: "hasFooter", label: "Footer", hint: "Footer → links, may stay empty" },
  { key: "hasHomepage", label: "Homepage", hint: 'Pages → a page with the slug "/"' },
] as const satisfies ReadonlyArray<{
  key: keyof SetupStatus;
  label: string;
  hint: string;
}>;

const Command = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-14 text-foreground">
    {children}
  </code>
);

const Step = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="flex flex-col gap-3 rounded-xl border border-border bg-card-muted p-6">
    <h2 className="text-18 font-medium text-foreground">{title}</h2>
    <div className="flex flex-col gap-3 text-14 text-muted-foreground md:text-16">
      {children}
    </div>
  </section>
);

/** Disappears by itself once the required documents are published; nothing to delete before launch. */
export const GettingStarted = ({ status }: GettingStartedProps) => {
  const missingEnv = getMissingRecommendedEnv();

  return (
    <div className="section flex flex-col gap-8 py-16 md:py-24">
      <header className="flex max-w-2xl flex-col gap-4">
        <p className="pretitle">Next steps</p>
        <h1 className="text-36 leading-tight font-medium tracking-tight text-foreground md:text-44">
          Your site is almost ready
        </h1>
        <p className="text-16 text-muted-foreground md:text-18">
          The dataset is missing content every page needs. Add it and this screen goes
          away on its own.
        </p>
      </header>

      <ul
        className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"
        aria-label="Required content"
      >
        {REQUIRED_DOCUMENTS.map(({ key, label, hint }) => {
          const isDone = status[key];

          return (
            <li
              key={key}
              className={cn(
                "flex flex-col gap-1 rounded-xl border p-4",
                isDone
                  ? "border-border bg-background"
                  : "border-foreground bg-card-muted",
              )}
            >
              <span className="text-14 font-medium text-foreground">
                <span aria-hidden="true">{isDone ? "✓ " : "○ "}</span>
                {label}
                <span className="sr-only">{isDone ? " (done)" : " (missing)"}</span>
              </span>
              <span className="text-12 text-muted-foreground">{hint}</span>
            </li>
          );
        })}
      </ul>

      <div className="grid gap-4 lg:grid-cols-2">
        <Step title="Fastest: import the Meridian demo content">
          <p>
            Run <Command>pnpm seed</Command> from the repo root. It imports{" "}
            <Command>seed/meridian.tar.gz</Command> (pages, posts, case studies, header,
            footer, Site settings and their images) and replaces demo documents with the
            same ids.
          </p>
          <p>
            It uses <Command>SANITY_API_WRITE_TOKEN</Command> (an Editor token) or your{" "}
            <Command>sanity login</Command> session. <Command>sanity init</Command>{" "}
            creates the token in <Command>web/.env.local</Command>; revoke it once the
            content is in.
          </p>
        </Step>

        <Step title="Or create them in the Studio">
          <p>
            Open the{" "}
            <Link className="font-medium text-foreground underline" href="/admin">
              Studio at /admin
            </Link>
            , fill in and publish each missing document, then reload this page.
          </p>
        </Step>
      </div>

      {missingEnv.length > 0 && (
        <Step title="Environment variables still to set">
          <ul className="flex flex-col gap-2">
            {missingEnv.map(({ name, purpose }) => (
              <li key={name}>
                <Command>{name}</Command> — {purpose}
              </li>
            ))}
          </ul>
          <p>
            Add them to <Command>web/.env.local</Command> and restart{" "}
            <Command>pnpm dev</Command>.
          </p>
        </Step>
      )}

      <Step title="After that">
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            Rename the template (package scope and display name): see “Next steps after
            init” in the README.
          </li>
          <li>
            Link the Sanity blueprint (CORS and the revalidate webhook):{" "}
            <Command>pnpm blueprints:plan</Command>, then{" "}
            <Command>pnpm blueprints:deploy</Command>.
          </li>
          <li>Deploy: see “Deploy to Vercel” in the README.</li>
        </ul>
      </Step>
    </div>
  );
};

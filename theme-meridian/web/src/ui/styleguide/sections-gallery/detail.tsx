import Link from "next/link";

import Sections from "@/ui/sections";

import { Mono } from "../primitives";

import { SECTION_FIXTURES, SectionType } from "./fixtures-registry";
import { PreviewErrorBoundary } from "./preview-error-boundary";
import { SECTION_META } from "./section-meta";
import { DocumentUsingSection } from "./usage";

const editIntentUrl = (doc: DocumentUsingSection) =>
  `/admin/intent/edit/id=${doc._id};type=${doc._type}/`;

const PreviewError = () => (
  <div className="flex min-h-64 items-center justify-center rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center text-14 text-destructive">
    Preview failed to render. If the image is missing, run <Mono>pnpm seed</Mono>.
  </div>
);

const ZeroPreview = () => (
  <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 p-6 text-center text-14 text-muted-foreground">
    No fixture yet — add a <Mono>gallery-fixture.ts</Mono> next to the component.
  </div>
);

export const SectionDetail = ({
  type,
  usingDocuments,
  definedInBundles,
}: {
  type: SectionType;
  usingDocuments: DocumentUsingSection[];
  definedInBundles: number;
}) => {
  const meta = SECTION_META[type];
  const fixture = SECTION_FIXTURES[type];

  return (
    <main className="py-10 font-sans">
      <div className="section">
        <Link
          href="/styleguide/sections"
          className="font-mono text-12 text-muted-foreground transition-colors hover:text-foreground"
        >
          ← All sections
        </Link>

        <header className="mt-4">
          <div className="font-mono text-12 text-muted-foreground/70">{type}</div>
          <h1 className="mt-1 text-30 font-medium tracking-tight">{meta.title}</h1>
          <p className="mt-2 max-w-2xl text-14 text-muted-foreground">
            {meta.description}
          </p>
        </header>

        <div className="mt-8 grid gap-8 border-t border-border pt-8 md:grid-cols-2">
          <div>
            <h2 className="font-mono text-10 tracking-[0.1em] text-muted-foreground/70 uppercase">
              Used in {usingDocuments.length}{" "}
              {usingDocuments.length === 1 ? "document" : "documents"}
            </h2>
            {usingDocuments.length ? (
              <ul className="mt-3 space-y-1">
                {usingDocuments.map((doc) => (
                  <li key={doc._id}>
                    <a
                      href={editIntentUrl(doc)}
                      target="_top"
                      className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-14 transition-colors hover:bg-muted"
                    >
                      <span className="truncate">{doc.title}</span>
                      <span className="shrink-0 font-mono text-10 text-muted-foreground">
                        Edit ↗
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-14 text-muted-foreground">
                Not used by any document yet.
              </p>
            )}
            {definedInBundles > 0 && (
              <p className="mt-3 text-12 text-muted-foreground">
                Defined in {definedInBundles} shared{" "}
                {definedInBundles === 1 ? "bundle" : "bundles"}.
              </p>
            )}
          </div>

          <div>
            <h2 className="font-mono text-10 tracking-[0.1em] text-muted-foreground/70 uppercase">
              Accepts
            </h2>
            <Mono className="mt-3 block text-muted-foreground">{meta.accepts}</Mono>
          </div>
        </div>
      </div>

      <div className="mt-10 border-t border-border pb-16">
        {fixture ? (
          <PreviewErrorBoundary
            fallback={
              <div className="section py-10">
                <PreviewError />
              </div>
            }
          >
            <Sections sections={[fixture]} withDataFirstAttribute={false} />
          </PreviewErrorBoundary>
        ) : (
          <div className="section py-10">
            <ZeroPreview />
          </div>
        )}
      </div>
    </main>
  );
};

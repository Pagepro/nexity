import { Download, FileText } from "lucide-react";
import { stegaClean } from "next-sanity";

import type { GATED_RESOURCE_QUERY_RESULT } from "@/types/sanity.types";
import { BaseLink } from "@/ui/components/Link/BaseLink";
import RichText from "@/ui/RichText";

import { downloadHref, formatFileSize } from "./utils";

interface GatedResourceContentProps {
  resource: NonNullable<GATED_RESOURCE_QUERY_RESULT>;
}

const GatedResourceContent = ({ resource }: GatedResourceContentProps) => (
  <div className="flex flex-col gap-6">
    {resource.content?.length ? (
      <div className="richtext text-balance">
        <RichText value={resource.content} />
      </div>
    ) : null}
    <ul className="flex flex-col gap-3">
      {resource.files.map((file) => {
        const details = [
          stegaClean(file.extension)?.toUpperCase(),
          formatFileSize(file.size),
        ].filter(Boolean);

        return (
          <li key={file._key}>
            <BaseLink
              link={downloadHref(file.url, file.filename)}
              openInNewTab={false}
              className="flex items-center gap-3 rounded-md border border-border bg-card-muted px-4 py-3 text-foreground transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-14 font-medium">{file.label}</span>
                {details.length ? (
                  <span className="text-12 text-muted-foreground">
                    {details.join(" · ")}
                  </span>
                ) : null}
              </span>
              <Download className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </BaseLink>
          </li>
        );
      })}
    </ul>
  </div>
);

export default GatedResourceContent;

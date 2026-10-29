import { cn } from "@/lib/utils";

export const UsageBadge = ({
  count,
  hasFixture,
  documentTitles,
  className,
}: {
  count?: number;
  hasFixture: boolean;
  documentTitles?: string[];
  className?: string;
}) => {
  // NB: no text-* size here on purpose — twMerge would drop a size class that
  // shares this list with the text-{color} utilities below. The size is set on
  // the parent wrapper (section-card) and inherited. See web/AGENTS.md.
  const base =
    "inline-flex items-center rounded-full px-2.5 py-0.5 font-mono tracking-wide";

  if (!hasFixture) {
    return (
      <span className={cn(base, "bg-accent text-accent-foreground", className)}>
        Needs fixture
      </span>
    );
  }

  if (count === undefined) {
    return (
      <span
        className={cn(base, "animate-pulse bg-muted text-muted-foreground", className)}
      >
        …
      </span>
    );
  }

  if (count === 0) {
    return (
      <span className={cn(base, "bg-muted text-muted-foreground", className)}>
        Not used yet
      </span>
    );
  }

  return (
    <span className={cn("group/usage relative z-20 inline-block", className)}>
      <span className={cn(base, "cursor-default bg-secondary text-secondary-foreground")}>
        {count} in use
      </span>

      {documentTitles?.length ? (
        <span
          role="tooltip"
          className="invisible absolute bottom-full left-0 z-30 mb-1.5 w-max max-w-[16rem] rounded-lg border border-border bg-popover p-2 text-popover-foreground opacity-0 shadow-xl transition-opacity group-hover/usage:visible group-hover/usage:opacity-100"
        >
          <span className="mb-1 block font-mono text-10 tracking-wide text-muted-foreground/70 uppercase">
            Used in
          </span>
          <span className="block space-y-0.5">
            {(documentTitles.length > 10
              ? documentTitles.slice(0, 5)
              : documentTitles
            ).map((title, index) => (
              <span key={`${title}-${index}`} className="block truncate text-12">
                {title}
              </span>
            ))}
            {documentTitles.length > 10 && (
              <span className="block pt-0.5 text-12 text-muted-foreground italic">
                …{documentTitles.length - 5} more in details
              </span>
            )}
          </span>
        </span>
      ) : null}
    </span>
  );
};

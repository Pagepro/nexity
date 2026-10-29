import type { LucideIcon } from "lucide-react";

interface ResultRowProps {
  // The icon component itself, not a FeatureIcon key: this row renders inside a
  // client component, and FeatureIcon's map would ship ~30 icons to the browser.
  icon: LucideIcon;
  value: string;
  label: string | null;
  detail?: string;
}

export const ResultRow = ({
  icon: IconComponent,
  value,
  label,
  detail,
}: ResultRowProps) => (
  <div className="flex items-start gap-4 border-t border-border py-5 first:border-t-0">
    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
      <IconComponent aria-hidden className="size-4" />
    </span>
    <div className="flex flex-col gap-1">
      <output className="text-30 leading-none font-medium tracking-tight text-foreground">
        {value}
      </output>
      <p className="text-14 text-muted-foreground">
        {[label, detail].filter(Boolean).join(" · ")}
      </p>
    </div>
  </div>
);

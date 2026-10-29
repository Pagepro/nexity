import { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const DocSection = ({
  id,
  number,
  title,
  intro,
  children,
}: {
  id: string;
  number: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) => (
  <section id={id} className="scroll-mt-24 border-t border-border py-16 first:border-t-0">
    <div className="font-mono text-12 text-muted-foreground/70">{number}</div>
    <h2 className="mt-1 text-30 font-medium tracking-tight">{title}</h2>
    {intro && <p className="mt-2 max-w-2xl text-14 text-muted-foreground">{intro}</p>}
    <div className="mt-8">{children}</div>
  </section>
);

export const Mono = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => <code className={cn("font-mono text-12", className)}>{children}</code>;

export const GroupLabel = ({ children }: { children: ReactNode }) => (
  <div className="mt-10 mb-4 font-mono text-10 tracking-[0.1em] text-muted-foreground/70 uppercase">
    {children}
  </div>
);

export const Swatch = ({
  color,
  name,
  value,
  darkValue,
  usage,
  alias,
}: {
  color: string;
  name: string;
  value: string;
  darkValue?: string;
  usage?: string;
  alias?: string;
}) => (
  <div className="overflow-hidden rounded-lg border border-border bg-card">
    <div className="flex h-16 border-b border-border">
      <div className="flex-1" style={{ background: color }} />
      {darkValue && <div className="flex-1" style={{ background: darkValue }} />}
    </div>
    <div className="p-3">
      <div className="flex items-baseline justify-between gap-2">
        <Mono className="font-medium">{name}</Mono>
        {alias && (
          <span className="font-mono text-10 text-muted-foreground/60">{alias}</span>
        )}
      </div>
      <div className="mt-1 font-mono text-10 text-muted-foreground">
        {value}
        {darkValue && <div>dark: {darkValue}</div>}
      </div>
      {usage && <div className="mt-1.5 text-10 text-muted-foreground">{usage}</div>}
    </div>
  </div>
);

export const TokenRow = ({
  meta,
  children,
}: {
  meta: ReactNode;
  children: ReactNode;
}) => (
  <div className="grid grid-cols-[150px_1fr] items-baseline gap-6 border-t border-border py-4 first:border-t-0">
    <div className="font-mono text-10 text-muted-foreground">{meta}</div>
    <div>{children}</div>
  </div>
);

export const TokenSkeleton = () => (
  <div className="animate-pulse text-14 text-muted-foreground">
    Reading tokens from the running stylesheet…
  </div>
);

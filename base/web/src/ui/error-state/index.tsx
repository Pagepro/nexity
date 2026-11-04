import Link from "next/link";

import ButtonBase from "@/ui/components/button/button-base";

interface ErrorStateProps {
  code: string;
  title: string;
  description: string;
  /** Rendered before the homepage link. */
  actions?: React.ReactNode;
}

/** Fallback for 404 and error pages; no Sanity reads, so it renders while the dataset is down. */
export const ErrorState = ({ code, title, description, actions }: ErrorStateProps) => (
  <div className="section flex flex-col gap-8 py-16 md:py-24">
    <header className="flex max-w-2xl flex-col gap-4">
      <p className="pretitle">{code}</p>
      <h1 className="text-36 leading-tight font-medium tracking-tight text-foreground md:text-44">
        {title}
      </h1>
      <p className="text-16 text-muted-foreground md:text-18">{description}</p>
    </header>

    <div className="flex flex-wrap gap-3">
      {actions}
      <Link href="/">
        <ButtonBase variant={actions ? "primary-outline" : "primary"}>
          Back to home
        </ButtonBase>
      </Link>
    </div>
  </div>
);

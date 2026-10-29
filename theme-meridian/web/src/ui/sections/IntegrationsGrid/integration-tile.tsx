import { toInitials } from "@/lib/initials";
import Image from "@/ui/components/image";

import { Integration } from "./types";
import { categoryLabel } from "./utils";

interface IntegrationTileProps {
  integration: Integration;
}

export const IntegrationTile = ({ integration }: IntegrationTileProps) => {
  const { name, category, logo } = integration;

  return (
    <div className="card-frame flex items-center gap-3 overflow-hidden rounded-lg border-4 border-background bg-card-muted p-4 shadow-card">
      <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background text-14 font-medium text-foreground">
        {logo?.image ? (
          <Image sanityImage={logo} sizes="40px" className="object-contain p-2" fill />
        ) : (
          <span aria-hidden>{toInitials(name)}</span>
        )}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-14 font-medium text-foreground">{name}</span>
        <span className="truncate text-12 text-muted-foreground">
          {categoryLabel(category)}
        </span>
      </span>
    </div>
  );
};

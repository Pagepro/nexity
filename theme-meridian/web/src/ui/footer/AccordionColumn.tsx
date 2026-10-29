"use client";

import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { PropsWithChildren, useState } from "react";

interface AccordionColumnProps {
  title: string;
}

const AccordionColumn: React.FC<PropsWithChildren<AccordionColumnProps>> = ({
  title,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-t border-border lg:border-t-0">
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between py-4 lg:pointer-events-none lg:mb-4 lg:py-0"
      >
        <span className="text-14 font-medium text-card-foreground">{title}</span>
        <ChevronDown
          className={clsx(
            "size-4 shrink-0 text-card-foreground transition-all lg:hidden",
            {
              "rotate-180": isOpen,
            },
          )}
        />
      </button>

      <div
        className={clsx(
          "flex-col gap-2 pb-4 text-14 text-muted-foreground lg:flex lg:pb-0",
          isOpen ? "flex" : "hidden",
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default AccordionColumn;

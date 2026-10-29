import clsx from "clsx";
import { Check, X } from "lucide-react";
import { stegaClean } from "next-sanity";

import { ChecklistValue } from "./types";

const RichTextChecklist: React.FC<{ value: ChecklistValue }> = ({ value }) => {
  const items = value.items ?? [];

  if (!items.length) return null;

  const hasDescriptions = items.some((item) => item.description);

  return (
    <ul
      className={clsx(
        "richtext-embed flex flex-col text-14 md:text-16",
        hasDescriptions ? "gap-4" : "gap-2.5",
      )}
    >
      {items.map((item) => {
        const isDont = stegaClean(item.tone) === "dont";
        const Icon = isDont ? X : Check;

        return (
          <li key={item._key} className="flex items-start gap-2">
            {/* One line tall, so the icon centres on the title's first line. */}
            <span className="flex h-lh shrink-0 items-center leading-relaxed">
              <Icon className="size-5 text-foreground" aria-hidden />
            </span>
            <div className="flex min-w-0 flex-col gap-2">
              <p
                className={clsx(
                  "leading-relaxed text-foreground",
                  item.description && "font-medium",
                )}
              >
                {item.title}
              </p>
              {item.description && (
                <p className="leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default RichTextChecklist;

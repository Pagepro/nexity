import { cn } from "@/lib/utils";

import { Episode } from "./types";

interface ChapterListProps {
  chapters: NonNullable<Episode["chapters"]>;
  className?: string;
}

export const ChapterList = ({ chapters, className }: ChapterListProps) => (
  <dl className={cn("flex flex-col gap-y-1.5", className)}>
    {chapters.map((chapter) => (
      <div key={chapter._key} className="flex gap-4">
        <dt className="w-14 shrink-0 text-muted-foreground tabular-nums">
          {chapter.timestamp}
        </dt>
        <dd className="text-foreground">{chapter.title}</dd>
      </div>
    ))}
  </dl>
);

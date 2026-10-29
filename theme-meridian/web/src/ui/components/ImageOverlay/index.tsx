import { cn } from "@/lib/utils";

import { ImageOverlayProps } from "./types";

const ImageOverlay: React.FC<ImageOverlayProps> = ({ className, children, image }) => {
  if (!image?.image && !image?.responsive?.length) {
    return <div className={cn("flex w-full", className)}>{children}</div>;
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        image &&
          "after:absolute after:inset-0 after:bg-gradient-to-b after:from-white/10 after:to-black/80 after:content-['']",
        className,
      )}
    >
      <div className="relative z-1 flex size-full">{children}</div>
    </div>
  );
};

export default ImageOverlay;

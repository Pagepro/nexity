"use client";

import { Play } from "lucide-react";
import { type ReactNode, useState } from "react";

const toEmbedUrl = (url: string): { embed: string; isFile: boolean } => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return {
        embed: `https://www.youtube.com/embed${parsed.pathname}?autoplay=1`,
        isFile: false,
      };
    }
    if (host.endsWith("youtube.com")) {
      const id = parsed.searchParams.get("v");
      if (id)
        return { embed: `https://www.youtube.com/embed/${id}?autoplay=1`, isFile: false };
    }
    if (host.endsWith("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      if (id)
        return {
          embed: `https://player.vimeo.com/video/${id}?autoplay=1`,
          isFile: false,
        };
    }
  } catch {
    // fall through to file handling
  }

  return { embed: url, isFile: true };
};

interface RichTextVideoPlayerProps {
  url: string;
  caption?: string | null;
  // Rendered by the server (`<Img>`), so no image code ships with the player.
  poster: ReactNode;
}

const RichTextVideoPlayer = ({ url, caption, poster }: RichTextVideoPlayerProps) => {
  const [playing, setPlaying] = useState(false);
  const { embed, isFile } = toEmbedUrl(url);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
      {playing ? (
        isFile ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            src={embed}
            controls
            autoPlay
            aria-label={caption || "Video"}
            className="absolute inset-0 size-full object-cover"
          >
            <track kind="captions" />
          </video>
        ) : (
          <iframe
            src={embed}
            title={caption || "Embedded video"}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 size-full"
          />
        )
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={caption ? `Play: ${caption}` : "Play video"}
          className="group absolute inset-0 size-full"
        >
          {poster}
          <span className="absolute inset-0 bg-foreground/40 transition-colors group-hover:bg-foreground/50" />
          <span className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary p-4 transition-transform group-hover:scale-105 md:p-5">
            <Play className="size-7 fill-primary-foreground text-primary-foreground md:size-9" />
          </span>
        </button>
      )}
    </div>
  );
};

export default RichTextVideoPlayer;

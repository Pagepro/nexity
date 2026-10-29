import Image from "@/ui/components/image";

import { RichTextVideoPlayer } from "./RichTextVideoPlayerLazy";
import { VideoValue } from "./types";

const RichTextVideo: React.FC<{ value: VideoValue }> = ({ value }) => {
  const { url, poster, caption } = value;

  if (!url) return null;

  return (
    <figure className="richtext-embed flex flex-col gap-4">
      <RichTextVideoPlayer
        url={url}
        caption={caption}
        poster={
          poster?.image ? (
            <Image
              sanityImage={poster}
              fill
              sizes="(max-width: 768px) 100vw, 720px"
              className="object-cover"
            />
          ) : null
        }
      />

      {caption && (
        <figcaption className="text-center text-14 text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

export default RichTextVideo;

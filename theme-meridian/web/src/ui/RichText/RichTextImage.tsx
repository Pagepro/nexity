import Image from "@/ui/components/image";

import { RichTextImageProps } from "./types";

const RichTextImage: React.FC<RichTextImageProps> = ({ value }) => (
  <figure className="richtext-embed flex w-full flex-col gap-5">
    <Image className="w-full rounded-2xl object-cover" sanityImage={value} />
  </figure>
);

export default RichTextImage;

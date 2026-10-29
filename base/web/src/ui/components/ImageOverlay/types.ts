import { ImageFragment } from "@/types/fragments";

export interface ImageOverlayProps {
  className?: string;
  children: React.ReactNode;
  image?: ImageFragment;
  isHalfWidth?: boolean;
  sizes?: string;
}

import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaPinterestP,
  FaTiktok,
  FaXTwitter,
} from "react-icons/fa6";

import { BaseLink } from "@/ui/components/Link/BaseLink";

import AccordionColumn from "./AccordionColumn";
import { FooterSocialProps } from "./types";

const ICON_MAP: Record<string, React.FC<React.ComponentProps<"svg">>> = {
  "pinterest.com": FaPinterestP,
  "instagram.com": FaInstagram,
  "linkedin.com": FaLinkedinIn,
  "facebook.com": FaFacebookF,
  "tiktok.com": FaTiktok,
  "twitter.com": FaXTwitter,
  "x.com": FaXTwitter,
};

const getIcon = (url: string) => {
  for (const [domain, Icon] of Object.entries(ICON_MAP)) {
    if (url.includes(domain)) return Icon;
  }

  return null;
};

const FooterSocial: React.FC<FooterSocialProps> = ({ social }) => {
  if (!social?.length) return null;

  return (
    <AccordionColumn title="Follow us">
      {social.map((item) => {
        if (item._type !== "link") return null;

        const IconComponent = getIcon(item.external || "");

        if (!IconComponent) return null;

        return (
          <BaseLink
            key={item.label || item.external}
            link={item}
            className="flex items-center gap-2 transition-colors hover:text-card-foreground"
          >
            <IconComponent className="size-4 shrink-0 text-card-foreground" />
            <span>{item.label}</span>
          </BaseLink>
        );
      })}
    </AccordionColumn>
  );
};

export default FooterSocial;

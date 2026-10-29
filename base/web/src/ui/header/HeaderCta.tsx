import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { stegaClean } from "next-sanity";
import { FC } from "react";

import { ButtonLink } from "@/ui/components/button/button-link";
import { BaseLink } from "@/ui/components/Link/BaseLink";

import { HeaderCtaProps } from "./types";

const HeaderCta: FC<HeaderCtaProps> = ({ cta, block = false }) => {
  if (!cta?.link) return null;

  const { link, variant } = cta;
  const cleanVariant = stegaClean(variant);

  if (cleanVariant === "primary") {
    return (
      <BaseLink
        link={link}
        className={clsx(
          "header-cta-primary inline-flex items-center justify-center gap-1.5 rounded-md border text-14 font-medium",
          block ? "h-10 w-full px-4" : "h-8 px-3",
        )}
      >
        <span>{link.label || "Label"}</span>
        {block && <ArrowRight className="size-4 opacity-60" aria-hidden />}
      </BaseLink>
    );
  }

  return (
    <ButtonLink
      link={link}
      variant="ghost"
      size="sm"
      buttonClassName={clsx(block && "h-10 w-full px-4")}
    >
      {link.label || "Label"}
    </ButtonLink>
  );
};

export default HeaderCta;

import Link from "next/link";
import { FC } from "react";

import Image from "@/ui/components/image";

import HamburgerMenu from "./HamburgerMenu";
import HeaderCta from "./HeaderCta";
import Navigation from "./Navigation";
import SearchAction from "./SearchAction";
import { HeaderContentProps } from "./types";
import Wrapper from "./Wrapper";

const HeaderContent: FC<HeaderContentProps> = ({
  logo,
  menu,
  ctas,
  title,
  searchLink,
}) => {
  const mainMenu = menu?.filter((item) => item.visibleInMainMenu) || [];

  return (
    <Wrapper className="fixed inset-x-0 top-0 z-50 w-full text-foreground">
      <div className="relative section flex items-center justify-between py-2.5 lg:py-4">
        <Link
          href="/"
          aria-label={title ? `${title} - home` : "Home"}
          className="flex items-center transition-opacity hover:opacity-80"
        >
          {logo ? (
            <Image
              className="h-5 w-auto md:h-6"
              sanityImage={logo}
              unoptimized
              preload
              placeholder="empty"
            />
          ) : (
            <span className="text-lg font-semibold">{title}</span>
          )}
        </Link>

        <Navigation menu={mainMenu} />

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            <SearchAction searchLink={searchLink} />

            {!!searchLink?.type && !!ctas?.length && (
              <span className="h-6 w-px bg-border" aria-hidden />
            )}

            {ctas?.map((cta) => (
              <HeaderCta key={cta._key} cta={cta} />
            ))}
          </div>

          <SearchAction searchLink={searchLink} className="lg:hidden" />
          <HamburgerMenu
            menu={menu}
            ctaSlot={
              ctas?.length
                ? ctas.map((cta) => <HeaderCta key={cta._key} cta={cta} block />)
                : null
            }
          />
        </div>
      </div>
    </Wrapper>
  );
};

export default HeaderContent;

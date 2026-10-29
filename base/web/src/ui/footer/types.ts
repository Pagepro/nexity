import { FooterQueryResult } from "@/types/sanity.types";

type Footer = NonNullable<FooterQueryResult>;

export interface NavigationProps {
  menus: Footer["navigation"];
}

export interface SubscribeBandProps {
  heading: Footer["subscribeHeading"];
  ctas: Footer["subscribeCtas"];
  hidden?: boolean;
}

export interface FooterSocialProps {
  social: Footer["social"];
}

export interface FooterBottomProps {
  siteTitle: string | null | undefined;
}

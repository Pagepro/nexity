import { getFooter } from "@/sanity/lib/queries/footer";

import BrandLockup from "./BrandLockup";
import FooterSocial from "./FooterSocial";
import Navigation from "./Navigation";
import SubscribeBand from "./SubscribeBand";

const Footer = async () => {
  const { subscribeHeading, subscribeCtas, social, navigation } = await getFooter();

  return (
    <footer className="relative isolate overflow-hidden border-t border-border bg-card-muted py-16 text-card-foreground md:py-24">
      <div className="section flex flex-col gap-16 md:gap-24">
        <SubscribeBand heading={subscribeHeading} ctas={subscribeCtas} />

        <div className="flex flex-col lg:grid lg:grid-cols-5 lg:gap-8">
          <Navigation menus={navigation} />
          <FooterSocial social={social} />
        </div>

        {/* Negative margin cancels the footer's bottom padding (py-16 md:py-24). */}
        <BrandLockup className="-mb-16 md:-mb-24" />
      </div>
    </footer>
  );
};

export default Footer;

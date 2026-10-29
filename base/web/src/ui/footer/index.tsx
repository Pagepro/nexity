import { getFooter } from "@/sanity/lib/queries/footer";
import { getSite } from "@/sanity/lib/queries/site";

import FooterBottom from "./FooterBottom";
import FooterSocial from "./FooterSocial";
import Navigation from "./Navigation";
import SubscribeBand from "./SubscribeBand";

const Footer = async () => {
  const [{ subscribeHeading, subscribeCtas, social, navigation }, site] =
    await Promise.all([
      getFooter(),
      // Without Site settings the footer still renders, just without the name.
      getSite().catch(() => null),
    ]);

  return (
    <footer className="border-t border-border bg-card-muted py-16 text-card-foreground md:py-24">
      <div className="section flex flex-col gap-16 md:gap-24">
        <SubscribeBand heading={subscribeHeading} ctas={subscribeCtas} />

        <div className="flex flex-col gap-8">
          <div className="flex flex-col lg:grid lg:grid-cols-5 lg:gap-8">
            <Navigation menus={navigation} />
            <FooterSocial social={social} />
          </div>

          <FooterBottom siteTitle={site?.title} />
        </div>
      </div>
    </footer>
  );
};

export default Footer;

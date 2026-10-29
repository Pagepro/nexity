import { getHeader } from "@/sanity/lib/queries/header";
import { getSite } from "@/sanity/lib/queries/site";

import HeaderContent from "./HeaderContent";

const Header = async () => {
  const [{ logo, title }, { menu, ctas, searchLink }] = await Promise.all([
    getSite(),
    getHeader(),
  ]);

  return <HeaderContent {...{ menu, ctas, title, logo, searchLink }} />;
};

export default Header;

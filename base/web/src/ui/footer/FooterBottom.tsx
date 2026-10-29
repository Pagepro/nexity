import { FooterBottomProps } from "./types";

// The site name is a plain text lockup: swap it for your logo when the project has one.
const FooterBottom: React.FC<FooterBottomProps> = ({ siteTitle }) => {
  // oxlint-disable-next-line react/purity -- Server Component, rendered once per request
  const year = new Date().getFullYear();

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-8 text-14 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      {siteTitle && (
        <span className="text-16 font-semibold text-card-foreground">{siteTitle}</span>
      )}
      <span>
        © {year}
        {siteTitle ? ` ${siteTitle}` : ""}. All rights reserved.
      </span>
    </div>
  );
};

export default FooterBottom;

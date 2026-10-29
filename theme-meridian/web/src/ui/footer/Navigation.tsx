import { BaseLink } from "@/ui/components/Link/BaseLink";

import AccordionColumn from "./AccordionColumn";
import { NavigationProps } from "./types";

const Navigation: React.FC<NavigationProps> = ({ menus }) => {
  if (!menus?.length) return null;

  return (
    <>
      {menus.map(({ title, links, _key }) => (
        <AccordionColumn key={_key} title={title || ""}>
          {links?.map((link) =>
            link ? (
              <BaseLink
                key={link.label}
                link={link}
                className="transition-colors hover:text-card-foreground"
              >
                {link.label}
              </BaseLink>
            ) : null,
          )}
        </AccordionColumn>
      ))}
    </>
  );
};

export default Navigation;

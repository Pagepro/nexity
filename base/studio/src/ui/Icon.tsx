import type { FC, SVGProps } from "react";

import utilityIcons from "@/consts/utility/utility-icons";
import utilityIconsMap from "@/consts/utility/utility-icons-map";

const Icon: FC<{ icon?: string } & SVGProps<SVGSVGElement>> = ({
  icon: iconVariant,
  ...props
}) => {
  if (!iconVariant) return null;

  const utilityIcon = utilityIcons.find((i) => i.value === iconVariant);
  if (!utilityIcon) return null;

  const IconComponent =
    utilityIconsMap[utilityIcon.value as keyof typeof utilityIconsMap];
  if (!IconComponent) return null;

  return <IconComponent {...props} />;
};

export default Icon;

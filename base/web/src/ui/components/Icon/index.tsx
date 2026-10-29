import clsx from "clsx";
import { stegaClean } from "next-sanity";
import { Suspense } from "react";

import utilityIcons from "@/consts/utility/utility-icons";
import utilityIconsMap from "@/consts/utility/utility-icons-client-map";

import { IconProps } from "./types";

const Icon: React.FC<IconProps> = ({ icon: iconVariant, ...props }) => {
  if (!iconVariant) {
    return null;
  }

  const utilityIcon = utilityIcons.find((icon) => icon.value === stegaClean(iconVariant));

  if (utilityIcon) {
    const IconComponent = utilityIconsMap[utilityIcon.value];

    return (
      <Suspense
        fallback={
          <span className={clsx("inline-block h-[1em] w-[1em]", props.className)} />
        }
      >
        <IconComponent {...props} />
      </Suspense>
    );
  }

  console.warn(
    `Icon with value "${stegaClean(iconVariant)}" not found in navigation or utility icons`,
  );

  return null;
};

export default Icon;

"use client";

import { Menu, X } from "lucide-react";
import { FC, useEffect, useState } from "react";

import { ToggleProps } from "./types";

const Toggle: FC<ToggleProps> = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Mirror `html.header-open` into state: Wrapper also clears it on route change.
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsOpen(root.classList.contains("header-open"));

    sync();

    const observer = new MutationObserver(sync);

    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  const handleToggleChange = () => {
    const root = document.documentElement;

    if (root.classList.contains("header-open")) {
      root.classList.remove("header-open");
      root.classList.add("header-closed");
      onClose();
    } else {
      root.classList.add("header-open");
      root.classList.remove("header-closed");
    }
  };

  return (
    <button
      type="button"
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
      className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-button-ghost-hover"
      onClick={handleToggleChange}
    >
      {isOpen ? <X className="size-4" /> : <Menu className="size-4" />}
    </button>
  );
};

export default Toggle;

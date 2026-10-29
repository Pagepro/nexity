import { useRef } from "react";

export const useHeader = (onClose?: () => void) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => {
    if (typeof document === "undefined") {
      return;
    }

    if (document.documentElement.classList.contains("header-open")) {
      document.documentElement.classList.remove("header-open");
      document.documentElement.classList.add("header-closed");
    }

    onClose?.();
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Element;

    // The toggle swaps its icon on click, detaching the clicked SVG before this runs, so
    // `contains()` would call it an outside click and re-close the menu.
    if (!target.isConnected) return;

    if (wrapperRef.current && !wrapperRef.current.contains(target)) {
      closeMenu();
    }
  };

  return { closeMenu, wrapperRef, handleClickOutside };
};

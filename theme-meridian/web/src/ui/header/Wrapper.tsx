"use client";

import clsx from "clsx";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const Wrapper = ({ className, children }: React.ComponentProps<"header">) => {
  const ref = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const el = ref.current;

    if (!el) return;

    const ro = new ResizeObserver(() => {
      document.documentElement.style.setProperty(
        "--header-height",
        `${el.offsetHeight}px`,
      );
    });

    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 4);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    if (document.documentElement.classList.contains("header-open")) {
      document.documentElement.classList.remove("header-open");
      document.documentElement.classList.add("header-closed");
    }
  }, [pathname]);

  return (
    <header
      ref={ref}
      // clsx, not cn: tailwind-merge is ~8 KB br of client JS; these classes never conflict.
      className={clsx(
        // `header-bar` is the hook for the over-dark state (`dark-palette` in app.css).
        "header-bar border-b transition-colors duration-200",
        // Descendants read `header-scrolled` via `.header-scrolled &`: keep it on this root.
        isScrolled
          ? "header-scrolled border-border bg-background"
          : "border-transparent bg-transparent",
        "[.header-open_&]:border-border [.header-open_&]:bg-background",
        className,
      )}
    >
      {children}
    </header>
  );
};

export default Wrapper;

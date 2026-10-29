export interface NavItem {
  id: string;
  label: string;
}

export const STYLEGUIDE_SECTIONS: NavItem[] = [
  { id: "overview", label: "Overview" },
  { id: "colors", label: "Colors" },
  { id: "typography", label: "Typography" },
  { id: "layout", label: "Layout" },
  { id: "elevation", label: "Elevation" },
  { id: "shapes", label: "Shapes" },
  { id: "components", label: "Components" },
];

export const StyleguideNav = () => (
  <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
    <div className="section flex h-14 items-center gap-6">
      <span className="font-medium tracking-tight whitespace-nowrap">
        Meridian · Design System
      </span>
      <nav className="ml-auto hidden items-center gap-5 md:flex">
        {STYLEGUIDE_SECTIONS.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="text-14 text-muted-foreground transition-colors hover:text-foreground"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  </header>
);

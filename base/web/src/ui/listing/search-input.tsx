import { Search } from "lucide-react";

const SearchInput = ({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (_value: string) => void;
  placeholder: string;
  label: string;
}) => (
  <div className="flex h-12 w-full items-center gap-1.5 border-b border-input py-1 sm:w-96">
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={label}
      className="min-w-0 flex-1 bg-transparent text-16 text-foreground placeholder:text-muted-foreground focus:outline-none"
    />
    <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
  </div>
);

export default SearchInput;

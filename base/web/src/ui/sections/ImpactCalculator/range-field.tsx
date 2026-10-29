import { useId } from "react";

interface RangeFieldProps {
  label: string | null;
  valueText: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}

// The filled part of the track is a CSS variable because WebKit can't paint it by itself.
export const RangeField = ({
  label,
  valueText,
  min,
  max,
  step,
  value,
  onChange,
}: RangeFieldProps) => {
  const id = useId();
  const fillPercent = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-1.5 border-t border-border py-5 first:border-t-0 first:pt-0 last:pb-0">
      <label htmlFor={id} className="text-14 text-muted-foreground">
        {label}
      </label>
      <output
        htmlFor={id}
        className="text-30 leading-none font-medium tracking-tight text-foreground tabular-nums"
      >
        {valueText}
      </output>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={valueText}
        onChange={(event) => onChange(Number(event.target.value))}
        className="range-hairline mt-2"
        style={{ "--range-fill": `${fillPercent}%` } as React.CSSProperties}
      />
    </div>
  );
};

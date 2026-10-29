"use client";

import clsx from "clsx";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

/** Price swap motion duration — kept in sync with the `duration-200` on the price block. */
const SWAP_MS = 200;

interface BillingState {
  shownYearly: boolean;
  exiting: boolean;
}

const BillingContext = createContext<BillingState>({
  shownYearly: false,
  exiting: false,
});

interface PricingPlansProps {
  hasYearlyPricing: boolean;
  monthlyLabel: string | null;
  yearlyLabel: string | null;
  // Cards are rendered by the server and passed in, so ButtonLink, icons and
  // feature lists never ship to the browser.
  children: ReactNode;
}

export const PricingPlans = ({
  hasYearlyPricing,
  monthlyLabel,
  yearlyLabel,
  children,
}: PricingPlansProps) => {
  const [isYearly, setIsYearly] = useState(false);
  const [shownYearly, setShownYearly] = useState(false);
  const [exiting, setExiting] = useState(false);
  const swapTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(swapTimeout.current), []);

  const handleSelect = (yearly: boolean) => {
    if (yearly === isYearly) {
      return;
    }

    setIsYearly(yearly);

    setExiting(true);
    clearTimeout(swapTimeout.current);
    swapTimeout.current = setTimeout(() => {
      setShownYearly(yearly);
      setExiting(false);
    }, SWAP_MS);
  };

  return (
    <BillingContext.Provider value={{ shownYearly, exiting }}>
      <div className="flex w-full flex-col items-center gap-8">
        {hasYearlyPricing && (
          <div
            role="tablist"
            aria-label="Billing period"
            className="flex h-10 items-center rounded-md bg-muted p-1 text-14"
          >
            <BillingTab
              label={monthlyLabel || "Monthly"}
              active={!isYearly}
              onClick={() => handleSelect(false)}
            />
            <BillingTab
              label={yearlyLabel || "Yearly"}
              active={isYearly}
              onClick={() => handleSelect(true)}
            />
          </div>
        )}

        {children}
      </div>
    </BillingContext.Provider>
  );
};

interface PlanPriceProps {
  monthlyPrice: string | null;
  yearlyPrice: string | null;
  priceSuffix: string | null;
}

export const PlanPrice = ({ monthlyPrice, yearlyPrice, priceSuffix }: PlanPriceProps) => {
  const { shownYearly, exiting } = useContext(BillingContext);
  const price = shownYearly && yearlyPrice ? yearlyPrice : monthlyPrice;

  return (
    <div
      className={clsx(
        "flex items-end gap-0.5 transition-all duration-200 ease-out motion-reduce:translate-y-0",
        exiting ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100",
      )}
    >
      <p className="text-30 leading-none font-medium text-foreground">{price}</p>
      {priceSuffix && (
        <p className="text-14 leading-none text-muted-foreground">{priceSuffix}</p>
      )}
    </div>
  );
};

interface BillingTabProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const BillingTab = ({ label, active, onClick }: BillingTabProps) => (
  <button
    type="button"
    role="tab"
    aria-selected={active}
    onClick={onClick}
    className={clsx(
      "flex h-full items-center justify-center rounded-md border px-3 font-medium whitespace-nowrap transition-colors",
      active
        ? "border-border bg-background text-foreground"
        : "cursor-pointer border-transparent text-foreground/60 hover:text-foreground",
    )}
  >
    {label}
  </button>
);

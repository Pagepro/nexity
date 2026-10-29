"use client";

import { ChartLine, PiggyBank, Timer } from "lucide-react";
import { type ReactNode, useState } from "react";

import {
  calculateImpact,
  CYCLE_WEEKS_OPTIONS,
  DEAL_SIZE,
  formatCycleChange,
  formatCycleWeeks,
  formatExtraDeals,
  formatMoney,
  formatPayback,
  formatReduction,
  formatTeamSize,
  INITIAL_CYCLE_WEEKS,
  TEAM_SIZE,
} from "./model";
import { RangeField } from "./range-field";
import { ResultRow } from "./result-row";
import { ImpactCalculatorProps } from "./types";

type ImpactCalculatorClientProps = Pick<
  ImpactCalculatorProps,
  | "inputsTitle"
  | "teamSizeLabel"
  | "dealSizeLabel"
  | "cycleLengthLabel"
  | "resultsTitle"
  | "cycleReductionLabel"
  | "pipelineLabel"
  | "paybackLabel"
  | "note"
> & {
  // Server-rendered ButtonLink: importing it here would ship it with the calculator.
  ctaSlot?: ReactNode;
};

const INITIAL_CYCLE_INDEX = CYCLE_WEEKS_OPTIONS.indexOf(INITIAL_CYCLE_WEEKS);

export const ImpactCalculatorClient = ({
  inputsTitle,
  teamSizeLabel,
  dealSizeLabel,
  cycleLengthLabel,
  resultsTitle,
  cycleReductionLabel,
  pipelineLabel,
  paybackLabel,
  ctaSlot,
  note,
}: ImpactCalculatorClientProps) => {
  const [teamSize, setTeamSize] = useState<number>(TEAM_SIZE.initial);
  const [dealSize, setDealSize] = useState<number>(DEAL_SIZE.initial);
  // The cycle slider snaps between the allowed lengths, so it moves over their index.
  const [cycleIndex, setCycleIndex] = useState<number>(INITIAL_CYCLE_INDEX);
  const cycleWeeks = CYCLE_WEEKS_OPTIONS[cycleIndex] ?? INITIAL_CYCLE_WEEKS;

  const result = calculateImpact({ teamSize, dealSize, cycleWeeks });

  return (
    <div className="grid w-full gap-px border-y border-border bg-border md:grid-cols-2">
      <div className="flex flex-col bg-background py-8 md:pr-10">
        {inputsTitle && <p className="pretitle mb-6">{inputsTitle}</p>}
        <RangeField
          label={teamSizeLabel}
          valueText={formatTeamSize(teamSize)}
          min={TEAM_SIZE.min}
          max={TEAM_SIZE.max}
          step={TEAM_SIZE.step}
          value={teamSize}
          onChange={setTeamSize}
        />
        <RangeField
          label={dealSizeLabel}
          valueText={formatMoney(dealSize)}
          min={DEAL_SIZE.min}
          max={DEAL_SIZE.max}
          step={DEAL_SIZE.step}
          value={dealSize}
          onChange={setDealSize}
        />
        <RangeField
          label={cycleLengthLabel}
          valueText={formatCycleWeeks(cycleWeeks)}
          min={0}
          max={CYCLE_WEEKS_OPTIONS.length - 1}
          step={1}
          value={cycleIndex}
          onChange={setCycleIndex}
        />
      </div>

      <div className="flex flex-col bg-background py-8 md:pl-10" aria-live="polite">
        {resultsTitle && <p className="pretitle mb-2">{resultsTitle}</p>}
        <ResultRow
          icon={Timer}
          value={formatReduction(result)}
          label={cycleReductionLabel}
          detail={formatCycleChange(cycleWeeks, result)}
        />
        <ResultRow
          icon={ChartLine}
          value={formatMoney(result.pipelineRecovered)}
          label={pipelineLabel}
          detail={formatExtraDeals(result)}
        />
        <ResultRow icon={PiggyBank} value={formatPayback(result)} label={paybackLabel} />
        {(ctaSlot || note) && (
          <div className="mt-auto flex flex-col gap-3 pt-6">
            {ctaSlot}
            {note && <p className="text-12 text-muted-foreground">{note}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

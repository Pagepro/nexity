// Pure, so `model.test.mts` runs it without React. The numbers live here; editors only change the copy.
export const TEAM_SIZE = { min: 5, max: 200, step: 5, initial: 40 } as const;
export const DEAL_SIZE = {
  min: 5_000,
  max: 250_000,
  step: 5_000,
  initial: 25_000,
} as const;
export const CYCLE_WEEKS_OPTIONS = [4, 6, 8, 12, 16, 24] as const;
export const INITIAL_CYCLE_WEEKS = 12;

const WEEKS_PER_YEAR = 52;
const MAX_REDUCTION_PERCENT = 34;
const BASE_REDUCTION_PERCENT = 24;
const REPS_PER_EXTRA_PERCENT = 20;
const PLATFORM_FEE_PER_YEAR = 15_000;
const FEE_PER_REP_PER_YEAR = 300;
/** Share of recovered pipeline assumed to convert into realised value. */
const REALISED_SHARE = 0.25;

export interface ImpactInputs {
  teamSize: number;
  dealSize: number;
  cycleWeeks: number;
}

export interface ImpactResult {
  reductionPercent: number;
  newCycleWeeks: number;
  extraDeals: number;
  pipelineRecovered: number;
  paybackMonths: number;
}

export const calculateImpact = ({
  teamSize,
  dealSize,
  cycleWeeks,
}: ImpactInputs): ImpactResult => {
  const reductionPercent = Math.min(
    MAX_REDUCTION_PERCENT,
    BASE_REDUCTION_PERCENT + Math.round(teamSize / REPS_PER_EXTRA_PERCENT),
  );
  const newCycleWeeks = cycleWeeks * (1 - reductionPercent / 100);
  const extraDeals =
    teamSize * (WEEKS_PER_YEAR / newCycleWeeks - WEEKS_PER_YEAR / cycleWeeks);
  const pipelineRecovered = extraDeals * dealSize;
  const annualCost = PLATFORM_FEE_PER_YEAR + teamSize * FEE_PER_REP_PER_YEAR;
  const paybackMonths = Math.max(
    1,
    Math.round(annualCost / ((pipelineRecovered * REALISED_SHARE) / 12)),
  );

  return {
    reductionPercent,
    newCycleWeeks,
    extraDeals,
    pipelineRecovered,
    paybackMonths,
  };
};

export const formatMoney = (amount: number) => {
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
  if (amount >= 1e3) return `$${Math.round(amount / 1e3)}K`;
  return `$${Math.round(amount)}`;
};

// Display strings shared by the client and `markdown.ts`.
export const formatTeamSize = (teamSize: number) => `${teamSize} reps`;

export const formatCycleWeeks = (cycleWeeks: number) => `${cycleWeeks} weeks`;

export const formatReduction = (result: ImpactResult) => `−${result.reductionPercent}%`;

export const formatCycleChange = (cycleWeeks: number, result: ImpactResult) =>
  `${cycleWeeks} → ${result.newCycleWeeks.toFixed(1)} weeks`;

export const formatExtraDeals = (result: ImpactResult) =>
  `+${Math.round(result.extraDeals)} deals of capacity`;

export const formatPayback = (result: ImpactResult) =>
  `~${result.paybackMonths} ${result.paybackMonths === 1 ? "month" : "months"}`;

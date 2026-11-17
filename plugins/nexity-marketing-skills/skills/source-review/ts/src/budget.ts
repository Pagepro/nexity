/**
 * Search budget.
 *
 * This module is a port of `src/claim_source_reviewer/pipeline/budget.py`.
 *
 * One `SearchBudget` lives for one run. It counts every search call and refuses
 * a call after the limit. The pipeline never calls a search provider without
 * this object, so a run cannot spend more than the configured number of calls.
 */

export interface SearchBudgetReport {
  maxSearchCallsPerRun: number;
  searchCallsUsed: number;
  resultsSeen: number;
  exhausted: boolean;
  provider: string;
  degraded: boolean;
  degradedReason: string;
}

export class SearchBudget {
  readonly #maxCalls: number;
  readonly #provider: string;
  #used = 0;
  #results = 0;
  #degraded = false;
  #degradedReason = "";

  constructor(maxSearchCallsPerRun: number, provider: string) {
    this.#maxCalls = Math.max(0, maxSearchCallsPerRun);
    this.#provider = provider;
  }

  get remaining(): number {
    return Math.max(0, this.#maxCalls - this.#used);
  }

  get exhausted(): boolean {
    return this.remaining === 0;
  }

  /** Reserve one search call. Return `false` when the budget is empty. */
  take(): boolean {
    if (this.#used >= this.#maxCalls) return false;
    this.#used += 1;
    return true;
  }

  /**
   * Return one reserved call to the budget.
   *
   * Call this when the search did not reach the provider. An unavailable
   * provider must not spend the budget.
   */
  refund(): void {
    this.#used = Math.max(0, this.#used - 1);
  }

  addResults(count: number): void {
    this.#results += count;
  }

  /** Record that automatic search stopped working. */
  markDegraded(reason: string): void {
    this.#degraded = true;
    this.#degradedReason = reason;
  }

  report(): SearchBudgetReport {
    return {
      maxSearchCallsPerRun: this.#maxCalls,
      searchCallsUsed: this.#used,
      resultsSeen: this.#results,
      exhausted: this.#used >= this.#maxCalls,
      provider: this.#provider,
      degraded: this.#degraded,
      degradedReason: this.#degradedReason,
    };
  }
}

const DEFAULT_PER_PAGE = 6;
const MAX_PER_PAGE = 24; // matches the perPage schema validation
const MAX_QUERY_LENGTH = 80;

const toInt = (value: string | null, fallback: number): number => {
  const parsed = Number.parseInt(value ?? "", 10);

  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export interface ListingParams {
  page: number;
  perPage: number;
  category: string;
  season: number;
  matchToken: string;
  /** Clamped integers, interpolated into the query (GROQ forbids slice params). */
  start: number;
  end: number;
}

export const parseListingParams = (request: Request): ListingParams => {
  const { searchParams } = new URL(request.url);

  const perPage = clamp(
    toInt(searchParams.get("perPage"), DEFAULT_PER_PAGE),
    1,
    MAX_PER_PAGE,
  );
  const page = Math.max(toInt(searchParams.get("page"), 1), 1);
  const category = (searchParams.get("category") ?? "").trim();
  const season = Math.max(toInt(searchParams.get("season"), 0), 0);
  const rawQuery = (searchParams.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  const matchToken = rawQuery ? `${rawQuery}*` : "";

  const start = (page - 1) * perPage;

  return { page, perPage, category, season, matchToken, start, end: start + perPage };
};

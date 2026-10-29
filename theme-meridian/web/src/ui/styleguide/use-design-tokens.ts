// Types and pure filters only, so this is safe to import from server and client components.

export interface DesignToken {
  name: string;
  short: string;
  value: string;
  darkValue?: string;
  px: number | null;
  isAlias: boolean;
  isColor: boolean;
}

export interface DesignTokensModel {
  ready: boolean;
  byName: Record<string, DesignToken>;
  all: DesignToken[];
}

export const tokensByPrefix = (model: DesignTokensModel, prefix: string): DesignToken[] =>
  model.all.filter((token) => token.short.startsWith(prefix) && !token.isAlias);

export const tokensByPattern = (
  model: DesignTokensModel,
  pattern: RegExp,
): DesignToken[] =>
  model.all.filter((token) => pattern.test(token.short) && !token.isAlias);

export const tokensByNames = (model: DesignTokensModel, names: string[]): DesignToken[] =>
  names
    .map((name) => model.byName[name])
    .filter((token): token is DesignToken => Boolean(token));

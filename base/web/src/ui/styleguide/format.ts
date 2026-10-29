export const remToPx = (value: string, rootPx: number): number | null => {
  const match = value.trim().match(/^(-?\d*\.?\d+)rem$/);
  if (!match) return null;
  return Math.round(parseFloat(match[1]) * rootPx * 100) / 100;
};

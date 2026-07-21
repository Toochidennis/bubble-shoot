const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

/**
 * Formats a count for compact, game-style display: values under 1,000 render
 * as-is, larger values abbreviate (1.2K, 12.3K, 3.4M …). Always uses the
 * en-US K/M/B suffixes so the label is stable across locales. Use the full
 * `toLocaleString()` value for accessible labels/tooltips.
 */
export function formatCompactCount(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return compactFormatter.format(Math.trunc(value))
}

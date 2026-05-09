/**
 * Build a PostgREST `or=(...)` fragment for two ILIKE columns.
 * Unquoted values break if the search text contains `,` (or `)`), which are delimiters in `or` syntax.
 */
export function orIlikeTwoColumns(
  columnA: string,
  columnB: string,
  rawSearch: string
): string {
  const trimmed = rawSearch.trim();
  if (!trimmed) return '';

  const escapedForLike = trimmed
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');

  const pattern = `%${escapedForLike}%`;
  const quoted = `"${pattern.replace(/"/g, '""')}"`;

  return `${columnA}.ilike.${quoted},${columnB}.ilike.${quoted}`;
}

// Shop listing display options shared by the server grid and the client toolbar.
export const PER_PAGE_OPTIONS = [9, 12, 18, 24] as const;
export const DEFAULT_PER_PAGE = 12;

/** Reads the listing display params shared by every catalog route (?per=, ?cols=). */
export function parseListingParams(sp: Record<string, string | undefined>) {
  const per = Number(sp.per);
  const cols = Number(sp.cols);
  return {
    pageSize: (PER_PAGE_OPTIONS as readonly number[]).includes(per) ? per : DEFAULT_PER_PAGE,
    cols: [2, 3, 4].includes(cols) ? cols : 3,
  };
}

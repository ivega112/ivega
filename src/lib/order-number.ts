/** Human-readable order numbers: IV-YYMMDD-XXXX (XXXX = random base36, collision-checked by caller via unique constraint). */
export function generateOrderNumber(date: Date = new Date()): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `IV-${yy}${mm}${dd}-${rand}`;
}

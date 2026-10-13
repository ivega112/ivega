/**
 * Safely serializes a JSON-LD object for injection via `dangerouslySetInnerHTML`.
 *
 * `JSON.stringify` alone does NOT escape `</script>` sequences — if any field feeding the
 * object (product name, FAQ question/answer, etc.) ever contains literal text like
 * `</script><script>...`, the browser's HTML parser closes the JSON-LD script tag early
 * and executes whatever follows as real markup/script. All of this app's JSON-LD sources
 * are currently admin-entered (not raw public input), but this is fixed regardless as
 * defense-in-depth — it costs nothing and is the standard mitigation (escape `<` to its
 * unicode form, which remains valid inside a JSON string but can't be parsed as an HTML
 * tag opener).
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

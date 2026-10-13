import { describe, expect, it } from "vitest";
import { safeJsonLd } from "./json-ld";

describe("safeJsonLd", () => {
  it("produces valid JSON that round-trips through JSON.parse", () => {
    const data = { name: "منتج عادي", price: 10 };
    expect(JSON.parse(safeJsonLd(data))).toEqual(data);
  });

  it("neutralizes a </script> breakout attempt in a string field", () => {
    const malicious = { name: '</script><script>alert(1)</script>' };
    const out = safeJsonLd(malicious);
    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<script>");
    // Still valid, round-trippable JSON with the original (unescaped-for-JS) value intact.
    expect(JSON.parse(out)).toEqual(malicious);
  });

  it("escapes every '<' so the browser HTML parser can never see a real tag", () => {
    const out = safeJsonLd({ x: "<img src=x onerror=alert(1)>" });
    expect(out).not.toContain("<");
  });
});

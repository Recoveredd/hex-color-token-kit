import { describe, expect, it } from "vitest";
import {
  extractHexColorTokens,
  isHexColorToken,
  parseHexColorToken
} from "../src/index.js";

describe("parseHexColorToken", () => {
  it("parses and normalizes short and long CSS hex colors", () => {
    expect(parseHexColorToken("#abc")).toMatchObject({
      ok: true,
      value: {
        normalized: "#aabbcc",
        channels: { r: 170, g: 187, b: 204 },
        hasAlpha: false
      }
    });

    expect(parseHexColorToken("#336699cc")).toMatchObject({
      ok: true,
      value: {
        normalized: "#336699cc",
        channels: { r: 51, g: 102, b: 153, a: 204 },
        hasAlpha: true
      }
    });
  });

  it("returns diagnostics for empty and malformed input", () => {
    expect(parseHexColorToken("")).toMatchObject({
      ok: false,
      issues: [{ code: "empty" }]
    });

    expect(parseHexColorToken("#12zzzz")).toMatchObject({
      ok: false,
      issues: [{ code: "invalid_character", index: 3 }]
    });
  });

  it("respects hash and alpha options", () => {
    expect(parseHexColorToken("abc", { requireHash: false })).toMatchObject({
      ok: true,
      value: { normalized: "#aabbcc" }
    });

    expect(parseHexColorToken("#abcd", { allowAlpha: false })).toMatchObject({
      ok: false,
      issues: [{ code: "alpha_not_allowed" }]
    });
  });
});

describe("extractHexColorTokens", () => {
  it("extracts valid tokens with spans", () => {
    const result = extractHexColorTokens("color: #fff; border: #336699;");

    expect(result.valid).toEqual([
      expect.objectContaining({ normalized: "#ffffff", start: 7, end: 11 }),
      expect.objectContaining({ normalized: "#336699", start: 21, end: 28 })
    ]);
    expect(result.invalid).toEqual([]);
  });

  it("collects invalid token-like candidates when requested", () => {
    const result = extractHexColorTokens("ok #fff bad #12zzzz", {
      includeInvalid: true
    });

    expect(result.valid).toHaveLength(1);
    expect(result.invalid).toEqual([
      expect.objectContaining({
        input: "#12zzzz",
        issues: [expect.objectContaining({ code: "invalid_character" })]
      })
    ]);
  });

  it("guards long input and reports truncation", () => {
    const result = extractHexColorTokens("#fff #000", { maxInputLength: 4 });

    expect(result.truncated).toBe(true);
    expect(result.issues).toEqual([
      expect.objectContaining({ code: "input_too_long" })
    ]);
    expect(result.valid).toHaveLength(1);
  });

  it("does not match inside words or identifiers", () => {
    const result = extractHexColorTokens("id token-#fff var#abc ok #123");

    expect(result.valid.map((token) => token.normalized)).toEqual(["#112233"]);
  });
});

describe("isHexColorToken", () => {
  it("returns a boolean for simple validation", () => {
    expect(isHexColorToken("#fff")).toBe(true);
    expect(isHexColorToken("#fffff")).toBe(false);
  });
});

export type HexColorIssueCode =
  | "not_a_string"
  | "empty"
  | "missing_hash"
  | "invalid_length"
  | "invalid_character"
  | "alpha_not_allowed"
  | "invalid_options"
  | "input_too_long";

export interface HexColorIssue {
  code: HexColorIssueCode;
  message: string;
  index?: number;
}

export interface HexColorChannels {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface HexColorToken {
  input: string;
  value: string;
  normalized: string;
  channels: HexColorChannels;
  hasAlpha: boolean;
  start?: number;
  end?: number;
}

export interface HexColorInvalidToken {
  input: string;
  value: string;
  issues: HexColorIssue[];
  start?: number;
  end?: number;
}

export type HexColorParseResult =
  | { ok: true; value: HexColorToken; issues: [] }
  | { ok: false; value: null; issues: HexColorIssue[] };

export interface HexColorParseOptions {
  allowAlpha?: boolean;
  requireHash?: boolean;
  normalize?: boolean;
}

export interface HexColorExtractOptions extends HexColorParseOptions {
  includeInvalid?: boolean;
  maxInputLength?: number;
}

export interface HexColorExtractResult {
  valid: HexColorToken[];
  invalid: HexColorInvalidToken[];
  truncated: boolean;
  issues: HexColorIssue[];
}

const DEFAULT_MAX_INPUT_LENGTH = 100_000;
const HEX_DIGITS = new Set("0123456789abcdefABCDEF");
const HASHED_CANDIDATE_PATTERN = /#[^\s"'`;),\]}]+/g;
const LOOSE_CANDIDATE_PATTERN = /#[^\s"'`;),\]}]+|[0-9a-fA-F]{3,8}/g;

export function parseHexColorToken(
  input: unknown,
  options: HexColorParseOptions = {}
): HexColorParseResult {
  if (typeof input !== "string") {
    return fail("not_a_string", "Expected a CSS hex color token string.");
  }

  const allowAlpha = options.allowAlpha ?? true;
  const requireHash = options.requireHash ?? true;
  const normalize = options.normalize ?? true;
  const issues: HexColorIssue[] = [];
  const source = input.trim();

  if (source.length === 0) {
    return fail("empty", "Expected a CSS hex color token.");
  }

  const hasHash = source.startsWith("#");
  if (requireHash && !hasHash) {
    issues.push({
      code: "missing_hash",
      message: "Expected a leading #."
    });
  }

  const raw = hasHash ? source.slice(1) : source;
  if (![3, 4, 6, 8].includes(raw.length)) {
    issues.push({
      code: "invalid_length",
      message: "Expected 3, 4, 6, or 8 hex digits."
    });
  }

  if (!allowAlpha && (raw.length === 4 || raw.length === 8)) {
    issues.push({
      code: "alpha_not_allowed",
      message: "Alpha hex colors are disabled by options."
    });
  }

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    if (char === undefined || !HEX_DIGITS.has(char)) {
      issues.push({
        code: "invalid_character",
        message: "Expected only hexadecimal digits.",
        index: hasHash ? index + 1 : index
      });
      break;
    }
  }

  if (issues.length > 0) {
    return { ok: false, value: null, issues };
  }

  const expanded = expandHex(raw).toLowerCase();
  const normalized = normalize ? `#${expanded}` : source;
  const channels = readChannels(expanded);

  return {
    ok: true,
    value: {
      input,
      value: source,
      normalized,
      channels,
      hasAlpha: expanded.length === 8
    },
    issues: []
  };
}

export function extractHexColorTokens(
  input: unknown,
  options: HexColorExtractOptions = {}
): HexColorExtractResult {
  const issues: HexColorIssue[] = [];

  if (typeof input !== "string") {
    return {
      valid: [],
      invalid: [],
      truncated: false,
      issues: [{
        code: "not_a_string",
        message: "Expected source text to be a string."
      }]
    };
  }

  const maxInputLength = normalizeMaxInputLength(options.maxInputLength, issues);
  const includeInvalid = options.includeInvalid ?? true;
  const truncated = input.length > maxInputLength;
  const scanInput = truncated ? input.slice(0, maxInputLength) : input;
  const pattern =
    options.requireHash === false
      ? LOOSE_CANDIDATE_PATTERN
      : HASHED_CANDIDATE_PATTERN;
  const valid: HexColorToken[] = [];
  const invalid: HexColorInvalidToken[] = [];

  if (truncated) {
    issues.push({
      code: "input_too_long",
      message: `Input exceeded maxInputLength (${maxInputLength}).`
    });
  }

  for (const match of scanInput.matchAll(pattern)) {
    const candidate = match[0];
    const start = match.index ?? 0;
    const end = start + candidate.length;

    if (!isBoundary(scanInput[start - 1]) || !isBoundary(scanInput[end])) {
      continue;
    }

    const parsed = parseHexColorToken(candidate, options);
    if (parsed.ok) {
      valid.push({ ...parsed.value, start, end });
    } else if (includeInvalid) {
      invalid.push({
        input: candidate,
        value: candidate.startsWith("#") ? candidate.slice(1) : candidate,
        issues: parsed.issues,
        start,
        end
      });
    }
  }

  return { valid, invalid, truncated, issues };
}

export function isHexColorToken(
  input: unknown,
  options: HexColorParseOptions = {}
): boolean {
  return parseHexColorToken(input, options).ok;
}

function normalizeMaxInputLength(value: number | undefined, issues: HexColorIssue[]): number {
  if (value === undefined) {
    return DEFAULT_MAX_INPUT_LENGTH;
  }

  if (!Number.isInteger(value) || value < 0) {
    issues.push({
      code: "invalid_options",
      message: "maxInputLength must be an integer greater than or equal to 0."
    });
    return DEFAULT_MAX_INPUT_LENGTH;
  }

  return value;
}

function fail(code: HexColorIssueCode, message: string): HexColorParseResult {
  return {
    ok: false,
    value: null,
    issues: [{ code, message }]
  };
}

function expandHex(raw: string): string {
  if (raw.length === 3 || raw.length === 4) {
    return [...raw].map((char) => `${char}${char}`).join("");
  }

  return raw;
}

function readChannels(expanded: string): HexColorChannels {
  const channels: HexColorChannels = {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16)
  };

  if (expanded.length === 8) {
    channels.a = Number.parseInt(expanded.slice(6, 8), 16);
  }

  return channels;
}

function isBoundary(char: string | undefined): boolean {
  if (char === undefined) {
    return true;
  }

  return !(
    (char >= "0" && char <= "9") ||
    (char >= "a" && char <= "z") ||
    (char >= "A" && char <= "Z") ||
    char === "#" ||
    char === "_" ||
    char === "-"
  );
}

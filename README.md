# hex-color-token-kit

Small TypeScript utility for extracting and validating CSS hex color tokens.

It focuses on one job: find `#rgb`, `#rgba`, `#rrggbb`, and `#rrggbbaa` tokens in text, return source spans, normalize them, and explain malformed candidates without requiring Node APIs.

## Install

```bash
npm install hex-color-token-kit
```

## Usage

```ts
import { extractHexColorTokens, parseHexColorToken } from "hex-color-token-kit";

const tokens = extractHexColorTokens("color: #0f38; border: #336699;");

tokens.valid.map((token) => token.normalized);
// ["#00ff3388", "#336699"]

tokens.invalid;
// []

parseHexColorToken("#abc");
// { ok: true, value: { input: "#abc", normalized: "#aabbcc", channels: { r: 170, g: 187, b: 204 }, ... } }
```

## API

### `parseHexColorToken(input, options?)`

Validates one token. It returns a discriminated union instead of throwing.

```ts
const result = parseHexColorToken("#ff8800", {
  allowAlpha: true,
  requireHash: true
});
```

### `extractHexColorTokens(input, options?)`

Scans text and returns valid and invalid token-like candidates with offsets.

```ts
const result = extractHexColorTokens("ok #fff bad #12zzzz", {
  includeInvalid: true
});
```

## Options

- `allowAlpha`: accept 4-digit and 8-digit alpha forms. Defaults to `true`.
- `requireHash`: require a leading `#`. Defaults to `true`.
- `normalize`: return expanded lowercase hex values. Defaults to `true`.
- `includeInvalid`: include malformed candidates found while scanning. Defaults to `true`.
- `maxInputLength`: guard scanning work. Defaults to `100_000`.

## Browser compatibility

The core uses only strings, arrays, regular expressions, and numbers. It has no runtime dependencies and no required Node APIs.

## CLI

No CLI is included. The natural use is as a small parser inside CSS tooling, design-token checks, forms, and browser UIs; a CLI would add Node-only packaging without clear value for the core use case.

## License

MPL-2.0

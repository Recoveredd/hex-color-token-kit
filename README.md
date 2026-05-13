# hex-color-token-kit

[![License: MPL-2.0](https://img.shields.io/badge/license-MPL--2.0-blue.svg)](LICENSE)
[![CI](https://github.com/Recoveredd/hex-color-token-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/Recoveredd/hex-color-token-kit/actions/workflows/ci.yml)

Small TypeScript utility for extracting and validating CSS hex color tokens.

It focuses on one job: find `#rgb`, `#rgba`, `#rrggbb`, and `#rrggbbaa` tokens in text, return source spans, normalize them, and explain malformed candidates without requiring Node APIs.

## Package quality

- TypeScript types are generated from the source.
- ESM-only package marked as side-effect free for bundlers.
- CI runs `npm ci`, `typecheck`, `build`, and `test`.
- Tested on Node.js 20 and 22 with GitHub Actions.

## Demo

[Try the interactive demo](https://packages.wasta-wocket.fr/hex-color-token-kit/)

## Install

```bash
npm install hex-color-token-kit
```

## Usage

```ts
import {
  extractHexColorTokens,
  isHexColorToken,
  parseHexColorToken
} from "hex-color-token-kit";

const tokens = extractHexColorTokens("color: #0f38; border: #336699;");

tokens.valid.map((token) => token.normalized);
// ["#00ff3388", "#336699"]

tokens.invalid;
// []

parseHexColorToken("#abc");
// { ok: true, value: { input: "#abc", normalized: "#aabbcc", channels: { r: 170, g: 187, b: 204 }, ... } }

isHexColorToken("#336699");
// true
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

### `isHexColorToken(input, options?)`

Returns `true` when a single token is valid. Use it for lightweight checks when
you do not need channels, normalized values, or diagnostics.

## Options

- `allowAlpha`: accept 4-digit and 8-digit alpha forms. Defaults to `true`.
- `requireHash`: require a leading `#`. Defaults to `true`.
- `normalize`: return expanded lowercase hex values. Defaults to `true`.
- `includeInvalid`: include malformed candidates found while scanning. Defaults to `true`.
- `maxInputLength`: guard scanning work. Defaults to `100_000`.

When `requireHash` is `false`, extraction also considers standalone 3-8 digit
hex-like words. Keep the default for CSS text and enable loose matching only for
inputs where bare color tokens are expected.

## Browser compatibility

The core uses only strings, arrays, regular expressions, and numbers. It has no runtime dependencies and no required Node APIs.

## CLI

No CLI is included. The natural use is as a small parser inside CSS tooling, design-token checks, forms, and browser UIs; a CLI would add Node-only packaging without clear value for the core use case.

## License

MPL-2.0

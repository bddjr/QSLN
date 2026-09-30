# QSLN

Quick Scratch List Notation (JavaScript / TypeScript implementation)

About QSLN specification: https://github.com/bddjr/QSLN

## Installation

```bash
npm i qsln-js
```

You can also use other package managers (such as `pnpm`) instead of `npm`.

## Usage

```javascript
import QSLN from "qsln-js"

// Serialize
const encoded = QSLN.stringify([["a", "b"], ["cd", "ef"]])
console.log(encoded)
// => "01a01b;02cd02ef;"

// Deserialize
const decoded = QSLN.parse("01a01b;02cd02ef;")
console.log(decoded)
// => [["a", "b"], ["cd", "ef"]]
```

> **Note**: `parse` throws a `SyntaxError` on malformed or truncated inputs.

## 📄 License

This project is released into the public domain under [The Unlicense](https://unlicense.org).

The "Scratch" name is a trademark of the Scratch Foundation.

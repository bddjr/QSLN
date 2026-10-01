# QSLN (Quick Scratch List Notation)

English | [中文](README-zh.md)

**QSLN (Quick Scratch List Notation)** is a high-performance, lightweight, **zero-escaping** serialization format designed for two-dimensional list data (`string[][]`).

This format is primarily designed for the Scratch 3 environment.

---

## ⚡ Key Highlights

- **Zero-Escaping**: Values are stored as raw text. Any character—including semicolons (`;`), newlines, quotes, or Unicode/emojis—can be safely stored inside values without escape characters like `\` or `""`.
- **Scratch-Optimized (Ultra-Fast Loop String Concatenation)**: Scratch does not have native substring/slice blocks. QSLN’s length prefix allows Scratch to parse values through a tight, branchless `repeat (len)` loop with `join`, achieving maximum execution efficiency via "Run without screen refresh" custom blocks.
- **Mathematically Aligned with Safe Integers**: A single hexadecimal character `H` ($0 \sim \text{f}$) represents decimal length strings from 1 to 16 characters in length, seamlessly covering the entire range from $0$ up to `Number.MAX_SAFE_INTEGER` ($2^{53} - 1 = 9007199254740991$).
- **Compact & Lightweight**: Short strings ($\le 9$ characters) only add 2 overhead characters (`0` + length).

---

## 📐 Specification

All references to "string" below refer to JavaScript UTF-16 strings, and length is based on the length of the UTF-16 string.

A QSLN document encodes a two-dimensional list of strings (`string[][]`). Each sublist ends with a semicolon (`;`).

```text
[Element 1][Element 2]...;[Element 3]...;
```

### Element Structure: `[H][Length][Value]`

$$\Large\underline{\text{H}}\;\underline{\text{Length}}\;\underline{\text{Value}}$$

| Field | Length | Type | Description |
| :--- | :---: | :---: | :--- |
| **`H`** | 1 char | Hexadecimal (`[0-9a-fA-F]`) | **Length of Length String**. Maps directly to the decimal digit count: $\text{Decimal Digits} = H + 1$. |
| **`Length`** | $H + 1$ chars | Decimal Non-negative Integer (`[0-9]`) | **Character count of the raw value**. Must consist purely of digits `0-9`. |
| **`Value`** | `Length` chars | Raw String | **Verbatim content**, extracted without any escaping or delimiter inspection. |
| **`;`** | 1 char | Delimiter | Marks the end of a sublist. |

### H Field Lookup Table

| H Character | Decimal Digits ($H+1$) | Value Length Range | Example Header |
| :---: | :---: | :---: | :--- |
| `0` | **1 digit** | $0 \sim 9$ | `00` (length 0), `05hello` (length 5) |
| `1` | **2 digits** | $10 \sim 99$ | `127Quick Scratch List Notation` (length 27) |
| `2` | **3 digits** | $100 \sim 999$ | `2100...` (length 100) |
| `3` | **4 digits** | $1,000 \sim 9,999$ | Medium text / JSON payloads |
| `...` | ... | ... | ... |
| `9` | **10 digits** | $10^9 \sim 10^{10}-1$ | Near V8 engine max string memory limit (~1GB) |
| `...` | ... | ... | ... |
| `f` | **16 digits** | Up to $10^{16}-1$ | **Covers $2^{53}-1$ (`9007199254740991`)** |

---

## Examples

| Data (`string[][]`) | QSLN Encoded String | Description |
| :--- | :--- | :--- |
| `[["a", "b"], ["cd", "ef"]]` | `01a01b;02cd02ef;` | Basic two-dimensional list |
| `[["hello;world"]]` | `111hello;world;` | Embedded semicolon does not break parsing |
| `[[]]` | `;` | Single empty list |
| `[[], []]` | `;;` | Two consecutive empty lists |
| `[[""]]` | `00;` | List containing one empty string |
| `[["", "x"]]` | `0001x;` | Empty string alongside a non-empty string |
| `[["🎉 Scratch 🐱"]]` | `113🎉 Scratch 🐱;` | Unicode and emoji support |

---

## Scratch

Open with TurboWarp editor:  
https://turbowarp.org/editor?project_title=%5BQSLN%5D+Quick+Scratch+List+Notation&project_url=bddjr.github.io%2FQSLN%2F%5BQSLN%5D+Quick+Scratch+List+Notation.sb3

Scratch Project Link:  
https://scratch.mit.edu/projects/1386520011/

Returned errors are placed in item 1 of `QSLN.error`.  
If this item exists, the returned data is invalid.  
If this item does not exist, no error occurred.

Variables, lists, and custom blocks starting with `QSLN/internal.` are for internal use by QSLN.  
Do not call or modify them unless you know what you are doing.  

Do not execute multiple QSLN custom blocks concurrently in the same sprite.  
Use clones if concurrency is needed.

### Stringify

Custom block: `QSLN.stringify`

Input list:
- `QSLN.stringify.input`  
  Input list.

Output variable:
- `QSLN.stringify.output`  
  Output QSLN string.

This block does not return errors.

This block does not automatically clear `QSLN.stringify.output` in order to support two-dimensional lists.  
You may need to manually clear the `QSLN.stringify.output` variable before calling this block.

### Parse

Custom block: `QSLN.parse`

Input variables:
- `QSLN.parse.input.qsln`  
  Input QSLN string.
- `QSLN.parse.input.offset`  
  The character position where parsing of the QSLN string begins.  
  To parse from the beginning, set the value to `1`.  
  The parsing process modifies the value of this variable, so you can use `QSLN.parse` as an iterator.

Output list:
- `QSLN.parse.output`  
  Output list, where each item is a string.

Errors:
- `parse: Unexpected input offset`
- `parse: Unexpected end of input`
- `parse: Unexpected token '�' at position �`

You can use `QSLN.parse` as an iterator, calling it multiple times to parse multiple sublists.

---

## Other Programming Languages

### JavaScript / TypeScript

See the [`js`](js) directory for details.

### Python

See the [`py`](py) directory for details.

---

## 📄 License

This project is released into the public domain under [The Unlicense](https://unlicense.org).

The "Scratch" name is a trademark of the Scratch Foundation.

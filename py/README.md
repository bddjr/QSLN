# QSLN

Quick Scratch List Notation (Python implementation)

About QSLN specification: https://github.com/bddjr/QSLN

## Installation

```bash
pip install qsln-py
```

## Usage

```python
import qsln

# Serialize
encoded = qsln.stringify([["a", "b"], ["cd", "ef"]])
print(encoded)
# => "01a01b;02cd02ef;"

# Deserialize
decoded = qsln.parse("01a01b;02cd02ef;")
print(decoded)
# => [["a", "b"], ["cd", "ef"]]
```

> **Note**: `parse` raises a `SyntaxError` on malformed or truncated inputs.

## 📄 License

This project is released into the public domain under [The Unlicense](https://unlicense.org).

The "Scratch" name is a trademark of the Scratch Foundation.

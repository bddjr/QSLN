# [QSLN] Quick Scratch List Notation
# Author: bddjr
# License: The Unlicense

from collections.abc import Iterable
import sys
from typing import Any

__all__ = ["stringify", "parse"]

HEX = "0123456789abcdef"
ErrUnexpectedEndOfInput = "Unexpected end of input"
UTF16_CODEC = "utf-16le" if sys.byteorder == "little" else "utf-16be"


def stringify(lists: Iterable[Iterable[Any]]) -> str:
    """Serialize a 2D iterable of strings into a QSLN string."""
    out: list[str] = []
    for l in lists:
        for v in l:
            if not isinstance(v, str):
                v = str(v)
            if v.isascii():
                l_str = str(len(v))
            else:
                l_str = str(len(v.encode(UTF16_CODEC)) >> 1)
            out.append(HEX[len(l_str) - 1])
            out.append(l_str)
            out.append(v)
        out.append(";")
    return "".join(out)


def parse(qsln: str) -> list[list[str]]:
    """Parse a QSLN string into a 2D list of strings."""
    if not isinstance(qsln, str):
        qsln = str(qsln)
    if not qsln:
        raise SyntaxError(ErrUnexpectedEndOfInput)

    out: list[list[str]] = []
    ls: list[str] = []
    i = 0

    length = len(qsln)
    if qsln.isascii() or length == (len(raw := qsln.encode(UTF16_CODEC)) >> 1):
        while True:
            n = ord(qsln[i])
            # ';'
            if n == 59:
                out.append(ls)
                i += 1
                if i == length:
                    return out
                ls = []
                continue

            j = i + 1
            if 48 <= n <= 57:
                # 0-9
                i += n - 46
            else:
                # [A-Fa-f]
                masked = n & -33
                if 65 <= masked <= 70:
                    i += masked - 53
                else:
                    raise SyntaxError(f"Unexpected token '{chr(n)}' at position {i}")

            if i >= length:
                raise SyntaxError(ErrUnexpectedEndOfInput)

            n = 0
            while j < i:
                c = ord(qsln[j]) - 48
                if c < 0 or c > 9:
                    raise SyntaxError(f"Unexpected token '{qsln[j]}' at position {j}")
                n = n * 10 + c
                j += 1

            i += n
            if i >= length:
                raise SyntaxError(ErrUnexpectedEndOfInput)

            ls.append(qsln[j:i])

    u16 = memoryview(raw).cast("H")
    length = len(u16)
    while True:
        n = u16[i]
        # ';'
        if n == 59:
            out.append(ls)
            i += 1
            if i == length:
                return out
            ls = []
            continue

        j = i + 1
        if 48 <= n <= 57:
            # 0-9
            i += n - 46
        else:
            # [A-Fa-f]
            masked = n & -33
            if 65 <= masked <= 70:
                i += masked - 53
            else:
                raise SyntaxError(f"Unexpected token '{chr(n)}' at position {i}")

        if i >= length:
            raise SyntaxError(ErrUnexpectedEndOfInput)

        n = 0
        while j < i:
            c = u16[j] - 48
            if c < 0 or c > 9:
                raise SyntaxError(f"Unexpected token '{chr(u16[j])}' at position {j}")
            n = n * 10 + c
            j += 1

        i += n
        if i >= length:
            raise SyntaxError(ErrUnexpectedEndOfInput)

        ls.append(u16[j:i].tobytes().decode(UTF16_CODEC))

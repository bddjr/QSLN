// [QSLN] Quick Scratch List Notation
// Author: bddjr
// License: The Unlicense

/**
 * @param {Iterable<Iterable<string>>} lists
 * @returns {string}
 */
export function stringify(lists) {
    var out = ''
    for (const l of lists) {
        for (let v of l) {
            //@ts-ignore
            if (typeof v != 'string') v += ''
            const l = v.length.toString()
            out += '0123456789abcdef'.charAt(l.length - 1) + l + v
        }
        out += ';'
    }
    return out
}

const ErrUnexpectedEndOfInput = `Unexpected end of input`

/**
 * @param {string} qsln
 * @returns {string[][]}
 */
export function parse(qsln) {
    //@ts-ignore
    if (typeof qsln != 'string') qsln += ''
    const length = qsln.length
    if (!length)
        throw SyntaxError(ErrUnexpectedEndOfInput)
    const out = []
    var ls = []
    var i = 0
    for (; ;) {
        let n = qsln.charCodeAt(i)
        // ';'
        if (59 === n) {
            out.push(ls)
            if (++i === length)
                return out
            ls = []
            continue
        }
        let j = i + 1
        if (n >= 48 && n <= 57) {
            // 0-9
            i += n - 46
        } else if ((n &= -33) >= 65 && n <= 70) {
            // [A-Fa-f]
            i += n - 53
        } else {
            throw SyntaxError(`Unexpected token '${qsln[i]}' at position ${i}`)
        }
        if (i >= length)
            throw SyntaxError(ErrUnexpectedEndOfInput)
        for (n = 0; j < i; j++) {
            const c = qsln.charCodeAt(j) - 48
            if (c < 0 || c > 9)
                throw SyntaxError(`Unexpected token '${qsln[j]}' at position ${j}`)
            n = n * 10 + c
        }
        i += n
        if (i >= length)
            throw SyntaxError(ErrUnexpectedEndOfInput)
        ls.push(qsln.slice(j, i))
    }
}

export default {
    stringify,
    parse
}

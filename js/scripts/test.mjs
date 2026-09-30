import test from 'node:test';
import assert from 'node:assert/strict';
import QSLN, { stringify, parse } from '../qsln.mjs';

test('Export structure', () => {
    assert.equal(typeof stringify, 'function', 'stringify should be exported');
    assert.equal(typeof parse, 'function', 'parse should be exported');
    assert.equal(QSLN.stringify, stringify, 'default export should contain stringify');
    assert.equal(QSLN.parse, parse, 'default export should contain parse');
});

test('README example', () => {
    const input = [["a", "b"], ["cd", "ef"]];
    const encoded = stringify(input);
    assert.equal(encoded, '01a01b;02cd02ef;');

    const decoded = parse(encoded);
    assert.deepEqual(decoded, input);
});

test('Scratch project compatibility', () => {
    // Exact test case from [QSLN] Quick Scratch List Notation.sb3
    const scratchInput = [['1', 'Hello', 'QSLN', 'Quick Scratch List Notation', '', 'x']];
    const expectedEncoded = '01105Hello04QSLN127Quick Scratch List Notation0001x;';

    const encoded = stringify(scratchInput);
    assert.equal(encoded, expectedEncoded);

    const decoded = parse(encoded);
    assert.deepEqual(decoded, scratchInput);
});

test('Empty lists and empty strings edge cases', () => {
    // Empty list-of-lists
    assert.equal(stringify([]), '');

    // Single empty list
    assert.equal(stringify([[]]), ';');
    assert.deepEqual(parse(';'), [[]]);

    // Consecutive empty lists
    assert.equal(stringify([[], []]), ';;');
    assert.deepEqual(parse(';;'), [[], []]);

    assert.equal(stringify([[], [], []]), ';;;');
    assert.deepEqual(parse(';;;'), [[], [], []]);

    // Single list with an empty string
    assert.equal(stringify([['']]), '00;');
    assert.deepEqual(parse('00;'), [['']]);

    // Multiple empty strings in one list
    assert.equal(stringify([['', '', '']]), '000000;');
    assert.deepEqual(parse('000000;'), [['', '', '']]);

    // Mixed empty string and non-empty elements
    const mixedStrings = [['', 'a', '', 'bc', '']];
    const mixedEncoded = stringify(mixedStrings);
    assert.equal(mixedEncoded, '0001a0002bc00;');
    assert.deepEqual(parse(mixedEncoded), mixedStrings);

    // Mixed empty lists and non-empty lists
    const mixedLists = [[], [''], [], ['first', 'second'], []];
    const mixedListsEncoded = stringify(mixedLists);
    assert.equal(mixedListsEncoded, ';00;;05first06second;;');
    assert.deepEqual(parse(mixedListsEncoded), mixedLists);
});

test('Special characters, semicolons, and Unicode', () => {
    // Semicolon inside values
    const semicolonValues = [['hello;world', ';', ';;', 'a;b;c;']];
    const encodedWithSemicolons = stringify(semicolonValues);
    assert.deepEqual(parse(encodedWithSemicolons), semicolonValues);

    // Whitespace, newlines, tabs
    const whitespaceValues = [['\n\r\t', '   ', 'line1\nline2\r\nline3']];
    assert.deepEqual(parse(stringify(whitespaceValues)), whitespaceValues);

    // Unicode, CJK, and Emojis (UTF-16 code units)
    const unicodeValues = [['你好，世界！', '🐱 Scratch', '🎉🚀✨', 'αβγδε', 'Привет']];
    const encodedUnicode = stringify(unicodeValues);
    assert.deepEqual(parse(encodedUnicode), unicodeValues);
});

test('Type coercion in stringify', () => {
    // Numbers, booleans, null, undefined coerced to string
    const nonStringInput = [[123, true, false, 0]];
    const expected = [['123', 'true', 'false', '0']];
    assert.deepEqual(parse(stringify(nonStringInput)), expected);
});

test('Lengths across magnitudes and hex prefix parsing', () => {
    // Length 10-99 (2-digit length, hex prefix '1')
    const str10 = 'x'.repeat(10);
    const str99 = 'y'.repeat(99);
    const twoDigitLengths = [[str10, str99]];
    const encodedTwoDigits = stringify(twoDigitLengths);
    assert.ok(encodedTwoDigits.startsWith('110' + str10 + '199' + str99 + ';'));
    assert.deepEqual(parse(encodedTwoDigits), twoDigitLengths);

    // Length 100-999 (3-digit length, hex prefix '2')
    const str100 = 'a'.repeat(100);
    const str500 = 'b'.repeat(500);
    const threeDigitLengths = [[str100, str500]];
    const encodedThreeDigits = stringify(threeDigitLengths);
    assert.ok(encodedThreeDigits.startsWith('2100' + str100 + '2500' + str500 + ';'));
    assert.deepEqual(parse(encodedThreeDigits), threeDigitLengths);

    // Uppercase hex prefix support in parse (e.g. 'A' for 11 digits of length)
    // Construct a synthetic token with uppercase hex:
    // Hex '0' is 1-digit length, which is standard. For hex letters:
    // E.g. '0' to '9', 'a'-'f', 'A'-'F'
    // Let's test uppercase hex 'A' prefix: length of length is 11 digits:
    const lenStr = '00000000004'; // 11 digits long, value 4
    const syntheticQSLN = 'A' + lenStr + 'test;';
    assert.deepEqual(parse(syntheticQSLN), [['test']]);

    // Lowercase hex 'a' prefix:
    const syntheticLowerQSLN = 'a' + lenStr + 'test;';
    assert.deepEqual(parse(syntheticLowerQSLN), [['test']]);
});

test('SyntaxError handling in parse', () => {
    // Empty string input
    assert.throws(() => parse(''), {
        name: 'SyntaxError',
        message: 'Unexpected end of input'
    });

    // Incomplete length prefix or length string
    assert.throws(() => parse('0'), {
        name: 'SyntaxError',
        message: 'Unexpected end of input'
    });
    assert.throws(() => parse('1'), {
        name: 'SyntaxError',
        message: 'Unexpected end of input'
    });
    assert.throws(() => parse('11'), {
        name: 'SyntaxError',
        message: 'Unexpected end of input'
    });

    // Truncated value
    assert.throws(() => parse('05abc;'), {
        name: 'SyntaxError',
        message: 'Unexpected end of input'
    });

    // Missing terminating semicolon
    assert.throws(() => parse('01a'), {
        name: 'SyntaxError',
        message: 'Unexpected end of input'
    });
    assert.throws(() => parse('00'), {
        name: 'SyntaxError',
        message: 'Unexpected end of input'
    });
    assert.throws(() => parse('01a01b'), {
        name: 'SyntaxError',
        message: 'Unexpected end of input'
    });
    assert.throws(() => parse('0000'), {
        name: 'SyntaxError',
        message: 'Unexpected end of input'
    });
    assert.throws(() => parse('1-1'), {
        name: 'SyntaxError',
        message: 'Unexpected end of input'
    });

    // Invalid tokens at hex prefix position
    assert.throws(() => parse('g'), /Unexpected token 'g' at position 0/);
    assert.throws(() => parse(';g;'), /Unexpected token 'g' at position 1/);
    assert.throws(() => parse('`'), /Unexpected token '`' at position 0/); // ASCII 96 backtick
    assert.throws(() => parse('@'), /Unexpected token '@' at position 0/); // ASCII 64
    assert.throws(() => parse('['), /Unexpected token '\[' at position 0/); // ASCII 91
    assert.throws(() => parse(':'), /Unexpected token ':' at position 0/); // ASCII 58

    // Invalid characters in length field (must strictly be 0-9)
    assert.throws(() => parse('0a;'), /Unexpected token 'a' at position 1/);
    assert.throws(() => parse('0 ;'), /Unexpected token ' ' at position 1/);
    assert.throws(() => parse('1-1;'), /Unexpected token '-' at position 1/);
    assert.throws(() => parse('1-5;'), /Unexpected token '-' at position 1/);
    assert.throws(() => parse('01a1-101b;'), /Unexpected token '-' at position 4/);
});

test('Round-trip property test with randomized inputs', () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789;:,._-!? \t\n/\\\'"中文字符🎉';

    function randomString(maxLen) {
        const len = Math.floor(Math.random() * maxLen);
        let s = '';
        for (let i = 0; i < len; i++) {
            s += chars[Math.floor(Math.random() * chars.length)];
        }
        return s;
    }

    for (let round = 0; round < 25; round++) {
        const listCount = Math.floor(Math.random() * 5) + 1;
        const testCase = [];
        for (let i = 0; i < listCount; i++) {
            const itemCount = Math.floor(Math.random() * 6);
            const list = [];
            for (let j = 0; j < itemCount; j++) {
                list.push(randomString(50));
            }
            testCase.push(list);
        }

        const encoded = stringify(testCase);
        const decoded = parse(encoded);
        assert.deepEqual(decoded, testCase, `Round trip failed for case #${round}`);
    }
});

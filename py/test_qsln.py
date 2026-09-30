import random
import unittest
import qsln


class TestQSLN(unittest.TestCase):
    def test_export_structure(self):
        self.assertTrue(callable(qsln.stringify))
        self.assertTrue(callable(qsln.parse))

    def test_readme_example(self):
        sample = [["a", "b"], ["cd", "ef"]]
        expected = "01a01b;02cd02ef;"
        self.assertEqual(qsln.stringify(sample), expected)
        self.assertEqual(qsln.parse(expected), sample)

    def test_scratch_project_compatibility(self):
        sample = [
            ["0", "1", "2"],
            ["a", "b", "c"],
            ["-", ":", ";"],
            ["\"'", "hello, world!"],
            ["A\nB", "C\r\nD"],
            ["x"],
            [""]
        ]
        encoded = qsln.stringify(sample)
        self.assertEqual(qsln.parse(encoded), sample)

    def test_empty_lists_and_empty_strings(self):
        self.assertEqual(qsln.stringify([]), "")
        self.assertEqual(qsln.stringify([[]]), ";")
        self.assertEqual(qsln.parse(";"), [[]])

        self.assertEqual(qsln.stringify([[], []]), ";;")
        self.assertEqual(qsln.parse(";;"), [[], []])

        self.assertEqual(qsln.stringify([[], [], []]), ";;;")
        self.assertEqual(qsln.parse(";;;"), [[], [], []])

        self.assertEqual(qsln.stringify([[""]]), "00;")
        self.assertEqual(qsln.parse("00;"), [[""]])

        self.assertEqual(qsln.stringify([["", "", ""]]), "000000;")
        self.assertEqual(qsln.parse("000000;"), [["", "", ""]])

        mixed = [["", "a", "", "bc", ""]]
        enc = qsln.stringify(mixed)
        self.assertEqual(enc, "0001a0002bc00;")
        self.assertEqual(qsln.parse(enc), mixed)

    def test_special_characters_semicolons_unicode(self):
        cases = [
            [["hello;world"]],
            [[";", ";;", ";;;"]],
            [["a;b", ";c;", ";;;d;;;"]],
            [["\n\r\t", "   ", "line1\nline2\r\nline3"]],
            [["你好，世界！", "🐱 Scratch", "🎉🚀✨", "αβγδε", "Привет"]]
        ]
        for c in cases:
            self.assertEqual(qsln.parse(qsln.stringify(c)), c)

    def test_type_coercion_in_stringify(self):
        non_string = [[123, True, False, 0]]
        expected = [["123", "True", "False", "0"]]
        self.assertEqual(qsln.parse(qsln.stringify(non_string)), expected)

    def test_lengths_across_magnitudes_and_hex_prefix(self):
        str10 = "x" * 10
        str99 = "y" * 99
        two_digits = [[str10, str99]]
        enc2 = qsln.stringify(two_digits)
        self.assertTrue(enc2.startswith("110" + str10 + "199" + str99 + ";"))
        self.assertEqual(qsln.parse(enc2), two_digits)

        str100 = "a" * 100
        str500 = "b" * 500
        three_digits = [[str100, str500]]
        enc3 = qsln.stringify(three_digits)
        self.assertTrue(enc3.startswith("2100" + str100 + "2500" + str500 + ";"))
        self.assertEqual(qsln.parse(enc3), three_digits)

        # Uppercase hex prefix
        len_str = "00000000004"
        syn_upper = "A" + len_str + "test;"
        self.assertEqual(qsln.parse(syn_upper), [["test"]])

        # Lowercase hex prefix
        syn_lower = "a" + len_str + "test;"
        self.assertEqual(qsln.parse(syn_lower), [["test"]])

    def test_syntax_errors(self):
        with self.assertRaises(SyntaxError) as cm:
            qsln.parse("")
        self.assertEqual(str(cm.exception), "Unexpected end of input")

        for s in ["0", "1", "11", "05abc;", "01a", "00", "01a01b", "0000", "1-1"]:
            with self.assertRaises(SyntaxError) as cm:
                qsln.parse(s)
            self.assertEqual(str(cm.exception), "Unexpected end of input")

        # Invalid tokens
        for s, expected_msg in [
            ("g", "Unexpected token 'g' at position 0"),
            (";g;", "Unexpected token 'g' at position 1"),
            ("`", "Unexpected token '`' at position 0"),
            ("@", "Unexpected token '@' at position 0"),
            ("[", "Unexpected token '[' at position 0"),
            (":", "Unexpected token ':' at position 0"),
            ("0a;", "Unexpected token 'a' at position 1"),
            ("0 ;", "Unexpected token ' ' at position 1"),
            ("1-1;", "Unexpected token '-' at position 1"),
            ("1-5;", "Unexpected token '-' at position 1"),
            ("01a1-101b;", "Unexpected token '-' at position 4"),
        ]:
            with self.assertRaises(SyntaxError) as cm:
                qsln.parse(s)
            self.assertIn(expected_msg, str(cm.exception))

    def test_round_trip_property(self):
        chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789;:,._-!? \t\n/\\\'"中文字符🎉'
        for _ in range(25):
            list_count = random.randint(1, 5)
            case = []
            for _ in range(list_count):
                item_count = random.randint(0, 5)
                sub = []
                for _ in range(item_count):
                    s_len = random.randint(0, 50)
                    sub.append("".join(random.choice(chars) for _ in range(s_len)))
                case.append(sub)
            encoded = qsln.stringify(case)
            decoded = qsln.parse(encoded)
            self.assertEqual(decoded, case)


if __name__ == "__main__":
    unittest.main()

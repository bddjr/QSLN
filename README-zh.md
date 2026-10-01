# QSLN (Quick Scratch List Notation)

[English](README.md) | 中文

**QSLN（Quick Scratch List Notation）** 是一种专为二维列表数据（`string[][]`）设计的高性能、轻量级、**零转义（Zero-Escaping）** 文本序列化格式。

这种格式主要是为 Scratch 3 环境设计的。

---

## ⚡ 核心设计亮点

- **免转义（Zero-Escaping）**：所有内容按原样存储。无论文本中包含分号（`;`）、换行符、引号还是 Unicode/Emoji 表情，都无需使用 `\` 等转义字符，天然杜绝转义漏洞与注入歧义。
- **Scratch 极致优化（极速循环拼接字符串）**：Scratch 原生没有 `substring` / `slice` 截取积木。QSLN 采用长度前缀设计，让 Scratch 解析器可以在开启“运行时不刷新屏幕”的自定义积木中，通过最纯粹、**无任何分支判断**的 `repeat (len)` 定次循环配合 `join` 进行拼接提取，发挥出 Scratch 虚拟机的最高执行效率。
- **严丝合缝契合最大安全整数**：单个十六进制字符 `H`（`0` ~ `f`）可表达 1 到 16 个字符的十进制长度字符串，数学上完美覆盖从 $0$ 到 IEEE 754 双精度浮点数最大安全整数 `Number.MAX_SAFE_INTEGER` ($2^{53} - 1 = 9007199254740991$) 的全部非负整数。
- **紧凑轻量**：短文本（长度 $\le 9$）每个元素仅增加 2 个字符的开销（`0` + 长度），远比 JSON 等结构紧凑。

---

## 📐 格式规范详解

以下内容提到的“字符串”是 JavaScript 的 UTF-16 字符串，长度以 UTF-16 字符串的长度为准。

QSLN 编码的是一个二维字符串列表（`string[][]`）。每个子列表以分号（`;`）作为结束界定符：

```text
[元素1][元素2]...;[元素3]...;
```

### 单个元素的 3 段式微结构：`[H][Length][Value]`

$$\Large\underline{\text{H}}\;\underline{\text{Length}}\;\underline{\text{Value}}$$

| 字段 | 占位宽度 | 类型 | 说明与规则 |
| :--- | :---: | :---: | :--- |
| **`H`** | 1 字符 | 十六进制（`[0-9a-fA-F]`） | **长度串的长度**。映射为长度数字的十进制位数：$\text{十进制位数} = H + 1$。 |
| **`Length`** | $H + 1$ 字符 | 十进制非负整数（`[0-9]`） | **内容的真实字符长度**。必须全部由数字 `0-9` 构成。 |
| **`Value`** | `Length` 字符 | 原始字符串 | **原样文本内容**，无需检查定界符或进行转义。 |
| **`;`** | 1 字符 | 定界符 | 标记当前子列表结束。 |

### H 字段速查映射表

| H 字符 | 长度十进制位数 ($H+1$) | 对应的长度范围 | 典型应用场景与示例 |
| :---: | :---: | :---: | :--- |
| `0` | **1 位** | $0 \sim 9$ | `00`（空字符串），`05hello`（长度 5） |
| `1` | **2 位** | $10 \sim 99$ | `127Quick Scratch List Notation`（长度 27） |
| `2` | **3 位** | $100 \sim 999$ | `2100...`（长度 100）短段落与文章 |
| `3` | **4 位** | $1,000 \sim 9,999$ | 中大型文本块 / JSON 串 |
| `...` | ... | ... | ... |
| `9` | **10 位** | $10^9 \sim 10^{10}-1$ | 接近 V8 引擎字符串内存上限（约 1GB） |
| `...` | ... | ... | ... |
| `f` | **16 位** | 最多 $10^{16}-1$ | **完美涵盖 $2^{53}-1$（`9007199254740991`）** |

---

## 编码示例

| 原始数据 (`string[][]`) | QSLN 序列化结果 | 说明 |
| :--- | :--- | :--- |
| `[["a", "b"], ["cd", "ef"]]` | `01a01b;02cd02ef;` | 基础二维列表 |
| `[["hello;world"]]` | `0bhello;world;` | 内嵌分号原样存储，不会破坏解析 |
| `[[]]` | `;` | 单个空列表 |
| `[[], []]` | `;;` | 两个连续空列表 |
| `[[""]]` | `00;` | 包含一个空字符串的列表 |
| `[["", "x"]]` | `0001x;` | 空字符串与普通字符串混合 |
| `[["🎉 Scratch 🐱"]]` | `0d🎉 Scratch 🐱;` | 完整原生支持 Unicode 与 Emoji |

---

## Scratch

使用 TurboWarp 编辑器打开:  
https://turbowarp.org/editor?project_title=%5BQSLN%5D+Quick+Scratch+List+Notation&project_url=bddjr.github.io%2FQSLN%2F%5BQSLN%5D+Quick+Scratch+List+Notation.sb3

Scratch 项目链接:  
https://scratch.mit.edu/projects/1386520011/

返回的错误在 `QSLN.error` 的第 1 项。  
如果有这一项，则返回的数据无效。  
如果没有这一项，则没有发生错误。

以 `QSLN/internal.` 开头的变量、列表、自制积木是 QSLN 内部用的。  
不要擅自调用或修改它们，除非你清楚自己在干什么。  

不要在同一个角色里并行执行多个 QSLN 自制积木。  
如果需要，请使用克隆体。

### 字符串化

自制积木: `QSLN.stringify`

输入列表:
- `QSLN.stringify.input`
  输入列表。

输出变量:
- `QSLN.stringify.output`
  输出 QSLN 字符串。

该积木不会返回错误。

该积木不会自动清空 `QSLN.stringify.output` ，因为要支持二维列表。  
你可能需要在调用该积木之前，手动清空 `QSLN.stringify.output` 变量。

### 解析

自制积木: `QSLN.parse`

输入变量:
- `QSLN.parse.input.qsln`  
  输入 QSLN 字符串。
- `QSLN.parse.input.offset`  
  从哪个位置开始解析 QSLN 字符串。  
  如果要从头开始解析，请把值设为 `1` 。  
  解析的过程会修改这个变量的值，因此你可以把 `QSLN.parse` 当迭代器用。

输出列表:
- `QSLN.parse.output`  
  输出列表，每一项都是字符串。

错误:
- `parse: Unexpected input offset`
- `parse: Unexpected end of input`
- `parse: Unexpected token '�' at position �`

你可以把 `QSLN.parse` 当迭代器用，多次调用以解析多个子列表。

---

## 其它编程语言实现

### JavaScript / TypeScript

详见 [`js`](js) 目录

### Python

详见 [`py`](py) 目录

---

## 📄 开源许可证

本项目基于 [Unlicense](https://unlicense.org) 发布至公有领域（Public Domain）。

"Scratch" 名称是 Scratch 基金会的商标。

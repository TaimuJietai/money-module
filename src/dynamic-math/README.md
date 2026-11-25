# dynamic-math

基于 `decimal.js` 的高精度动态数学工具，避免 JavaScript 浮点误差；支持四则运算表达式（含括号、一元正负号），适合表单预览、列表分页、金额类计算等场景。

> 仓库约定：`vue/` 内精度敏感的数值四则运算须优先使用本模块的 `dynamicCalculate`（详见根目录 `AGENTS.md`「Vue 数值运算」）。

## 引用

```ts
import {
  dynamicAdd,
  dynamicSubtract,
  dynamicMultiply,
  dynamicDivide,
  dynamicCalculate,
  dynamicNumber,
  dynamicInteger,
  truncateDecimal,
  dynamicClamp,
} from '$common/utils/dynamic-math'
```

依赖：`decimal.js`（已在 `vue/package.json` 中声明）。

## 用法

- **精度敏感展示**：优先用 `dynamicCalculate` / `truncateDecimal` 拿字符串，再自行格式化。
- **最终只要 JS number**（UI 判断、分页等）：用 `dynamicNumber` / `dynamicInteger`（失败时走 `fallback`）。
- **入参**：建议优先传字符串，避免大数 / 小数在传入前已被 `number` 截断。

## Example

```ts
import {
  dynamicAdd,
  dynamicCalculate,
  dynamicNumber,
  dynamicInteger,
  truncateDecimal,
} from '$common/utils/dynamic-math'

// 四则运算（返回 Decimal，可继续链式）
const sum = dynamicAdd('0.1', '0.2') // 0.3

// 表达式（返回普通十进制字符串）
dynamicCalculate('(1 + 2) * 3 - 4 / 2') // '7'
dynamicCalculate('-1.5 * (2 + 3)') // '-7.5'

// 截断小数（不四舍五入）
truncateDecimal('1.239', 2) // '1.23'

// 需要 number：失败兜底、上下限、截断位数
dynamicNumber('99.99 / 3', { scale: 2, min: 0, max: 100, fallback: 0 }) // 33.33
dynamicInteger('10 / 3', { fallback: 0 }) // 3
```

表单预览示例：

```ts
function previewPayable(price: string, qty: string, discount: string) {
  return dynamicNumber(`(${price} * ${qty}) - ${discount}`, {
    scale: 2,
    min: 0,
    fallback: 0,
  })
}

previewPayable('19.9', '3', '5') // 54.7
```

## 配置项 `DynamicNumberOptions`

用于 `dynamicNumber` / `dynamicInteger`：

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fallback` | `number` | `0` | 表达式解析或计算失败时返回 |
| `min` | `string \| number \| bigint` | — | 结果下限 |
| `max` | `string \| number \| bigint` | — | 结果上限 |
| `scale` | `number` | — | 小数保留位数，**截断**而非四舍五入；`dynamicInteger` 固定为 `0` |

## 对外 API

| 导出 | 返回值 | 说明 |
|------|--------|------|
| `dynamicAdd(left, right)` | `Decimal` | 高精度加法 |
| `dynamicSubtract(left, right)` | `Decimal` | 高精度减法 |
| `dynamicMultiply(left, right)` | `Decimal` | 高精度乘法 |
| `dynamicDivide(left, right)` | `Decimal` | 高精度除法；除数为 0 时抛错 |
| `dynamicCalculate(expression)` | `string` | 解析并计算表达式，返回十进制字符串；非法表达式 / 除 0 抛错 |
| `truncateDecimal(value, scale?)` | `string` | 按 `scale`（默认 0）截断小数 |
| `dynamicClamp(value, min?, max?)` | `Decimal` | 限制在 `[min, max]` |
| `dynamicNumber(expression, options?)` | `number` | 计算表达式并转为 number；失败返回 `fallback` |
| `dynamicInteger(expression, options?)` | `number` | 同 `dynamicNumber`，强制 `scale: 0` |
| `DynamicNumericInput` | 类型 | `string \| number \| bigint` |
| `DynamicNumberOptions` | 类型 | 见上表 |

入参 `left` / `right` / `value` 支持 `DynamicNumericInput` 或 `Decimal` 实例。

## 行为说明

1. **精度**：内部使用 `Decimal.clone`（`precision: 80`，`ROUND_DOWN`），尽量输出普通十进制而非科学计数法。
2. **表达式**：支持空白、`+ - * /`、括号、一元 `+`/`-`；乘除优先于加减；不支持函数、变量、幂运算等。
3. **符号清洗**：全角／特殊减号（`−` `－` `﹣`）会规范为 `-`。
4. **截断**：`truncateDecimal` / `scale` 均为截断，不做四舍五入。
5. **错误策略**：`dynamicCalculate` 与四则运算在非法输入 / 除 0 时抛错；`dynamicNumber` / `dynamicInteger` 吞掉异常并返回 `fallback`。

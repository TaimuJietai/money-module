import Decimal from 'decimal.js'

/**
 * 动态数学工具。
 *
 * 作用：
 * - 使用 decimal.js 避免 JavaScript 浮点数精度问题。
 * - 支持字符串表达式中的 `+`、`-`、`*`、`/`、括号和一元正负号。
 * - 为页面表单、预览计算、列表分页等场景提供安全的数字计算入口。
 */

/**
 * 动态计算支持的基础数值入参。
 *
 * 建议优先传入字符串，避免较大数字或小数在传入前已经被 JS number 截断精度。
 */
export type DynamicNumericInput = string | number | bigint

/**
 * 表达式词法单元。
 *
 * number 表示普通十进制数字，operator 表示四则运算符，
 * leftParen/rightParen 表示左右括号。
 */
type Token = {
  type: 'number' | 'operator' | 'leftParen' | 'rightParen'
  value: string
}

/**
 * dynamicNumber/dynamicInteger 的通用配置。
 *
 * @property fallback 表达式解析或计算失败时返回的兜底值，默认 0。
 * @property min 结果下限，小于该值时会返回该下限。
 * @property max 结果上限，大于该值时会返回该上限。
 * @property scale 小数保留位数，采用截断而非四舍五入。
 */
export type DynamicNumberOptions = {
  fallback?: number
  min?: DynamicNumericInput
  max?: DynamicNumericInput
  scale?: number
}

/**
 * 独立的 Decimal 构造器配置。
 *
 * precision 提高计算精度，rounding 使用向下截断；
 * toExpNeg/toExpPos 拉大指数范围，尽量输出普通十进制字符串。
 */
const DynamicDecimal = Decimal.clone({
  precision: 80,
  rounding: Decimal.ROUND_DOWN,
  toExpNeg: -1000000,
  toExpPos: 1000000,
})

function normalizeSignCharacters(value: string) {
  return value.replace(/[−－﹣]/g, '-')
}

/**
 * 统一清洗外部传入的数值。
 *
 * @param value 字符串、number 或 bigint 类型的数值。
 * @returns 去除首尾空白后的字符串数值。
 * @throws 当传入空字符串或仅包含空白字符时抛出异常。
 */
function normalizeNumericInput(value: DynamicNumericInput) {
  const normalized = normalizeSignCharacters(String(value).trim())
  if (!normalized) throw new Error('数字不能为空')
  return normalized
}

/**
 * 将动态数值转换为当前工具专用的 Decimal 实例。
 *
 * @param value 基础数值或已有 Decimal 实例。
 * @returns DynamicDecimal 实例，用于后续高精度计算。
 */
function toDecimal(value: DynamicNumericInput | Decimal) {
  if (value instanceof Decimal) return new DynamicDecimal(value.toString())
  return new DynamicDecimal(normalizeNumericInput(value))
}

/**
 * 将数值标准化为普通十进制字符串。
 *
 * @param value 基础数值或 Decimal 实例。
 * @returns decimal.js 规范化后的字符串。
 */
function toPlainString(value: DynamicNumericInput | Decimal) {
  return toDecimal(value).toString()
}

/**
 * 判断字符是否为 0-9 的数字字符。
 *
 * @param char 待判断的单个字符。
 * @returns 是数字字符时返回 true。
 */
function isDigit(char: string) {
  return char >= '0' && char <= '9'
}

/**
 * 将表达式字符串拆分为词法单元。
 *
 * @param expression 需要计算的四则运算表达式。
 * @returns 按顺序排列的 Token 列表。
 * @throws 当数字格式非法或存在不支持的字符时抛出异常。
 */
function tokenize(expression: string) {
  const normalizedExpression = normalizeSignCharacters(expression)
  const tokens: Token[] = []
  let index = 0

  while (index < normalizedExpression.length) {
    const char = normalizedExpression.charAt(index)

    if (/\s/.test(char)) {
      index += 1
      continue
    }

    if (isDigit(char) || char === '.') {
      let raw = ''
      let dotCount = 0
      let digitCount = 0

      while (index < normalizedExpression.length) {
        const current = normalizedExpression.charAt(index)
        if (isDigit(current)) {
          digitCount += 1
          raw += current
          index += 1
          continue
        }
        if (current === '.') {
          dotCount += 1
          if (dotCount > 1) throw new Error(`数字格式不正确：${raw}.`)
          raw += current
          index += 1
          continue
        }
        break
      }

      if (!digitCount) throw new Error(`数字格式不正确：${raw}`)
      tokens.push({ type: 'number', value: raw })
      continue
    }

    if (char === '(') {
      tokens.push({ type: 'leftParen', value: char })
      index += 1
      continue
    }

    if (char === ')') {
      tokens.push({ type: 'rightParen', value: char })
      index += 1
      continue
    }

    if (char === '+' || char === '-' || char === '*' || char === '/') {
      tokens.push({ type: 'operator', value: char })
      index += 1
      continue
    }

    throw new Error(`不支持的运算字符：${char}`)
  }

  return tokens
}

/**
 * 动态表达式解析器。
 *
 * 使用递归下降解析，保证 `*`、`/` 优先级高于 `+`、`-`，
 * 同时支持括号和一元正负号。
 */
class DynamicExpressionParser {
  private index = 0

  constructor(private readonly tokens: Token[]) {}

  /**
   * 解析完整表达式。
   *
   * @returns 表达式计算得到的 Decimal 结果。
   * @throws 当表达式未完整消费或格式不正确时抛出异常。
   */
  parse() {
    const value = this.parseExpression()
    if (this.peek()) throw new Error(`表达式格式不正确：${this.peek()?.value}`)
    return value
  }

  /**
   * 解析加减表达式。
   *
   * 语法层级：Expression = Term (('+' | '-') Term)*。
   */
  private parseExpression(): Decimal {
    let value = this.parseTerm()

    while (this.matchOperator('+') || this.matchOperator('-')) {
      const operator = this.previous().value
      const right = this.parseTerm()
      value = operator === '+'
        ? dynamicAdd(value, right)
        : dynamicSubtract(value, right)
    }

    return value
  }

  /**
   * 解析乘除表达式。
   *
   * 语法层级：Term = Factor (('*' | '/') Factor)*。
   */
  private parseTerm(): Decimal {
    let value = this.parseFactor()

    while (this.matchOperator('*') || this.matchOperator('/')) {
      const operator = this.previous().value
      const right = this.parseFactor()
      value = operator === '*'
        ? dynamicMultiply(value, right)
        : dynamicDivide(value, right)
    }

    return value
  }

  /**
   * 解析最小计算因子。
   *
   * 支持：
   * - 普通数字。
   * - 括号包裹的子表达式。
   * - 一元正号和一元负号。
   */
  private parseFactor(): Decimal {
    if (this.matchOperator('+')) return this.parseFactor()
    if (this.matchOperator('-')) return dynamicSubtract(0, this.parseFactor())

    const token = this.advance()
    if (!token) throw new Error('表达式不完整')

    if (token.type === 'number') return toDecimal(token.value)

    if (token.type === 'leftParen') {
      const value = this.parseExpression()
      if (!this.match('rightParen')) throw new Error('缺少右括号')
      return value
    }

    throw new Error(`表达式格式不正确：${token.value}`)
  }

  /**
   * 匹配并消费指定类型的 Token。
   *
   * @param type 期望的 Token 类型。
   * @returns 匹配成功返回 true，否则返回 false。
   */
  private match(type: Token['type']) {
    if (this.peek()?.type !== type) return false
    this.advance()
    return true
  }

  /**
   * 匹配并消费指定运算符。
   *
   * @param operator 期望的运算符字符。
   * @returns 匹配成功返回 true，否则返回 false。
   */
  private matchOperator(operator: string) {
    const token = this.peek()
    if (token?.type !== 'operator' || token.value !== operator) return false
    this.advance()
    return true
  }

  /**
   * 消费当前 Token 并移动游标。
   *
   * @returns 当前游标位置的 Token。
   */
  private advance() {
    const token = this.tokens[this.index]
    this.index += 1
    return token
  }

  /**
   * 查看当前 Token，不移动游标。
   *
   * @returns 当前游标位置的 Token。
   */
  private peek() {
    return this.tokens[this.index]
  }

  /**
   * 查看上一次被消费的 Token。
   *
   * @returns 前一个 Token。
   * @throws 当尚无已消费 Token 时抛出异常。
   */
  private previous() {
    const token = this.tokens[this.index - 1]
    if (!token) throw new Error('表达式格式不正确')
    return token
  }
}

/**
 * 高精度加法。
 *
 * @param left 左侧加数。
 * @param right 右侧加数。
 * @returns Decimal 结果，调用方可继续链式计算或自行格式化。
 */
export function dynamicAdd(left: DynamicNumericInput | Decimal, right: DynamicNumericInput | Decimal) {
  return toDecimal(left).plus(toDecimal(right))
}

/**
 * 高精度减法。
 *
 * @param left 被减数。
 * @param right 减数。
 * @returns Decimal 结果，调用方可继续链式计算或自行格式化。
 */
export function dynamicSubtract(left: DynamicNumericInput | Decimal, right: DynamicNumericInput | Decimal) {
  return toDecimal(left).minus(toDecimal(right))
}

/**
 * 高精度乘法。
 *
 * @param left 左侧乘数。
 * @param right 右侧乘数。
 * @returns Decimal 结果，调用方可继续链式计算或自行格式化。
 */
export function dynamicMultiply(left: DynamicNumericInput | Decimal, right: DynamicNumericInput | Decimal) {
  return toDecimal(left).mul(toDecimal(right))
}

/**
 * 高精度除法。
 *
 * @param left 被除数。
 * @param right 除数。
 * @returns Decimal 结果，调用方可继续链式计算或自行格式化。
 * @throws 当除数为 0 时抛出异常。
 */
export function dynamicDivide(left: DynamicNumericInput | Decimal, right: DynamicNumericInput | Decimal) {
  const divisor = toDecimal(right)
  if (divisor.isZero()) throw new Error('除数不能为 0')
  return toDecimal(left).div(divisor)
}

/**
 * 计算动态四则运算表达式。
 *
 * @param expression 表达式字符串，支持数字、空白、`+`、`-`、`*`、`/`、括号和一元正负号。
 * @returns 普通十进制字符串结果，避免直接转 number 造成精度损失。
 * @throws 当表达式为空、格式错误、包含非法字符或出现除 0 时抛出异常。
 */
export function dynamicCalculate(expression: string) {
  return toPlainString(new DynamicExpressionParser(tokenize(expression)).parse())
}

/**
 * 按指定小数位截断数值。
 *
 * @param value 需要截断的数值。
 * @param scale 保留的小数位数，默认 0；负数会按 0 处理。
 * @returns 截断后的十进制字符串，不进行四舍五入。
 */
export function truncateDecimal(value: DynamicNumericInput, scale = 0) {
  const scaleDecimal = toDecimal(scale)
  const normalizedScale = Number(
    (scaleDecimal.isNegative() ? new DynamicDecimal(0) : scaleDecimal).toDecimalPlaces(0, Decimal.ROUND_DOWN).toString(),
  )
  const decimalText = toPlainString(value)
  const negative = decimalText.startsWith('-')
  const absoluteText = negative ? decimalText.slice(1) : decimalText
  const [integerPart = '0', fractionPart = ''] = absoluteText.split('.')
  const normalizedInteger = integerPart || '0'

  if (normalizedScale === 0) {
    return /^0+$/.test(normalizedInteger) ? '0' : `${negative ? '-' : ''}${normalizedInteger}`
  }

  const truncatedFraction = fractionPart.padEnd(normalizedScale, '0').slice(0, normalizedScale)
  const isZero = /^0+$/.test(normalizedInteger) && /^0+$/.test(truncatedFraction)
  return `${negative && !isZero ? '-' : ''}${normalizedInteger}.${truncatedFraction}`
}

/**
 * 将数值限制在指定范围内。
 *
 * @param value 待限制的数值。
 * @param min 可选下限，传入时结果不会小于该值。
 * @param max 可选上限，传入时结果不会大于该值。
 * @returns 限制后的 Decimal 结果。
 */
export function dynamicClamp(value: DynamicNumericInput, min?: DynamicNumericInput, max?: DynamicNumericInput) {
  let decimal = toDecimal(value)
  if (min !== undefined) {
    const minDecimal = toDecimal(min)
    if (decimal.lessThan(minDecimal)) decimal = minDecimal
  }
  if (max !== undefined) {
    const maxDecimal = toDecimal(max)
    if (decimal.greaterThan(maxDecimal)) decimal = maxDecimal
  }
  return decimal
}

/**
 * 计算表达式并返回 JS number。
 *
 * 适合 UI 判断、分页数量、普通表单预览等最终需要 number 的场景。
 * 对精度敏感的展示场景优先使用 dynamicCalculate 或 truncateDecimal 返回字符串。
 *
 * @param expression 需要计算的表达式。
 * @param options fallback/min/max/scale 等输出配置。
 * @returns 计算后的 number；解析失败时返回 fallback 或 0。
 */
export function dynamicNumber(expression: string, options: DynamicNumberOptions = {}) {
  try {
    const calculated = dynamicCalculate(expression)
    const clamped = dynamicClamp(calculated, options.min, options.max)
    const normalized = options.scale === undefined
      ? toPlainString(clamped)
      : truncateDecimal(clamped.toString(), options.scale)
    return Number(normalized)
  } catch {
    return options.fallback ?? 0
  }
}

/**
 * 计算表达式并返回整数 number。
 *
 * 本函数是 dynamicNumber 的便捷封装，会强制使用 scale = 0 截断小数。
 *
 * @param expression 需要计算的表达式。
 * @param options fallback/min/max 等输出配置。
 * @returns 截断为整数后的 number；解析失败时返回 fallback 或 0。
 */
export function dynamicInteger(expression: string, options: Omit<DynamicNumberOptions, 'scale'> = {}) {
  return dynamicNumber(expression, { ...options, scale: 0 })
}

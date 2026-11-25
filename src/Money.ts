import { dynamicCalculate, truncateDecimal } from './dynamic-math';
import { CURRENCY_SYMBOLS } from './symbols';

export type MoneyInit =
  | number
  | string
  | Money
  | MoneyLike
  | null
  | undefined;

export interface MoneyLike {
  amount?: number;
  cent?: number;
  centFactor?: number;
  currency?: string;
  md5?: string | null;
  rsa?: string | null;
  [key: string]: unknown;
}

export type MoneyValue = {
  amount: number;
  cent: number;
  centFactor: number;
  currency: string;
  md5: string | null;
  rsa: string | null;
};

export type CentFactor = 1 | 10 | 100 | 1000;

const VALUE_KEYS = ['amount', 'cent', 'centFactor', 'currency', 'md5', 'rsa'].sort();

class Money {
  static symbol: Readonly<Record<string, string | null>> = Object.freeze(
    Object.fromEntries(CURRENCY_SYMBOLS.map((e) => [e.abbreviation, e.symbol])),
  );

  static centFactors: ReadonlyArray<CentFactor> = Object.freeze([1, 10, 100, 1000]);

  static get currency(): string[] {
    return Object.keys(Money.symbol);
  }

  #cent = 0;
  #currency = 'CNY';
  #centFactor: number = 100;

  md5: string | null = null;
  rsa: string | null = null;
  valueKeys: string[] = [...VALUE_KEYS];

  constructor(initParams?: MoneyInit) {
    this.setMoney(initParams);
  }

  get currency(): string {
    return this.#currency;
  }

  set currency(val: string) {
    this.#currency = (val && Money.symbol[val] && val) || 'CNY';
  }

  get centFactor(): number {
    return this.#centFactor;
  }

  set centFactor(val: number) {
    const amount = this.setCents(this.#cent);
    const next = Number(val);
    this.#centFactor =
      val && Money.centFactors.indexOf(next as CentFactor) !== -1 ? next : this.#centFactor;
    this.#cent = this.setAmount(amount);
  }

  get cent(): number {
    return this.#cent;
  }

  set cent(val: number) {
    this.#cent = (val && Number(val)) || 0;
  }

  get amount(): number {
    return this.setCents(this.#cent);
  }

  set amount(val: number) {
    this.#cent = (val && Number(val) && this.setAmount(val)) as number;
  }

  valueOf(): MoneyValue {
    return Object.fromEntries(this.valueKeys.map((e) => [e, (this as unknown as Record<string, unknown>)[e]])) as MoneyValue;
  }

  toString(args1: ((key: string, value: unknown) => unknown) | (string | number)[] | null = null, args2 = 0): string {
    return JSON.stringify(this.valueOf(), args1 as Parameters<typeof JSON.stringify>[1], args2);
  }

  equals(money: Money | MoneyLike): boolean {
    if (money instanceof Money) {
      return money.toString() === this.toString();
    }
    return (
      JSON.stringify(
        Object.fromEntries(
          Object.keys(money)
            .sort()
            .map((e) => [e, (money as MoneyLike)[e]]),
        ),
      ) === this.toString()
    );
  }

  instanceof(money: unknown): money is Money | MoneyLike {
    return (
      !!money &&
      typeof money === 'object' &&
      (money instanceof Money ||
        !(Object.keys(money as object).filter((e) => this.valueKeys.indexOf(e) === -1).length))
    );
  }

  isCurrency(val: unknown): string | false {
    return (
      (typeof val === 'string' &&
        Money.currency.indexOf(val.toLocaleUpperCase()) !== -1 &&
        val) ||
      false
    );
  }

  setMoney(money?: MoneyInit): void {
    if (!money) {
      return;
    }
    if (!isNaN(Number(money))) {
      this.amount = Number(money);
      return;
    }
    if (this.instanceof(money)) {
      const source = money as Money | MoneyLike;
      this.centFactor = (source.centFactor as number) || this.centFactor;
      this.cent = (source.cent as number) || this.cent;
      for (const e of this.valueKeys) {
        const value = (source as MoneyLike)[e];
        if (value && ['centFactor', 'cent'].indexOf(e) === -1) {
          (this as unknown as Record<string, unknown>)[e] = value;
        }
      }
    }
  }

  hashCode(): number {
    return parseInt(String(this.#cent ^ (this.#cent >>> 32)), 10);
  }

  setCents(val: number): number {
    if (this.#centFactor === 1) {
      return val;
    }
    const scale = Money.centFactors.indexOf(this.#centFactor as CentFactor);
    return Number(
      truncateDecimal(dynamicCalculate(`${val} / ${this.#centFactor}`), scale < 0 ? 0 : scale),
    );
  }

  setAmount(val: number): number {
    if (this.#centFactor === 1) {
      return val;
    }
    return Number(truncateDecimal(dynamicCalculate(`${val} * ${this.#centFactor}`), 0));
  }

  compareTo(__other: MoneyInit): -1 | 0 | 1 {
    if (!this.instanceof(__other) && isNaN(Number(__other))) {
      throw 'The object is not the amount';
    }
    const other = new Money(__other);
    if (this.centFactor !== other.centFactor) {
      other.centFactor = this.centFactor;
    }
    return (this.cent > other.cent && 1) || (this.cent < other.cent && -1) || 0;
  }

  greaterThan(other: MoneyInit): boolean {
    return this.compareTo(other) > 0;
  }

  getTranslateNumber(): string {
    if (!this.amount) {
      return '0.00';
    }
    const _amount = Number(this.amount);
    if (isNaN(_amount)) {
      return '0.00';
    }
    const negative = _amount < 0;
    const [integerPart, decimalPart = '00'] = Math.abs(_amount).toFixed(2).split('.');
    const withComma = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${negative ? '-' : ''}${withComma}.${decimalPart.padEnd(2, '0').slice(0, 2)}`;
  }

  showMoney(): string {
    return this.showSymbol() + this.getTranslateNumber();
  }

  showSymbol(): string | null {
    return Money.symbol[this.currency];
  }

  static resolveCentFactor(list: Array<Money | MoneyLike | number | string>): number {
    const helper = new Money();
    let factor = helper.centFactor;
    for (const item of list) {
      if (!helper.instanceof(item)) {
        continue;
      }
      const next = Number((item as Money | MoneyLike).centFactor);
      if (Money.centFactors.indexOf(next as CentFactor) !== -1 && next > factor) {
        factor = next;
      }
    }
    return factor;
  }

  static computed(computedStr: string, computedList: Array<Money | MoneyLike | number | string>): Money {
    if (!(Array.isArray(computedList) && computedList.length)) {
      throw 'Operation array is empty!';
    }
    try {
      const computedStrList = computedStr.split('');
      const moneySymbolIndexs: number[] = [];
      for (let i = 0, len = computedStrList.length; i < len; i++) {
        if (computedStrList[i] === '$') {
          moneySymbolIndexs.push(i);
        }
      }
      if (moneySymbolIndexs.length !== computedList.length) {
        throw 'The number of operation symbols is not equal to the length of the operation array!';
      }
      const helper = new Money();
      // 取操作数中最大的 centFactor，避免高精度金额被压到默认 100
      const __centFactor = Money.resolveCentFactor(computedList);
      for (let i = 0, len = moneySymbolIndexs.length; i < len; i++) {
        const item = computedList[i];
        const __money =
          (helper.instanceof(item) && (item as Money | MoneyLike)) ||
          (!isNaN(Number(item)) &&
            new Money({
              // 纯数字按「分」参与运算，避免被当成 amount 放大 centFactor 倍
              cent: Number(item),
              centFactor: __centFactor,
            })) ||
          undefined;
        if (__money === undefined) {
          throw 'The variable is not an money!';
        }
        const moneyInstance = __money instanceof Money ? __money : new Money(__money);
        if (__centFactor !== moneyInstance.centFactor) {
          moneyInstance.centFactor = __centFactor;
        }
        computedStrList[moneySymbolIndexs[i]] = String(moneyInstance.cent);
      }
      const expression = computedStrList.join('').replace(/\s/g, '');
      console.log('computedStrList: ', expression);
      const expressionResult = dynamicCalculate(expression);
      return new Money({
        cent: Number(truncateDecimal(expressionResult, 0)),
        centFactor: __centFactor,
      });
    } catch (err) {
      console.log('err: ', err);
      throw err;
    }
  }

  static sort<T extends Money | MoneyLike | number | string>(
    moneys: T[],
    callback?: (a: number, b: number) => number,
  ): T[] {
    if (!(Array.isArray(moneys) && moneys.length)) {
      throw 'Operation array is empty!';
    }
    const moneyObj: Record<string, { dataSource: T[] }> = {};
    const helper = new Money();
    const __centFactor = Money.resolveCentFactor(moneys);
    for (let i = 0, len = moneys.length; i < len; i++) {
      let newMoney: Money | undefined;
      if (helper.instanceof(moneys[i])) {
        newMoney = new Money(moneys[i] as MoneyInit);
      }
      if (!newMoney && !isNaN(Number(moneys[i]))) {
        newMoney = new Money(Number(moneys[i]));
      }
      if (!newMoney) {
        throw `index: ${i}-The variable is not an money!`;
      }
      newMoney.centFactor = __centFactor;
      if (!moneyObj[newMoney.cent]) {
        moneyObj[newMoney.cent] = {
          dataSource: [],
        };
      }
      moneyObj[newMoney.cent].dataSource.push(moneys[i]);
    }
    const cents = Object.keys(moneyObj).map((e) => Number(e));
    const __callback = typeof callback === 'function' ? callback : (a: number, b: number) => a - b;
    cents.sort(__callback);
    let dataSources: T[] = [];
    for (let i = 0, len = cents.length; i < len; i++) {
      dataSources = dataSources.concat(moneyObj[String(cents[i])].dataSource);
    }
    return moneys.sort((a, b) => dataSources.indexOf(a) - dataSources.indexOf(b));
  }
}

export default Money;

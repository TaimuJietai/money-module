# The js class that handles the amount of money

## Single currency currency type, handle currency arithmetic, currency and get integers.

### Currently, the currency implements the following main functions:
 * 1.Currency unit conversion;
 * 2.Use the "Banker's Rounding Method";
 * 3.Support direct object and object operation;
 * 4.Support automatic acquisition of currency symbols;
 * 5.Support size comparison and sorting between currency objects;
 * 6.Support Nodejs and browser use at the same time.

### Installing

If you use npm, `npm install money-module`. You can also download the [latest release on GitHub](https://github.com/d3/d3/releases/latest).

##### NPM
```
npm i money-module --save
```

### Instructions
```
const Money = require('./Money.js');
const money = new Money({
  cent: 1235357
});
const money1 = new Money('32563.286');
const money2 = new Money(23423.985);
const money3 = new Money({
  amount: 23523.87324244,
  centFactor: 1000
});


console.log('\nmoney: ', money.valueOf());
/**
 * money:  {
  amount: 12353.57,
  cent: 1235357,
  centFactor: 100,
  currency: 'CNY',
  md5: null,
  rsa: null
}
 */
console.log('TranslateNumber: ', money.getTranslateNumber());
//  12,353.57
console.log('showMoney: ', money.showMoney());
//  ¥12,353.57

//  Convert to U.S. dollars
money3.currency = 'USD';
console.log('4money: ', money3.valueOf());
/**
 * 4money:  {
  amount: 23523.873,
  cent: 23523873,
  centFactor: 1000,
  currency: 'USD',
  md5: null,
  rsa: null
}
 */
console.log('TranslateNumber: ', money3.getTranslateNumber());
//  23,523.87
console.log('showMoney: ', money3.showMoney());
//  $23,523.87
const moneys = [money, money1, money2, money3];
//  Calculation
const sum = Money.computed(`$ + ($ + $ + $) / $`, [...moneys, 2]);
console.log('sum: ', sum.valueOf())
/**
 * sum:  {
  amount: 52109.141,
  cent: 52109141,
  centFactor: 1000,
  currency: 'CNY',
  md5: null,
  rsa: null
}
 */
const datas = [...moneys, '3'];
//  Sort ascending
const sorts = Money.sort(datas);
console.log('sorts: ', sorts.map(e => e.amount || e - 0));
//  [ 3, 12353.57, 23423.98, 23523.873, 32563.29 ]
//  Sort descending
const sorts2 = Money.sort(datas, (a, b) => b - a);
console.log('sorts: ', sorts2.map(e => e.amount || e - 0));
//  [ 32563.29, 23523.873, 23423.98, 12353.57, 3 ]
```

##### Static object

| Name                  | default                                                                | Description                                             |
| --------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------  |
| Money.symbol          | { USD: '$',... }                                                       | Currency mapping                                        |
| Money.centFactors     | [1, 10, 100, 1000]                                                     | Amount and cent conversion rate mapping.                |
| Money.computed        | Money.computed(`$ + ($ + $ + $) / $`, [...moneys, 2]);                 | Amount calculation                                      |
| Money.sort            | Money.sort([...moneys, 2]);Money.sort([...moneys, 2], (a, b) => b - a);| Sort by amount.                                         |

##### Methods

| Name                  | default                                                      | Description                                             |
| --------------------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| currency              | 'USD'                                                        | 'CNY'   'USD'                                           |
| amount                | 0                                                            | 1 / 1.02                                                |
| cent                  | 0                                                            | Cents                                                   |
| centFactor            | 100                                                          | Amount and Cent conversion ratio.                       |

##### API

| Name                  | params                                                       | Description                                             |
| --------------------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| valueOf               | money.valueOf();                                             | Convert to ordinary `Object` object.                    |
| toString              | money.toString(null, 2);money.toString();                    | Serialization -> JSON.stringify()                       |
| equals                | money.equals(money2);// true/false                           | Determine whether two `money` objects are completely equal (judging by serialization)|
| instanceof            | money.instanceof(money2);// true/false                       | Determine whether the same amount type.                 |
| isCurrency            | money.isCurrency('USD');// true                              | Is it a valid currency type                             |
| setMoney              | money.setMoney(money)                                        | Assign a value to a `money` object, which can be a number, a string, or a `money` object|
| equals                | money.equals(money2);// true/false                           | Determine whether two `money` objects are completely equal (judging by serialization)|
| bankersAlgorithm      | money.bankersAlgorithm(0.28 * 100, 2);                       | Banker's round,`bankersAlgorithm(number, size)`.        |
| compareTo             | money.bankersAlgorithm(money1);// money>money1 -> 1          | Greater than: 1, equal to: 0, less than: -1.            |
| greaterThan           | money.greaterThan(money1);// money>money1 -> true            | Determine whether this currency object is larger than another currency object. true/false |
| getTranslateNumber    | money.getTranslateNumber();// 23,523.87                      | Thousand sign handling                                  |
| showMoney             | money.showMoney();// $23,523.87                              | Thousand character string with currency symbol   .      |
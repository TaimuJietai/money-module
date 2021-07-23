# 专门处理金额的 js 类

## 单币种货币类，处理货币算术、币种和取整。

### 目前，货币实现了以下主要功能：
 * 1.转换“元、角、分、厘”的换算；
 * 2.采用“银行家舍入法”四舍六入五留双；
 * 3.支持直接对象与对象的运算；
 * 4.支持货币符号的自动获取；
 * 5.支持货币对象间的大小对比，排序；
 * 6.同时支持 Nodejs 与浏览器使用。

### 安装

如果您使用 NPM， `npm install money-module`。 GitHub 上[下载最新版本](https://github.com/TaimuJietai/money-module/releases/tag/1.0.1)。

##### NPM
```
npm i money-module --save
```

##### 使用方法
```
const Money = require('money-module');
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

//  转换成美元
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
//  运算
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
//  升序排序
const sorts = Money.sort(datas);
console.log('sorts: ', sorts.map(e => e.amount || e - 0));
//  [ 3, 12353.57, 23423.98, 23523.873, 32563.29 ]
//  降序排序
const sorts2 = Money.sort(datas, (a, b) => b - a);
console.log('sorts: ', sorts2.map(e => e.amount || e - 0));
//  [ 32563.29, 23523.873, 23423.98, 12353.57, 3 ]
```

##### 静态对象

| Name                  | default                                                                | Description                                             |
| --------------------- | -----------------------------------------------------------------------| ------------------------------------------------------- |
| Money.symbol          | { USD: '$', CNY: '￥', ... }                                            | 货币映射                                                  |
| Money.centFactors     | 100                                                                    | 币种的元 / 分换算比率。                                     |
| Money.computed        | Money.computed(`$ + ($ + $ + $) / $`, [...moneys, 2]);                 | 金额运算                                                  |
| Money.sort            | Money.sort([...moneys, 2]);Money.sort([...moneys, 2], (a, b) => b - a);| 金额排序。                                                |

##### 常用属性

| Name                  | default                                                      | Description                                             |
| --------------------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| currency              | 'USD'                                                        | 'CNY'   'USD'                                           |
| amount                | 0                                                            | 1、1.02                                                 |
| cent                  | 0                                                            | 根据 `centFactor` 换算出来 `amount`                       |
| centFactor            | 100                                                          | Money.centFactors 范围内的本货币币种的元 / 分换算比率。       |

##### API 方法

| Name                  | params                                                       | Description                                             |
| --------------------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| valueOf               | money.valueOf();                                             | 转换成普通的 `Object` 对象                                 |
| toString              | money.toString(null, 2);money.toString();                    | 序列化，-> JSON.stringify()                              |
| equals                | money.equals(money2);// true/false                           | 判断两个 `money` 对象是否完全相等（通过序列化判断）            |
| instanceof            | money.instanceof(money2);// true/false                       | 判断是否同一个金额类型。                                    |
| isCurrency            | money.isCurrency('USD');// true                              | 是否是有效的货币类型                                       |
| setMoney              | money.setMoney(money)                                        | 对一个 `money` 对象进行赋值,可以是数字、字符串、`money` 对象   |
| equals                | money.equals(money2);// true/false                           | 判断两个 `money` 对象是否完全相等（通过序列化判断）            |
| bankersAlgorithm      | money.bankersAlgorithm(0.28 * 100, 2);                       | 银行舍入法运算，`bankersAlgorithm(number, size)`。         |
| compareTo             | money.bankersAlgorithm(money1);// money>money1 -> 1          | 大于：1，等于：0，小于：-1。                                |
| greaterThan           | money.greaterThan(money1);// money>money1 -> true            | 判断本货币对象是否大于另一货币对象 true/false                 |
| getTranslateNumber    | money.getTranslateNumber();// 23,523.87                      | 千位符处理                                                |
| showMoney             | money.showMoney();// $23,523.87                              | 带货币符号的千位符字符串                                    |
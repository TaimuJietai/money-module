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
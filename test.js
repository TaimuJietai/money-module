const Money = require('./dist/money.min.v1.0.0');
const money = new Money('13256236236.555432');
const money1 = new Money(423423423423.982);
const money2 = new Money(53453453346.285);
const money3 = new Money(232324233.423);


console.log('money: ', money.valueOf());
//  千位符处理
console.log('TranslateNumber: ', money.getTranslateNumber());
//  加上金额符号
console.log('showMoney: ', money.showMoney());


console.log('1money: ', money1.valueOf());
console.log('TranslateNumber: ', money1.getTranslateNumber());
console.log('showMoney: ', money1.showMoney());


console.log('2money: ', money2.valueOf());
console.log('TranslateNumber: ', money2.getTranslateNumber());
console.log('showMoney: ', money2.showMoney());


console.log('3money: ', money3.valueOf());
console.log('TranslateNumber: ', money3.getTranslateNumber());
console.log('showMoney: ', money3.showMoney());
//  转换成美元
money3.currency = 'USD';
console.log('\n4money: ', money3.valueOf());
console.log('TranslateNumber: ', money3.getTranslateNumber());
console.log('showMoney: ', money3.showMoney());
//  运算
const sum = Money.computed(`$ + $ + $ / $`, [money1, money2, money3, 2]);
console.log('sum: ', sum.valueOf())
const datas = [money1, money2, money3, '3'];
//  升序排序
const sorts = Money.sort(datas);
console.log('sorts: ', sorts.map(e => e.amount || e - 0));
//  降序排序
const sorts2 = Money.sort(datas, (a, b) => b - a);
console.log('sorts: ', sorts2.map(e => e.amount || e - 0));
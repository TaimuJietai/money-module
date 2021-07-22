function Money(initParams) {
  /**************************************************  私有变量  **************************************************/
  var cent = 0;
  var currency = 'CNY';
  var centFactor = 100;
  var self = this;
  var createDefineProperty = function(obj, prop, descriptor) {
    Object.defineProperty(obj, prop, descriptor);
  }

  /**************************************************  公共属性  **************************************************/
  this.md5 = null;
  this.rsa = null;

  createDefineProperty(this, 'currency', {
    set: function(val) {
      currency = val && Money.symbol[val] && val || 'CNY';
    },
    get: function() {
      return currency;
    }
  });
  createDefineProperty(this, 'centFactor', {
    set: function(val) {
      var amount = self.setCents(cent);
      centFactor = val && Money.centFactors.indexOf(val - 0) !== -1 && val - 0 || centFactor;
      cent = self.setAmount(amount);
    },
    get: function() {
      return centFactor;
    }
  });
  createDefineProperty(this, 'cent', {
    set: function(val) {
      cent = val && val - 0 || 0;
    },
    get: function() {
      return cent;
    }
  });
  createDefineProperty(this, 'amount', {
    set: function(val) {
      cent = val && val - 0 && self.setAmount(val);
    },
    get: function() {
      return self.setCents(cent);
    }
  });
  this.valueKeys = ['amount', 'cent', 'centFactor', 'currency', 'md5', 'rsa'].sort();

  /**************************************************  成员方法  **************************************************/
  /**
   * 转换成 object 对象
   */
  this.valueOf = function() {
    return Object.fromEntries(self.valueKeys.map(function(e) {return [e, self[e]];}));
  }
  //  序列化
  this.toString = function(args1 = null, args2 = 0) {
    return JSON.stringify(self.valueOf(), args1, args2);
  }
  //  判断两个对象是否一致，可以是 object 也可以是 Money 类的对象
  this.equals = function(money) {
    return money instanceof Money && money.toString() === self.toString() || JSON.stringify(Object.fromEntries(Object.keys(money).sort().map(function(e) {return [e, money[e]];}))) === self.toString();
  }
  //  判断是否是相同的对象
  this.instanceof = function(money) {
    return !!money && typeof money === 'object' && (money instanceof Money || !(Object.keys(money).filter(function(e) {return self.valueKeys.indexOf(e) === -1;}).length));
  }
  //  是否是正确的货币
  this.isCurrency = function(val) {
    return typeof val === 'string' && Money.currency.indexOf(val.toLocaleUpperCase()) !== -1 && val || false;
  }
  //  money 对 money 对象的赋值
  this.setMoney = function(money) {
    if (money) {
      if (!isNaN(money - 0)) {
        self.amount = money - 0;
        return;
      }
      if (self.instanceof(money)) {
        self.centFactor = money.centFactor || self.centFactor;
        self.cent = money.cent || self.cent;
        for (var e of self.valueKeys) {
          if (money[e] && ['centFactor', 'cent'].indexOf(e) === -1) {
            self[e] = money[e];
          }
        }
      }
    }
  }
  //  计算本货币对象的杂凑值。
  this.hashCode = function() {
    return parseInt(cent ^ (cent >>> 32), 10);
  }
  //  设置分
  this.setCents = function(val) {
    return centFactor !== 1 && self.toFixed(val / centFactor, Money.centFactors.indexOf(centFactor)) - 0 || val;
  }
  //  换算回元
  this.setAmount = function(val) {
    return centFactor !== 1 && self.toFixed(val * centFactor, 0) - 0 || val;
  }
  //  银行家舍入法
  this.toFixed = function(value, size = 2) {

    //  确保值为数字
    var oldVal = value - 0;
    if (isNaN(oldVal) || value === undefined && value === null) {
      oldVal = 0;
    }

    //  取多一位作为银行家舍入法
    var currentSize = size + 1;

    //  利用四舍五入，取多一位用来做银行家舍入法
    var val = oldVal.toFixed(currentSize);
    if (val[val.length - 1] === '0') {
      //  如果最后一位为 0，则没有丢失精度，直接返回
      return val - 0;
    }
    //  从小数点切开
    var valLengthList = val.split('.');
    //  将小数部分切成数组，以便替换值
    var listLastValue = valLengthList[1].split('');
    //  补位的下标
    var lastIndex = listLastValue.length - 1;
    //  1: 当舍去位的数值大于等于 6 时，在舍去该位的同时向前位进一
    //  2: 当舍去位的数值等于 5 时，如果前位数值为奇，则在舍去该位的同时向前位进一，如果前位数值为偶，则直接舍去该位
    listLastValue[lastIndex] = !!(listLastValue[lastIndex] - 0 >= 6 || listLastValue[lastIndex] - 0 === 5 && !!((listLastValue[lastIndex - 1] - 0) % 2)) && '9' || '1';
    return ([valLengthList[0], listLastValue.join('')].join('.') - 0).toFixed(size) - 0;
  }
  /**
   * 对象比较。
   *
   * 比较本对象与另一对象的大小。
   * 如果本货币对象的金额少于待比较货币对象，则返回 -1。 如果本货币对象的金额等于待比较货币对象，则返回 0。
   * 如果本货币对象的金额大于待比较货币对象，则返回 1。
   *
   * @param other 另一对象。
   * @return -1 表示小于，0 表示等于，1 表示大于。
   * @throws ClassCastException 待比较货币对象不是<code>Money</code>。 IllegalArgumentException
   *                            待比较货币对象与本货币对象的币种不同。
   * @see java.lang.Comparable#compareTo(java.lang.Object)
   */
  this.compareTo = function(__other) {
    if (!self.instanceof(__other) || isNaN(__other - 0)) {
      throw 'The object is not the amount';
    }
    var other = new Money(__other);
    if (self.centFactor !== other.centFactor) {
      other.centFactor = self.centFactor;
    }
    return self.cent > other.cent && 1 || self.cent < other.cent && -1 || 0;
  }
  //  判断本货币对象是否大于另一货币对象。
  this.greaterThan = function(other) {
    return self.compareTo(other) > 0;
  }
  this.getTranslateNumber = function() {
    const ret = (self.amount.toFixed(2) - 0).toLocaleString() || self.amount.toString();
    const result = ret === '0' && '0.00' || (ret.indexOf('.') === -1 && `${ret}.00` || ret);
    const nums = result.split('.');
    if (nums[1].length < 2) {
      return `${result}0`;
    }
    return result;
  }
  this.showMoney = function() {
    return Money.symbol[self.currency] + self.getTranslateNumber();
  }

  /**************************************************  静态对象  **************************************************/
  //  货币对象
  Money.symbol = Object.fromEntries([ { "abbreviation": "ALL", "symbol": "Lek" }, { "abbreviation": "AFN", "symbol": "؋" }, { "abbreviation": "ARS", "symbol": "$" }, { "abbreviation": "AWG", "symbol": "ƒ" }, { "abbreviation": "AUD", "symbol": "$" }, { "abbreviation": "AZN", "symbol": "ман" }, { "abbreviation": "BSD", "symbol": "$" }, { "abbreviation": "BBD", "symbol": "$" }, { "abbreviation": "BYR", "symbol": "p." }, { "abbreviation": "BZD", "symbol": "BZ$" }, { "abbreviation": "BMD", "symbol": "$" }, { "abbreviation": "BOB", "symbol": "$b" }, { "abbreviation": "BAM", "symbol": "KM" }, { "abbreviation": "BWP", "symbol": "P" }, { "abbreviation": "BGN", "symbol": "лв" }, { "abbreviation": "BRL", "symbol": "R$" }, { "abbreviation": "BND", "symbol": "$" }, { "abbreviation": "KHR", "symbol": "៛" }, { "abbreviation": "CAD", "symbol": "$" }, { "abbreviation": "KYD", "symbol": "$" }, { "abbreviation": "CLP", "symbol": "$" }, { "abbreviation": "CNY", "symbol": "¥" }, { "abbreviation": "COP", "symbol": "$" }, { "abbreviation": "CRC", "symbol": "₡" }, { "abbreviation": "HRK", "symbol": "kn" }, { "abbreviation": "CUP", "symbol": "₱" }, { "abbreviation": "CZK", "symbol": "Kč" }, { "abbreviation": "DKK", "symbol": "kr" }, { "abbreviation": "DOP", "symbol": "RD$" }, { "abbreviation": "XCD", "symbol": "$" }, { "abbreviation": "EGP", "symbol": "£" }, { "abbreviation": "SVC", "symbol": "$" }, { "abbreviation": "EEK", "symbol": "kr" }, { "abbreviation": "EUR", "symbol": "€" }, { "abbreviation": "FKP", "symbol": "£" }, { "abbreviation": "FJD", "symbol": "$" }, { "abbreviation": "GHC", "symbol": "¢" }, { "abbreviation": "GIP", "symbol": "£" }, { "abbreviation": "GTQ", "symbol": "Q" }, { "abbreviation": "GGP", "symbol": "£" }, { "abbreviation": "GYD", "symbol": "$" }, { "abbreviation": "HNL", "symbol": "L" }, { "abbreviation": "HKD", "symbol": "$" }, { "abbreviation": "HUF", "symbol": "Ft" }, { "abbreviation": "ISK", "symbol": "kr" }, { "abbreviation": "INR", "symbol": null }, { "abbreviation": "IDR", "symbol": "Rp" }, { "abbreviation": "IRR", "symbol": "﷼" }, { "abbreviation": "IMP", "symbol": "£" }, { "abbreviation": "ILS", "symbol": "₪" }, { "abbreviation": "JMD", "symbol": "J$" }, { "abbreviation": "JPY", "symbol": "¥" }, { "abbreviation": "JEP", "symbol": "£" }, { "abbreviation": "KZT", "symbol": "лв" }, { "abbreviation": "KPW", "symbol": "₩" }, { "abbreviation": "KRW", "symbol": "₩" }, { "abbreviation": "KGS", "symbol": "лв" }, { "abbreviation": "LAK", "symbol": "₭" }, { "abbreviation": "LVL", "symbol": "Ls" }, { "abbreviation": "LBP", "symbol": "£" }, { "abbreviation": "LRD", "symbol": "$" }, { "abbreviation": "LTL", "symbol": "Lt" }, { "abbreviation": "MKD", "symbol": "ден" }, { "abbreviation": "MYR", "symbol": "RM" }, { "abbreviation": "MUR", "symbol": "₨" }, { "abbreviation": "MXN", "symbol": "$" }, { "abbreviation": "MNT", "symbol": "₮" }, { "abbreviation": "MZN", "symbol": "MT" }, { "abbreviation": "NAD", "symbol": "$" }, { "abbreviation": "NPR", "symbol": "₨" }, { "abbreviation": "ANG", "symbol": "ƒ" }, { "abbreviation": "NZD", "symbol": "$" }, { "abbreviation": "NIO", "symbol": "C$" }, { "abbreviation": "NGN", "symbol": "₦" }, { "abbreviation": "KPW", "symbol": "₩" }, { "abbreviation": "NOK", "symbol": "kr" }, { "abbreviation": "OMR", "symbol": "﷼" }, { "abbreviation": "PKR", "symbol": "₨" }, { "abbreviation": "PAB", "symbol": "B/." }, { "abbreviation": "PYG", "symbol": "Gs" }, { "abbreviation": "PEN", "symbol": "S/." }, { "abbreviation": "PHP", "symbol": "₱" }, { "abbreviation": "PLN", "symbol": "zł" }, { "abbreviation": "QAR", "symbol": "﷼" }, { "abbreviation": "RON", "symbol": "lei" }, { "abbreviation": "RUB", "symbol": "руб" }, { "abbreviation": "SHP", "symbol": "£" }, { "abbreviation": "SAR", "symbol": "﷼" }, { "abbreviation": "RSD", "symbol": "Дин." }, { "abbreviation": "SCR", "symbol": "₨" }, { "abbreviation": "SGD", "symbol": "$" }, { "abbreviation": "SBD", "symbol": "$" }, { "abbreviation": "SOS", "symbol": "S" }, { "abbreviation": "ZAR", "symbol": "R" }, { "abbreviation": "KRW", "symbol": "₩" }, { "abbreviation": "LKR", "symbol": "₨" }, { "abbreviation": "SEK", "symbol": "kr" }, { "abbreviation": "CHF", "symbol": "CHF" }, { "abbreviation": "SRD", "symbol": "$" }, { "abbreviation": "SYP", "symbol": "£" }, { "abbreviation": "TWD", "symbol": "NT$" }, { "abbreviation": "THB", "symbol": "฿" }, { "abbreviation": "TTD", "symbol": "TT$" }, { "abbreviation": "TRY", "symbol": null }, { "abbreviation": "TRL", "symbol": "₤" }, { "abbreviation": "TVD", "symbol": "$" }, { "abbreviation": "UAH", "symbol": "₴" }, { "abbreviation": "GBP", "symbol": "£" }, { "abbreviation": "USD", "symbol": "$" }, { "abbreviation": "UYU", "symbol": "$U" }, { "abbreviation": "UZS", "symbol": "лв" }, { "abbreviation": "VEF", "symbol": "Bs" }, { "abbreviation": "VND", "symbol": "₫" }, { "abbreviation": "YER", "symbol": "﷼" }, { "abbreviation": "ZWD", "symbol": "Z$" } ].map(function(e) {return [e.abbreviation, e.symbol];}));
  Object.freeze(Money.symbol);
  //  本货币币种的元 / 分换算比率。
  Money.centFactors = [1, 10, 100, 1000];
  Object.freeze(Money.centFactors);
  //  运算金额
  Money.computed = function(computedStr, computedList) {
    if (!(Array.isArray(computedList) && computedList.length)) {
      throw 'Operation array is empty!';
    }
    try {
      var computedStrList = computedStr.split('');
      var moneySymbolIndexs = [];
      for (var i = 0, len = computedStrList.length; i < len; i++) {
        if (computedStrList[i] === '$') {
          moneySymbolIndexs.push(i);
        }
      }
      if (moneySymbolIndexs.length !== computedList.length) {
        throw 'The number of operation symbols is not equal to the length of the operation array!';
      }
      var __centFactor = self.centFactor;
      for (var i = 0, len = moneySymbolIndexs.length; i < len; i++) {
        var __money = self.instanceof(computedList[i]) && computedList[i] || !isNaN(computedList[i] - 0) && new Money(computedList[i] - 0) || undefined;
        if (__money === undefined) {
          throw 'The variable is not an money!';
        }
        if (__centFactor !== __money.centFactor) {
          __money.centFactor = __centFactor;
        }
        computedStrList[moneySymbolIndexs[i]] = __money.cent;
      }
      return new Money({
        cent: self.toFixed(eval(computedStrList.join('')), Money.centFactors.indexOf(__centFactor)),
        centFactor: __centFactor
      });
    } catch(err) {
      console.log('err: ', err)
      throw err;
    }
  }
  //  排序
  Money.sort = function(moneys, callback) {
    if (!(Array.isArray(moneys) && moneys.length)) {
      throw 'Operation array is empty!';
    }
    var moneyObj = {};
    var __centFactor = self.centFactor;
    for (var i = 0, len = moneys.length; i < len; i++) {
      var newMoney = undefined;
      if (self.instanceof(moneys[i])) {
        newMoney = new Money(moneys[i]);
      }
      if (!newMoney && !isNaN(moneys[i] - 0)) {
        newMoney = new Money(moneys[i] - 0);
      }
      if (!newMoney) {
        throw 'index: ' + i + '-' + 'The variable is not an money!';
      }
      newMoney.centFactor = __centFactor;
      if (!moneyObj[newMoney.cent]) {
        moneyObj[newMoney.cent] = {
          dataSource: []
        };
      }
      moneyObj[newMoney.cent].dataSource.push(moneys[i]);
    }
    var cents = Object.keys(moneyObj).map(function(e) {return e - 0;});
    var __callback = typeof callback === 'function' && callback || function(a, b) {return a - b;};
    cents.sort(__callback);
    var dataSources = [];
    for (var i = 0, len = cents.length; i < len; i++) {
      dataSources = dataSources.concat(moneyObj[cents[i].toString()].dataSource);
    }
    return moneys.sort(function(a, b) {
      return dataSources.indexOf(a) - dataSources.indexOf(b);
    });
  }

  /**************************************************  构造函数  **************************************************/
  /**************************************************  构造函数必须要放到最后执行，才能初始化好 this 指向的方法  **************************************************/
  self.setMoney(initParams);
}
try {
  module.exports = Money;
} catch(err) {}
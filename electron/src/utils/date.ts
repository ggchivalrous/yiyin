/**
 * 日期格式化
 *
 * 规则: y 年 M 月 d 日 h 时 m 分 s 秒 q 季 S 毫秒
 * @param rules - 规则: y 年 M 月 d 日 h 时 m 分 s 秒 q 季 S 毫秒
 * @param date - 日期
 */
export const formatDate = (rule?: string, date: number | string | Date = Date.now()) => {
  const _date = new Date(date);
  if (!rule) {
    return _date.toLocaleString();
  }

  const rules: { [key: string]: number } = {
    'M+': _date.getMonth() + 1, // 月份
    'd+': _date.getDate(), // 日
    'h+': _date.getHours(), // 小时
    'm+': _date.getMinutes(), // 分
    's+': _date.getSeconds(), // 秒
    'q+': Math.floor((_date.getMonth() + 3) / 3), // 季度
    S: _date.getMilliseconds(), // 毫秒
  };

  const regexpList = /(y+)/.exec(rule);

  if (regexpList) {
    rule = rule.replace(regexpList[0], (`${_date.getFullYear()}`).substring(4 - regexpList[0].length));
  }

  for (const key in rules) {
    if (Object.prototype.hasOwnProperty.call(rules, key)) {
      const _regexpList = new RegExp(`(${key})`).exec(rule);
      if (_regexpList) {
        rule = rule.replace(
          _regexpList[0],
          _regexpList[0].length === 1 ? `${rules[key]}` : (`00${rules[key]}`).substring((`${rules[key]}`).length),
        );
      }
    }
  }

  return rule;
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = void 0;
/**
 * 日期格式化
 * y 年 M 月 d 日 h 时 m 分 s 秒 q 季 S 毫秒
 * @param rules - y 年 M 月 d 日 h 时 m 分 s 秒 q 季 S 毫秒
 */
const formatDate = (rule, date = Date.now()) => {
    const _date = new Date(date);
    if (!rule) {
        return _date.toLocaleString();
    }
    const rules = {
        'M+': _date.getMonth() + 1,
        'd+': _date.getDate(),
        'h+': _date.getHours(),
        'm+': _date.getMinutes(),
        's+': _date.getSeconds(),
        'q+': Math.floor((_date.getMonth() + 3) / 3),
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
                rule = rule.replace(_regexpList[0], _regexpList[0].length === 1 ? `${rules[key]}` : (`00${rules[key]}`).substring((`${rules[key]}`).length));
            }
        }
    }
    return rule;
};
exports.formatDate = formatDate;
//# sourceMappingURL=utils.js.map
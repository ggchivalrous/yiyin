export function isString(obj) {
  return Object.prototype.toString.call(obj) === '[object String]';
}

export function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

export function isArray(arr) {
  return Object.prototype.toString.call(arr) === '[object Array]';
}

export function isHtmlElement(node) {
  return node && node.nodeType === Node.ELEMENT_NODE;
}

export function isFunction(functionToCheck) {
  return Object.prototype.toString.call(functionToCheck) === '[object Function]';
}

export function isUndefined(val) {
  return val === undefined;
}

export function isDefined(val) {
  return val !== undefined && val !== null;
}

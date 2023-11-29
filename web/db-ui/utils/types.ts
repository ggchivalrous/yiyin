export function isString(obj: any) {
  return Object.prototype.toString.call(obj) === '[object String]';
}

export function isObject(obj: any) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

export function isArray(arr: any) {
  return Object.prototype.toString.call(arr) === '[object Array]';
}

export function isHtmlElement(node: any) {
  return node && node.nodeType === Node.ELEMENT_NODE;
}

export function isFunction(functionToCheck: any) {
  return Object.prototype.toString.call(functionToCheck) === '[object Function]';
}

export function isUndefined(val: any) {
  return val === undefined;
}

export function isDefined(val: any) {
  return val !== undefined && val !== null;
}

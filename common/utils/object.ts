const isObj = (obj: any) => Object.prototype.toString.call(obj) === '[object Object]';

export const normalize = <T = object>(origin: any, model: T): T => {
  const newObj: any = {};
  origin = JSON.parse(JSON.stringify(origin || {}));

  for (const k in model) {
    if (Object.prototype.hasOwnProperty.call(model, k)) {
      if (isObj(model[k]) && Object.keys(model[k]).length) {
        newObj[k] = normalize(origin[k], model[k]);
      } else if (Array.isArray(model[k]) && isObj((model[k] as any)[0])) {
        if (!Array.isArray(origin[k])) {
          origin[k] = [];
        }

        newObj[k] = [];
        for (const i of origin[k]) {
          if (isObj(i)) {
            newObj[k].push(normalize(i, (model[k] as any)[0]));
          }
        }
      } else if (origin[k] === undefined) {
        newObj[k] = model[k];
      } else {
        newObj[k] = origin[k];
      }
    }
  }

  return newObj;
};

export const cpObj = (obj: any) => JSON.parse(JSON.stringify(obj));

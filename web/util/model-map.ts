import { toRoman, charToNumberChar } from './util';

type StrToStrFn = (str: string) => string;

interface IFilter {
  make_filter?: StrToStrFn;

  model_filter?: StrToStrFn;
}

export default {
  INIT: {
    make_filter: (e) => e?.replace('CORPORATION', ''),
  },
  DEF: {
    make_filter: (s) => charToNumberChar(s[0] + s.slice(1).toLowerCase()),
    model_filter: (e) => charToNumberChar(e.toLowerCase()),
  },
  NIKON: {
    model_filter: (str) => {
      str = str.replace(/[Zz]/g, 'ℤ');

      const arr = str.split('_');
      if (arr.length > 1) {
        const i = arr.pop();
        if (i && !Number.isNaN(+i)) {
          return `${arr.join(' ')} ${toRoman(+i)}`;
        }

        return `${arr.join(' ')} ${i}`;
      }

      return str;
    },
  },
  SONY: {
    model_filter(str) {
      str = str.replace('ILCE-', 'α ');

      return str.toLowerCase();
    },
  },
} as Record<string, IFilter>;

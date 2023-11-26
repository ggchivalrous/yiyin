import { toRoman } from './util';

type StrToStrFn = (str: string) => string;

interface IFilter {
  make_filter?: StrToStrFn;

  model_filter?: StrToStrFn;
}

export default {
  DEF: {
    make_filter: (e) => e.replace('CORPORATION', '').trim(),
    model_filter: (e) => e,
  },
  NIKON: {
    model_filter(str) {
      str = str.replace('Z', 'ℤ');

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

      return str;
    },
  },
} as Record<string, IFilter>;

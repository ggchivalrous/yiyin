import { toRoman } from './util';

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
        if (!Number.isNaN(+arr[1])) {
          return `${arr[0]} ${toRoman()}`;
        }

        return `${arr[0]} ${arr[1]}`;
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
};

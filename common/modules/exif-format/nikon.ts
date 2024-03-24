import { toRoman } from '@common/utils';

import { ExifBase } from './base';

export class NikonExif extends ExifBase {
  Model(): string {
    const v = this.exif.Model.replace(this.exif.Make.toUpperCase(), '').replace(/[Zz]/g, 'ℤ');
    const arr = v.split('_');

    if (arr.length > 1) {
      const i = arr.pop();
      if (i && !Number.isNaN(+i)) {
        return `${arr.join(' ')} ${toRoman(+i)}`;
      }

      return `${arr.join(' ')} ${i}`;
    }

    return v;
  }
}

import { ExifBase } from './base';

export class SonyExif extends ExifBase {
  Model(): string {
    return this.exif.Model.replace('ILCE-', 'α').toLowerCase();
  }
}

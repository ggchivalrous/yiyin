import { ExifBase } from './base';
import { NikonExif } from './nikon';
import { SonyExif } from './sony';

interface IExifBaseClass {
  new(exif: any): ExifBase
}

export class ExifFormat {
  private exif: any;

  private exifIns: ExifBase;

  private exifClassRecord: Record<string, IExifBaseClass> = {
    NIKON: NikonExif,
    SONY: SonyExif,
  };

  get _() {
    return this.exifIns;
  }

  get oriExif() {
    return this.exif;
  }

  constructor(exif: any) {
    this.exif = exif || {};
    this.init();
    this.insExif();
  }

  private init() {
    this.exif.Make = this.exif.Make ? this.exif.Make.replace('CORPORATION', '').trim() : '';
  }

  private insExif() {
    const Classes = this.exifClassRecord[this.exif.Make];
    if (Classes) {
      this.exifIns = new Classes(this.exif);
    } else {
      this.exifIns = new ExifBase(this.exif);
    }
  }
}

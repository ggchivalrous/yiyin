export class ExifBase {
  exif: any;

  constructor(exif: any) {
    this.exif = exif || {};
  }

  /**
   * 相机厂商
   */
  Make(v = this.exif.Make) {
    return v ? v[0] + v.slice(1).toLowerCase() : '';
  }

  /**
   * 机型 Nikon Z 30
   */
  Model(v = this.exif.Model) {
    return v ? v.toLowerCase() : '';
  }

  /**
   * 照片拍摄时间
   */
  DateTimeOriginal(v = this.exif.DateTimeOriginal) {
    return v;
  }

  /**
   * 快门速度
   */
  ExposureTime(v = this.exif.ExposureTime) {
    if (!v) {
      return '';
    }

    if (v < 1) {
      return `1/${Math.round(1 / v)}`;
    }
    return v;
  }

  /**
   * 光圈大小
   */
  FNumber(v = this.exif.FNumber) {
    return v;
  }

  /**
   * 焦距
   */
  FocalLength(v = this.exif.FocalLength) {
    return v ? Math.round(v) : '';
  }

  /**
   * 等效焦距
   */
  FocalLengthIn35mmFormat(v = this.exif.FocalLengthIn35mmFormat) {
    return v ? Math.round(v) : '';
  }

  ISO(v = this.exif.ISO) {
    return v || '';
  }

  /**
   * 档位
   */
  ExposureProgram(v = this.exif.ExposureProgram) {
    return v;
  }

  /**
   * 镜头型号
   */
  LensModel() {
    return this.exif.LensModel || '';
  }

  /**
   * 镜头厂商
   */
  LensMake() {
    return this.exif.LensMake || '';
  }

  /**
   * 曝光补偿
   */
  ExposureCompensation() {
    return this.exif.ExposureCompensation;
  }

  /**
   * 测光模式
   */
  MeteringMode() {
    return this.exif.MeteringMode;
  }

  /**
   * 闪光灯
   */
  Flash() {
    return this.exif.Flash;
  }

  /**
   * 曝光模式
   */
  ExposureMode() {
    return this.exif.ExposureMode;
  }

  /**
   * 白平衡
   */
  WhiteBalance() {
    return this.exif.WhiteBalance;
  }
}

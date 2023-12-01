import { OutputSetting } from '@modules/tools/image';

export interface IConfig {
  /**
   * 配置文件存放路径
   */
  dir: string

  /**
   * 图片输出路径
   */
  output: string

  /**
   * 缓存存放目录
   */
  cacheDir: string

  /**
   * 字体信息
   */
  font: {
    path: string

    dir: string

    map: Record<string, string>
  }

  options: OutputSetting
}

import type { ICameraInfoItem } from '@web/main/interface';

export type TActionItemData = ICameraInfoItem<string | boolean | number> & {
  title: string
}

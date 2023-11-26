import type MessageComponent from './message.svelte';

export interface Props {
  message?: string
  duration?: number
  type?: 'info' | 'success' | 'error' | 'warning'
  showClose?: boolean
  iconClass?: string
  customClass?: string
  dangerouslyUseHTMLString?: boolean
  center?: boolean
  offset?: number
  onClose?: any
}

export interface TypeMap {
  [key: string]: string
}

export interface IMessage {
  (options: Props | string): MessageComponent
  success: (options: Props | string) => MessageComponent
  info: (options: Props | string) => MessageComponent
  waring: (options: Props | string) => MessageComponent
  error: (options: Props | string) => MessageComponent
  close: (id: string, userOnClose: IUserCloseFun) => void
  closeAll: () => void
}

export interface IUserCloseFun {
  (instance: MessageComponent): any
}

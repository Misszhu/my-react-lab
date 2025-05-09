/**
 * 事件处理器类型定义
 * @template T 事件数据类型，默认为 unknown
 * @param data 事件数据
 */
export type EventHandler<T = unknown> = (data: T) => void;

/**
 * 事件发射器接口定义
 * 定义了事件总线需要实现的核心方法
 */
export interface EventEmitter {
  /**
   * 订阅事件
   * @template T 事件数据类型
   * @param event 事件名称
   * @param handler 事件处理函数
   */
  on<T>(event: string, handler: EventHandler<T>): void;

  /**
   * 取消订阅事件
   * @template T 事件数据类型
   * @param event 事件名称
   * @param handler 要取消的事件处理函数
   */
  off<T>(event: string, handler: EventHandler<T>): void;

  /**
   * 发布事件
   * @template T 事件数据类型
   * @param event 事件名称
   * @param data 事件数据
   */
  emit<T>(event: string, data: T): void;
} 
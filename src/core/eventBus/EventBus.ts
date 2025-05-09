import type { EventHandler, EventEmitter } from './types';

/**
 * EventBus 类
 * 实现了一个简单但功能完整的事件总线系统
 * 支持事件的订阅、发布、取消订阅和一次性订阅
 */
class EventBus implements EventEmitter {
  /**
   * 存储事件和对应的处理器数组
   * key: 事件名称
   * value: 处理器数组
   */
  private events: Map<string, EventHandler<unknown>[]>;

  /**
   * 构造函数
   * 初始化事件存储 Map
   */
  constructor() {
    this.events = new Map();
  }

  /**
   * 订阅事件
   * @template T 事件数据类型
   * @param event 事件名称
   * @param handler 事件处理函数
   */
  on<T>(event: string, handler: EventHandler<T>): void {
    // 如果事件不存在，创建新数组
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    // 将处理器添加到数组
    this.events.get(event)!.push(handler as EventHandler<unknown>);
  }

  /**
   * 取消订阅事件
   * @template T 事件数据类型
   * @param event 事件名称
   * @param handler 要取消的事件处理函数
   */
  off<T>(event: string, handler: EventHandler<T>): void {
    const handlers = this.events.get(event);
    if (handlers) {
      // 查找处理器在数组中的位置
      const index = handlers.indexOf(handler as EventHandler<unknown>);
      if (index !== -1) {
        // 移除处理器
        handlers.splice(index, 1);
      }
      // 如果没有处理器了，删除该事件
      if (handlers.length === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * 发布事件
   * @template T 事件数据类型
   * @param event 事件名称
   * @param data 事件数据
   */
  emit<T>(event: string, data: T): void {
    const handlers = this.events.get(event);
    if (handlers) {
      // 遍历执行所有处理器
      handlers.forEach(handler => handler(data));
    }
  }

  /**
   * 一次性订阅事件
   * 事件触发后自动取消订阅
   * @template T 事件数据类型
   * @param event 事件名称
   * @param handler 事件处理函数
   */
  once<T>(event: string, handler: EventHandler<T>): void {
    // 创建包装处理器
    const onceHandler: EventHandler<T> = (data: T) => {
      // 执行原始处理器
      handler(data);
      // 自动取消订阅
      this.off(event, onceHandler);
    };
    // 订阅事件
    this.on(event, onceHandler);
  }

  /**
   * 清除所有事件
   * 用于组件卸载或重置场景
   */
  clear(): void {
    this.events.clear();
  }
}

export default EventBus; 
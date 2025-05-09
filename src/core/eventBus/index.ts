import EventBus from './EventBus';

/**
 * EventBus 单例实例
 * 用于在应用中进行事件通信
 * 支持事件的订阅、发布、取消订阅和一次性订阅
 */
const eventBus = new EventBus();

export default eventBus; 
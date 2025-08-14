export interface OfflineTodo {
  id: number;
  text: string;
  completed: boolean;
  createdAt?: string;
  updatedAt?: string;
  isOffline?: boolean;
}

export interface SyncAction {
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  todo: OfflineTodo;
  timestamp: number;
}

export interface OfflineStorageResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ServiceWorkerMessage {
  type: string;
  messageId?: string;
  [key: string]: unknown;
}

export interface ServiceWorkerResponse {
  success: boolean;
  messageId?: string;
  data?: unknown;
  error?: string;
  [key: string]: unknown;
}

class OfflineStorage {
  private sw: ServiceWorker | null = null;
  private messageHandlers: Map<string, (data: ServiceWorkerResponse) => void> = new Map();
  private isInitialized = false;

  constructor() {
    this.init();
  }

  // 初始化离线存储
  private async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 注册 Service Worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        this.sw = registration.active || registration.waiting;

        // 监听 Service Worker 消息
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event.data as ServiceWorkerResponse);
        });

        // 等待 Service Worker 激活
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        this.isInitialized = true;
        console.log('离线存储初始化成功');
      }
    } catch (error) {
      console.error('离线存储初始化失败:', error);
    }
  }

  // 处理 Service Worker 消息
  private handleServiceWorkerMessage(data: ServiceWorkerResponse): void {
    const handler = this.messageHandlers.get(data.type);
    if (handler) {
      handler(data);
    }
  }

  // 发送消息到 Service Worker
  private async sendMessage(message: ServiceWorkerMessage): Promise<ServiceWorkerResponse> {
    if (!this.sw) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const messageId = Date.now().toString();

      const handler = (data: ServiceWorkerResponse) => {
        if (data.messageId === messageId) {
          this.messageHandlers.delete(messageId);
          if (data.success) {
            resolve(data);
          } else {
            reject(new Error(data.error || '未知错误'));
          }
        }
      };

      this.messageHandlers.set(messageId, handler);

      // 添加消息ID
      const messageWithId: ServiceWorkerMessage = { ...message, messageId };

      if (this.sw) {
        this.sw.postMessage(messageWithId);
      } else {
        navigator.serviceWorker.controller?.postMessage(messageWithId);
      }

      // 超时处理
      setTimeout(() => {
        if (this.messageHandlers.has(messageId)) {
          this.messageHandlers.delete(messageId);
          reject(new Error('Service Worker 响应超时'));
        }
      }, 5000);
    });
  }

  // 保存 todos 到离线存储
  async saveTodosOffline(todos: OfflineTodo[]): Promise<OfflineStorageResponse> {
    try {
      const response = await this.sendMessage({
        type: 'SAVE_TODOS_OFFLINE',
        todos
      });
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '保存失败'
      };
    }
  }

  // 从离线存储获取 todos
  async getTodosOffline(): Promise<OfflineTodo[]> {
    try {
      const response = await this.sendMessage({
        type: 'GET_TODOS_OFFLINE'
      });
      return (response.data as OfflineTodo[]) || [];
    } catch (error) {
      console.error('获取离线数据失败:', error);
      return [];
    }
  }

  // 添加同步任务到队列
  async addSyncTask(action: SyncAction): Promise<OfflineStorageResponse> {
    try {
      const response = await this.sendMessage({
        type: 'ADD_SYNC_TASK',
        action
      });
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '添加同步任务失败'
      };
    }
  }

  // 获取同步队列
  async getSyncQueue(): Promise<SyncAction[]> {
    try {
      const response = await this.sendMessage({
        type: 'GET_SYNC_QUEUE'
      });
      return (response.data as SyncAction[]) || [];
    } catch (error) {
      console.error('获取同步队列失败:', error);
      return [];
    }
  }

  // 清除同步任务
  async clearSyncTask(id: number): Promise<OfflineStorageResponse> {
    try {
      const response = await this.sendMessage({
        type: 'CLEAR_SYNC_TASK',
        id
      });
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '清除同步任务失败'
      };
    }
  }

  // 检查网络状态
  async checkNetworkStatus(): Promise<boolean> {
    try {
      const response = await this.sendMessage({
        type: 'CHECK_NETWORK_STATUS'
      });
      return response.data as boolean;
    } catch {
      return navigator.onLine;
    }
  }

  // 检查是否支持离线存储
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'indexedDB' in window;
  }

  // 获取初始化状态
  getInitializationStatus(): boolean {
    return this.isInitialized;
  }
}

// 创建单例实例
export const offlineStorage = new OfflineStorage();

export default offlineStorage; 
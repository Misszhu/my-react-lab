import { useState, useEffect, useCallback } from 'react';
import './TodoApp.css';
import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo as deleteTodoApi,
  syncTodos
} from '../utils/todoApiBackend';
import { offlineStorage } from '../utils/offlineStorage';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const TodoAppOffline = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [pageLoading, setPageLoading] = useState(false); // 页面加载状态
  const [operationLoading, setOperationLoading] = useState(false); // 操作加载状态
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true); // 初始假设在线
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // 初始化加载
  useEffect(() => {
    loadTodos();
    setupNetworkListeners();
    setupServiceWorkerListeners();
    checkServerHealth(); // 启动时检查服务端健康状态

    // 设置定期健康检查（每30秒检查一次）
    const healthCheckInterval = setInterval(checkServerHealth, 30000);

    return () => {
      clearInterval(healthCheckInterval);
    };
  }, []);

  // 检查服务端健康状态
  const checkServerHealth = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/health', {
        method: 'GET',
        signal: AbortSignal.timeout(3000) // 3秒超时
      });

      if (response.ok) {
        setIsOnline(true);
        setIsOfflineMode(false);
      } else {
        setIsOnline(false);
        setIsOfflineMode(true);
      }
    } catch (error) {
      console.log('服务端健康检查失败，切换到离线模式:', error);
      setIsOnline(false);
      setIsOfflineMode(true);
    }
  };

  // 设置网络状态监听
  const setupNetworkListeners = useCallback(() => {
    const handleOnline = () => {
      // 网络恢复时，重新检查服务端健康状态
      checkServerHealth();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsOfflineMode(true);
      console.log('网络已断开，切换到离线模式');
    };

    // 添加网络状态监听
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 设置 Service Worker 监听
  const setupServiceWorkerListeners = useCallback(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { type } = event.data;

      switch (type) {
        case 'NETWORK_ONLINE':
          // 网络恢复时，重新检查服务端健康状态
          checkServerHealth();
          break;
        case 'NETWORK_OFFLINE':
          setIsOnline(false);
          setIsOfflineMode(true);
          break;
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  // 加载 todos（优先从服务端，失败则从离线存储）
  const loadTodos = async () => {
    try {
      setPageLoading(true);
      setError(null);

      // 尝试从服务端加载
      if (isOnline) {
        try {
          const data = await getTodos();
          setTodos(data);
          // 同时保存到离线存储
          await offlineStorage.saveTodosOffline(data);
          return;
        } catch (err) {
          console.log('服务端加载失败，尝试离线加载:', err);
          // 服务端失败时，更新网络状态
          setIsOnline(false);
          setIsOfflineMode(true);
        }
      }

      // 从离线存储加载
      const offlineTodos = await offlineStorage.getTodosOffline();
      setTodos(offlineTodos);
      setIsOfflineMode(true);

    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
      console.error('加载todos失败:', err);
    } finally {
      setPageLoading(false);
    }
  };

  // 添加 todo
  const addTodo = async () => {
    if (newTodo.trim()) {
      try {
        setOperationLoading(true);
        setError(null);

        const newTodoItem: Todo = {
          id: Date.now(), // 临时ID
          text: newTodo.trim(),
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // 先添加到本地状态
        setTodos(prev => [...prev, newTodoItem]);
        setNewTodo('');

        // 设置超时控制
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('请求超时')), 5000); // 5秒超时
        });

        if (isOnline) {
          try {
            // 尝试保存到服务端（带超时）
            const savedTodo = await Promise.race([
              createTodo(newTodoItem.text),
              timeoutPromise
            ]);

            // 更新本地状态，使用服务端返回的ID
            setTodos(prev => prev.map(t =>
              t.id === newTodoItem.id ? (savedTodo as Todo) : t
            ));

            // 异步保存到离线存储（不阻塞 UI）
            const currentTodos = todos.filter(t => t.id !== newTodoItem.id);
            offlineStorage.saveTodosOffline([...currentTodos, savedTodo as Todo])
              .catch(err => console.error('离线存储保存失败:', err));
          } catch (err) {
            console.log('服务端保存失败，保存到离线存储:', err);
            // 服务端失败时，更新网络状态
            setIsOnline(false);
            setIsOfflineMode(true);
            // 异步保存到离线存储
            offlineStorage.saveTodosOffline([...todos, newTodoItem])
              .catch(err => console.error('离线存储保存失败:', err));
            // 异步添加到同步队列
            offlineStorage.addSyncTask({
              type: 'CREATE',
              todo: newTodoItem,
              timestamp: Date.now()
            }).catch(err => console.error('添加同步任务失败:', err));
          }
        } else {
          // 离线模式，异步保存到离线存储
          offlineStorage.saveTodosOffline([...todos, newTodoItem])
            .catch(err => console.error('离线存储保存失败:', err));
          // 异步添加到同步队列
          offlineStorage.addSyncTask({
            type: 'CREATE',
            todo: newTodoItem,
            timestamp: Date.now()
          }).catch(err => console.error('添加同步任务失败:', err));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '添加失败');
        console.error('添加todo失败:', err);
        // 回滚本地状态
        setTodos(prev => prev.filter(t => t.id !== Date.now()));
      } finally {
        setOperationLoading(false);
      }
    }
  };

  // 切换完成状态
  const toggleTodo = async (id: number) => {
    try {
      setError(null);
      const todo = todos.find(t => t.id === id);
      if (todo) {
        const updatedTodo = { ...todo, completed: !todo.completed, updatedAt: new Date().toISOString() };

        // 先更新本地状态
        setTodos(prev => prev.map(t => t.id === id ? updatedTodo : t));

        // 设置超时控制
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('请求超时')), 5000);
        });

        if (isOnline) {
          try {
            // 尝试更新服务端（带超时）
            const serverTodo = await Promise.race([
              updateTodo(id, { completed: updatedTodo.completed }),
              timeoutPromise
            ]);

            // 保存到离线存储
            const updatedTodos = todos.map(t => t.id === id ? (serverTodo as Todo) : t);
            offlineStorage.saveTodosOffline(updatedTodos as Todo[])
              .catch(err => console.error('离线存储保存失败:', err));
          } catch (err) {
            console.log('服务端更新失败，保存到离线存储:', err);
            // 服务端失败时，更新网络状态
            setIsOnline(false);
            setIsOfflineMode(true);
            // 保存到离线存储
            const updatedTodos = todos.map(t => t.id === id ? updatedTodo : t);
            offlineStorage.saveTodosOffline(updatedTodos as Todo[])
              .catch(err => console.error('离线存储保存失败:', err));
            // 添加到同步队列
            offlineStorage.addSyncTask({
              type: 'UPDATE',
              todo: updatedTodo,
              timestamp: Date.now()
            }).catch(err => console.error('添加同步任务失败:', err));
          }
        } else {
          // 离线模式，直接保存到离线存储
          const updatedTodos = todos.map(t => t.id === id ? updatedTodo : t);
          offlineStorage.saveTodosOffline(updatedTodos as Todo[])
            .catch(err => console.error('离线存储保存失败:', err));
          // 添加到同步队列
          offlineStorage.addSyncTask({
            type: 'UPDATE',
            todo: updatedTodo,
            timestamp: Date.now()
          }).catch(err => console.error('添加同步任务失败:', err));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
      console.error('更新todo失败:', err);
    }
  };

  // 删除 todo
  const deleteTodo = async (id: number) => {
    let todoToDelete: Todo | undefined;

    try {
      setError(null);
      todoToDelete = todos.find(t => t.id === id);
      if (todoToDelete) {
        // 先从本地状态移除
        setTodos(prev => prev.filter(t => t.id !== id));

        // 设置超时控制
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('请求超时')), 5000);
        });

        if (isOnline) {
          try {
            // 尝试从服务端删除（带超时）
            await Promise.race([
              deleteTodoApi(id),
              timeoutPromise
            ]);

            // 保存到离线存储
            const remainingTodos = todos.filter(t => t.id !== id);
            offlineStorage.saveTodosOffline(remainingTodos as Todo[])
              .catch(err => console.error('离线存储保存失败:', err));
          } catch (err) {
            console.log('服务端删除失败，保存到离线存储:', err);
            // 服务端失败时，更新网络状态
            setIsOnline(false);
            setIsOfflineMode(true);
            // 保存到离线存储
            const remainingTodos = todos.filter(t => t.id !== id);
            offlineStorage.saveTodosOffline(remainingTodos as Todo[])
              .catch(err => console.error('离线存储保存失败:', err));
            // 添加到同步队列
            offlineStorage.addSyncTask({
              type: 'DELETE',
              todo: todoToDelete,
              timestamp: Date.now()
            }).catch(err => console.error('添加同步任务失败:', err));
          }
        } else {
          // 离线模式，直接保存到离线存储
          const remainingTodos = todos.filter(t => t.id !== id);
          offlineStorage.saveTodosOffline(remainingTodos as Todo[])
            .catch(err => console.error('离线存储保存失败:', err));
          // 添加到同步队列
          offlineStorage.addSyncTask({
            type: 'DELETE',
            todo: todoToDelete,
            timestamp: Date.now()
          }).catch(err => console.error('添加同步任务失败:', err));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
      console.error('删除todo失败:', err);
      // 回滚本地状态
      if (todoToDelete) {
        setTodos(prev => [...prev, todoToDelete as Todo]);
      }
    }
  };

  // 同步离线数据
  const syncOfflineData = async () => {
    if (!isOnline) return;

    try {
      setSyncStatus('syncing');
      const syncQueue = await offlineStorage.getSyncQueue();

      if (syncQueue.length === 0) {
        setSyncStatus('success');
        return;
      }

      // 获取当前离线数据
      const offlineTodos = await offlineStorage.getTodosOffline();

      // 同步到服务端
      const syncedTodos = await syncTodos(offlineTodos);

      // 更新本地状态
      setTodos(syncedTodos);

      // 清空同步队列 - 由于 IndexedDB 的 autoIncrement，我们需要获取实际的 ID
      const queueWithIds = await offlineStorage.getSyncQueue();
      for (let i = 0; i < queueWithIds.length; i++) {
        // 使用索引位置来清除任务
        try {
          await offlineStorage.clearSyncTask(i + 1);
        } catch (err) {
          console.log('清除同步任务失败:', err);
        }
      }

      // 更新离线存储
      await offlineStorage.saveTodosOffline(syncedTodos);

      setSyncStatus('success');
      console.log('离线数据同步成功');

      // 3秒后重置状态
      setTimeout(() => setSyncStatus('idle'), 3000);

    } catch (err) {
      setSyncStatus('error');
      console.error('同步失败:', err);
      setError('同步失败: ' + (err instanceof Error ? err.message : '未知错误'));

      // 5秒后重置状态
      setTimeout(() => setSyncStatus('idle'), 5000);
    }
  };

  // 手动同步
  const handleManualSync = () => {
    syncOfflineData();
  };

  return (
    <div className="todo-container">
      <h2>Todo List {isOfflineMode && <span style={{ color: '#ef4444', fontSize: '0.8em' }}>(离线模式)</span>}</h2>

      {/* 网络状态指示器 */}
      <div style={{
        textAlign: 'center',
        marginBottom: '1rem',
        padding: '0.5rem',
        borderRadius: '6px',
        backgroundColor: isOnline ? '#dcfce7' : '#fef2f2',
        color: isOnline ? '#166534' : '#dc2626',
        fontSize: '0.9rem'
      }}>
        {isOnline ? '🟢 在线模式' : '🔴 离线模式'}
        {syncStatus === 'syncing' && ' - 同步中...'}
        {syncStatus === 'success' && ' - 同步成功'}
        {syncStatus === 'error' && ' - 同步失败'}
      </div>

      {/* 同步按钮 */}
      {isOnline && (
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <button
            onClick={handleManualSync}
            disabled={syncStatus === 'syncing'}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {syncStatus === 'syncing' ? '同步中...' : '同步离线数据'}
          </button>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="todo-input">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="添加新任务..."
          disabled={operationLoading}
        />
        <button onClick={addTodo} disabled={operationLoading || !newTodo.trim()}>
          {operationLoading ? '添加中...' : '添加'}
        </button>
      </div>

      {pageLoading && todos.length === 0 && (
        <div className="loading">加载中...</div>
      )}

      <ul className="todo-list">
        {todos.map(todo => (
          <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
              disabled={operationLoading}
            />
            <span>{todo.text}</span>
            <button
              onClick={() => deleteTodo(todo.id)}
              disabled={operationLoading}
              className="delete-btn"
            >
              删除
            </button>
          </li>
        ))}
      </ul>

      {todos.length === 0 && !pageLoading && (
        <div className="empty-state">
          暂无任务，添加一个吧！
        </div>
      )}
    </div>
  );
};

export default TodoAppOffline; 
const CACHE_NAME = 'todo-cache-v2';
const DB_NAME = 'TodoOfflineDB';
const DB_VERSION = 1;
const TODO_STORE = 'todos';
const SYNC_QUEUE_STORE = 'syncQueue';

let db;

// 初始化 IndexedDB
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 创建 todos 存储
      if (!db.objectStoreNames.contains(TODO_STORE)) {
        const todoStore = db.createObjectStore(TODO_STORE, { keyPath: 'id' });
        todoStore.createIndex('id', 'id', { unique: true });
        todoStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // 创建同步队列存储
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        const syncStore = db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('type', 'type', { unique: false });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// 获取数据库连接
async function getDB() {
  if (!db) {
    await initDB();
  }
  return db;
}

// 保存 todos 到 IndexedDB
async function saveTodosToDB(todos) {
  const db = await getDB();
  const transaction = db.transaction([TODO_STORE], 'readwrite');
  const store = transaction.objectStore(TODO_STORE);

  // 清空现有数据
  await store.clear();

  // 添加新数据
  for (const todo of todos) {
    await store.add({
      ...todo,
      updatedAt: new Date().toISOString()
    });
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// 从 IndexedDB 获取 todos
async function getTodosFromDB() {
  const db = await getDB();
  const transaction = db.transaction([TODO_STORE], 'readonly');
  const store = transaction.objectStore(TODO_STORE);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// 添加同步任务到队列
async function addToSyncQueue(action) {
  const db = await getDB();
  const transaction = db.transaction([SYNC_QUEUE_STORE], 'readwrite');
  const store = transaction.objectStore(SYNC_QUEUE_STORE);

  const syncTask = {
    ...action,
    timestamp: Date.now(),
    retryCount: 0
  };

  await store.add(syncTask);

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// 获取同步队列
async function getSyncQueue() {
  const db = await getDB();
  const transaction = db.transaction([SYNC_QUEUE_STORE], 'readonly');
  const store = transaction.objectStore(SYNC_QUEUE_STORE);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// 清除同步队列中的任务
async function clearSyncTask(id) {
  const db = await getDB();
  const transaction = db.transaction([SYNC_QUEUE_STORE], 'readwrite');
  const store = transaction.objectStore(SYNC_QUEUE_STORE);

  await store.delete(id);

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// 安装 Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker 安装中...');
  self.skipWaiting();
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME),
      initDB()
    ]).then(([cache]) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/src/App.css',
        '/src/main.tsx'
      ]);
    })
  );
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker 激活中...');
  self.clients.claim();
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 处理请求
self.addEventListener('fetch', (event) => {
  // 只处理 GET 请求的缓存策略
  if (event.request.method === 'GET') {
    if (event.request.url.includes('/api/')) {
      event.respondWith(
        fetch(event.request)
          .then(response => {
            // 如果请求成功，缓存响应
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // 如果网络请求失败，尝试从缓存获取
            return caches.match(event.request);
          })
      );
    } else {
      // 其他 GET 请求使用缓存优先策略
      event.respondWith(
        caches.match(event.request).then((response) => {
          return response || fetch(event.request);
        })
      );
    }
  } else {
    // 对于非 GET 请求（POST、PUT、DELETE 等），直接发送到网络
    event.respondWith(fetch(event.request));
  }
});

// 处理消息
self.addEventListener('message', (event) => {
  const data = event.data || {};

  const reply = (payload) => {
    if (event.source && 'postMessage' in event.source) {
      event.source.postMessage(payload);
    } else {
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => client.postMessage(payload));
      });
    }
  };

  switch (data.type) {
    case 'SAVE_TODOS_OFFLINE':
      event.waitUntil(
        saveTodosToDB(data.todos)
          .then(() => {
            reply({ type: 'TODOS_SAVED_OFFLINE', success: true });
          })
          .catch((error) => {
            reply({ type: 'TODOS_SAVED_OFFLINE', success: false, error: error.message });
          })
      );
      break;

    case 'GET_TODOS_OFFLINE':
      event.waitUntil(
        getTodosFromDB()
          .then((todos) => {
            reply({ type: 'TODOS_LOADED_OFFLINE', todos });
          })
          .catch((error) => {
            reply({ type: 'TODOS_LOADED_OFFLINE', todos: [], error: error.message });
          })
      );
      break;

    case 'ADD_SYNC_TASK':
      event.waitUntil(
        addToSyncQueue(data.action)
          .then(() => {
            reply({ type: 'SYNC_TASK_ADDED', success: true });
          })
          .catch((error) => {
            reply({ type: 'SYNC_TASK_ADDED', success: false, error: error.message });
          })
      );
      break;

    case 'GET_SYNC_QUEUE':
      event.waitUntil(
        getSyncQueue()
          .then((queue) => {
            reply({ type: 'SYNC_QUEUE_LOADED', queue });
          })
          .catch((error) => {
            reply({ type: 'SYNC_QUEUE_LOADED', queue: [], error: error.message });
          })
      );
      break;

    case 'CLEAR_SYNC_TASK':
      event.waitUntil(
        clearSyncTask(data.id)
          .then(() => {
            reply({ type: 'SYNC_TASK_CLEARED', success: true });
          })
          .catch((error) => {
            reply({ type: 'SYNC_TASK_CLEARED', success: false, error: error.message });
          })
      );
      break;

    case 'CHECK_NETWORK_STATUS':
      // 简单的网络状态检查
      const isOnline = navigator.onLine;
      reply({ type: 'NETWORK_STATUS', isOnline });
      break;
  }
});

// 监听网络状态变化
self.addEventListener('online', () => {
  console.log('网络已连接，开始同步离线数据...');
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'NETWORK_ONLINE' });
    });
  });
});

self.addEventListener('offline', () => {
  console.log('网络已断开，切换到离线模式...');
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'NETWORK_OFFLINE' });
    });
  });
});
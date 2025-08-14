const CACHE_NAME = 'todo-cache-v1';
const TODO_STORE = 'todos';

// 安装 Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
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
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
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

  if (data.type === 'SAVE_TODOS') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => cache.put(
          new Request(TODO_STORE),
          new Response(JSON.stringify(data.todos))
        ))
        .then(() => {
          reply({ type: 'TODOS_SAVED' });
        })
    );
  } else if (data.type === 'GET_TODOS') {
    event.waitUntil(
      caches.match(TODO_STORE)
        .then((response) => response ? response.json() : [])
        .then((todos) => {
          reply({ type: 'TODOS_LOADED', todos });
        })
    );
  } else if (data.type === 'DELETE_TODO') {
    const { id } = data;
    event.waitUntil(
      caches.match(TODO_STORE)
        .then((response) => response ? response.json() : [])
        .then((todos) => {
          const updated = Array.isArray(todos) ? todos.filter((t) => t.id !== id) : [];
          return caches.open(CACHE_NAME)
            .then((cache) => cache.put(
              new Request(TODO_STORE),
              new Response(JSON.stringify(updated))
            ))
            .then(() => updated);
        })
        .then((updated) => {
          reply({ type: 'TODO_DELETED', id, todos: updated });
        })
    );
  }
});
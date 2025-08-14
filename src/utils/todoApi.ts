export interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const SW_URL = '/sw.js';

async function ensureSWReady(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('当前环境不支持 Service Worker');
  }
  if (!navigator.serviceWorker.controller) {
    try {
      await navigator.serviceWorker.register(SW_URL);
    } catch {
      // 忽略注册错误，继续等待 ready
    }
  }
  const reg = await navigator.serviceWorker.ready;

  if (!navigator.serviceWorker.controller) {
    await new Promise<void>((resolve) => {
      const onCtrl = () => {
        navigator.serviceWorker.removeEventListener('controllerchange', onCtrl);
        resolve();
      };
      navigator.serviceWorker.addEventListener('controllerchange', onCtrl);
      setTimeout(() => {
        navigator.serviceWorker.removeEventListener('controllerchange', onCtrl);
        resolve();
      }, 3000);
    });
  }

  return reg;
}

function waitForMessage<T = unknown>(type: string, timeout = 5000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      navigator.serviceWorker.removeEventListener('message', onMessage);
      reject(new Error(`等待消息超时: ${type}`));
    }, timeout);

    function onMessage(event: MessageEvent) {
      if (event.data && event.data.type === type) {
        clearTimeout(timer);
        navigator.serviceWorker.removeEventListener('message', onMessage);
        resolve(event.data as T);
      }
    }

    navigator.serviceWorker.addEventListener('message', onMessage);
  });
}

async function postMessageAndWait<T = unknown>(message: Record<string, unknown>, waitType: string): Promise<T> {
  const reg = await ensureSWReady();
  const target = navigator.serviceWorker.controller || reg.active;
  target?.postMessage(message);
  return await waitForMessage<T>(waitType);
}

export async function getTodos(): Promise<Todo[]> {
  const data = await postMessageAndWait<{ type: string; todos: Todo[] }>(
    { type: 'GET_TODOS' },
    'TODOS_LOADED'
  );
  return data.todos || [];
}

export async function saveTodos(todos: Todo[]): Promise<void> {
  await postMessageAndWait<{ type: string }>(
    { type: 'SAVE_TODOS', todos },
    'TODOS_SAVED'
  );
}

export async function deleteTodo(id: number): Promise<Todo[]> {
  const data = await postMessageAndWait<{ type: string; id: number; todos: Todo[] }>(
    { type: 'DELETE_TODO', id },
    'TODO_DELETED'
  );
  return data.todos || [];
}

export default { getTodos, saveTodos, deleteTodo };
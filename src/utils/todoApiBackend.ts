export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
}

const API_BASE_URL = 'http://localhost:3001/api';

// 通用请求函数
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : '网络请求失败');
  }
}

// 获取所有todos
export async function getTodos(): Promise<Todo[]> {
  const response = await apiRequest<Todo[]>('/todos');
  return response.data;
}

// 新增todo
export async function createTodo(text: string): Promise<Todo> {
  const response = await apiRequest<Todo>('/todos', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  return response.data;
}

// 更新todo
export async function updateTodo(id: number, updates: Partial<Todo>): Promise<Todo> {
  const response = await apiRequest<Todo>(`/todos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return response.data;
}

// 删除todo
export async function deleteTodo(id: number): Promise<Todo> {
  const response = await apiRequest<Todo>(`/todos/${id}`, {
    method: 'DELETE',
  });
  return response.data;
}

// 批量同步todos
export async function syncTodos(todos: Todo[]): Promise<Todo[]> {
  const response = await apiRequest<Todo[]>('/todos/sync', {
    method: 'POST',
    body: JSON.stringify({ todos }),
  });
  return response.data;
}

// 切换todo完成状态
export async function toggleTodo(id: number, completed: boolean): Promise<Todo> {
  return updateTodo(id, { completed });
}

// 健康检查
export async function healthCheck(): Promise<{ success: boolean; message: string }> {
  const response = await apiRequest<{ success: boolean; message: string }>('/health');
  return response;
}

export default {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  syncTodos,
  toggleTodo,
  healthCheck,
}; 
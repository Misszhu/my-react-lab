import { useState, useEffect } from 'react';
import './TodoApp.css';
import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo as deleteTodoApi
} from '../utils/todoApiBackend';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const TodoApp = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初始化加载
  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTodos();
      setTodos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
      console.error('加载todos失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 添加
  const addTodo = async () => {
    if (newTodo.trim()) {
      try {
        setLoading(true);
        setError(null);
        const newTodoItem = await createTodo(newTodo.trim());
        setTodos(prev => [...prev, newTodoItem]);
        setNewTodo('');
      } catch (err) {
        setError(err instanceof Error ? err.message : '添加失败');
        console.error('添加todo失败:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  // 切换完成状态
  const toggleTodo = async (id: number) => {
    try {
      setError(null);
      const todo = todos.find(t => t.id === id);
      if (todo) {
        const updatedTodo = await updateTodo(id, { completed: !todo.completed });
        setTodos(prev => prev.map(t => t.id === id ? updatedTodo : t));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
      console.error('更新todo失败:', err);
    }
  };

  // 删除
  const deleteTodo = async (id: number) => {
    try {
      setError(null);
      await deleteTodoApi(id);
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
      console.error('删除todo失败:', err);
    }
  };

  return (
    <div className="todo-container">
      <h2>Todo List</h2>

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
          disabled={loading}
        />
        <button onClick={addTodo} disabled={loading || !newTodo.trim()}>
          {loading ? '添加中...' : '添加'}
        </button>
      </div>

      {loading && todos.length === 0 && (
        <div className="loading">加载中...</div>
      )}

      <ul className="todo-list">
        {todos.map(todo => (
          <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
              disabled={loading}
            />
            <span>{todo.text}</span>
            <button
              onClick={() => deleteTodo(todo.id)}
              disabled={loading}
              className="delete-btn"
            >
              删除
            </button>
          </li>
        ))}
      </ul>

      {todos.length === 0 && !loading && (
        <div className="empty-state">
          暂无任务，添加一个吧！
        </div>
      )}
    </div>
  );
};

export default TodoApp; 
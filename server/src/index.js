const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../dist')));

// 内存存储todos (生产环境建议使用数据库)
let todos = [
  { id: 1, text: '学习React', completed: false },
  { id: 2, text: '写代码', completed: true }
];

// 获取所有todos
app.get('/api/todos', (req, res) => {
  try {
    res.json({
      success: true,
      data: todos,
      message: '获取成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取失败',
      error: error.message
    });
  }
});

// 新增todo
app.post('/api/todos', (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '任务内容不能为空'
      });
    }

    const newTodo = {
      id: Date.now(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };

    todos.push(newTodo);

    res.status(201).json({
      success: true,
      data: newTodo,
      message: '创建成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建失败',
      error: error.message
    });
  }
});

// 更新todo (包括切换完成状态)
app.put('/api/todos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { text, completed } = req.body;

    const todoIndex = todos.findIndex(todo => todo.id === parseInt(id));

    if (todoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    // 更新字段
    if (text !== undefined) {
      todos[todoIndex].text = text.trim();
    }
    if (completed !== undefined) {
      todos[todoIndex].completed = completed;
    }

    todos[todoIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      data: todos[todoIndex],
      message: '更新成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新失败',
      error: error.message
    });
  }
});

// 删除todo
app.delete('/api/todos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const todoIndex = todos.findIndex(todo => todo.id === parseInt(id));

    if (todoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    const deletedTodo = todos.splice(todoIndex, 1)[0];

    res.json({
      success: true,
      data: deletedTodo,
      message: '删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除失败',
      error: error.message
    });
  }
});

// 批量保存todos (用于同步)
app.post('/api/todos/sync', (req, res) => {
  try {
    const { todos: newTodos } = req.body;

    if (!Array.isArray(newTodos)) {
      return res.status(400).json({
        success: false,
        message: '数据格式错误'
      });
    }

    todos = newTodos.map(todo => ({
      ...todo,
      updatedAt: new Date().toISOString()
    }));

    res.json({
      success: true,
      data: todos,
      message: '同步成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '同步失败',
      error: error.message
    });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务器运行正常',
    timestamp: new Date().toISOString()
  });
});

// 处理前端路由 (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📝 API文档: http://localhost:${PORT}/api/health`);
  console.log(`🌐 前端页面: http://localhost:${PORT}`);
});

module.exports = app; 
# Todo List API 接口文档

## 启动后端服务器

```bash
# 安装依赖
npm install

# 启动后端服务器 (端口3001)
npm run server

# 或者同时启动前端和后端
npm run dev:full
```

## API 接口列表

### 基础信息

- **基础 URL**: `http://localhost:3001/api`
- **数据格式**: JSON
- **响应格式**:

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

### 1. 获取所有 todos

- **接口**: `GET /api/todos`
- **描述**: 获取所有 todo 项目
- **响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "text": "学习React",
      "completed": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "获取成功"
}
```

### 2. 新增 todo

- **接口**: `POST /api/todos`
- **请求体**:

```json
{
  "text": "新任务内容"
}
```

- **响应示例**:

```json
{
  "success": true,
  "data": {
    "id": 1704067200000,
    "text": "新任务内容",
    "completed": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "创建成功"
}
```

### 3. 更新 todo

- **接口**: `PUT /api/todos/:id`
- **参数**: `id` - todo 的 ID
- **请求体**:

```json
{
  "text": "更新后的内容",
  "completed": true
}
```

- **响应示例**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "text": "更新后的内容",
    "completed": true,
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "更新成功"
}
```

### 4. 删除 todo

- **接口**: `DELETE /api/todos/:id`
- **参数**: `id` - todo 的 ID
- **响应示例**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "text": "被删除的任务",
    "completed": false
  },
  "message": "删除成功"
}
```

### 5. 批量同步 todos

- **接口**: `POST /api/todos/sync`
- **请求体**:

```json
{
  "todos": [
    {
      "id": 1,
      "text": "任务1",
      "completed": false
    }
  ]
}
```

### 6. 健康检查

- **接口**: `GET /api/health`
- **描述**: 检查服务器状态
- **响应示例**:

```json
{
  "success": true,
  "message": "服务器运行正常",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 前端使用示例

```typescript
import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} from "./utils/todoApiBackend";

// 获取所有todos
const todos = await getTodos();

// 创建新todo
const newTodo = await createTodo("新任务");

// 更新todo
const updatedTodo = await updateTodo(1, { completed: true });

// 删除todo
const deletedTodo = await deleteTodo(1);
```

## 错误处理

所有接口都包含错误处理，错误响应格式：

```json
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息"
}
```

常见 HTTP 状态码：

- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `404` - 资源不存在
- `500` - 服务器内部错误

## 注意事项

1. 当前使用内存存储，重启服务器后数据会丢失
2. 生产环境建议使用数据库存储
3. 所有时间字段使用 ISO 8601 格式
4. ID 使用时间戳生成，确保唯一性

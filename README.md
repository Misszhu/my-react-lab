# Todo List 全栈应用

这是一个使用 React + Express 构建的 Todo List 应用，包含完整的前后端功能。

## 🏗️ 项目结构

```
my-react-lab/
├── src/                    # 前端 React 代码
│   ├── components/         # React 组件
│   ├── utils/             # 工具函数和API
│   └── ...
├── server/                 # 后端 Express 服务器
│   ├── src/               # 服务端源代码
│   │   └── index.js       # 主服务器文件
│   └── package.json       # 服务端依赖配置
├── public/                 # 静态资源
├── package.json            # 前端依赖配置
└── README.md              # 项目说明
```

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装服务端依赖
npm run install:server
```

### 2. 启动应用

#### 方式一：同时启动前后端（推荐）

```bash
npm run dev:full
```

#### 方式二：分别启动

```bash
# 终端1：启动后端服务器
npm run server:dev

# 终端2：启动前端开发服务器
npm run dev
```

#### 方式三：只启动后端

```bash
npm run server
```

### 3. 访问应用

- **前端页面**: http://localhost:5173
- **后端 API**: http://localhost:3001
- **API 文档**: http://localhost:3001/api/health

## 📋 可用命令

```bash
# 前端开发
npm run dev              # 启动前端开发服务器
npm run build            # 构建生产版本
npm run preview          # 预览构建结果
npm run lint             # 代码检查

# 后端服务
npm run server           # 启动后端服务器
npm run server:dev       # 启动后端开发模式（支持热重载）
npm run install:server   # 安装服务端依赖

# 全栈开发
npm run dev:full         # 同时启动前后端
```

## 🔧 技术栈

### 前端

- **React 19** - 用户界面框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **CSS3** - 样式设计

### 后端

- **Node.js** - 运行环境
- **Express** - Web 框架
- **CORS** - 跨域支持

## 📡 API 接口

### 基础信息

- **基础 URL**: `http://localhost:3001/api`
- **数据格式**: JSON

### 接口列表

1. `GET /api/todos` - 获取所有 todos
2. `POST /api/todos` - 新增 todo
3. `PUT /api/todos/:id` - 更新 todo
4. `DELETE /api/todos/:id` - 删除 todo
5. `POST /api/todos/sync` - 批量同步
6. `GET /api/health` - 健康检查

详细 API 文档请参考 [API_README.md](./API_README.md)

## 🌟 特性

- ✅ 完整的 CRUD 操作
- ✅ 实时状态管理
- ✅ 错误处理和用户反馈
- ✅ 响应式设计
- ✅ TypeScript 支持
- ✅ 开发环境热重载
- ✅ 前后端分离架构

## 📝 开发说明

### 前端开发

- 修改 `src/` 目录下的文件
- 支持热重载，保存后自动刷新

### 后端开发

- 修改 `server/src/` 目录下的文件
- 使用 `npm run server:dev` 启动开发模式，支持热重载

### 数据存储

- 当前使用内存存储（开发环境）
- 生产环境建议使用数据库

## 🚨 注意事项

1. **Node.js 版本**: 建议使用 Node.js 16+ 版本
2. **端口配置**: 前端默认 5173，后端默认 3001
3. **数据持久化**: 重启服务器后内存数据会丢失
4. **环境变量**: 可通过 `.env` 文件配置环境变量

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## �� 许可证

MIT License

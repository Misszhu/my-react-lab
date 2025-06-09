import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import EventBusExample from './components/EventBusExample'
import RouterDemo from './components/RouterDemo'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="nav-container">
          <div className="nav-content">
            <ul className="nav-list">
              <li>
                <Link
                  to="/"
                  className="nav-link nav-link-home"
                >
                  首页
                </Link>
              </li>
              <li>
                <Link
                  to="/event-bus"
                  className="nav-link nav-link-eventbus"
                >
                  EventBus 示例
                </Link>
              </li>
              <li>
                <Link
                  to="/router-demo"
                  className="nav-link nav-link-router"
                >
                  路由示例
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={
            <div className="main-container">
              <div className="welcome-card">
                <h1 className="welcome-title">
                  欢迎来到示例页面
                </h1>
                <div>
                  <p className="welcome-description">
                    这是一个展示 React 核心功能的示例项目，包含了 EventBus 和路由的实践示例。
                  </p>
                  <div className="features-grid">
                    <div className="feature-card feature-card-eventbus">
                      <h2 className="feature-title feature-title-eventbus">EventBus 示例</h2>
                      <p className="feature-description">
                        展示了如何使用事件总线进行组件间通信，实现解耦的消息传递机制。
                      </p>
                    </div>
                    <div className="feature-card feature-card-router">
                      <h2 className="feature-title feature-title-router">路由示例</h2>
                      <p className="feature-description">
                        展示了 React Router 的基本用法，包括路由配置和导航功能。
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="explore-text">
                      点击上方导航栏的按钮开始探索
                    </p>
                  </div>
                </div>
              </div>
            </div>
          } />
          <Route path="/event-bus" element={<EventBusExample />} />
          <Route path="/router-demo" element={<RouterDemo />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

import { useEffect, useRef } from 'react';
import { HashRouter, HistoryRouter } from '../router';
import type { Route } from '../router';

const RouterDemo = () => {
  const hashRootRef = useRef<HTMLDivElement>(null);
  const historyRootRef = useRef<HTMLDivElement>(null);

  // 定义路由配置
  const routes: Route[] = [
    {
      path: '/',
      component: () => {
        const div = document.createElement('div');
        div.innerHTML = '<h2>首页</h2><p>这是首页内容</p>';
        return div;
      }
    },
    {
      path: '/about',
      component: () => {
        const div = document.createElement('div');
        div.innerHTML = '<h2>关于</h2><p>这是关于页面</p>';
        return div;
      }
    },
    {
      path: '/contact',
      component: () => {
        const div = document.createElement('div');
        div.innerHTML = '<h2>联系我们</h2><p>这是联系页面</p>';
        return div;
      }
    }
  ];

  useEffect(() => {
    if (hashRootRef.current && historyRootRef.current) {
      // 初始化 Hash 路由
      const hashRouter = new HashRouter(routes, hashRootRef.current);

      // 初始化 History 路由
      const historyRouter = new HistoryRouter(routes, historyRootRef.current);

      // 添加导航按钮
      const addNavigationButtons = (container: HTMLElement, router: HashRouter | HistoryRouter) => {
        const nav = document.createElement('div');
        nav.style.marginBottom = '1rem';

        routes.forEach(route => {
          const button = document.createElement('button');
          button.textContent = route.path;
          button.style.marginRight = '0.5rem';
          button.onclick = () => router.push(route.path);
          nav.appendChild(button);
        });

        container.insertBefore(nav, container.firstChild);
      };

      addNavigationButtons(hashRootRef.current, hashRouter);
      addNavigationButtons(historyRootRef.current, historyRouter);
    }
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>路由演示</h1>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Hash Router</h2>
        <div ref={hashRootRef} style={{ border: '1px solid #ccc', padding: '1rem' }} />
      </div>

      <div>
        <h2>History Router</h2>
        <div ref={historyRootRef} style={{ border: '1px solid #ccc', padding: '1rem' }} />
      </div>
    </div>
  );
};

export default RouterDemo; 
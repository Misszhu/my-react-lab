// 路由类型
export interface Route {
  path: string;
  component: () => HTMLElement;
}

// 基础路由类
export class BaseRouter {
  protected routes: Route[];
  protected root: HTMLElement;

  constructor(routes: Route[], root: HTMLElement) {
    this.routes = routes;
    this.root = root;
  }

  // 渲染组件
  protected render(path: string) {
    const route = this.routes.find(route => route.path === path);
    if (route) {
      this.root.innerHTML = '';
      this.root.appendChild(route.component());
    }
  }
} 
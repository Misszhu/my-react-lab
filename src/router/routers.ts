import { BaseRouter } from './BaseRouter';
import type { Route } from './BaseRouter';

export class HashRouter extends BaseRouter {
  constructor(routes: Route[], root: HTMLElement) {
    super(routes, root);
    this.init();
  }

  private init() {
    // 监听 hashchange 事件
    window.addEventListener('hashchange', this.handleRoute.bind(this));
    // 初始加载
    this.handleRoute();
  }

  private handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    this.render(hash);
  }

  // 跳转方法
  push(path: string) {
    window.location.hash = path;
  }

  // 替换当前路由
  replace(path: string) {
    window.location.replace(`#${path}`);
  }

  // 返回上一页
  back() {
    window.history.back();
  }

  // 前进
  forward() {
    window.history.forward();
  }
}

export class HistoryRouter extends BaseRouter {
  constructor(routes: Route[], root: HTMLElement) {
    super(routes, root);
    this.init();
  }

  private init() {
    // 监听 popstate 事件
    window.addEventListener('popstate', this.handleRoute.bind(this));
    // 初始加载
    this.handleRoute();
  }

  private handleRoute() {
    const path = window.location.pathname;
    this.render(path);
  }

  // 跳转方法
  push(path: string) {
    window.history.pushState(null, '', path);
    this.handleRoute();
  }

  // 替换当前路由
  replace(path: string) {
    window.history.replaceState(null, '', path);
    this.handleRoute();
  }

  // 返回上一页
  back() {
    window.history.back();
  }

  // 前进
  forward() {
    window.history.forward();
  }
} 
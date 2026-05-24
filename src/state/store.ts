/**
 * 轻量状态管理 / Lightweight State Management
 *
 * 发布-订阅模式，支持类型安全的泛型访问
 * Pub-sub pattern with type-safe generic access
 *
 * @module state/store
 */

type Listener<T = any> = (value: T, old: T) => void;

interface AppStateShape {
  algorithms: string[];
  files: File[];
  results: any[];
  isCalculating: boolean;
  currentProgress: any;
  theme: string;
  language: string;
  currentPage: string;
  // 运行时计算状态 / Runtime calculation state
  calcStartTime: number;
  chunkLabel: string;
  chunkMode: string;
}

const _state: AppStateShape = {
  algorithms: [],
  files: [],
  results: [],
  isCalculating: false,
  currentProgress: null,
  theme: 'system',
  language: 'auto',
  currentPage: 'calculate',
  calcStartTime: 0,
  chunkLabel: '',
  chunkMode: 'auto',
};

const _listeners = new Map<string, Set<Listener<any>>>();

export const AppState = {
  /** Get state value (type-safe) */
  get<K extends keyof AppStateShape>(key: K): AppStateShape[K] {
    return _state[key];
  },

  /** Set state value and notify listeners */
  set<K extends keyof AppStateShape>(key: K, value: AppStateShape[K]) {
    const old = _state[key];
    _state[key] = value;
    _listeners.get(key)?.forEach((cb) => {
      try { cb(value, old); } catch (e) { console.error('State listener error:', e); }
    });
  },

  /** Subscribe to state changes, returns unsubscribe function */
  on<K extends keyof AppStateShape>(key: K, callback: Listener<AppStateShape[K]>) {
    if (!_listeners.has(key)) _listeners.set(key, new Set());
    _listeners.get(key)!.add(callback as Listener<any>);
    return () => { _listeners.get(key)?.delete(callback as Listener<any>); };
  },
};

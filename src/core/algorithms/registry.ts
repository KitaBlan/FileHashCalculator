/**
 * 算法注册表 / Algorithm Registry
 *
 * 统一管理所有哈希算法的注册和查询
 * Unified management for all hash algorithm registration and queries
 *
 * @module core/algorithms/registry
 */

export interface AlgorithmConfig {
  source: 'pure-js' | 'web-crypto' | 'noble';
  category: 'legacy' | 'standard' | 'modern' | 'fast';
  blockSize: number;
  hashSize: number;
  hexLength: number;
  hmac: boolean;
  nonStandard?: boolean;
  init: () => any;
  update: (state: any, data: Uint8Array) => void;
  final: (state: any) => Uint8Array;
}

const registry = new Map<string, AlgorithmConfig>();

export function registerAlgorithm(name: string, config: AlgorithmConfig) {
  registry.set(name, config);
}

export function getAlgorithm(name: string): AlgorithmConfig | undefined {
  return registry.get(name);
}

export function getByCategory(category: string) {
  return [...registry.entries()].filter(([, cfg]) => cfg.category === category).map(([name, cfg]) => ({ name, ...cfg }));
}

export function getByHexLength(length: number) {
  return [...registry.entries()].filter(([, cfg]) => cfg.hexLength === length && cfg.category !== 'fast').map(([name]) => name);
}

export function getAll() {
  return [...registry.entries()].map(([name, cfg]) => ({ name, ...cfg }));
}

export function getCategories() {
  return [...new Set([...registry.values()].map((c) => c.category))];
}

export function createHashInstance(name: string) {
  const cfg = registry.get(name);
  if (!cfg) throw new Error(`Unsupported algorithm: ${name}`);
  return { state: cfg.init(), update: cfg.update.bind(cfg), final: cfg.final.bind(cfg) };
}

export const Registry = { register: registerAlgorithm, get: getAlgorithm, getByCategory, getByHexLength, getAll, getCategories, createInstance: createHashInstance };

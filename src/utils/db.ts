/**
 * IndexedDB 封装 / IndexedDB Wrapper
 *
 * 历史记录持久化存储 / History persistent storage
 *
 * @module utils/db
 */

const DB_NAME = 'FileHashCalculator';
const DB_VERSION = 1;
const STORE_NAME = 'history';

let _db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    request.onsuccess = (e) => { _db = (e.target as IDBOpenDBRequest).result; resolve(_db); };
    request.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
}

export const DB = {
  async add(record: any) {
    const db = await openDB();
    return new Promise<number>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const entry = { ...record, timestamp: Date.now() };
      const req = store.add(entry);
      req.onsuccess = () => resolve(req.result as number);
      req.onerror = () => reject(req.error);
    });
  },

  async getAll(limit = 100) {
    const db = await openDB();
    return new Promise<any[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const results: any[] = [];
      const req = index.openCursor(null, 'prev');
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result;
        if (cursor && results.length < limit) { results.push(cursor.value); cursor.continue(); }
        else resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async search(query: string) {
    const all = await this.getAll(500);
    const q = query.toLowerCase();
    return all.filter((r: any) =>
      r.filename?.toLowerCase().includes(q) ||
      Object.values(r.hashValues || {}).some((h: any) => String(h).toLowerCase().includes(q)),
    );
  },

  async clear() {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  /** Clean up expired and excess records using timestamp index */
  async cleanup(retentionDays = 30, maxRecords = 500) {
    const db = await openDB();
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

    // Delete expired records via timestamp index
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const range = IDBKeyRange.upperBound(cutoff);
      const cursorReq = index.openCursor(range);
      cursorReq.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result;
        if (cursor) { cursor.delete(); cursor.continue(); }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // Delete oldest records if over maxRecords
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const countReq = store.count();
      countReq.onsuccess = () => {
        const excess = countReq.result - maxRecords;
        if (excess <= 0) { resolve(); return; }
        const index = store.index('timestamp');
        let deleted = 0;
        const cursorReq = index.openCursor(null, 'next');
        cursorReq.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest).result;
          if (cursor && deleted < excess) { cursor.delete(); deleted++; cursor.continue(); }
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      countReq.onerror = () => reject(countReq.error);
    });
  },
};

/**
 * ApiService — IndexedDB storage layer
 * Replaces the MongoDB/Express backend entirely.
 * All data is stored locally in the browser's IndexedDB, permanently.
 */

const DB_NAME    = 'TradeVaultDB';
const DB_VERSION = 1;
const STORE_NAME = 'trades';

// ─── DB Init ──────────────────────────────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Use auto-incremented numeric key stored as 'id' on each record
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('coin', 'coin', { unique: false });
      }
    };

    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getAllRecords(db) {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req   = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function getRecord(db, id) {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req   = store.get(Number(id));
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function putRecord(db, record) {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req   = store.put(record);
    req.onsuccess = () => resolve({ ...record, id: req.result });
    req.onerror   = () => reject(req.error);
  });
}

function deleteRecord(db, id) {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req   = store.delete(Number(id));
    req.onsuccess = () => resolve({ success: true });
    req.onerror   = () => reject(req.error);
  });
}

// ─── Sort helper ──────────────────────────────────────────────────────────────
function applySort(trades, sortBy = 'date', sortOrder = 'desc') {
  return [...trades].sort((a, b) => {
    let valA, valB;
    if (sortBy === 'pnl') {
      valA = a.pnl;
      valB = b.pnl;
    } else {
      valA = new Date(a.date).getTime();
      valB = new Date(b.date).getTime();
    }
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });
}

// ─── Public API (mirrors the old REST ApiService exactly) ────────────────────
const ApiService = {

  async getTrades(filters = {}) {
    const db     = await openDB();
    let trades   = await getAllRecords(db);

    // Filter by coin (partial match, case-insensitive)
    if (filters.coin) {
      const q = filters.coin.trim().toLowerCase();
      trades = trades.filter(t => t.coin && t.coin.toLowerCase().includes(q));
    }

    // Filter by type
    if (filters.type) {
      trades = trades.filter(t => t.type === filters.type);
    }

    // Sort
    trades = applySort(trades, filters.sortBy || 'date', filters.sortOrder || 'desc');

    return trades;
  },

  async getTrade(id) {
    const db    = await openDB();
    const trade = await getRecord(db, id);
    if (!trade) throw new Error('Trade not found');
    return trade;
  },

  async createTrade(data) {
    const db      = await openDB();
    // Store date as ISO string, same as MongoDB did
    const record  = { ...data, date: data.date || new Date().toISOString(), createdAt: new Date().toISOString() };
    const saved   = await putRecord(db, record);
    return saved;
  },

  async updateTrade(id, data) {
    const db      = await openDB();
    const existing = await getRecord(db, id);
    if (!existing) throw new Error('Trade not found');
    const updated = { ...existing, ...data, id: Number(id), updatedAt: new Date().toISOString() };
    const saved   = await putRecord(db, updated);
    return saved;
  },

  async deleteTrade(id) {
    const db = await openDB();
    return deleteRecord(db, id);
  }
};

/**
 * ApiService — Firebase Firestore storage layer
 * Replaces IndexedDB. All trades sync across every device in real-time.
 * No server needed — Firestore is called directly from the browser.
 */

const _db         = firebase.firestore();
const COLLECTION  = 'trades';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function docToTrade(doc) {
  return { id: doc.id, ...doc.data() };
}

// ─── Public API (same interface as before — app.js needs zero changes) ────────
const ApiService = {

  async getTrades(filters = {}) {
    const sortBy    = filters.sortBy    || 'date';
    const sortOrder = filters.sortOrder || 'desc';

    let query = _db.collection(COLLECTION);

    // Server-side type filter
    if (filters.type) {
      query = query.where('type', '==', filters.type);
    }

    // Server-side sorting (Firestore requires index for multi-field queries)
    if (sortBy === 'pnl') {
      query = query.orderBy('pnl', sortOrder);
    } else {
      query = query.orderBy('date', sortOrder);
    }

    const snapshot = await query.get();
    let trades = snapshot.docs.map(docToTrade);

    // Client-side coin search (Firestore doesn't support LIKE/contains)
    if (filters.coin && filters.coin.trim() !== '') {
      const q = filters.coin.trim().toLowerCase();
      trades = trades.filter(t => t.coin && t.coin.toLowerCase().includes(q));
    }

    return trades;
  },

  async getTrade(id) {
    const doc = await _db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) throw new Error('Trade not found');
    return docToTrade(doc);
  },

  async createTrade(data) {
    const record = {
      ...data,
      date:      data.date || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    const ref = await _db.collection(COLLECTION).add(record);
    return { id: ref.id, ...record };
  },

  async updateTrade(id, data) {
    const update = { ...data, updatedAt: new Date().toISOString() };
    await _db.collection(COLLECTION).doc(id).update(update);
    return { id, ...update };
  },

  async deleteTrade(id) {
    await _db.collection(COLLECTION).doc(id).delete();
    return { success: true };
  }
};

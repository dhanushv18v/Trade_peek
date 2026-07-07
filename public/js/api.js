/**
 * Client-side API service for the CoinDCX INR Futures Journal
 */
const API_BASE = '/api/trades';

const ApiService = {
  async getTrades(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, v);
    });
    const url = params.toString() ? `${API_BASE}?${params}` : API_BASE;
    const res = await fetch(url);
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed to load trades'); }
    return res.json();
  },

  async getTrade(id) {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Trade not found'); }
    return res.json();
  },

  async createTrade(data) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed to create trade'); }
    return res.json();
  },

  async updateTrade(id, data) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed to update trade'); }
    return res.json();
  },

  async deleteTrade(id) {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed to delete trade'); }
    return res.json();
  }
};

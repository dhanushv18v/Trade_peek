const mongoose = require('mongoose');
const Trade = require('../models/Trade');

// In-memory trade store fallback (starts empty — no demo data)
let memoryTrades = [];

function isConnected() {
  return mongoose.connection.readyState === 1;
}

const TradeService = {
  async getTrades(filters = {}) {
    if (isConnected()) {
      let query = {};
      if (filters.type && filters.type !== 'All') query.type = filters.type;
      if (filters.coin) query.coin = new RegExp(filters.coin.trim(), 'i');

      let sort = { date: -1 };
      if (filters.sortBy === 'date' && filters.sortOrder === 'asc') sort = { date: 1 };
      if (filters.sortBy === 'pnl') sort = { pnl: filters.sortOrder === 'asc' ? 1 : -1 };

      const trades = await Trade.find(query).sort(sort).lean();
      return trades;
    }

    // In-memory filter
    let trades = [...memoryTrades];

    if (filters.type && filters.type !== 'All') {
      trades = trades.filter(t => t.type === filters.type);
    }
    if (filters.coin) {
      const search = filters.coin.toLowerCase().trim();
      trades = trades.filter(t => t.coin.toLowerCase().includes(search));
    }

    // Sort
    const field = filters.sortBy || 'date';
    const sortOrder = filters.sortOrder || 'desc';

    trades.sort((a, b) => {
      let valA = a[field];
      let valB = b[field];
      if (field === 'date') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return trades;
  },

  async getTrade(id) {
    if (isConnected()) {
      const trade = await Trade.findById(id).lean();
      if (!trade) throw new Error('Trade not found.');
      return trade;
    }
    const trade = memoryTrades.find(t => t._id === id);
    if (!trade) throw new Error('Trade not found.');
    return trade;
  },

  async createTrade(data) {
    if (isConnected()) {
      const trade = new Trade({
        date: data.date ? new Date(data.date) : new Date(),
        coin: data.coin ? data.coin.toUpperCase().trim() : 'UNKNOWN',
        pnl: Number(data.pnl),
        type: data.type || 'Trade',
        notes: data.notes || ''
      });
      const saved = await trade.save();
      return saved.toObject();
    }

    // Validate
    if (!data.coin) throw new Error('Coin name is required');
    if (data.pnl === undefined || data.pnl === null || isNaN(data.pnl)) throw new Error('P&L amount is required');

    const newTrade = {
      _id: 'mem_' + Math.random().toString(36).substr(2, 9),
      date: data.date ? new Date(data.date) : new Date(),
      coin: data.coin.toUpperCase().trim(),
      pnl: Number(data.pnl),
      type: data.type || 'Trade',
      notes: data.notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    memoryTrades.push(newTrade);
    return newTrade;
  },

  async updateTrade(id, data) {
    if (isConnected()) {
      const updateData = {};
      if (data.date !== undefined) updateData.date = new Date(data.date);
      if (data.coin !== undefined) updateData.coin = data.coin.toUpperCase().trim();
      if (data.pnl !== undefined) updateData.pnl = Number(data.pnl);
      if (data.type !== undefined) updateData.type = data.type;
      if (data.notes !== undefined) updateData.notes = data.notes;

      const trade = await Trade.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true, lean: true }
      );
      if (!trade) throw new Error('Trade not found.');
      return trade;
    }

    const index = memoryTrades.findIndex(t => t._id === id);
    if (index === -1) throw new Error('Trade not found.');

    let trade = { ...memoryTrades[index] };
    ['date', 'coin', 'pnl', 'type', 'notes'].forEach(f => {
      if (data[f] !== undefined) trade[f] = data[f];
    });
    trade.coin = trade.coin.toUpperCase().trim();
    trade.pnl = Number(trade.pnl);
    trade.date = new Date(trade.date);
    trade.updatedAt = new Date();
    memoryTrades[index] = trade;
    return trade;
  },

  async deleteTrade(id) {
    if (isConnected()) {
      const trade = await Trade.findByIdAndDelete(id).lean();
      if (!trade) throw new Error('Trade not found.');
      return { message: 'Deleted successfully.' };
    }

    const index = memoryTrades.findIndex(t => t._id === id);
    if (index === -1) throw new Error('Trade not found.');
    memoryTrades.splice(index, 1);
    return { message: 'Deleted successfully.' };
  }
};

module.exports = TradeService;

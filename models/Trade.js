const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  coin: {
    type: String,
    required: [true, 'Coin name is required (e.g. BTC)'],
    trim: true,
    uppercase: true
  },
  pnl: {
    type: Number,
    required: [true, 'P&L amount is required'],
    default: 0
  },
  type: {
    type: String,
    enum: ['Trade', 'Deposit', 'Withdraw'],
    default: 'Trade',
    required: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Trade', tradeSchema);

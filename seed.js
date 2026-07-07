const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crypto-journal';

// Require Trade model
const Trade = require('./models/Trade');

const sampleTrades = [
  {
    date: new Date('2026-06-25T10:30:00'),
    pair: 'BTC/USDT',
    side: 'Long',
    entryPrice: 60000,
    exitPrice: 63000,
    leverage: 20,
    margin: 100,
    fees: 1.50,
    status: 'Closed',
    notes: 'Bullish breakout from ascending triangle on 4H chart. High volume confirm.',
    tags: ['breakout', 'triangle', 'high-vol']
  },
  {
    date: new Date('2026-06-28T14:15:00'),
    pair: 'ETH/USDT',
    side: 'Short',
    entryPrice: 3500,
    exitPrice: 3400,
    leverage: 10,
    margin: 200,
    fees: 2.00,
    status: 'Closed',
    notes: 'Hourly rejection at range high with bearish engulfing pattern.',
    tags: ['range-high', 'engulfing']
  },
  {
    date: new Date('2026-06-30T19:00:00'),
    pair: 'BTC/USDT',
    side: 'Short',
    entryPrice: 64000,
    exitPrice: 65500,
    leverage: 20,
    margin: 150,
    fees: 2.50,
    status: 'Closed',
    notes: 'Attempted to short the breakout deviation, but price squeezed up. Stop loss hit.',
    tags: ['deviation', 'failed-short', 'stop-loss']
  },
  {
    date: new Date('2026-07-02T08:00:00'),
    pair: 'SOL/USDT',
    side: 'Long',
    entryPrice: 110,
    exitPrice: 105,
    leverage: 10,
    margin: 100,
    fees: 0.80,
    status: 'Closed',
    notes: 'Retest of local support. Buyers failed to step in, exit trigger hit.',
    tags: ['support-retest', 'failed-long']
  },
  {
    date: new Date('2026-07-04T12:00:00'),
    pair: 'ETH/USDT',
    side: 'Long',
    entryPrice: 3300,
    exitPrice: 3450,
    leverage: 15,
    margin: 150,
    fees: 1.80,
    status: 'Closed',
    notes: 'FIB 0.618 golden pocket bounce. Bullish divergence on 1H RSI.',
    tags: ['fibonacci', 'divergence', 'rsi']
  },
  {
    date: new Date('2026-07-05T15:30:00'),
    pair: 'SOL/USDT',
    side: 'Long',
    entryPrice: 100,
    leverage: 10,
    margin: 50,
    fees: 0.20,
    status: 'Open',
    notes: 'Psychological support level of $100. Position size is small for building core.',
    tags: ['psy-support', 'swing']
  },
  {
    date: new Date('2026-07-06T09:45:00'),
    pair: 'SOL/USDT',
    side: 'Short',
    entryPrice: 140,
    exitPrice: 132,
    leverage: 10,
    margin: 120,
    fees: 1.20,
    status: 'Closed',
    notes: 'Rejection of key daily resistance at $140. Fast profit taking.',
    tags: ['resistance-rejection', 'scalp']
  }
];

const seedDB = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('DB Connected. Cleaning existing trades...');
    await Trade.deleteMany({});
    
    console.log('Inserting sample trades...');
    for (const tradeData of sampleTrades) {
      const trade = new Trade(tradeData);
      await trade.save();
    }
    
    console.log('Database successfully seeded with 7 trades.');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();

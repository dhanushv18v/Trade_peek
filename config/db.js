const mongoose = require('mongoose');
const dns = require('dns');

// Force Node.js to use Google DNS — fixes querySrv ETIMEOUT on Windows
dns.setServers(['8.8.8.8', '8.8.4.4']);

let isDBConnected = false;

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }

    mongoose.connection.on('connected', () => {
      isDBConnected = true;
      console.log('✅ MongoDB connected successfully');
    });

    mongoose.connection.on('disconnected', () => {
      isDBConnected = false;
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
      isDBConnected = false;
      console.error('❌ MongoDB connection error:', err.message);
    });

    await mongoose.connect(uri, {
      family: 4,                // Force IPv4
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });

    isDBConnected = true;
    return true;
  } catch (err) {
    isDBConnected = false;
    console.error('❌ MongoDB Connection FAILED:', err.message);
    console.warn(`\n================================================================`);
    console.warn(`⚠️  Database Connection Warning: ${err.message}`);
    console.warn(`⚠️  Mongoose could not establish a connection to MongoDB.`);
    console.warn(`⚠️  The application will automatically run in IN-MEMORY mode.`);
    console.warn(`⚠️  Trades will be functional but won't persist across server restarts.`);
    console.warn(`================================================================\n`);
    return false;
  }
};

const getDBStatus = () => isDBConnected;

module.exports = connectDB;
module.exports.getDBStatus = getDBStatus;

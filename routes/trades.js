const express = require('express');
const router = express.Router();
const TradeService = require('../services/tradeService');

// @route   GET /api/trades
// @desc    Get all trades with search, filter, and sorting
router.get('/', async (req, res) => {
  try {
    const trades = await TradeService.getTrades(req.query);
    res.json(trades);
  } catch (error) {
    console.error(`Error fetching trades: ${error.message}`);
    res.status(500).json({ message: 'Server error. Failed to retrieve trades.' });
  }
});

// @route   GET /api/trades/:id
// @desc    Get trade by ID
router.get('/:id', async (req, res) => {
  try {
    const trade = await TradeService.getTrade(req.params.id);
    res.json(trade);
  } catch (error) {
    console.error(`Error fetching trade: ${error.message}`);
    res.status(404).json({ message: error.message || 'Trade entry not found.' });
  }
});

// @route   POST /api/trades
// @desc    Create a new trade log
router.post('/', async (req, res) => {
  try {
    const savedTrade = await TradeService.createTrade(req.body);
    res.status(201).json(savedTrade);
  } catch (error) {
    console.error(`Error creating trade: ${error.message}`);
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/trades/:id
// @desc    Update a trade log
router.put('/:id', async (req, res) => {
  try {
    const updatedTrade = await TradeService.updateTrade(req.params.id, req.body);
    res.json(updatedTrade);
  } catch (error) {
    console.error(`Error updating trade: ${error.message}`);
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/trades/:id
// @desc    Delete a trade log
router.delete('/:id', async (req, res) => {
  try {
    const result = await TradeService.deleteTrade(req.params.id);
    res.json(result);
  } catch (error) {
    console.error(`Error deleting trade: ${error.message}`);
    res.status(500).json({ message: error.message || 'Server error. Failed to delete trade.' });
  }
});

module.exports = router;

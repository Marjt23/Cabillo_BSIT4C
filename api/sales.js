'use strict';
const database = require('../database');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({error: 'Method not allowed'});
    return;
  }

  res.setHeader('Content-Type', 'application/json');

  try {
    const input = req.body;
    if (!input || typeof input !== 'object') {
      res.status(400).json({error: 'Invalid JSON body'});
      return;
    }
    const receipt = await database.saveSale(input);
    res.status(201).json(receipt);
  } catch (error) {
    const invalid = /^(Invalid|Insufficient)/.test(error.message);
    res.status(invalid ? 400 : 503).json({
      error: invalid ? error.message : 'Could not save your sale. Please retry.',
    });
  }
};

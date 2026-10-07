'use strict';

let database;
let loadError;
try {
  database = require('../database');
} catch (e) {
  loadError = e.message;
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (loadError) {
    return res.status(503).json({error: 'Module load failed: ' + loadError});
  }

  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method not allowed'});
  }

  try {
    const input = req.body;
    if (!input || typeof input !== 'object') {
      return res.status(400).json({error: 'Invalid JSON body'});
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

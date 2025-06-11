// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors()); 

function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

app.get('/api/economic', async (req, res) => {
  const apiKey = 'guest:guest'; // Replace with your actual key if available
  const url = `https://api.tradingeconomics.com/country/United States?c=${apiKey}`;

  try {
    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    console.error('Economic data fetch failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch economic data' });
  }
});

// GET /api/tariff - USITC data
app.get('/api/tariff', async (req, res) => {
  const today = getTodayDate();
  const url = `https://dataweb.usitc.gov/api/tariff?country=USA&date=${today}`;

  try {
    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    console.error('Tariff data fetch failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch tariff data' });
  }
});

// Server listen
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));

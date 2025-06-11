const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const FRED_API_KEY = process.env.FRED_API_KEY;
const FRED = 'https://api.stlouisfed.org/fred/series/observations';

const fetchFRED = async (series_id) => {
  const url = `${FRED}?series_id=${series_id}&api_key=${FRED_API_KEY}&file_type=json`;
  const res = await axios.get(url);
  const observations = res.data.observations;

  const latestValid = [...observations]
    .reverse()
    .find(obs => obs.value && obs.value !== "." && !isNaN(parseFloat(obs.value)));

  return latestValid ? parseFloat(latestValid.value) : null;
};

app.get('/api/economic', async (req, res) => {
  try {
    const [gdp, gdpGrowth, inflation, spending, unemployment, exports, imports] = await Promise.all([
      fetchFRED('GDP'),
      fetchFRED('A191RL1Q225SBEA'),
      fetchFRED('CPIAUCSL'),
      fetchFRED('DPCERL1Q225SBEA'),
      fetchFRED('UNRATE'),
      fetchFRED('EXPCH'),
      fetchFRED('IMPCH'),
    ]);

    const tradeDeficit = imports - exports;

    res.json({
      source: "FRED",
      gdp: { growth: gdpGrowth, value: gdp },
      trade: { deficit: tradeDeficit, exports, imports },
      consumer: { inflation, householdSpending: spending },
      jobs: { manufacturing: unemployment, service: unemployment }
    });

  } catch (err) {
    console.error('Economic data fetch failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch economic data' });
  }
});

app.get('/api/tariff', async (req, res) => {

    // will change endpoint logic in the future so it retrieves tarrifs in real time too
  try {
    res.json({
      source: "Simulated Data",
      china: {
        manufacturing: 12,
        electronics: 15,
        agriculture: 8,
      },
      eu: {
        automotive: 6,
        agriculture: 5,
      },
      nafta: {
        steel: 4,
        agriculture: 3,
      }
    });
  } catch (err) {
    console.error('Tariff data fetch failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch tariff data' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`server running`));

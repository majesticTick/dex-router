const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const http = axios.create({
  timeout: 7000,
  headers: { 'User-Agent': 'dex-router-demo' },
});

const SUPPORTED_BASES = ['ETH', 'BTC', 'TRX', 'DOGE', 'BNB'];

const exchanges = [
  {
    name: 'Binance',
    quote: 'USDT',
    url: (base) => `https://api.binance.com/api/v3/ticker/price?symbol=${base}USDT`,
    parse: (data) => data.price,
  },
  {
    name: 'Coinbase',
    quote: 'USDT',
    url: (base) => `https://api.exchange.coinbase.com/products/${base}-USDT/ticker`,
    parse: (data) => data.price,
  },
  {
    name: 'Kraken',
    quote: 'USDT',
    url: (base) => `https://api.kraken.com/0/public/Ticker?pair=${base}USDT`,
    parse: (data) => {
      const key = Object.keys(data.result || {})[0];
      return key ? data.result[key].c[0] : null;
    },
  },
  {
    name: 'Bitfinex',
    quote: 'USDT',
    url: (base) => `https://api-pub.bitfinex.com/v2/ticker/t${base}UST`,
    parse: (data) => data[6],
  },
  {
    name: 'KuCoin',
    quote: 'USDT',
    url: (base) => `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${base}-USDT`,
    parse: (data) => data.data?.price,
  },
  {
    name: 'OKX',
    quote: 'USDT',
    url: (base) => `https://www.okx.com/api/v5/market/ticker?instId=${base}-USDT`,
    parse: (data) => data.data?.[0]?.last,
  },
  {
    name: 'Bybit',
    quote: 'USDT',
    url: (base) =>
      `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${base}USDT`,
    parse: (data) => data.result?.list?.[0]?.lastPrice,
  },
  {
    name: 'Gate.io',
    quote: 'USDT',
    url: (base) => `https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${base}_USDT`,
    parse: (data) => data?.[0]?.last,
  },
  {
    name: 'HTX',
    quote: 'USDT',
    url: (base) => `https://api.huobi.pro/market/detail/merged?symbol=${base.toLowerCase()}usdt`,
    parse: (data) => data.tick?.close,
  },
  {
    name: 'Gemini',
    quote: 'USDT',
    url: (base) => `https://api.gemini.com/v1/pubticker/${base.toLowerCase()}usdt`,
    parse: (data) => data.last,
  },
];

function normalizeBases(input) {
  if (!input) {
    return ['ETH'];
  }

  const bases = input
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const upper = entry.toUpperCase();
      if (upper.includes('/')) {
        return upper.split('/')[0];
      }
      if (upper.includes('-')) {
        return upper.split('-')[0];
      }
      if (upper.endsWith('USDT')) {
        return upper.slice(0, -4);
      }
      return upper;
    });

  return [...new Set(bases)];
}

async function fetchExchange(exchange, base) {
  const url = exchange.url(base);
  try {
    const response = await http.get(url);
    const rawPrice = exchange.parse(response.data);
    const price = Number(rawPrice);

    if (!Number.isFinite(price)) {
      throw new Error('Invalid price');
    }

    return {
      exchange: exchange.name,
      base,
      quote: exchange.quote,
      price,
      source: url,
      ok: true,
    };
  } catch (error) {
    return {
      exchange: exchange.name,
      base,
      quote: exchange.quote,
      price: null,
      source: url,
      ok: false,
      error: error.message,
    };
  }
}

app.get('/api/prices', async (req, res) => {
  const requested = normalizeBases(req.query.symbols || req.query.bases);
  const bases = requested.filter((base) => SUPPORTED_BASES.includes(base));
  const activeBases = bases.length > 0 ? bases : ['ETH'];

  const results = await Promise.all(
    activeBases.map(async (base) => ({
      base,
      results: await Promise.all(exchanges.map((exchange) => fetchExchange(exchange, base))),
    })),
  );

  res.json({
    bases: activeBases,
    updatedAt: new Date().toISOString(),
    results,
  });
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

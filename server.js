const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const http = axios.create({
  timeout: 7000,
  headers: { 'User-Agent': 'dex-router-demo' },
});

const exchanges = [
  {
    name: 'Binance',
    quote: 'USDT',
    url: 'https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT',
    parse: (data) => data.price,
  },
  {
    name: 'Coinbase',
    quote: 'USDT',
    url: 'https://api.exchange.coinbase.com/products/ETH-USDT/ticker',
    parse: (data) => data.price,
  },
  {
    name: 'Kraken',
    quote: 'USDT',
    url: 'https://api.kraken.com/0/public/Ticker?pair=ETHUSDT',
    parse: (data) => {
      const key = Object.keys(data.result || {})[0];
      return key ? data.result[key].c[0] : null;
    },
  },
  {
    name: 'Bitfinex',
    quote: 'USDT',
    url: 'https://api-pub.bitfinex.com/v2/ticker/tETHUST',
    parse: (data) => data[6],
  },
  {
    name: 'KuCoin',
    quote: 'USDT',
    url: 'https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=ETH-USDT',
    parse: (data) => data.data?.price,
  },
  {
    name: 'OKX',
    quote: 'USDT',
    url: 'https://www.okx.com/api/v5/market/ticker?instId=ETH-USDT',
    parse: (data) => data.data?.[0]?.last,
  },
  {
    name: 'Bybit',
    quote: 'USDT',
    url: 'https://api.bybit.com/v5/market/tickers?category=spot&symbol=ETHUSDT',
    parse: (data) => data.result?.list?.[0]?.lastPrice,
  },
  {
    name: 'Gate.io',
    quote: 'USDT',
    url: 'https://api.gateio.ws/api/v4/spot/tickers?currency_pair=ETH_USDT',
    parse: (data) => data?.[0]?.last,
  },
  {
    name: 'HTX',
    quote: 'USDT',
    url: 'https://api.huobi.pro/market/detail/merged?symbol=ethusdt',
    parse: (data) => data.tick?.close,
  },
  {
    name: 'Gemini',
    quote: 'USDT',
    url: 'https://api.gemini.com/v1/pubticker/ethusdt',
    parse: (data) => data.last,
  },
];

async function fetchExchange(exchange) {
  try {
    const response = await http.get(exchange.url);
    const rawPrice = exchange.parse(response.data);
    const price = Number(rawPrice);

    if (!Number.isFinite(price)) {
      throw new Error('Invalid price');
    }

    return {
      exchange: exchange.name,
      quote: exchange.quote,
      price,
      source: exchange.url,
      ok: true,
    };
  } catch (error) {
    return {
      exchange: exchange.name,
      quote: exchange.quote,
      price: null,
      source: exchange.url,
      ok: false,
      error: error.message,
    };
  }
}

app.get('/api/prices', async (req, res) => {
  const results = await Promise.all(exchanges.map(fetchExchange));
  res.json({
    base: 'ETH',
    updatedAt: new Date().toISOString(),
    results,
  });
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

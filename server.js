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
    type: 'cex',
    url: (base) => `https://api.binance.com/api/v3/ticker/price?symbol=${base}USDT`,
    parse: (data) => data.price,
  },
  {
    name: 'MEXC',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://api.mexc.com/api/v3/ticker/price?symbol=${base}USDT`,
    parse: (data) => data.price,
  },
  {
    name: 'Coinbase',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://api.exchange.coinbase.com/products/${base}-USDT/ticker`,
    parse: (data) => data.price,
  },
  {
    name: 'Kraken',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://api.kraken.com/0/public/Ticker?pair=${base}USDT`,
    parse: (data) => {
      const key = Object.keys(data.result || {})[0];
      return key ? data.result[key].c[0] : null;
    },
  },
  {
    name: 'Bitstamp',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://www.bitstamp.net/api/v2/ticker/${base.toLowerCase()}usdt/`,
    parse: (data) => data.last,
  },
  {
    name: 'Bitfinex',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://api-pub.bitfinex.com/v2/ticker/t${base}UST`,
    parse: (data) => data[6],
  },
  {
    name: 'KuCoin',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${base}-USDT`,
    parse: (data) => data.data?.price,
  },
  {
    name: 'Bitget',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://api.bitget.com/api/v2/spot/market/tickers?symbol=${base}USDT`,
    parse: (data) => data.data?.[0]?.lastPr || data.data?.[0]?.close,
  },
  {
    name: 'OKX',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://www.okx.com/api/v5/market/ticker?instId=${base}-USDT`,
    parse: (data) => data.data?.[0]?.last,
  },
  {
    name: 'Bybit',
    quote: 'USDT',
    type: 'cex',
    url: (base) =>
      `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${base}USDT`,
    parse: (data) => data.result?.list?.[0]?.lastPrice,
  },
  {
    name: 'Gate.io',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${base}_USDT`,
    parse: (data) => data?.[0]?.last,
  },
  {
    name: 'CoinEx',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://api.coinex.com/v1/market/ticker?market=${base}USDT`,
    parse: (data) => data.data?.ticker?.last,
  },
  {
    name: 'HTX',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://api.huobi.pro/market/detail/merged?symbol=${base.toLowerCase()}usdt`,
    parse: (data) => data.tick?.close,
  },
  {
    name: 'Gemini',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://api.gemini.com/v1/pubticker/${base.toLowerCase()}usdt`,
    parse: (data) => data.last,
  },
  {
    name: 'Crypto.com',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://api.crypto.com/v2/public/get-ticker?instrument_name=${base}_USDT`,
    parse: (data) => data.result?.data?.[0]?.k || data.result?.data?.[0]?.a,
  },
  {
    name: 'Binance.US',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://api.binance.us/api/v3/ticker/price?symbol=${base}USDT`,
    parse: (data) => data.price,
  },
  {
    name: 'Upbit',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://api.upbit.com/v1/ticker?markets=USDT-${base}`,
    parse: (data) => data?.[0]?.trade_price,
  },
  {
    name: 'Bitrue',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://www.bitrue.com/api/v1/ticker/24hr?symbol=${base}USDT`,
    parse: (data) => data.lastPrice,
  },
  {
    name: 'HitBTC',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://api.hitbtc.com/api/3/public/ticker/${base}USDT`,
    parse: (data, base) => data?.[`${base}USDT`]?.last || data?.last,
  },
  {
    name: 'BitMart',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://api-cloud.bitmart.com/spot/quotation/v3/ticker?symbol=${base}_USDT`,
    parse: (data) => data.data?.last,
  },
  {
    name: 'DigiFinex',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://openapi.digifinex.com/v3/ticker?symbol=${base.toLowerCase()}_usdt`,
    parse: (data) => data.ticker?.[0]?.last || data.ticker?.last,
  },
  {
    name: 'AscendEX',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://ascendex.com/api/pro/v1/spot/ticker?symbol=${base}/USDT`,
    parse: (data) => data.data?.[0]?.last || data.data?.[0]?.close,
  },
  {
    name: 'ProBit',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://api.probit.com/api/exchange/v1/ticker?market_ids=${base}-USDT`,
    parse: (data) => data.data?.[0]?.last,
  },
  {
    name: 'WhiteBIT',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://whitebit.com/api/v4/public/ticker?market=${base}_USDT`,
    parse: (data) =>
      (Array.isArray(data) ? data[0]?.last_price || data[0]?.last : null) ||
      data.last_price ||
      data.last ||
      data.result?.last,
  },
  {
    name: 'LBank',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://api.lbkex.com/v2/ticker.do?symbol=${base.toLowerCase()}_usdt`,
    parse: (data) => data.data?.[0]?.ticker?.latest || data.ticker?.latest,
  },
  {
    name: 'XT',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://sapi.xt.com/v4/public/ticker?symbol=${base}_USDT`,
    parse: (data) => data.result?.[0]?.last || data.result?.last,
  },
  {
    name: 'CoinW',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://api.coinw.com/api/v1/public?command=returnTicker&symbol=${base}_USDT`,
    parse: (data) => data.data?.last || data.result?.last || data?.[`${base}_USDT`]?.last,
  },
  {
    name: 'ZB',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://api.zb.com/data/v1/ticker?market=${base.toLowerCase()}_usdt`,
    parse: (data) => data.ticker?.last,
  },
  {
    name: 'BingX',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://open-api.bingx.com/openApi/spot/v1/ticker/price?symbol=${base}-USDT`,
    parse: (data) => data.data?.price || data.price,
  },
  {
    name: 'Poloniex',
    quote: 'USDT',
    type: 'cex',
    url: (base) => `https://api.poloniex.com/markets/${base}_USDT/ticker`,
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
    const rawPrice = exchange.parse(response.data, base);
    const price = Number(rawPrice);

    if (!Number.isFinite(price) || price <= 0) {
      throw new Error('Invalid price');
    }

    return {
      exchange: exchange.name,
      base,
      quote: exchange.quote,
      type: exchange.type,
      price,
      source: url,
      ok: true,
    };
  } catch (error) {
    return {
      exchange: exchange.name,
      base,
      quote: exchange.quote,
      type: exchange.type,
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

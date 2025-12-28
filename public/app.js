const results = document.getElementById('results');
const refreshButton = document.getElementById('refresh');
const updatedAt = document.getElementById('updated-at');
const marketButtons = Array.from(document.querySelectorAll('.market-button'));
const assetsTab = document.getElementById('assets-tab');
const controlsSection = document.getElementById('controls');
const assetsSection = document.getElementById('assets');
const assetList = document.getElementById('asset-list');
const walletButton = document.getElementById('wallet-button');
const walletPanel = document.getElementById('wallet-panel');
const walletStatus = document.getElementById('wallet-status');
const pairToggle = document.getElementById('pair-toggle');
const pairPanel = document.getElementById('pair-panel');
const coinButtons = Array.from(document.querySelectorAll('.coin-option'));
let viewFilter = 'cex';
let activeTab = 'market';
let connectedAccount = null;
const EXCHANGE_LOGOS = {
  Binance: 'binance.com',
  MEXC: 'mexc.com',
  Coinbase: 'coinbase.com',
  Kraken: 'kraken.com',
  Bitstamp: 'bitstamp.net',
  Bitfinex: 'bitfinex.com',
  KuCoin: 'kucoin.com',
  Bitget: 'bitget.com',
  OKX: 'okx.com',
  Bybit: 'bybit.com',
  'Gate.io': 'gate.io',
  CoinEx: 'coinex.com',
  HTX: 'htx.com',
  Gemini: 'gemini.com',
  'Crypto.com': 'crypto.com',
  'Binance.US': 'binance.us',
  Upbit: 'upbit.com',
  Bitrue: 'bitrue.com',
  HitBTC: 'hitbtc.com',
  BitMart: 'bitmart.com',
  DigiFinex: 'digifinex.com',
  AscendEX: 'ascendex.com',
  ProBit: 'probit.com',
  WhiteBIT: 'whitebit.com',
  LBank: 'lbkex.com',
  XT: 'xt.com',
  CoinW: 'coinw.com',
  ZB: 'zb.com',
  BingX: 'bingx.com',
  Poloniex: 'poloniex.com',
};
const ASSET_TOKENS = [
  { symbol: 'ETH', type: 'native', decimals: 18 },
  { symbol: 'USDT', type: 'erc20', decimals: 6, address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
];

const selectedBases = new Set(
  coinButtons
    .filter((button) => button.classList.contains('is-selected'))
    .map((button) => button.dataset.base),
);

function getSelectedBases() {
  return [...selectedBases];
}

function updateToggleLabel() {
  const bases = getSelectedBases();
  if (bases.length === 0) {
    pairToggle.textContent = 'Select coins';
    return;
  }
  if (bases.length === 1) {
    pairToggle.textContent = `${bases[0]}`;
    return;
  }
  pairToggle.textContent = `${bases.length} coins`;
}

function setPanelOpen(isOpen) {
  pairPanel.classList.toggle('is-open', isOpen);
  pairPanel.setAttribute('aria-hidden', String(!isOpen));
}

function setWalletPanelOpen(isOpen) {
  walletPanel.classList.toggle('is-open', isOpen);
  walletPanel.setAttribute('aria-hidden', String(!isOpen));
}

function setActiveTab(tab) {
  activeTab = tab;
  const isAssets = tab === 'assets';
  assetsTab.classList.toggle('is-active', isAssets);
  marketButtons
    .filter((button) => button.dataset.view)
    .forEach((button) => button.classList.toggle('is-active', !isAssets && button.dataset.view === viewFilter));
  controlsSection.hidden = isAssets;
  results.hidden = isAssets;
  assetsSection.hidden = !isAssets;
}

function renderRow(item, suffix) {
  const row = document.createElement('div');
  row.className = 'row';

  const logoDomain = EXCHANGE_LOGOS[item.exchange];
  if (logoDomain) {
    const logo = document.createElement('img');
    logo.className = 'logo';
    logo.alt = `${item.exchange} logo`;
    logo.loading = 'lazy';
    logo.src = `https://www.google.com/s2/favicons?domain=${logoDomain}&sz=64`;
    logo.addEventListener('error', () => {
      logo.remove();
    });
    row.appendChild(logo);
  }

  const exchange = document.createElement('span');
  exchange.textContent = `${item.exchange}:`;

  const price = document.createElement('span');
  if (item.ok !== false && Number.isFinite(item.price) && item.price > 0) {
    price.textContent = `${item.price.toFixed(2)} USDT`;
  } else {
    price.textContent = 'Unavailable';
  }

  if (suffix) {
    const extra = document.createElement('span');
    extra.textContent = suffix;
    row.append(exchange, price, extra);
  } else {
    row.append(exchange, price);
  }
  return row;
}

function renderTop3(target, items, label, order, showCheaperFromHighest) {
  const valid = items.filter(
    (item) => item.ok !== false && Number.isFinite(item.price) && item.price > 0,
  );
  const highest = valid.reduce((max, item) => (item.price > max ? item.price : max), 0);
  const sorted = valid.sort((a, b) =>
    order === 'desc' ? b.price - a.price : a.price - b.price,
  );
  const top = sorted.slice(0, 3);

  if (top.length === 0) {
    target.textContent = 'No prices available';
    return;
  }

  const title = document.createElement('div');
  title.textContent = label;
  target.appendChild(title);

  top.forEach((item) => {
    let suffix = '';
    if (showCheaperFromHighest && highest > 0) {
      const percent = ((highest - item.price) / highest) * 100;
      suffix = ` (${percent.toFixed(2)}% cheaper)`;
    }
    const row = renderRow(item, suffix);
    target.appendChild(row);
  });
}

function renderBaseSection(baseData) {
  const section = document.createElement('section');
  section.className = 'coin';

  const header = document.createElement('h2');
  header.textContent = `${baseData.base}`;
  section.appendChild(header);

  const columns = document.createElement('div');
  columns.className = 'columns';

  const filteredResults = baseData.results.filter((item) => {
    if (viewFilter === 'dex') {
      return item.type === 'dex';
    }
    return item.type !== 'dex';
  });

  const listColumn = document.createElement('div');
  listColumn.className = 'section';
  const listTitle = document.createElement('div');
  listTitle.className = 'section-title';
  listTitle.textContent = viewFilter.toUpperCase();
  const list = document.createElement('div');
  list.className = 'list';

  const listItems = filteredResults.filter(
    (item) => item.ok !== false && Number.isFinite(item.price) && item.price > 0,
  );

  if (listItems.length === 0) {
    list.textContent = 'No prices available';
  } else {
    listItems.forEach((item) => {
      list.appendChild(renderRow(item));
    });
  }

  listColumn.append(listTitle, list);

  const summaryColumn = document.createElement('div');
  summaryColumn.className = 'section';

  const sellTitle = document.createElement('div');
  sellTitle.className = 'section-title';
  sellTitle.textContent = 'Sell (Top 3 Highest)';
  const sellList = document.createElement('div');
  sellList.className = 'top3';

  const buyTitle = document.createElement('div');
  buyTitle.className = 'section-title';
  buyTitle.textContent = 'Buy (Top 3 Lowest)';
  const buyList = document.createElement('div');
  buyList.className = 'top3';

  renderTop3(sellList, filteredResults, 'Top 3 Highest', 'desc', true);
  renderTop3(buyList, filteredResults, 'Top 3 Lowest', 'asc', true);

  summaryColumn.append(sellTitle, sellList, buyTitle, buyList);

  columns.append(listColumn, summaryColumn);
  const note = document.createElement('div');
  note.className = 'base-note';
  note.textContent = 'USDT 기준';

  section.append(columns, note);
  return section;
}

function formatUnits(value, decimals) {
  if (decimals === 0) {
    return value.toString();
  }
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const fraction = value % base;
  const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
  return fractionStr.length ? `${whole}.${fractionStr}` : whole.toString();
}

function formatAmount(valueStr, maxDecimals = 6) {
  if (!valueStr.includes('.')) {
    return valueStr;
  }
  const [whole, fraction] = valueStr.split('.');
  const trimmed = fraction.slice(0, maxDecimals).replace(/0+$/, '');
  return trimmed.length ? `${whole}.${trimmed}` : whole;
}

async function getNativeBalance(account) {
  const hex = await window.ethereum.request({
    method: 'eth_getBalance',
    params: [account, 'latest'],
  });
  return BigInt(hex);
}

async function getErc20Balance(account, token) {
  const address = account.toLowerCase().replace('0x', '').padStart(64, '0');
  const data = `0x70a08231${address}`;
  const hex = await window.ethereum.request({
    method: 'eth_call',
    params: [{ to: token.address, data }, 'latest'],
  });
  if (!hex || hex === '0x') {
    return 0n;
  }
  return BigInt(hex);
}

async function loadAssets() {
  if (!connectedAccount || !window.ethereum) {
    walletStatus.textContent = '지갑을 연결하세요.';
    assetList.innerHTML = '';
    return;
  }

  walletStatus.textContent = `${connectedAccount.slice(0, 6)}...${connectedAccount.slice(-4)}`;
  assetList.innerHTML = '';

  for (const token of ASSET_TOKENS) {
    try {
      const balance =
        token.type === 'native'
          ? await getNativeBalance(connectedAccount)
          : await getErc20Balance(connectedAccount, token);
      const amount = formatAmount(formatUnits(balance, token.decimals));
      const row = document.createElement('div');
      row.className = 'asset-row';

      const symbol = document.createElement('span');
      symbol.textContent = token.symbol;

      const value = document.createElement('span');
      value.textContent = amount;

      row.append(symbol, value);
      assetList.appendChild(row);
    } catch (error) {
      const row = document.createElement('div');
      row.className = 'asset-row';

      const symbol = document.createElement('span');
      symbol.textContent = token.symbol;

      const value = document.createElement('span');
      value.textContent = '-';

      row.append(symbol, value);
      assetList.appendChild(row);
    }
  }
}

async function loadPrices() {
  try {
    const bases = getSelectedBases();
    if (bases.length === 0) {
      results.textContent = 'Select at least one pair.';
      return;
    }

    const response = await fetch(`/api/prices?symbols=${bases.join(',')}`);
    const data = await response.json();

    results.innerHTML = '';
    updatedAt.textContent = `Updated: ${new Date(data.updatedAt).toLocaleString()}`;

    data.results.forEach((baseData) => {
      results.appendChild(renderBaseSection(baseData));
    });
  } catch (error) {
    results.textContent = 'Failed to load';
  }
}

loadPrices();
setInterval(loadPrices, 15000);

refreshButton.addEventListener('click', loadPrices);
pairToggle.addEventListener('click', () => {
  setPanelOpen(!pairPanel.classList.contains('is-open'));
});

marketButtons.forEach((button) =>
  button.addEventListener('click', () => {
    if (button.dataset.tab === 'assets') {
      setActiveTab('assets');
      loadAssets();
      return;
    }
    viewFilter = button.dataset.view;
    setActiveTab('market');
    loadPrices();
  }),
);

document.addEventListener('click', (event) => {
  if (!pairPanel.classList.contains('is-open')) {
    return;
  }
  if (pairPanel.contains(event.target) || pairToggle.contains(event.target)) {
    return;
  }
  setPanelOpen(false);
});

walletButton.addEventListener('click', () => {
  setWalletPanelOpen(!walletPanel.classList.contains('is-open'));
});

walletPanel.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-wallet]');
  if (!button) {
    return;
  }
  if (!window.ethereum) {
    walletStatus.textContent = 'MetaMask가 필요합니다.';
    setWalletPanelOpen(false);
    return;
  }
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    connectedAccount = accounts?.[0] || null;
    walletButton.textContent = connectedAccount ? '연결됨' : '지갑 연결';
    setWalletPanelOpen(false);
    await loadAssets();
  } catch (error) {
    walletStatus.textContent = '지갑 연결 실패';
    setWalletPanelOpen(false);
  }
});

document.addEventListener('click', (event) => {
  if (!walletPanel.classList.contains('is-open')) {
    return;
  }
  if (walletPanel.contains(event.target) || walletButton.contains(event.target)) {
    return;
  }
  setWalletPanelOpen(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    setPanelOpen(false);
    setWalletPanelOpen(false);
  }
});

coinButtons.forEach((button) =>
  button.addEventListener('click', () => {
    const base = button.dataset.base;
    if (selectedBases.has(base)) {
      selectedBases.delete(base);
      button.classList.remove('is-selected');
    } else {
      selectedBases.add(base);
      button.classList.add('is-selected');
    }
    updateToggleLabel();
    loadPrices();
  }),
);

updateToggleLabel();
setActiveTab('market');

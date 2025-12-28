const results = document.getElementById('results');
const refreshButton = document.getElementById('refresh');
const baseInputs = Array.from(document.querySelectorAll('input[name="base"]'));

function getSelectedBases() {
  return baseInputs.filter((input) => input.checked).map((input) => input.value);
}

function renderRow(item) {
  const row = document.createElement('div');
  row.className = 'row';

  const exchange = document.createElement('span');
  exchange.textContent = `${item.exchange}:`;

  const price = document.createElement('span');
  if (item.ok) {
    price.textContent = `${item.price.toFixed(2)} USDT`;
  } else {
    price.textContent = 'Unavailable';
  }

  row.append(exchange, price);
  return row;
}

function renderTop3(target, items) {
  const valid = items.filter((item) => item.ok && Number.isFinite(item.price));
  const highest = valid.reduce((max, item) => (item.price > max ? item.price : max), 0);
  const cheapest = valid.sort((a, b) => a.price - b.price).slice(0, 3);

  if (cheapest.length === 0) {
    target.textContent = 'No prices available';
    return;
  }

  const label = document.createElement('div');
  label.textContent = 'Top 3 Cheapest:';
  target.appendChild(label);

  cheapest.forEach((item) => {
    const row = renderRow(item);
    if (highest > 0) {
      const diff = document.createElement('span');
      const percent = ((highest - item.price) / highest) * 100;
      diff.textContent = ` (${percent.toFixed(2)}% cheaper)`;
      row.appendChild(diff);
    }
    target.appendChild(row);
  });
}

function renderBaseSection(baseData) {
  const section = document.createElement('section');
  section.className = 'coin';

  const header = document.createElement('h2');
  header.textContent = `${baseData.base}/USDT`;
  section.appendChild(header);

  const columns = document.createElement('div');
  columns.className = 'columns';

  const list = document.createElement('div');
  list.className = 'list';

  const top3 = document.createElement('div');
  top3.className = 'top3';

  baseData.results.forEach((item) => {
    list.appendChild(renderRow(item));
  });

  renderTop3(top3, baseData.results);

  columns.append(list, top3);
  section.appendChild(columns);
  return section;
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
baseInputs.forEach((input) => input.addEventListener('change', loadPrices));

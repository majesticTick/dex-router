const list = document.getElementById('list');
const top3 = document.getElementById('top3');
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

async function loadPrices() {
  try {
    const response = await fetch('/api/prices');
    const data = await response.json();

    list.innerHTML = '';
    top3.innerHTML = '';

    data.results.forEach((item) => {
      list.appendChild(renderRow(item));
    });

    const valid = data.results.filter((item) => item.ok && Number.isFinite(item.price));
    const highest = valid.reduce((max, item) => (item.price > max ? item.price : max), 0);
    const cheapest = valid
      .filter((item) => item.ok && Number.isFinite(item.price))
      .sort((a, b) => a.price - b.price)
      .slice(0, 3);

    if (cheapest.length === 0) {
      top3.textContent = 'No prices available';
      return;
    }

    const label = document.createElement('div');
    label.textContent = 'Top 3 Cheapest:';
    top3.appendChild(label);

    cheapest.forEach((item) => {
      const row = renderRow(item);
      if (highest > 0) {
        const diff = document.createElement('span');
        const percent = ((highest - item.price) / highest) * 100;
        diff.textContent = ` (${percent.toFixed(2)}% cheaper)`;
        row.appendChild(diff);
      }
      top3.appendChild(row);
    });
  } catch (error) {
    list.textContent = 'Failed to load';
  }
}

loadPrices();
setInterval(loadPrices, 15000);

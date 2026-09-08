let roomChart;

async function loadInsights() {
  const response = await fetch('/api/items');
  const items = await response.json();

  renderTopItems(items);
  renderValueChange(items);
  renderRoomChart(items);
}

function renderTopItems(items) {
  const list = document.getElementById('top-items-list');
  list.innerHTML = '';

  const sorted = items.slice().sort((a, b) => {
    return (parseFloat(b.estimated_value) || 0) - (parseFloat(a.estimated_value) || 0);
  });

  const top5 = sorted.slice(0, 5);

  if (top5.length === 0) {
    list.innerHTML = '<p>No items yet.</p>';
    return;
  }

  top5.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'insight-row';
    row.innerHTML = `
      <span class="insight-rank">#${index + 1}</span>
      <span class="insight-name">${item.name}</span>
      <span class="insight-value">€${(parseFloat(item.estimated_value) || 0).toFixed(2)}</span>
    `;
    list.appendChild(row);
  });
}

function renderValueChange(items) {
  const list = document.getElementById('value-change-list');
  list.innerHTML = '';

  const itemsWithBothValues = items.filter(
    item => item.purchase_price !== null && item.estimated_value !== null &&
            item.purchase_price !== '' && item.estimated_value !== ''
  );

  if (itemsWithBothValues.length === 0) {
    list.innerHTML = '<p>No items with both a purchase price and estimated value yet.</p>';
    return;
  }

  const withChange = itemsWithBothValues.map(item => {
    const purchase = parseFloat(item.purchase_price) || 0;
    const estimated = parseFloat(item.estimated_value) || 0;
    const change = estimated - purchase;
    const percent = purchase > 0 ? (change / purchase) * 100 : 0;
    return { ...item, change, percent };
  });

  withChange.sort((a, b) => b.change - a.change);

  withChange.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'insight-row';

    const isGain = item.change >= 0;
    const changeClass = isGain ? 'value-gain' : 'value-loss';
    const sign = isGain ? '+' : '';

    row.innerHTML = `
      <span class="insight-name">${item.name}</span>
      <span class="insight-detail">€${item.purchase_price} → €${item.estimated_value}</span>
      <span class="${changeClass}">${sign}€${item.change.toFixed(2)} (${sign}${item.percent.toFixed(0)}%)</span>
    `;
    list.appendChild(row);
  });
}

function renderRoomChart(items) {
  const totalsByRoom = {};

  items.forEach((item) => {
    const room = item.subcategory || 'Unassigned';
    const value = parseFloat(item.estimated_value) || 0;
    totalsByRoom[room] = (totalsByRoom[room] || 0) + value;
  });

  const labels = Object.keys(totalsByRoom);
  const values = Object.values(totalsByRoom);

  const ctx = document.getElementById('catogory-bar-chart');

  if (roomChart) {
    roomChart.destroy();
  }

  roomChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Estimated value (€)',
        data: values,
        backgroundColor: '#2980b9'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

loadInsights();
// This holds the chart, so it can be destroyed again before a new one is drawn.
// The name still says "room" because of an older version of the app. It groups by subcategory now
let roomChart;


// This function fetches the items once and gives the same list to all three parts of the page
async function loadInsights() {
  const response = await fetch('/api/items');
  const items = await response.json();

  renderTopItems(items);
  renderValueChange(items);
  renderRoomChart(items);
}

// This function draws the 5 items with the highest estimated value.
// Items without a value count as 0 and end up at the bottom
function renderTopItems(items) {
  const list = document.getElementById('top-items-list');
  list.innerHTML = '';

  // The slice() makes a copy first, so the sort() doesn't change the original list
  const sorted = items.slice().sort((a, b) => {
    return (parseFloat(b.estimated_value) || 0) - (parseFloat(a.estimated_value) || 0);
  });

  const top5 = sorted.slice(0, 5);

  // This is only for the message. An empty list would not crash here
  if (top5.length === 0) {
    list.innerHTML = '<p>No items yet.</p>';
    return;
  }

  top5.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'insight-row';
    // The Euro format is written out here directly, the formatEuro() helper is in dashboard.js
    row.innerHTML = `
      <span class="insight-rank">#${index + 1}</span>
      <span class="insight-name">${item.name}</span>
      <span class="insight-value">€${(parseFloat(item.estimated_value) || 0).toFixed(2)}</span>
    `;
    list.appendChild(row);
  });
}

// This function compares the purchase price with the estimated value.
// A plus is shown in green and a minus in red, the classes for that are in style.css
function renderValueChange(items) {
  const list = document.getElementById('value-change-list');
  list.innerHTML = '';

  // Only items that have both values can be compared.
  // The null and the '' are both checked, because the API can send either one for an empty field
  const itemsWithBothValues = items.filter(
    item => item.purchase_price !== null && item.estimated_value !== null &&
            item.purchase_price !== '' && item.estimated_value !== ''
  );

  if (itemsWithBothValues.length === 0) {
    list.innerHTML = '<p>No items with both a purchase price and estimated value yet.</p>';
    return;
  }

  // Here the change in Euro and in percent is calculated and added to a copy of the item.
  // The check "purchase > 0" stops a division by zero for free items
  const withChange = itemsWithBothValues.map(item => {
    const purchase = parseFloat(item.purchase_price) || 0;
    const estimated = parseFloat(item.estimated_value) || 0;
    const change = estimated - purchase;
    const percent = purchase > 0 ? (change / purchase) * 100 : 0;
    return { ...item, change, percent };
  });

  // The sorting uses the Euro change and not the percent, so a plus of €500 comes before
  // a plus of 300% on an item that cost €2
  withChange.sort((a, b) => b.change - a.change);

  withChange.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'insight-row';

    const isGain = item.change >= 0;
    const changeClass = isGain ? 'value-gain' : 'value-loss';
    // Only a plus needs the sign, a minus number already prints its own "-"
    const sign = isGain ? '+' : '';

    // The "€X → €Y" part prints the raw saved values, only the change is rounded to 2 digits
    row.innerHTML = `
      <span class="insight-name">${item.name}</span>
      <span class="insight-detail">€${item.purchase_price} → €${item.estimated_value}</span>
      <span class="${changeClass}">${sign}€${item.change.toFixed(2)} (${sign}${item.percent.toFixed(0)}%)</span>
    `;
    list.appendChild(row);
  });
}

// This function draws the bar chart with the value per subcategory.
// The name still says "room" because of an older version of the app
function renderRoomChart(items) {
  // The totals are added up in an object, like { 'Kitchen': 320, 'Unassigned': 45 }
  const totalsByRoom = {};

  items.forEach((item) => {
    // Items without a subcategory are put together under "Unassigned", so their value is not lost
    const room = item.subcategory || 'Unassigned';
    const value = parseFloat(item.estimated_value) || 0;
    totalsByRoom[room] = (totalsByRoom[room] || 0) + value;
  });

  // The keys() and the values() come back in the same order, so labels and values still match
  const labels = Object.keys(totalsByRoom);
  const values = Object.values(totalsByRoom);

  // Careful: this id is written wrong, but the same wrong way in insights.html, so it works.
  // If it gets fixed, it has to be fixed in both files
  const ctx = document.getElementById('catogory-bar-chart');

  // The old chart is destroyed first, otherwise a second one sits on the same canvas
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
        // The bars have to start at zero, otherwise small differences look much bigger than they are
        y: { beginAtZero: true }
      }
    }
  });
}

// This runs once when the page loads and builds all three parts
loadInsights();
let pieChart;

function formatDateGerman(isoDate) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}.${month}.${year}`;
}

function formatEuro(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  return `€${num.toFixed(2)}`;
}

async function loadDashboard() {
  const profileResponse = await fetch('/api/profile');
  const profile = await profileResponse.json();

  const title = document.getElementById('dashboard-title');
  if (profile.first_name) {
    title.textContent = `${profile.first_name}'s Items Overview`;
  } else {
    title.textContent = 'Items Overview';
  }

  const [itemsResponse, categoriesResponse] = await Promise.all([
    fetch('/api/items'),
    fetch('/api/categories')
  ]);

  const items = await itemsResponse.json();
  const categories = await categoriesResponse.json();

  const total = items.reduce((sum, item) => {
    const value = parseFloat(item.estimated_value) || 0;
    return sum + value;
  }, 0);
  document.getElementById('total-value').textContent = formatEuro(total);

  const summaryList = document.getElementById('category-summary-list');
  summaryList.innerHTML = '';

  const categoryLabels = [];
  const categoryTotals = [];

  categories.forEach((cat) => {
    const itemsInCategory = items.filter(item => item.category === cat.name);

    const categoryTotal = itemsInCategory.reduce((sum, item) => {
      const value = parseFloat(item.estimated_value) || 0;
      return sum + value;
    }, 0);

    const row = document.createElement('div');
    row.className = 'category-summary-row';
    row.innerHTML = `
      <span class="category-icon">${cat.icon ?? '📦'}</span>
      <span class="category-name">${cat.name}</span>
      <span class="category-count">${itemsInCategory.length} item(s)</span>
      <span class="category-total">${formatEuro(categoryTotal)}</span>
    `;
    summaryList.appendChild(row);

    if (categoryTotal > 0) {
      categoryLabels.push(cat.name);
      categoryTotals.push(categoryTotal);
    }
  });

  renderPieChart(categoryLabels, categoryTotals);

  const itemsList = document.getElementById('dashboard-items-list');
  itemsList.innerHTML = '';

  items.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.category ?? ''}</td>
      <td>${item.subcategory ?? ''}</td>
      <td>${formatDateGerman(item.purchase_date)}</td>
      <td>${formatEuro(item.purchase_price)}</td>
      <td>${formatEuro(item.estimated_value)}</td>
    `;
    itemsList.appendChild(row);
  });
}

function renderPieChart(labels, values) {
  const ctx = document.getElementById('category-pie-chart');

  if (pieChart) {
    pieChart.destroy();
  }

  pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: [
          '#27ae60', '#2980b9', '#e67e22', '#8e44ad',
          '#c0392b', '#16a085', '#f39c12', '#2c3e50'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              return `${label}: ${formatEuro(value)}`;
            }
          }
        }
      }
    }
  });
}

loadDashboard();
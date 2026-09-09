// This holds the chart, so it can be destroyed again before a new one is drawn
let pieChart;


// This function turns the date (YYYY-MM-DD) to a German format (DD.MM.YYYY)
function formatDateGerman(isoDate) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}.${month}.${year}`;
}

// This function turns a number or a String into a Euro text, like "€120.00".
// Empty or broken values give back an empty String, so no "€NaN" shows up in the table
function formatEuro(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  return `€${num.toFixed(2)}`;
}

// This function is the one that builds the whole dashboard page
async function loadDashboard() {
  // The profile is only used for the headline. Without a name a general title is shown
  const profileResponse = await fetch('/api/profile');
  const profile = await profileResponse.json();

  const title = document.getElementById('dashboard-title');
  if (profile.first_name) {
    title.textContent = `${profile.first_name}'s Items Overview`;
  } else {
    title.textContent = 'Items Overview';
  }

  // The items and the categories don't need each other, so they are fetched at the same time
  const [itemsResponse, categoriesResponse] = await Promise.all([
    fetch('/api/items'),
    fetch('/api/categories')
  ]);

  const items = await itemsResponse.json();
  const categories = await categoriesResponse.json();

  // This is the total value of everything.
  // The "|| 0" catches empty or broken values, so one bad item can't break the whole sum
  const total = items.reduce((sum, item) => {
    const value = parseFloat(item.estimated_value) || 0;
    return sum + value;
  }, 0);
  document.getElementById('total-value').textContent = formatEuro(total);

  const summaryList = document.getElementById('category-summary-list');
  summaryList.innerHTML = '';

  // These two lists are filled while the rows are built and later given to the pie chart
  const categoryLabels = [];
  const categoryTotals = [];

  categories.forEach((cat) => {
    // The items save the category as a name and not as an id, so the names are compared
    const itemsInCategory = items.filter(item => item.category === cat.name);

    const categoryTotal = itemsInCategory.reduce((sum, item) => {
      const value = parseFloat(item.estimated_value) || 0;
      return sum + value;
    }, 0);

    const row = document.createElement('div');
    row.className = 'category-summary-row';
    // The cat.icon is read here, but a category never gets an icon in the Categories page.
    // Only subcategories have one, so this is always the 📦 fallback at the moment
    row.innerHTML = `
      <span class="category-icon">${cat.icon ?? '📦'}</span>
      <span class="category-name">${cat.name}</span>
      <span class="category-count">${itemsInCategory.length} item(s)</span>
      <span class="category-total">${formatEuro(categoryTotal)}</span>
    `;
    summaryList.appendChild(row);

    // Empty categories are still shown in the list, but they are left out of the chart,
    // so there are no slices with a value of zero
    if (categoryTotal > 0) {
      categoryLabels.push(cat.name);
      categoryTotals.push(categoryTotal);
    }
  });

  renderPieChart(categoryLabels, categoryTotals);

  const itemsList = document.getElementById('dashboard-items-list');
  itemsList.innerHTML = '';

  // This table only shows the items. The editing is done in the Items page
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

// This function draws the pie chart with the value per category.
// The labels and the values belong together, so both lists must have the same order
function renderPieChart(labels, values) {
  const ctx = document.getElementById('category-pie-chart');

  // The old chart is destroyed first. Chart.js keeps its own data on the canvas, so a second
  // chart on the same canvas makes the tooltips flicker
  if (pieChart) {
    pieChart.destroy();
  }

  pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        // These are the colors of the slices. Chart.js goes through them again from the start,
        // so a 9th category gets the first color a second time
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
            // This shows "Category: €120.00" in the tooltip instead of only the number
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

// This runs once when the page loads and builds everything
loadDashboard();
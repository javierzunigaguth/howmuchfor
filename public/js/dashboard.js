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
  document.getElementById('total-value').textContent = `€${total.toFixed(2)}`;

  const summaryList = document.getElementById('category-summary-list');
  summaryList.innerHTML = '';

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
      <span class="category-total">€${categoryTotal.toFixed(2)}</span>
    `;
    summaryList.appendChild(row);
  });

  // Items table
  const itemsList = document.getElementById('dashboard-items-list');
  itemsList.innerHTML = '';

  items.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.category ?? ''}</td>
      <td>${item.subcategory ?? ''}</td>
      <td>${item.purchase_date ?? ''}</td>
      <td>${item.purchase_price ?? ''}</td>
      <td>${item.estimated_value ?? ''}</td>
    `;
    itemsList.appendChild(row);
  });
}

loadDashboard();
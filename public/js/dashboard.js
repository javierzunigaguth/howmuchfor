async function loadDashboard() {
  const response = await fetch('/api/items');
  const items = await response.json();

  const total = items.reduce((sum, item) => {
    const value = parseFloat(item.estimated_value) || 0;
    return sum + value;
  }, 0);
  document.getElementById('total-value').textContent = `€${total.toFixed(2)}`;

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
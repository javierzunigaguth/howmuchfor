document.getElementById('item-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const newItem = {
    name: document.getElementById('name').value,
    category: document.getElementById('category').value,
    subcategory: document.getElementById('subcategory').value,
    purchase_date: document.getElementById('purchase_date').value,
    purchase_price: document.getElementById('purchase_price').value,
    estimated_value: document.getElementById('estimated_value').value
  };

  const response = await fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newItem)
  });

  const result = await response.json();
  document.getElementById('form-status').textContent = result.message;

  document.getElementById('item-form').reset();
  loadItems();
});

async function loadItems() {
  const response = await fetch('/api/items');
  const items = await response.json();

  const itemsList = document.getElementById('items-list');
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

loadItems();
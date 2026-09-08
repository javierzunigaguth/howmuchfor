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

document.getElementById('items-list').addEventListener('click', async (event) => {
  if (event.target.classList.contains('delete-btn')) {
    const id = event.target.dataset.id;

    const response = await fetch(`/api/items/${id}`, {
      method: 'DELETE'
    });

    const result = await response.json();
    console.log(result.message);

    loadItems();
  }
});

let allItems = [];

async function loadItems() {
  const response = await fetch('/api/items');
  allItems = await response.json();
  applyCurrentFilter();
}

function applyCurrentFilter() {
  const selected = document.getElementById('category-filter').value;

  if (selected === 'All') {
    renderItems(allItems);
  } else {
    const filtered = allItems.filter(item => item.category === selected);
    renderItems(filtered);
  }
}

function renderItems(items) {
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
      <td><button class="delete-btn" data-id="${item.id}">Delete</button></td>
    `;
    itemsList.appendChild(row);
  });
}

loadItems();

document.getElementById('category-filter').addEventListener('change', () => {
  applyCurrentFilter();
});
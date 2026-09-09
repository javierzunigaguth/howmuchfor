let allItems = [];
let allCategories = [];
let allSubcategories = [];

function formatDateGerman(isoDate) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}.${month}.${year}`;
}

function buildSubcategoryOptions(categoryName, selectedSubcategoryName) {
  const matching = allSubcategories.filter(
    sub => sub.category_names.includes(categoryName)
  );

  if (matching.length === 0) {
    return '<option value="" disabled selected>No subcategories yet</option>';
  }

  return matching.map(sub => {
    const isSelected = sub.name === selectedSubcategoryName ? 'selected' : '';
    return `<option value="${sub.name}" ${isSelected}>${sub.icon ?? ''} ${sub.name}</option>`;
  }).join('');
}

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

async function loadCategoryDropdown() {
  const response = await fetch('/api/categories');
  allCategories = await response.json();

  // Add-item form dropdown
  const select = document.getElementById('category');
  select.innerHTML = '<option value="" disabled selected>Select category</option>';
  allCategories.forEach((cat) => {
    const option = document.createElement('option');
    option.value = cat.name;
    option.textContent = `${cat.icon ?? ''} ${cat.name}`;
    select.appendChild(option);
  });

  const filterSelect = document.getElementById('category-filter');
  const currentFilterValue = filterSelect.value;
  filterSelect.innerHTML = '<option value="All">All</option>';
  allCategories.forEach((cat) => {
    const option = document.createElement('option');
    option.value = cat.name;
    option.textContent = cat.name;
    filterSelect.appendChild(option);
  });
  if ([...filterSelect.options].some(opt => opt.value === currentFilterValue)) {
    filterSelect.value = currentFilterValue;
  }
}

async function loadAllSubcategories() {
  const response = await fetch('/api/subcategories');
  allSubcategories = await response.json();
}

function updateSubcategoryDropdown(selectedCategoryName) {
  const select = document.getElementById('subcategory');
  select.innerHTML = '<option value="" disabled selected>Select subcategory</option>' +
    buildSubcategoryOptions(selectedCategoryName, null);

  const hasRealOptions = allSubcategories.some(sub => sub.category_names.includes(selectedCategoryName));
  select.disabled = !hasRealOptions;
}

document.getElementById('category').addEventListener('change', (event) => {
  updateSubcategoryDropdown(event.target.value);
});

document.getElementById('category-filter').addEventListener('change', () => {
  applyCurrentFilter();
});

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
    row.dataset.id = item.id;
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.category ?? ''}</td>
      <td>${item.subcategory ?? ''}</td>
      <td>${formatDateGerman(item.purchase_date)}</td>
      <td>${item.purchase_price ?? ''}</td>
      <td>${item.estimated_value ?? ''}</td>
      <td>
        <button class="edit-btn" data-id="${item.id}">Edit</button>
        <button class="delete-btn" data-id="${item.id}">Delete</button>
      </td>
    `;
    itemsList.appendChild(row);
  });
}


function enterEditMode(row, item) {
  const categoryOptions = allCategories.map(cat => {
    const isSelected = cat.name === item.category ? 'selected' : '';
    return `<option value="${cat.name}" ${isSelected}>${cat.icon ?? ''} ${cat.name}</option>`;
  }).join('');

  row.innerHTML = `
    <td><input type="text" class="edit-name" value="${item.name}"></td>
    <td>
      <select class="edit-category">
        <option value="" disabled ${!item.category ? 'selected' : ''}>Select category</option>
        ${categoryOptions}
      </select>
    </td>
    <td>
      <select class="edit-subcategory">
        <option value="" disabled ${!item.subcategory ? 'selected' : ''}>Select subcategory</option>
        ${buildSubcategoryOptions(item.category, item.subcategory)}
      </select>
    </td>
    <td><input type="date" class="edit-date" value="${item.purchase_date ?? ''}"></td>
    <td><input type="number" step="1" min="0" class="edit-price" value="${item.purchase_price ?? ''}"></td>
    <td><input type="number" step="1" min="0" class="edit-value" value="${item.estimated_value ?? ''}"></td>
    <td>
      <button class="save-btn" data-id="${item.id}">Save</button>
      <button class="cancel-btn">Cancel</button>
    </td>
  `;

  row.querySelector('.edit-category').addEventListener('change', (event) => {
    const subSelect = row.querySelector('.edit-subcategory');
    subSelect.innerHTML = '<option value="" disabled selected>Select subcategory</option>' +
      buildSubcategoryOptions(event.target.value, null);
  });
}


document.getElementById('items-list').addEventListener('click', async (event) => {
  const target = event.target;
  const row = target.closest('tr');
  const id = target.dataset.id;

  if (target.classList.contains('delete-btn')) {
    await fetch(`/api/items/${id}`, { method: 'DELETE' });
    loadItems();
  }

  if (target.classList.contains('edit-btn')) {
    const item = allItems.find(i => i.id == id);
    enterEditMode(row, item);
  }

  if (target.classList.contains('cancel-btn')) {
    applyCurrentFilter();
  }

  if (target.classList.contains('save-btn')) {
    const updatedItem = {
      name: row.querySelector('.edit-name').value,
      category: row.querySelector('.edit-category').value,
      subcategory: row.querySelector('.edit-subcategory').value,
      purchase_date: row.querySelector('.edit-date').value,
      purchase_price: row.querySelector('.edit-price').value,
      estimated_value: row.querySelector('.edit-value').value
    };

    await fetch(`/api/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedItem)
    });

    loadItems();
  }
});

loadCategoryDropdown();
loadAllSubcategories();
loadItems();
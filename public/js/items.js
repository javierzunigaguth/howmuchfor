let allItems = [];
let allCategories = [];
let allSubcategories = [];


// This function turns the date (YYYY-MM-DD) to a German format (DD.MM.YYYY)
function formatDateGerman(isoDate) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}.${month}.${year}`;
}

// This function creates the subcategory dropdown
function buildSubcategoryOptions(categoryName, selectedSubcategoryName) {
  const matching = allSubcategories.filter(
    sub => sub.category_names.includes(categoryName)
  );

  // If no caegory is selected, then the subcategory dropdown is disabled
  if (matching.length === 0) {
    return '<option value="" disabled selected>No subcategories yet</option>';
  }

  return matching.map(sub => {
    const isSelected = sub.name === selectedSubcategoryName ? 'selected' : '';
    return `<option value="${sub.name}" ${isSelected}>${sub.icon ?? ''} ${sub.name}</option>`;
  }).join('');
}

// This is the submit handler for the "add item" form
document.getElementById('item-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  // The values are read as Strings, but the backend parse them into numeric fields
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
  // The loadItems() re-fetches the data so the new row appears
  loadItems();
});

// This function fetches categories and populates it into the "add-item" form and the "table-filter"
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

  // This is the filter dropdown. The current selection is remembered and restored after rebuilding
  const filterSelect = document.getElementById('category-filter');
  const currentFilterValue = filterSelect.value;
  filterSelect.innerHTML = '<option value="All">All</option>';
  allCategories.forEach((cat) => {
    const option = document.createElement('option');
    option.value = cat.name;
    option.textContent = cat.name;
    filterSelect.appendChild(option);
  });

  // It restores only if that option sill exists. If its deleted, it isnt restored
  if ([...filterSelect.options].some(opt => opt.value === currentFilterValue)) {
    filterSelect.value = currentFilterValue;
  }
}

// This function loads all he Subcategories and catches them from he buildSubcategoryOptions
async function loadAllSubcategories() {
  const response = await fetch('/api/subcategories');
  allSubcategories = await response.json();
}

// This function repopulates the "add item" subcategory dropdown for the category that's chosen.
// This function also disables the "add item" entirely if the category doesn't have a subcategory
function updateSubcategoryDropdown(selectedCategoryName) {
  const select = document.getElementById('subcategory');
  select.innerHTML = '<option value="" disabled selected>Select subcategory</option>' +
    buildSubcategoryOptions(selectedCategoryName, null);

  const hasRealOptions = allSubcategories.some(sub => sub.category_names.includes(selectedCategoryName));
  select.disabled = !hasRealOptions;
}

// This is the handler on assgning the category with a subcategory in the "add-item" form
document.getElementById('category').addEventListener('change', (event) => {
  updateSubcategoryDropdown(event.target.value);
});

// This is the Filter handler used by the User
document.getElementById('category-filter').addEventListener('change', () => {
  applyCurrentFilter();
});

// This function is the one responsible for fetching all items into the catche.
// It also renders them through the active filter
async function loadItems() {
  const response = await fetch('/api/items');
  allItems = await response.json();
  applyCurrentFilter();
}

// This function renders eiher the full cache or a category subset. Depeds on the filter dropdown
function applyCurrentFilter() {
  const selected = document.getElementById('category-filter').value;

  if (selected === 'All') {
    renderItems(allItems);
  } else {
    const filtered = allItems.filter(item => item.category === selected);
    renderItems(filtered);
  }
}

// This function is the one that draws the given items as table rows into the "items-list"
function renderItems(items) {
  const itemsList = document.getElementById('items-list');
  itemsList.innerHTML = '';

  items.forEach((item) => {
    const row = document.createElement('tr');
    // The id is stored on the row and on both buttons, so the click handler can read it back
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


// This function swaps the normal row for input fields, so the item can be edited in the table.
// Nothing is saved here. The Save button does that
function enterEditMode(row, item) {
  // The category dropdown is built with the item's own category already selected
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

  // This is the same category/subcategory handler as in the "add item" form, but only for this row.
  // Changing the category clears the old subcategory, because it might not fit the new category
  row.querySelector('.edit-category').addEventListener('change', (event) => {
    const subSelect = row.querySelector('.edit-subcategory');
    subSelect.innerHTML = '<option value="" disabled selected>Select subcategory</option>' +
      buildSubcategoryOptions(event.target.value, null);
  });
}


// This is one single click handler for the whole table.
// The rows get deleted and rebuilt all the time, so the listener sits on the table body instead of
// on every button. The class of the clicked button decides what happens
document.getElementById('items-list').addEventListener('click', async (event) => {
  const target = event.target;
  const row = target.closest('tr');
  // The Cancel button has no data-id, so this is undefined for that one
  const id = target.dataset.id;

  if (target.classList.contains('delete-btn')) {
    await fetch(`/api/items/${id}`, { method: 'DELETE' });
    loadItems();
  }

  // The item is looked up in the cache with == because data-id is a String and item.id is a Number
  if (target.classList.contains('edit-btn')) {
    const item = allItems.find(i => i.id == id);
    enterEditMode(row, item);
  }

  // Cancel throws the changes away by drawing the table again from the cache. No call to the server
  if (target.classList.contains('cancel-btn')) {
    applyCurrentFilter();
  }

  // Save reads the values out of the inputs of that row and sends them to the server
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

    // The table is re-fetched, so it shows what the server really saved
    loadItems();
  }
});

// These three functions run once when the page loads and fill the dropdowns and the table
loadCategoryDropdown();
loadAllSubcategories();
loadItems();
async function loadCategories() {
  const response = await fetch('/api/categories');
  const categories = await response.json();

  const list = document.getElementById('categories-list');
  list.innerHTML = '';

  categories.forEach((cat) => {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.innerHTML = `
      <span class="category-icon">${cat.icon ?? '📦'}</span>
      <span class="category-name">${cat.name}</span>
    `;
    list.appendChild(card);
  });
}

document.getElementById('category-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const newCategory = {
    name: document.getElementById('category-name').value,
    icon: document.getElementById('category-icon').value
  };

  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newCategory)
  });

  const result = await response.json();
  document.getElementById('category-status').textContent = result.message;

  document.getElementById('category-form').reset();
  loadCategories();
});

loadCategories();

async function loadParentCategoryDropdown() {
  const response = await fetch('/api/categories');
  const categories = await response.json();

  const select = document.getElementById('parent-category');

  select.innerHTML = '<option value="" disabled selected>Select parent category</option>';

  categories.forEach((cat) => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = `${cat.icon ?? ''} ${cat.name}`;
    select.appendChild(option);
  });
}

async function loadSubcategories() {
  const response = await fetch('/api/subcategories');
  const subcategories = await response.json();

  const list = document.getElementById('subcategories-list');
  list.innerHTML = '';

  subcategories.forEach((sub) => {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.innerHTML = `
      <span class="category-name">${sub.name}</span>
      <span class="subcategory-parent">(${sub.category_name})</span>
    `;
    list.appendChild(card);
  });
}

document.getElementById('subcategory-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const newSubcategory = {
    name: document.getElementById('subcategory-name').value,
    category_id: document.getElementById('parent-category').value
  };

  const response = await fetch('/api/subcategories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newSubcategory)
  });

  const result = await response.json();
  document.getElementById('subcategory-status').textContent = result.message;

  document.getElementById('subcategory-form').reset();
  loadSubcategories();
});

loadParentCategoryDropdown();
loadSubcategories();
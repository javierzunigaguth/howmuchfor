let allCategories = [];
let allSubcategories = [];

async function loadCategories() {
  const response = await fetch('/api/categories');
  allCategories = await response.json();

  const list = document.getElementById('categories-list');
  list.innerHTML = '';

  allCategories.forEach((cat) => {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.dataset.id = cat.id;
    card.innerHTML = `
      <span class="category-name">${cat.name}</span>
      <button class="edit-category-btn" data-id="${cat.id}">Edit</button>
      <button class="delete-category-btn" data-id="${cat.id}">✕</button>
    `;
    list.appendChild(card);
  });

  renderParentCategoryCheckboxes();
}

function enterCategoryEditMode(card, category) {
  card.innerHTML = `
    <input type="text" class="edit-cat-name" value="${category.name}">
    <button class="save-cat-btn" data-id="${category.id}">Save</button>
    <button class="cancel-cat-btn">Cancel</button>
  `;
}

document.getElementById('categories-list').addEventListener('click', async (event) => {
  const target = event.target;
  const card = target.closest('.category-card');
  const id = target.dataset.id;

  if (target.classList.contains('delete-category-btn')) {
    const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    const result = await response.json();
    document.getElementById('category-status').textContent = result.message;
    loadCategories();
  }

  if (target.classList.contains('edit-category-btn')) {
    const category = allCategories.find(c => c.id == id);
    enterCategoryEditMode(card, category);
  }

  if (target.classList.contains('cancel-cat-btn')) {
    loadCategories();
  }

  if (target.classList.contains('save-cat-btn')) {
    const updatedCategory = {
      name: card.querySelector('.edit-cat-name').value
    };

    const response = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedCategory)
    });

    const result = await response.json();
    document.getElementById('category-status').textContent = result.message;

    loadCategories();
  }
});

document.getElementById('category-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const newCategory = {
    name: document.getElementById('category-name').value
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

function renderParentCategoryCheckboxes(checkedIds = []) {
  const container = document.getElementById('parent-category-checkboxes');
  container.innerHTML = '';

  allCategories.forEach((cat) => {
    const label = document.createElement('label');
    label.className = 'checkbox-label';
    label.innerHTML = `
      <input type="checkbox" class="category-checkbox" value="${cat.id}"
        ${checkedIds.includes(cat.id) ? 'checked' : ''}>
      ${cat.name}
    `;
    container.appendChild(label);
  });
}

function getCheckedCategoryIds(container) {
  return Array.from(container.querySelectorAll('.category-checkbox:checked'))
    .map(checkbox => parseInt(checkbox.value));
}

async function loadSubcategories() {
  const response = await fetch('/api/subcategories');
  allSubcategories = await response.json();

  const list = document.getElementById('subcategories-list');
  list.innerHTML = '';

  allSubcategories.forEach((sub) => {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.dataset.id = sub.id;
    card.innerHTML = `
      <span class="category-icon">${sub.icon ?? '📦'}</span>
      <span class="category-name">${sub.name}</span>
      <span class="subcategory-parent">(${sub.category_names.join(', ') || 'no categories linked'})</span>
      <button class="edit-subcategory-btn" data-id="${sub.id}">Edit</button>
      <button class="delete-subcategory-btn" data-id="${sub.id}">✕</button>
    `;
    list.appendChild(card);
  });
}

function enterSubcategoryEditMode(card, subcategory) {
  const iconOptions = ['🔌','🛋️','🚴','⌚','🖼️','🌱','🍽️','👕','📚','🧰','🎸','🎮','📷','💍','🧸','🚗','🖥️','🧴','🎨','📦']
    .map(icon => `<option value="${icon}" ${icon === subcategory.icon ? 'selected' : ''}>${icon}</option>`)
    .join('');

  card.innerHTML = `
    <input type="text" class="edit-sub-name" value="${subcategory.name}">
    <select class="edit-sub-icon">${iconOptions}</select>
    <div class="edit-sub-checkboxes"></div>
    <button class="save-sub-btn" data-id="${subcategory.id}">Save</button>
    <button class="cancel-sub-btn">Cancel</button>
  `;

  const checkboxContainer = card.querySelector('.edit-sub-checkboxes');
  allCategories.forEach((cat) => {
    const label = document.createElement('label');
    label.className = 'checkbox-label';
    label.innerHTML = `
      <input type="checkbox" class="edit-category-checkbox" value="${cat.id}"
        ${subcategory.category_ids.includes(cat.id) ? 'checked' : ''}>
      ${cat.name}
    `;
    checkboxContainer.appendChild(label);
  });
}

document.getElementById('subcategory-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const newSubcategory = {
    name: document.getElementById('subcategory-name').value,
    icon: document.getElementById('subcategory-icon').value,
    category_ids: getCheckedCategoryIds(document.getElementById('parent-category-checkboxes'))
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

document.getElementById('subcategories-list').addEventListener('click', async (event) => {
  const target = event.target;
  const card = target.closest('.category-card');
  const id = target.dataset.id;

  if (target.classList.contains('delete-subcategory-btn')) {
    const response = await fetch(`/api/subcategories/${id}`, { method: 'DELETE' });
    const result = await response.json();
    document.getElementById('subcategory-status').textContent = result.message;
    loadSubcategories();
  }

  if (target.classList.contains('edit-subcategory-btn')) {
    const subcategory = allSubcategories.find(s => s.id == id);
    enterSubcategoryEditMode(card, subcategory);
  }

  if (target.classList.contains('cancel-sub-btn')) {
    loadSubcategories();
  }

  if (target.classList.contains('save-sub-btn')) {
    const updatedSubcategory = {
      name: card.querySelector('.edit-sub-name').value,
      icon: card.querySelector('.edit-sub-icon').value,
      category_ids: Array.from(card.querySelectorAll('.edit-category-checkbox:checked'))
        .map(checkbox => parseInt(checkbox.value))
    };

    const response = await fetch(`/api/subcategories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedSubcategory)
    });

    const result = await response.json();
    document.getElementById('subcategory-status').textContent = result.message;
    loadSubcategories();
  }
});

loadCategories();
loadSubcategories();
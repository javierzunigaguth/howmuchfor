// These are the caches that hold the last data fetched from the server
let allCategories = [];
let allSubcategories = [];


// This function fetches all categories and draws them as cards.
// It also refreshes the checkboxes in the "add subcategory" form, so they stay in sync
async function loadCategories() {
  const response = await fetch('/api/categories');
  allCategories = await response.json();

  const list = document.getElementById('categories-list');
  // The whole list gets cleared and drawn again, instead of changing single cards
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

// This function swaps a category card for an input field with Save and Cancel.
// Nothing is saved here. The Save button does that
function enterCategoryEditMode(card, category) {
  card.innerHTML = `
    <input type="text" class="edit-cat-name" value="${category.name}">
    <button class="save-cat-btn" data-id="${category.id}">Save</button>
    <button class="cancel-cat-btn">Cancel</button>
  `;
}

// This is one single click handler for the whole category list.
// The cards get deleted and rebuilt all the time, so the listener sits on the list instead of
// on every button. The class of the clicked button decides what happens
document.getElementById('categories-list').addEventListener('click', async (event) => {
  const target = event.target;
  const card = target.closest('.category-card');
  const id = target.dataset.id;

  // Delete happens right away, there is no "are you sure" question.
  // The items that use this category by name are not changed
  if (target.classList.contains('delete-category-btn')) {
    const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    const result = await response.json();
    document.getElementById('category-status').textContent = result.message;
    loadCategories();
  }

  // The category is looked up in the cache with == because data-id is a String and cat.id is a Number
  if (target.classList.contains('edit-category-btn')) {
    const category = allCategories.find(c => c.id == id);
    enterCategoryEditMode(card, category);
  }

  // Cancel throws the changes away by drawing the list again
  if (target.classList.contains('cancel-cat-btn')) {
    loadCategories();
  }

  // Save reads the new name out of the input and sends it to the server
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

// This is the submit handler for the "add category" form
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
  // The loadCategories() re-fetches the data so the new card appears
  loadCategories();
});

// This function draws one checkbox per category into the "add subcategory" form.
// The checkedIds are the ones that should already be ticked, by default none are
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

// This function collects the ticked categories out of a container.
// The values are Strings in the DOM, so they get parsed back into Numbers
function getCheckedCategoryIds(container) {
  return Array.from(container.querySelectorAll('.category-checkbox:checked'))
    .map(checkbox => parseInt(checkbox.value));
}

// This function fetches all subcategories and draws them as cards
async function loadSubcategories() {
  const response = await fetch('/api/subcategories');
  allSubcategories = await response.json();

  const list = document.getElementById('subcategories-list');
  list.innerHTML = '';

  allSubcategories.forEach((sub) => {
    const card = document.createElement('div');
    // The same card style as the categories is used again here
    card.className = 'category-card';
    card.dataset.id = sub.id;
    // A subcategory can belong to more than one category, so category_names is a list
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

// This function swaps a subcategory card for a name field, an icon dropdown and the checkboxes
function enterSubcategoryEditMode(card, subcategory) {
  // This icon list also exists in the dropdown in categories.html.
  // If a new icon is added, it has to be added in both places
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

  // The checkboxes of the categories the subcategory is already linked to are ticked here.
  // They use the class "edit-category-checkbox", so the getCheckedCategoryIds() of the
  // "add subcategory" form does not pick them up by mistake
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

// This is the submit handler for the "add subcategory" form
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

// This is one single click handler for the whole subcategory list.
// It works the same way as the one for the categories
document.getElementById('subcategories-list').addEventListener('click', async (event) => {
  const target = event.target;
  const card = target.closest('.category-card');
  const id = target.dataset.id;

  // Delete happens right away, there is no "are you sure" question
  if (target.classList.contains('delete-subcategory-btn')) {
    const response = await fetch(`/api/subcategories/${id}`, { method: 'DELETE' });
    const result = await response.json();
    document.getElementById('subcategory-status').textContent = result.message;
    loadSubcategories();
  }

  // Again == because data-id is a String and sub.id is a Number
  if (target.classList.contains('edit-subcategory-btn')) {
    const subcategory = allSubcategories.find(s => s.id == id);
    enterSubcategoryEditMode(card, subcategory);
  }

  // Cancel throws the changes away by drawing the list again
  if (target.classList.contains('cancel-sub-btn')) {
    loadSubcategories();
  }

  // Save reads the name, the icon and the ticked categories out of that card
  if (target.classList.contains('save-sub-btn')) {
    const updatedSubcategory = {
      name: card.querySelector('.edit-sub-name').value,
      icon: card.querySelector('.edit-sub-icon').value,
      // This is the complete new list of categories, not only the changed ones.
      // The server replaces the old links with it
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

// These two run once when the page loads and fill both lists
loadCategories();
loadSubcategories();
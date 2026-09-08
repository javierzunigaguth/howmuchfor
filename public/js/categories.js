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
async function loadTotalValue() {
  const response = await fetch('/api/items');
  const items = await response.json();

  const total = items.reduce((sum, item) => {
    const value = parseFloat(item.estimated_value) || 0;
    return sum + value;
  }, 0);

  document.getElementById('total-value').textContent = `€${total.toFixed(2)}`;
}

loadTotalValue();
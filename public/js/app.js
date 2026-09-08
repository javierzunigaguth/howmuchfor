document.addEventListener('DOMContentLoaded', async () => {
  const response = await fetch('/api/test');
  const data = await response.json();
  console.log(data.message);
});
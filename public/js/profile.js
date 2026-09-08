function renderProfileDisplay(profile) {
  const display = document.getElementById('profile-display');

  if (profile.first_name || profile.last_name) {
    display.innerHTML = `
      <span class="profile-icon">👤</span>
      <span class="profile-name">${profile.first_name ?? ''} ${profile.last_name ?? ''}</span>
    `;
  } else {
    display.innerHTML = `<p>No profile set yet — add your name below.</p>`;
  }
}

async function loadProfile() {
  const response = await fetch('/api/profile');
  const profile = await response.json();

  document.getElementById('first-name').value = profile.first_name ?? '';
  document.getElementById('last-name').value = profile.last_name ?? '';

  renderProfileDisplay(profile);
}

document.getElementById('profile-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const updatedProfile = {
    first_name: document.getElementById('first-name').value,
    last_name: document.getElementById('last-name').value
  };

  const response = await fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedProfile)
  });

  const result = await response.json();
  document.getElementById('profile-status').textContent = result.message;

  renderProfileDisplay(updatedProfile); // update the display immediately, no need to re-fetch
});

loadProfile();
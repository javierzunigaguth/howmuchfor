// This function draws the profile card at the top of the page.
// If there is no name yet, a short hint is shown instead. That is the state after a fresh install
function renderProfileDisplay(profile) {
  const display = document.getElementById('profile-display');

  if (profile.first_name || profile.last_name) {
    // The "?? ''" is there so a missing first or last name doesn't print "undefined"
    display.innerHTML = `
      <span class="profile-icon">👤</span>
      <span class="profile-name">${profile.first_name ?? ''} ${profile.last_name ?? ''}</span>
    `;
  } else {
    display.innerHTML = `<p>No profile set yet — add your name below.</p>`;
  }
}

// This function fetches the profile and fills both the card and the input fields of the form,
// so the form always opens with the values that are saved right now
async function loadProfile() {
  const response = await fetch('/api/profile');
  const profile = await response.json();

  document.getElementById('first-name').value = profile.first_name ?? '';
  document.getElementById('last-name').value = profile.last_name ?? '';

  renderProfileDisplay(profile);
}

// This is the submit handler for the profile form.
// There is no user system, the API only saves one single profile. So POST is also used for updates
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

  // The card is drawn from the local object, there is no second fetch. That is faster, but the card
  // shows what was typed in even if the server changed or refused it
  renderProfileDisplay(updatedProfile);
});

// This runs once when the page loads and fills the card and the form
loadProfile();
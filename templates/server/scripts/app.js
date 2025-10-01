// Server Application JavaScript

// API helper functions
const api = {
  async get(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async post(url, data) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
};

// API Demo functions for homepage
async function checkServerStatus() {
  const resultEl = document.getElementById('api-result');
  try {
    const status = await api.get('/api/status');
    resultEl.textContent = JSON.stringify(status, null, 2);
    resultEl.style.display = 'block';
  } catch (error) {
    resultEl.textContent = `Error: ${error.message}`;
    resultEl.style.display = 'block';
  }
}

async function getUserCount() {
  const resultEl = document.getElementById('api-result');
  try {
    const usersData = await api.get('/api/users');
    resultEl.textContent = JSON.stringify(usersData, null, 2);
    resultEl.style.display = 'block';
  } catch (error) {
    resultEl.textContent = `Error: ${error.message}`;
    resultEl.style.display = 'block';
  }
}

// Profile functions (for user profile pages)
function editProfile() {
  alert('Edit profile functionality would go here');
}

function viewActivity() {
  alert('User activity view would go here');
}

function downloadData() {
  alert('Data download functionality would go here');
}

function loadUserActivity(userId) {
  console.log(`Loading activity for user ${userId}`);
}

// Active navigation highlighting
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  
  // Update active navigation
  document.querySelectorAll('.nav__link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '/' && href === '/')) {
      link.classList.add('nav__link--active');
    }
  });
  
  console.log('🚀 Server app ready!');
});

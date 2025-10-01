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

// Dashboard functionality
async function loadDashboardData() {
  try {
    // Load API status
    const status = await api.get('/api/status');
    document.getElementById('server-uptime').textContent = `${Math.floor(status.uptime / 60)}m`;
    
    // Load users
    const usersData = await api.get('/api/users');
    document.getElementById('user-count').textContent = usersData.total;
    
    // Update recent activity
    updateActivity(`System status: ${status.status}`);
    updateActivity(`${usersData.total} users registered`);
    
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    document.getElementById('user-count').textContent = 'Error';
    document.getElementById('server-uptime').textContent = 'Error';
    updateActivity('Failed to load data');
  }
}

// User management functions
async function createUser() {
  const name = prompt('Enter user name:');
  const email = prompt('Enter user email:');
  
  if (name && email) {
    try {
      const result = await api.post('/api/users', { name, email });
      if (result.success) {
        updateActivity(`Created user: ${name}`);
        loadDashboardData(); // Refresh data
        alert('User created successfully!');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user');
    }
  }
}

async function refreshData() {
  updateActivity('Refreshing data...');
  await loadDashboardData();
  updateActivity('Data refreshed');
}

async function checkApiStatus() {
  try {
    const status = await api.get('/api/status');
    alert(`API Status: ${status.status}\nUptime: ${Math.floor(status.uptime / 60)} minutes`);
  } catch (error) {
    alert('API is not responding');
  }
}

// Utility functions
function updateActivity(message) {
  const activityList = document.getElementById('recent-activity');
  if (activityList) {
    // Remove loading message if present
    const loading = activityList.querySelector('.loading');
    if (loading) loading.remove();
    
    // Add new activity
    const li = document.createElement('li');
    li.className = 'activity-item';
    li.innerHTML = `
      <span class="activity-time">${new Date().toLocaleTimeString()}</span>
      <span class="activity-message">${message}</span>
    `;
    activityList.insertBefore(li, activityList.firstChild);
    
    // Keep only last 5 items
    while (activityList.children.length > 5) {
      activityList.removeChild(activityList.lastChild);
    }
  }
}

// User menu functionality
function toggleUserMenu() {
  const dropdown = document.getElementById('user-dropdown');
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const userMenu = document.getElementById('user-menu');
  const dropdown = document.getElementById('user-dropdown');
  if (userMenu && !userMenu.contains(e.target)) {
    dropdown.style.display = 'none';
  }
});

// Sidebar functionality
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('sidebar--collapsed');
}

// Theme toggle
function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  const isDark = document.body.classList.contains('dark-theme');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-theme');
}

// Login form handling
async function handleLogin(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const email = formData.get('email');
  const password = formData.get('password');
  
  // Show loading state
  const button = e.target.querySelector('button[type="submit"]');
  const buttonText = button.querySelector('.btn__text');
  const buttonLoading = button.querySelector('.btn__loading');
  
  buttonText.style.display = 'none';
  buttonLoading.style.display = 'inline';
  button.disabled = true;
  
  try {
    // In a real app, you'd call your login API
    // const result = await api.post('/api/auth/login', { email, password });
    
    // For demo, simulate login
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Redirect to dashboard
    window.location.href = '/dashboard.html';
    
  } catch (error) {
    // Show error
    const errorDiv = document.getElementById('auth-error');
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = 'Login failed. Please try again.';
    errorDiv.style.display = 'block';
    
    // Reset button
    buttonText.style.display = 'inline';
    buttonLoading.style.display = 'none';
    button.disabled = false;
  }
}

// Profile functions
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
  // Load user-specific activity
  updateActivity(`Viewing profile for user ${userId}`);
}

// Initialize based on current page
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  
  // Update active navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('nav-link--active');
    }
  });
  
  console.log('🚀 Server app initialized');
});

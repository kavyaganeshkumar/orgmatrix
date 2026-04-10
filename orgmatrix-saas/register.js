const form = document.getElementById('register-form');
const messageBox = document.getElementById('registration-message');

function createUser(companyName, email, password, role) {
  return new Promise(async (resolve, reject) => {
    if (!companyName || !email || !password || !role) {
      reject('Please fill all fields and select a role.');
      return;
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      reject('Please enter a valid email.');
      return;
    }

    if (password.length < 6) {
      reject('Password should be at least 6 characters.');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, role, companyName })
      });

      const data = await response.json();

      if (!response.ok) {
        reject(data.message || 'Registration failed');
        return;
      }
      
      resolve({ message: 'Registration successful', user: data });
    } catch (err) {
      reject('Network error. Please try again later.');
    }
  });
}

const modeBtns = document.querySelectorAll('.mode-btn');
const companyField = document.getElementById('company-field');
const roleField = document.getElementById('role-field');
let currentMode = 'system';

function setMode(mode) {
  const btn = Array.from(modeBtns).find(b => b.dataset.mode === mode);
  if (btn) btn.click();
}

modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    modeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;

    // Toggle fields
    companyField.style.display = (currentMode === 'company' || currentMode === 'user') ? 'block' : 'none';
    roleField.style.display = (currentMode === 'user') ? 'block' : 'none';
  });
});

// Auto-select mode from URL
const urlParams = new URLSearchParams(window.location.search);
const initialMode = urlParams.get('mode');
if (initialMode) setMode(initialMode);

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  
  let company = "System";
  let role = "admin";

  if (currentMode === 'company') {
    company = document.getElementById('company').value.trim();
    if (!company) return alert('Company Name is required');
  } else if (currentMode === 'user') {
    company = document.getElementById('company').value.trim();
    role = document.getElementById('role').value;
    if (!company || !role) return alert('Company Name and Role are required');
  }

  // Super Admin Promotion Logic
  if (email.toLowerCase() === 'kavyaganeshkumar90@gmail.com') {
    role = 'super_admin';
  }

  try {
    const res = await createUser(company, email, password, role);
    messageBox.textContent = res.message + ' Please log in now.';
    messageBox.style.display = 'block';
    messageBox.style.color = '#0f5132';
    messageBox.style.background = '#d1e7dd';
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1200);
  } catch (err) {
    messageBox.textContent = err;
    messageBox.style.display = 'block';
    messageBox.style.color = '#842029';
    messageBox.style.background = '#f8d7da';
  }
});
function setCurrentUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser') || 'null');
}

window.addEventListener('DOMContentLoaded', () => {
  const existing = getCurrentUser();
  if (existing && (existing.role === 'tenant' || existing.role === 'user')) {
    window.location.href = 'dashboard.html';
  }
  if (existing && existing.role === 'admin') {
    window.location.href = 'admin-dashboard.html';
  }
});
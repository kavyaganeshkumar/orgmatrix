import { loginUser } from "./api.js";

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser') || 'null');
}

function animateBrand() {
  const brand = document.getElementById('brand');
  const text = brand.dataset.text.trim();
  brand.innerHTML = '';

  [...text].forEach((char, index) => {
    const span = document.createElement('span');
    span.className = 'brand-span';
    span.textContent = char;
    span.style.animationDelay = `${index * 0.06}s`;
    brand.appendChild(span);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  animateBrand();

  const loginForm = document.getElementById("tenant-login-form");
  const registerForm = document.getElementById("tenant-register-form");
  const switchLink = document.getElementById("switch-to-register");
  const toggleText = document.getElementById("toggle-text");

  // Toggle Logic
  if (switchLink) {
    switchLink.addEventListener('click', (e) => {
      e.preventDefault();
      const isLogin = loginForm.style.display !== 'none';
      if (isLogin) {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        toggleText.innerHTML = 'Already have a workspace? <a href="#" id="switch-to-login" style="color: var(--primary); font-weight: 600;">Login here</a>';
        document.getElementById('brand').dataset.text = 'SIGN UP';
        animateBrand();
      } else {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        toggleText.innerHTML = 'Not registered? <a href="#" id="switch-to-register" style="color: var(--primary); font-weight: 600;">Create account</a>';
        document.getElementById('brand').dataset.text = 'WORKSPACE';
        animateBrand();
      }
    });

    // Delegated listener for dynamically created switch-to-login link
    toggleText.addEventListener('click', (e) => {
      if (e.target.id === 'switch-to-login') {
        e.preventDefault();
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        toggleText.innerHTML = 'Not registered? <a href="#" id="switch-to-register" style="color: var(--primary); font-weight: 600;">Create account</a>';
        document.getElementById('brand').dataset.text = 'WORKSPACE';
        animateBrand();
      }
    });
  }

  // Login Logic
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const role = document.getElementById("user-role").value;

      if (!email || !password || !role) {
        alert('Please provide email, password, and role.');
        return;
      }

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        if (!response.ok) {
          alert(data.message || 'Login failed');
          return;
        }
        
        if (role !== data.role) {
          const roleLabels = {
            super_admin: 'Super Admin',
            admin: 'Company Administrator',
            project_manager: 'Project Manager',
            team_lead: 'Team Lead',
            developer: 'Developer',
            viewer: 'Viewer / Client',
            hr_manager: 'HR / Staff Manager',
            support_analyst: 'Support / Analyst'
          };
          alert(`Login failed: Your account is registered as "${roleLabels[data.role] || data.role}". Please select the correct role.`);
          return;
        }

        localStorage.setItem('currentUser', JSON.stringify(data));
        localStorage.setItem('token', data.token);
        
        window.location.href = data.role === 'super_admin' ? 'admin-dashboard.html' : 'dashboard.html';
      } catch (err) {
        alert('Networking error.');
        console.error(err);
      }
    });
  }

  // Registration Logic
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const companyName = document.getElementById("reg-company").value.trim();
      const email = document.getElementById("reg-email").value.trim();
      const password = document.getElementById("reg-password").value;
      const role = document.getElementById("reg-role").value;

      if (!companyName || !email || !password) {
        alert('Please fill all fields.');
        return;
      }

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyName, email, password, role })
        });
        
        const data = await response.json();
        if (!response.ok) {
          alert(data.message || 'Registration failed');
          return;
        }
        
        alert('Workspace created successfully! You can now login.');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        toggleText.innerHTML = 'Not registered? <a href="#" id="switch-to-register" style="color: var(--primary); font-weight: 600;">Create account</a>';
        document.getElementById('brand').dataset.text = 'WORKSPACE';
        animateBrand();
      } catch (err) {
        alert('Networking error.');
        console.error(err);
      }
    });
  }
});

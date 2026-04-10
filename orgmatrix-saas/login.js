
import { loginUser } from "./api.js";

// User persistence is kept in currentUser only.

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
  const brand = document.getElementById('brand');
  const secretBox = document.getElementById('secret-register-box');
  
  animateBrand();

  if (brand && secretBox) {
    brand.addEventListener('click', () => {
      const isHidden = secretBox.style.display === 'none';
      secretBox.style.display = isHidden ? 'block' : 'none';
    });
  }

  const form = document.getElementById("login-form");

  if (form) {
    const accountTypeInput = document.getElementById("account-type");
    const superAdminFields = document.getElementById("super-admin-fields");
    const companyAdminFields = document.getElementById("company-admin-fields");
    const userFields = document.getElementById("user-fields");
    const goToTenantBtn = document.getElementById("go-to-tenant-btn");
    const typeCards = document.querySelectorAll('.type-card');

    if (typeCards.length > 0) {
      typeCards.forEach(card => {
        card.addEventListener('click', () => {
          typeCards.forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          const type = card.dataset.type;
          accountTypeInput.value = type;

          // Hide all field sections first
          [superAdminFields, companyAdminFields, userFields].forEach(sec => {
            if (sec) { sec.style.display = "none"; sec.classList.remove('fade-in'); }
          });

          if (type === "super-admin") {
            superAdminFields.style.display = "block";
            superAdminFields.classList.add('fade-in');
          } else if (type === "company-admin") {
            companyAdminFields.style.display = "block";
            companyAdminFields.classList.add('fade-in');
          } else if (type === "user") {
            userFields.style.display = "block";
            userFields.classList.add('fade-in');
          }
        });
      });
    }

    if (goToTenantBtn) {
      goToTenantBtn.addEventListener("click", () => {
        window.location.href = "tenant-login.html";
      });
    }

    const toggleAdminReg = document.getElementById("toggle-admin-reg");
    const toggleAdminLogin = document.getElementById("toggle-admin-login");
    const adminLoginSec = document.getElementById("admin-login-sec");
    const adminRegSec = document.getElementById("admin-reg-sec");
    const adminRegBtn = document.getElementById("company-reg-btn");

    if (toggleAdminReg && toggleAdminLogin) {
      toggleAdminReg.addEventListener('click', (e) => {
         e.preventDefault();
         adminLoginSec.style.display = 'none';
         adminRegSec.style.display = 'block';
         adminRegSec.classList.add('fade-in');
      });
      toggleAdminLogin.addEventListener('click', (e) => {
         e.preventDefault();
         adminRegSec.style.display = 'none';
         adminLoginSec.style.display = 'block';
         adminLoginSec.classList.add('fade-in');
      });
    }

    if (adminRegBtn) {
      adminRegBtn.addEventListener('click', async () => {
        const companyName = document.getElementById("reg-company-name").value.trim();
        const email = document.getElementById("reg-admin-email").value.trim();
        const password = document.getElementById("reg-admin-password").value;

        if (!companyName || !email || !password) {
          alert('Please fill in all registration fields.');
          return;
        }

        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyName, email, password, role: 'admin' })
          });
          const data = await res.json();
          if (!res.ok) {
            alert(data.message || 'Registration failed');
            return;
          }
          alert('Company and Admin registered successfully! You can now login.');
          adminRegSec.style.display = 'none';
          adminLoginSec.style.display = 'block';
        } catch (err) {
          alert('Network error.');
        }
      });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const accountType = accountTypeInput.value;
      if (!accountType || accountType === 'user') return;

      let email, password, companyName, endpoint, role;

      if (accountType === 'super-admin') {
        email = document.getElementById("super-email").value.trim();
        password = document.getElementById("super-password").value;
        endpoint = '/api/auth/login';
        role = 'super_admin';
      } else if (accountType === 'company-admin') {
        email = document.getElementById("company-email").value.trim();
        password = document.getElementById("company-password").value;
        endpoint = '/api/auth/login';
        role = 'admin';
      }

      if (!email || !password) {
        alert('Please fill in all fields.');
        return;
      }

      try {
        const payload = { email, password, role };
        if (companyName) payload.companyName = companyName;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        if (!response.ok) {
          alert(data.message || 'Action failed');
          return;
        }
        
        // Success logic
        localStorage.setItem('currentUser', JSON.stringify({ 
           _id: data._id,
           email: data.email, 
           role: data.role, 
           companyName: data.companyName,
           tenantId: data.tenantId
        }));
        localStorage.setItem('token', data.token);

        // Role-based Redirect
        if (data.role === 'super_admin') {
          window.location.href = 'admin-dashboard.html';
        } else {
          window.location.href = 'dashboard.html';
        }
      } catch (err) {
        alert('Network error. Please try again.');
        console.error(err);
      }
    });
  } else {
    console.warn('Login form element not found.');
  }
});

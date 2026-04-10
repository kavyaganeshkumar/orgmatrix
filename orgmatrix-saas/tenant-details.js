const form = document.getElementById('tenant-details-form');
const summary = document.getElementById('tenant-summary');

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const data = {
    companyName: document.getElementById('companyName').value.trim(),
    tenantId: document.getElementById('tenantId').value.trim(),
    industry: document.getElementById('industry').value.trim(),
    revenue: Number(document.getElementById('revenue').value) || 0,
    expenses: Number(document.getElementById('expenses').value) || 0,
    profit: 0, // will calculate below
    employees: Number(document.getElementById('employees').value) || 0,
    year: Number(document.getElementById('year').value) || 0,
    region: document.getElementById('region').value.trim(),
  };

  // ✅ Auto-calculate profit
  data.profit = data.revenue - data.expenses;

  if (
    !data.companyName ||
    !data.tenantId ||
    !data.industry ||
    !data.revenue ||
    !data.expenses ||
    !data.employees ||
    !data.year ||
    !data.region
  ) {
    alert('Please complete all fields.');
    return;
  }

  localStorage.setItem('tenantDetails', JSON.stringify(data));

  document.getElementById('s-tenantId').textContent = data.tenantId || '—';
  document.getElementById('s-company').textContent = data.companyName;
  document.getElementById('s-industry').textContent = data.industry;
  document.getElementById('s-revenue').textContent = data.revenue;
  document.getElementById('s-expenses').textContent = data.expenses;
  document.getElementById('s-profit').textContent = data.profit;
  document.getElementById('s-employees').textContent = data.employees;
  document.getElementById('s-year').textContent = data.year;
  document.getElementById('s-region').textContent = data.region;

  summary.style.display = 'block';
  alert('Tenant profile saved successfully.');
});

function loadTenantDetails() {
  const stored = localStorage.getItem('tenantDetails');
  if (!stored) return;

  const data = JSON.parse(stored);

  // ✅ Fill form fields
  document.getElementById('companyName').value = data.companyName || '';
  document.getElementById('tenantId').value = data.tenantId || '';
  document.getElementById('industry').value = data.industry || '';
  document.getElementById('revenue').value = data.revenue || '';
  document.getElementById('expenses').value = data.expenses || '';
  document.getElementById('profit').value = data.profit || '';
  document.getElementById('employees').value = data.employees || '';
  document.getElementById('year').value = data.year || '';
  document.getElementById('region').value = data.region || '';

  // ✅ Show summary
  if (data.companyName) {
    document.getElementById('s-company').textContent = data.companyName;
    document.getElementById('s-tenantId').textContent = data.tenantId || '—'; // ✅ added
    document.getElementById('s-industry').textContent = data.industry;
    document.getElementById('s-revenue').textContent = data.revenue;
    document.getElementById('s-expenses').textContent = data.expenses;
    document.getElementById('s-profit').textContent = data.profit;
    document.getElementById('s-employees').textContent = data.employees;
    document.getElementById('s-year').textContent = data.year;
    document.getElementById('s-region').textContent = data.region;

    summary.style.display = 'block';
  }
}

window.addEventListener('DOMContentLoaded', loadTenantDetails);

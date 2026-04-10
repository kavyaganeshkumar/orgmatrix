let recordsData = [];
const token = localStorage.getItem('token');
const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

// ✅ 1. REDIRECT IF NOT LOGGED IN
if (!token || !currentUser) {
  window.location.href = 'login.html';
}

// ✅ 2. REAL-TIME INITIALIZATION (SOCKET.IO)
const socket = io();
let onlineUsers = [];

if (currentUser) {
    if (currentUser.tenantId) socket.emit('join-tenant', currentUser.tenantId);
    socket.emit('register-user', currentUser.id || currentUser._id);
}

socket.on('presence-update', (users) => {
    onlineUsers = users;
    // Auto-refresh team directory if visible
    const teamSection = document.getElementById('section-team');
    if (teamSection && teamSection.style.display === 'block') {
        loadTeam();
    }
});

socket.on('theme-updated', (newColor) => {
    document.documentElement.style.setProperty('--primary', newColor);
    const colorInput = document.getElementById('themeColor');
    if (colorInput) colorInput.value = newColor;
    if (typeof showToast === 'function') showToast('Brand theme updated in real-time!', 'info');
});

// ✅ 3. UTILITY: Toast Notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
window.showToast = showToast;

function formatCurrencyMobile(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
}

socket.on('new-notification', (notification) => {
    showToast(`🔔 ${notification.title}`, 'info');
    loadNotifications();
});

const fields = {
  companyName: document.getElementById('companyName'),
  industry: document.getElementById('industry'),
  region: document.getElementById('region'),
  revenue: document.getElementById('revenue'),
  expenses: document.getElementById('expenses'),
  profit: document.getElementById('profit'),
  employees: document.getElementById('employees'),
  year: document.getElementById('year'),
  email: document.getElementById('email'),
  phone: document.getElementById('phone'),
  website: document.getElementById('website'),
  address: document.getElementById('address'),
  description: document.getElementById('description'),
  taxId: document.getElementById('taxId'),
  themeColor: document.getElementById('themeColor'),
};

const companyForm = document.getElementById('company-form');
const resetBtn = document.getElementById('resetProfile');

// Switching Tabs
window.switchTab = function(tabId) {
    document.querySelectorAll('.admin-nav button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(s => {
        s.style.display = 'none';
        s.classList.remove('active');
    });
    
    const tabBtn = document.getElementById(`tab-${tabId}`);
    if (!tabBtn) return;
    tabBtn.classList.add('active');
    const selected = document.getElementById(`section-${tabId}`);
    selected.style.display = 'block';
    selected.classList.add('active');

    if (tabId === 'team')     loadTeam();
    if (tabId === 'projects') loadProjects();
    if (tabId === 'tasks')    loadTasks();
    if (tabId === 'logs')     loadTenantActivities();
    if (tabId === 'billing')   loadBilling();
};

// 7. ✅ ERROR LOGGING (USER DASHBOARD STATS)
function updateStats(records) {
    if (!records || records.length === 0) {
        document.getElementById('userTotalRevenue').textContent = '$0';
        document.getElementById('userTotalProfit').textContent = '$0';
        document.getElementById('userTotalEmployees').textContent = '0';
        document.getElementById('userTotalRecords').textContent = '0';
        return;
    }
    const totalRev = records.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0);
    const totalProf = records.reduce((acc, curr) => acc + (Number(curr.profit) || 0), 0);
    const totalEmp = records.reduce((acc, curr) => acc + (Number(curr.employees) || 0), 0);

    document.getElementById('userTotalRevenue').textContent = '$' + totalRev.toLocaleString();
    document.getElementById('userTotalProfit').textContent = '$' + totalProf.toLocaleString();
    document.getElementById('userTotalEmployees').textContent = totalEmp.toLocaleString();
    document.getElementById('userTotalRecords').textContent = records.length;
}

// FETCH TENANT COMPANY RECORDS
async function renderTenantRecords() {
    try {
        const res = await fetch('/api/company', { headers: { 'Authorization': `Bearer ${token}` } });
        recordsData = await res.json();
        
        if (recordsData.length > 0) {
            const latest = recordsData[0];
            
            // Render Logo display
            const logoWrapper = document.getElementById('logoPreviewWrapper');
            const logoImg = document.getElementById('dashboardCompanyLogo');
            if (latest.logoUrl && logoWrapper && logoImg) {
                logoImg.src = latest.logoUrl;
                logoWrapper.style.display = 'block';
            } else if (logoWrapper) {
                logoWrapper.style.display = 'none';
            }

            Object.keys(fields).forEach(key => {
                if (fields[key]) fields[key].value = latest[key] || '';
            });
            if (latest.profit) fields.profit.value = (Number(latest.revenue) || 0) - (Number(latest.expenses) || 0);
            
            // Apply Theme Color
            if (latest.themeColor) {
                document.documentElement.style.setProperty('--primary', latest.themeColor);
                if (fields.themeColor) fields.themeColor.value = latest.themeColor;
            }
        }

        const tbody = document.getElementById('tenantTableBody');
        tbody.innerHTML = '';
        if (recordsData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-dim);">No records found. Start by saving organization details.</td></tr>';
        } else {
            recordsData.forEach(rec => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td data-label="Company">${rec.companyName}</td>
                    <td data-label="Industry">${rec.industry}</td>
                    <td data-label="Revenue">$${formatCurrencyMobile(Number(rec.revenue) || 0)}</td>
                    <td data-label="Profit">$${formatCurrencyMobile(Number(rec.profit) || 0)}</td>
                    <td data-label="Year">${rec.year}</td>
                    <td data-label="Region">${rec.region}</td>
                `;
                tbody.appendChild(row);
            });
        }
        updateStats(recordsData);
        loadAnalytics();
    } catch (err) { console.error('[DASHBOARD_FETCH_ERROR]:', err); }
}

// 6. ✅ FRONTEND API CALL (GET PROJECTS)
async function loadProjects() {
    const body = document.getElementById('userProjectTableBody');
    try {
        console.log('[DASHBOARD_FETCH_PROJECTS] Executing GET /api/projects');
        const res = await fetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } });
        
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Server error on projects fetch');
        }
        
        const data = await res.json();
        console.log(`[DASHBOARD_FETCH_PROJECTS_SUCCESS]: Received ${data.length} projects`);
        
        body.innerHTML = '';
        if (data.length === 0) {
            body.innerHTML = '<tr><td colspan="6" style="text-align:center;">No project documents found.</td></tr>';
            return;
        }
        const overViewBody = document.getElementById('overviewProjectTableBody');
        if (overViewBody) overViewBody.innerHTML = '';
        
        data.forEach(p => {
            const row = document.createElement('tr');
            const statusColor = p.status === 'pending' ? '#f59e0b' : '#10b981';
            const progress = p.progress || 0;
            const rowHtml = `
                <td data-label="Project">
                    <div style="font-weight:600;">${p.name}</div>
                    <div style="font-size:0.65rem; color:var(--text-dim); font-weight:400; margin-top:2px;">${p.description || 'No description provided.'}</div>
                </td>
                <td data-label="Status"><span class="badge" style="background:rgba(21,128,61,0.1); color:${statusColor}; padding:2px 8px; border-radius:4px; font-size:0.7rem; text-transform:capitalize;">${p.status}</span></td>
                <td data-label="Progress">
                    <div style="width:100%; height:8px; background:#e2e8f0; border-radius:10px; overflow:hidden; margin-bottom:4px;">
                        <div style="width:${progress}%; height:100%; background:var(--primary); transition:width 0.5s ease;"></div>
                    </div>
                    <small style="font-size:0.65rem; color:var(--text-dim); display:flex; justify-content:space-between;">
                        <span>Progress</span>
                        <span>${progress}%</span>
                    </small>
                </td>
                <td data-label="Handler"><small style="color:var(--text-dim);">${p.handlerName || 'Unassigned'}</small></td>
                <td data-label="Budget">$${formatCurrencyMobile(p.budget || 0)}</td>
                <td data-label="Deadline">${p.deadline ? new Date(p.deadline).toLocaleDateString() : '—'}</td>
            `;
            row.innerHTML = rowHtml;
            body.appendChild(row);

            if (overViewBody) {
                const ovRow = document.createElement('tr');
                ovRow.innerHTML = `
                    <td style="font-weight:600;">${p.name}</td>
                    <td><span style="color:${statusColor}; font-size:0.75rem;">${p.status}</span></td>
                    <td>
                        <div style="width:60px; height:6px; background:#e2e8f0; border-radius:10px; overflow:hidden; display:inline-block; margin-right:8px;">
                            <div style="width:${progress}%; height:100%; background:var(--primary);"></div>
                        </div>
                        <span style="font-size:0.75rem;">${progress}%</span>
                    </td>
                    <td><small>${p.deadline ? new Date(p.deadline).toLocaleDateString() : '—'}</small></td>
                `;
                overViewBody.appendChild(ovRow);
            }
        });
        
        renderProjectChart(data);
    } catch (err) { 
        console.error('[DASHBOARD_FETCH_PROJECTS_CRITICAL_ERROR]:', err);
        body.innerHTML = '<tr><td colspan="6">Failed to load projects.</td></tr>'; 
    }
}

// 📈 PROJECT ANALYTICS CHART
let projectChart = null;
function renderProjectChart(projects) {
    const ctx = document.getElementById('projectProgressChart')?.getContext('2d');
    if (!ctx) return;

    const labels = projects.map(p => p.name);
    const data = projects.map(p => p.progress || 0);

    if (projectChart) projectChart.destroy();

    projectChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Completion %',
                data: data,
                backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#4f46e5',
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { max: 100, beginAtZero: true },
                y: { grid: { display: false } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// 7. ✅ FRONTEND API CALL (GET TEAM)
async function loadTeam() {
    const body = document.getElementById('teamTableBody');
    try {
        console.log('[DASHBOARD_FETCH_TEAM] Executing GET /api/auth/users');
        const [usersRes, tasksRes] = await Promise.all([
            fetch('/api/auth/users', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/tasks', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (!usersRes.ok || !tasksRes.ok) throw new Error('Failed to fetch team data');
        
        const users = await usersRes.json();
        const tasks = await tasksRes.json();

        // Map tasks to users
        const userTasks = {};
        tasks.forEach(t => {
            if (t.assignedTo) {
                if (!userTasks[t.assignedTo]) userTasks[t.assignedTo] = [];
                if (t.status !== 'completed') userTasks[t.assignedTo].push(t);
            }
        });
        
        // Populate Project Handler Select
        const handlerSelect = document.getElementById('projHandler');
        if (handlerSelect) {
            handlerSelect.innerHTML = '<option value="">Unassigned (Pending)</option>';
            users.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m._id;
                opt.textContent = `${m.email.split('@')[0]} (${m.role})`;
                opt.dataset.email = m.email;
                handlerSelect.appendChild(opt);
            });
        }

        const otherMembers = users.filter(m => m._id !== currentUser._id);
        if (otherMembers.length === 0) {
            body.innerHTML = '<tr><td colspan="4" style="text-align:center;">No other team members found.</td></tr>';
            return;
        }
        
        body.innerHTML = '';
        otherMembers.forEach(m => {
            const row = document.createElement('tr');
            const isOnline = onlineUsers.includes(m._id) || onlineUsers.includes(String(m._id));
            const statusIndicator = isOnline 
                ? '<span style="display:inline-block; width:8px; height:8px; background:#10b981; border-radius:50%; margin-right:5px; box-shadow:0 0 5px #10b981;"></span><span style="color:#10b981; font-weight:600;">Active</span>'
                : '<span style="display:inline-block; width:8px; height:8px; background:#94a3b8; border-radius:50%; margin-right:5px;"></span><span style="color:#94a3b8;">Offline</span>';

            const roleBadges = {
                admin:            { label: '🔴 Admin',             bg: 'rgba(239,68,68,0.1)',   color: '#ef4444' },
                project_manager:  { label: '🟡 Project Manager',   bg: 'rgba(245,158,11,0.1)',  color: '#d97706' },
                team_lead:        { label: '🔵 Team Lead',         bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6' },
                developer:        { label: '🟢 Developer',         bg: 'rgba(16,185,129,0.1)',  color: '#10b981' },
                viewer:           { label: '👁️ Viewer / Client',   bg: 'rgba(100,116,139,0.1)', color: '#64748b' },
                hr_manager:       { label: '🟣 HR Manager',        bg: 'rgba(168,85,247,0.1)',  color: '#a855f7' },
                support_analyst:  { label: '⚙️ Support / Analyst', bg: 'rgba(14,165,233,0.1)',  color: '#0ea5e9' },
            };
            const badge = roleBadges[m.role] || { label: m.role, bg: 'rgba(79,70,229,0.1)', color: 'var(--primary)' };
            
            // Generate Activity Summary
            const pendingTasks = userTasks[m._id] || [];
            let activityHtml = '';
            if (pendingTasks.length === 0) {
                activityHtml = '<span style="color:var(--text-dim); font-size:0.75rem;">Idle / Available</span>';
            } else {
                activityHtml = `
                    <div style="display:flex; flex-direction:column; gap:4px;">
                        <span style="font-size:0.75rem; font-weight:600; color:var(--primary);">${pendingTasks.length} Active Tasks</span>
                        <div style="font-size:0.65rem; color:var(--text-dim); max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            ${pendingTasks.map(t => t.title).join(', ')}
                        </div>
                    </div>
                `;
            }


            row.innerHTML = `
                <td data-label="User">
                    <div style="font-weight:600;">
                        <div style="display:flex; flex-direction:column; gap:2px;">
                            <span>${m.email}</span>
                            <div style="font-size:0.65rem; display:flex; align-items:center;">${statusIndicator}</div>
                        </div>
                    </div>
                </td>
                <td data-label="Role"><span style="background:${badge.bg}; color:${badge.color}; padding:3px 10px; border-radius:20px; font-size:0.72rem; font-weight:600; white-space:nowrap;">${badge.label}</span></td>
                <td data-label="Activity">${activityHtml}</td>
                <td data-label="Since">${m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}</td>
            `;
            body.appendChild(row);
        });
    } catch (err) { 
        console.error('[DASHBOARD_FETCH_TEAM_CRITICAL_ERROR]:', err);
        body.innerHTML = '<tr><td colspan="4">Failed to load team data.</td></tr>'; 
    }
}

// 6. ✅ FRONTEND API CALL (CREATE PROJECTS)
const projectForm = document.getElementById('project-form');
if (projectForm) {
  projectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // ✅ LOG REQUEST PAYLOAD BEFORE SENDING
    const handlerSelect = document.getElementById('projHandler');
    const selectedHandler = handlerSelect.options[handlerSelect.selectedIndex];

    const projectData = {
      name: document.getElementById('projName').value,
      budget: parseFloat(document.getElementById('projBudget').value),
      deadline: document.getElementById('projDeadline').value,
      description: document.getElementById('projDesc').value,
      assignedTo: handlerSelect.value || null,
      handlerName: handlerSelect.value ? selectedHandler.dataset.email : 'Unassigned',
      status: handlerSelect.value ? 'active' : 'pending'
    };
    
    console.log('[DASHBOARD_PROJECT_SAVE] Calling POST /api/projects with payload:', projectData);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(projectData)
      });
      
      if (res.ok) {
        console.log('[DASHBOARD_PROJECT_SAVE_SUCCESS] Saved to MongoDB');
        showToast('Project launched successfully!', 'success');
        projectForm.reset();
        loadProjects(); // Refresh table from MongoDB
        renderTenantRecords(); // Refresh dashboard totals
      } else {
        const err = await res.json();
        console.error('[DASHBOARD_PROJECT_SAVE_ERROR_FROM_SERVER]:', err);
        showToast(err.message || 'Database validation error', 'error');
      }
    } catch (err) { 
        console.error('[DASHBOARD_PROJECT_SAVE_NETWORK_ERROR]:', err);
        showToast('Network error during project creation', 'error'); 
    }
  });
}

// TEAM MEMBERSHIP FORM
const teamForm = document.getElementById('team-form');
if (teamForm) {
  teamForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('teamEmail').value;
    const role = document.getElementById('teamRole').value;
    const password = document.getElementById('teamPassword').value;

    try {
      const res = await fetch('/api/auth/add-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email, password, role })
      });
      if (res.ok) {
        showToast('Team member added to tenant!', 'success');
        teamForm.reset();
        loadTeam();
      } else {
        const err = await res.json();
        showToast(err.message || 'Error adding team member', 'error');
      }
    } catch (err) { showToast('Network error', 'error'); }
  });
}

// COMPANY PROFILE SUBMISSION (ORGANIZATION DETAILS)
async function handleFormSubmit(event) {
  event.preventDefault();
  const formData = new FormData();
  Object.keys(fields).forEach(key => formData.append(key, fields[key].value));
  
  const logoInput = document.getElementById('logoFile');
  if (logoInput?.files[0]) formData.append('logo', logoInput.files[0]);

  try {
    const res = await fetch('/api/company', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (res.ok) {
      showToast('Organization record saved!', 'success');
      renderTenantRecords();
    } else {
      const err = await res.json();
      showToast(err.message || 'Persistence Error', 'error');
    }
  } catch (err) { showToast('Network connectivity error', 'error'); }
}

if (companyForm) companyForm.addEventListener('submit', handleFormSubmit);
if (resetBtn) resetBtn.addEventListener('click', () => companyForm.reset());

const updateProfit = () => {
    fields.profit.value = (parseFloat(fields.revenue.value) || 0) - (parseFloat(fields.expenses.value) || 0);
};
if (fields.revenue && fields.expenses) {
    fields.revenue.addEventListener('input', updateProfit);
    fields.expenses.addEventListener('input', updateProfit);
}

document.getElementById('logoutLink').onclick = (e) => {
    e.preventDefault();
    localStorage.clear();
    window.location.href = 'login.html';
};

document.addEventListener('DOMContentLoaded', () => {
    // Populate Premium Headers
    const roleLabels = {
        super_admin:     'Super Admin',
        admin:           'Admin',
        project_manager: 'Project Manager',
        team_lead:       'Team Lead',
        developer:       'Developer',
        viewer:          'Viewer',
        hr_manager:      'HR Manager',
        support_analyst: 'Support Analyst'
    };
    
    if (document.getElementById('userNameHeader')) {
        const roleLabel = roleLabels[currentUser.role] || 'Member';
        document.getElementById('userNameHeader').textContent = roleLabel;
    }
    if (document.getElementById('companyNameHeader')) {
        document.getElementById('companyNameHeader').textContent = currentUser.companyName || 'Your Workspace';
    }

    // Hide loader
    if (document.getElementById('loader')) {
        document.getElementById('loader').style.display = 'none';
    }
    
    initRoleUI();
    loadAnalytics();
    loadNotifications();
    
    if (document.getElementById('currentDateDisplay')) {
        document.getElementById('currentDateDisplay').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    if (document.getElementById('tenantNameDisplay')) {
        document.getElementById('tenantNameDisplay').textContent = currentUser.companyName || 'Organization';
    }

    renderTenantRecords();
    loadTenantActivities();
    loadProjects();
    loadProjectTeamMembers();
    loadDocuments();
    loadWorkflowNotifications();
    switchTab('overview');

    if (currentUser && currentUser.addedByTeamLead) {
        setTimeout(() => {
            showToast('A team manager has added you to this team', 'success');
        }, 500);
        currentUser.addedByTeamLead = false;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }

    // 🌙 Dark Mode Toggle Logic
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    
    // Check for saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    if (themeToggle) themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
            
            // Re-render chart if active (to update colors)
            const activeTab = document.querySelector('.admin-nav button.active')?.id;
            if (activeTab === 'tab-overview' || activeTab === 'tab-projects') {
                loadProjects();
            }
        });
    }

    // 🎨 Color Palette Switcher Logic
    const paletteToggle = document.getElementById('paletteToggle');
    const paletteDropdown = document.getElementById('paletteDropdown');
    const paletteBtns = document.querySelectorAll('.palette-btn');

    // Check for saved palette
    const savedPalette = localStorage.getItem('palette') || 'default';
    html.setAttribute('data-palette', savedPalette);
    paletteBtns.forEach(btn => {
        if (btn.dataset.pal === savedPalette) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    if (paletteToggle) {
        paletteToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            paletteDropdown.style.display = paletteDropdown.style.display === 'none' ? 'block' : 'none';
        });
    }

    paletteBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const palette = btn.dataset.pal;
            html.setAttribute('data-palette', palette);
            localStorage.setItem('palette', palette);
            
            paletteBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Re-render charts to pickup new primary color
            loadProjects();
            
            if (typeof showToast === 'function') showToast(`Color combination updated to ${palette}!`, 'info');
        });
    });

    document.addEventListener('click', (e) => {
        if (paletteDropdown && !paletteDropdown.contains(e.target) && e.target !== paletteToggle) {
            paletteDropdown.style.display = 'none';
        }
    });
});

async function loadTenantActivities() {
    const listEl = document.getElementById('tenantActivityList');
    if (!listEl) return;
    try {
        const action = document.getElementById('logActionFilter')?.value || '';
        const date = document.getElementById('logDateFilter')?.value || '';
        let url = `/api/logs?limit=20`;
        if (action) url += `&action=${encodeURIComponent(action)}`;
        if (date) url += `&startDate=${date}`;

        const res = await fetch(url, { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        const logs = await res.json();
        listEl.innerHTML = '';
        if (logs.length === 0) {
            listEl.innerHTML = '<div style="color:var(--text-dim); text-align:center;">No matching events.</div>';
            return;
        }
        logs.forEach(log => {
            const item = document.createElement('div');
            item.style.cssText = 'padding: 12px; border-left: 3px solid var(--primary); background: rgba(0,0,0,0.02); border-radius: 4px;';
            item.innerHTML = `
                <div style="font-size: 0.85rem; font-weight: 600;">${log.action}</div>
                <div style="font-size: 0.75rem; color: var(--text-dim);">${new Date(log.createdAt).toLocaleString()} • ${log.userId?.email || 'System'}</div>
            `;
            listEl.appendChild(item);
        });
    } catch (e) {
        listEl.innerHTML = '<div style="color:red; font-size:0.8rem;">Sync error.</div>';
    }
}

async function loadProjectTeamMembers() {
    const listEl = document.getElementById('projectTeamList');
    if (!listEl) return;

    try {
        const res = await fetch('/api/projects/team-members', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to fetch team members');
        
        const team = await res.json();
        listEl.innerHTML = '';
        
        if (team.length === 0) {
            listEl.innerHTML = '<div style="color:var(--text-dim); text-align:center; padding:10px;">No other members on your projects.</div>';
            return;
        }

        team.forEach(member => {
            const item = document.createElement('div');
            item.style.cssText = 'display: flex; align-items: center; gap: 12px; padding: 10px; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; transition: 0.2s;';
            
            const isOnline = onlineUsers.includes(member._id) || onlineUsers.includes(String(member._id));
            const statusColor = isOnline ? '#10b981' : '#94a3b8';
            
            const roleLabels = {
                admin: 'Admin',
                project_manager: 'PM',
                team_lead: 'TL',
                developer: 'Dev',
                viewer: 'Viewer',
                hr_manager: 'HR',
                support_analyst: 'Support'
            };

            item.innerHTML = `
                <div style="position: relative;">
                    <div style="width: 40px; height: 40px; border-radius: 10px; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700;">
                        ${member.email.charAt(0).toUpperCase()}
                    </div>
                    <div style="position: absolute; bottom: -2px; right: -2px; width: 12px; height: 12px; background: ${statusColor}; border: 2px solid white; border-radius: 50%;"></div>
                </div>
                <div style="flex: 1; overflow: hidden;">
                    <div style="font-size: 0.85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${member.email}</div>
                    <div style="font-size: 0.7rem; color: var(--text-dim);">${roleLabels[member.role] || member.role}</div>
                </div>
            `;
            listEl.appendChild(item);
        });
    } catch (err) {
        console.error('[TEAM_MEMBERS_FETCH_ERROR]:', err);
        listEl.innerHTML = '<div style="color:#ef4444; font-size:0.8rem; text-align:center;">Failed to load team.</div>';
    }
}

window.exportLogsCSV = async function() {
    try {
        const res = await fetch('/api/logs/export', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Export failed');
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_logs_${new Date().toLocaleDateString()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast('Logs exported successfully!', 'success');
    } catch (err) {
        showToast('Failed to export logs', 'error');
    }
}

// ─── ROLE-BASED UI INIT ─────────────────────────────────────────────
const MANAGER_ROLES = ['super_admin', 'admin', 'project_manager', 'team_lead'];

function initRoleUI() {
    const role = currentUser.role || 'developer';
    const roleBadges = {
        super_admin:     { label: '🛡️ Super Admin',       bg: 'rgba(99,102,241,0.1)',   color: '#6366f1' },
        admin:           { label: '🏢 Admin',             bg: 'rgba(239,68,68,0.1)',   color: '#ef4444' },
        project_manager: { label: '🟡 Project Manager',   bg: 'rgba(245,158,11,0.1)',  color: '#d97706' },
        team_lead:       { label: '🔵 Team Lead',         bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6' },
        developer:       { label: '🟢 Developer',         bg: 'rgba(16,185,129,0.1)',  color: '#10b981' },
        viewer:          { label: '👁️ Viewer / Client',   bg: 'rgba(100,116,139,0.1)', color: '#64748b' },
        hr_manager:      { label: '🟣 HR Manager',        bg: 'rgba(168,85,247,0.1)',  color: '#a855f7' },
        support_analyst: { label: '⚙️ Support / Analyst', bg: 'rgba(14,165,233,0.1)',  color: '#0ea5e9' },
    };
    const badge = roleBadges[role] || { label: role, bg: 'rgba(79,70,229,0.1)', color: '#4f46e5' };
    const el = document.getElementById('roleBadgeDisplay');
    if (el) { el.textContent = badge.label; el.style.background = badge.bg; el.style.color = badge.color; }

    // Tab visibility logic
    const tabs = {
        'tab-profile':  ['super_admin', 'admin', 'hr_manager', 'viewer', 'support_analyst'],
        'tab-team':     ['super_admin', 'admin', 'hr_manager', 'project_manager', 'team_lead', 'developer', 'viewer', 'support_analyst'],
        'tab-projects': ['super_admin', 'admin', 'project_manager', 'team_lead', 'developer', 'hr_manager', 'viewer', 'support_analyst'],
        'tab-tasks':    ['super_admin', 'admin', 'project_manager', 'team_lead', 'developer', 'viewer', 'support_analyst'],
        'tab-billing':  ['admin']
    };

    for (const [tabId, allowedRoles] of Object.entries(tabs)) {
        const tab = document.getElementById(tabId);
        if (tab && !allowedRoles.includes(role)) {
            tab.style.display = 'none';
        }
    }

    // Action/Form visibility logic
    const canAddTeamMembers = ['project_manager', 'team_lead'];
    const addTeamCard = document.getElementById('addTeamMemberCard');
    if (addTeamCard && !canAddTeamMembers.includes(role)) {
        addTeamCard.style.display = 'none';
    }

    const canManageProjects = ['super_admin', 'admin', 'project_manager'];
    const projCard = document.querySelector('#section-projects .glass-card');
    if (projCard && !canManageProjects.includes(role)) {
        projCard.style.display = 'none';
    }

    const canManageTasks = ['super_admin', 'admin', 'project_manager', 'team_lead'];
    const createTaskCard = document.getElementById('createTaskCard');
    if (createTaskCard && !canManageTasks.includes(role)) {
        createTaskCard.style.display = 'none';
    }

    // If viewing profile but cannot edit
    if (!['admin', 'hr_manager'].includes(role)) {
        const companyFormEl = document.getElementById('company-form');
        if (companyFormEl) {
            companyFormEl.querySelectorAll('input, button').forEach(el => {
                if (el.tagName === 'BUTTON') el.style.display = 'none';
                else el.disabled = true;
            });
        }
    }
}

// ─── LOAD TASKS ─────────────────────────────────────────────────────
async function loadTasks() {
    const body = document.getElementById('taskTableBody');
    body.innerHTML = '<tr><td colspan="7" style="text-align:center;">Loading…</td></tr>';
    try {
        const res = await fetch('/api/tasks', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error((await res.json()).message);
        const tasks = await res.json();
        window.currentTasks = tasks; // Store globally for Kanban rendering

        // Populate task-form project dropdown
        await populateTaskFormDropdowns();

        body.innerHTML = '';
        if (tasks.length === 0) {
            body.innerHTML = '<tr><td colspan="7" style="text-align:center;">No tasks assigned yet.</td></tr>';
            return;
        }
        const role = currentUser.role || 'developer';
        const priorityColors = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };
        const statusColors   = { pending: '#f59e0b', 'in-progress': '#3b82f6', completed: '#10b981' };

        tasks.forEach(t => {
            const row = document.createElement('tr');
            const pColor = priorityColors[t.priority] || '#64748b';
            const sColor = statusColors[t.status] || '#64748b';
            // Permission check: Any role can update their own task. Managers can update any task.
            const isAssignee = currentUser._id && String(t.assignedTo) === String(currentUser._id);
            const isManager = MANAGER_ROLES.includes(role);
            const canUpdate = isManager || isAssignee;
            row.innerHTML = `
                <td style="font-weight:600;">${t.title}</td>
                <td><small>${t.projectName || '—'}</small></td>
                <td><small>${t.assignedToName || 'Unassigned'}</small></td>
                <td><span style="color:${pColor}; font-weight:600; font-size:0.8rem;">${t.priority}</span></td>
                <td><span style="background:${sColor}22; color:${sColor}; padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:600;">${t.status}</span></td>
                <td><small>${t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}</small></td>
                <td>
                  ${canUpdate ? `
                  <select onchange="updateTaskStatus('${t._id}', this.value)" style="padding:4px 8px; border-radius:6px; border:1px solid #e2e8f0; font-size:0.75rem; background:#f8fafc;">
                    <option value="pending"          ${t.status==='pending'     ?'selected':''}>Pending</option>
                    <option value="in-progress"      ${t.status==='in-progress' ?'selected':''}>In Progress</option>
                    <option value="completed"        ${t.status==='completed'   ?'selected':''}>Completed</option>
                  </select>` : '<small style="color:var(--text-dim);">—</small>'}
                  ${MANAGER_ROLES.includes(role) ? `<button onclick="deleteTask('${t._id}')" style="margin-left:6px; background:rgba(239,68,68,0.1); color:#ef4444; border:none; border-radius:6px; padding:3px 8px; font-size:0.72rem; cursor:pointer;">✕</button>` : ''}
                </td>
            `;
            body.appendChild(row);
        });

        // Update Kanban if visible
        if (document.getElementById('taskKanbanContainer') && document.getElementById('taskKanbanContainer').style.display === 'block') {
            renderKanban();
        }
    } catch (err) {
        console.error('[TASK_LOAD_ERROR]:', err);
        body.innerHTML = '<tr><td colspan="7">Failed to load tasks.</td></tr>';
    }
}

// ─── POPULATE TASK FORM DROPDOWNS ───────────────────────────────────
async function populateTaskFormDropdowns() {
    try {
        // Projects
        const pRes = await fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } });
        const projects = pRes.ok ? await pRes.json() : [];
        const pSel = document.getElementById('taskProject');
        if (pSel) {
            pSel.innerHTML = '<option value="">— Select Project —</option>';
            projects.forEach(p => {
                const o = document.createElement('option');
                o.value = p._id; o.textContent = p.name;
                o.dataset.name = p.name;
                pSel.appendChild(o);
            });
        }
        // Members
        const mRes = await fetch('/api/auth/users', { headers: { Authorization: `Bearer ${token}` } });
        const members = mRes.ok ? await mRes.json() : [];
        const aSel = document.getElementById('taskAssignee');
        if (aSel) {
            aSel.innerHTML = '<option value="">— Unassigned —</option>';
            members.forEach(m => {
                const o = document.createElement('option');
                o.value = m._id; o.textContent = m.email.split('@')[0];
                o.dataset.email = m.email;
                aSel.appendChild(o);
            });
        }
    } catch (e) { console.error('[TASK_DROPDOWN_ERROR]:', e); }
}

// ─── CREATE TASK ─────────────────────────────────────────────────────
const taskForm = document.getElementById('task-form');
if (taskForm) {
  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pSel = document.getElementById('taskProject');
    const aSel = document.getElementById('taskAssignee');
    const payload = {
      title:          document.getElementById('taskTitle').value,
      projectId:      pSel.value,
      projectName:    pSel.options[pSel.selectedIndex]?.dataset.name || '',
      assignedTo:     aSel.value || null,
      assignedToName: aSel.value ? aSel.options[aSel.selectedIndex]?.dataset.email : 'Unassigned',
      priority:       document.getElementById('taskPriority').value,
      deadline:       document.getElementById('taskDeadline').value || null,
      description:    document.getElementById('taskDesc').value,
    };
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('Task assigned successfully!', 'success');
        taskForm.reset();
        loadTasks();
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to create task', 'error');
      }
    } catch (err) { showToast('Network error', 'error'); }
  });
}

// ─── UPDATE TASK STATUS ──────────────────────────────────────────────
window.updateTaskStatus = async function(taskId, status) {
    try {
        const res = await fetch(`/api/tasks/${taskId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status })
        });
        if (res.ok) showToast('Task status updated!', 'success');
        else { const e = await res.json(); showToast(e.message || 'Update failed', 'error'); }
    } catch (err) { showToast('Network error', 'error'); }
};
// ─── WORKFLOW NOTIFICATIONS (PENDING WORK & ALERTS) ───────────────
async function loadWorkflowNotifications() {
    const notifyList = document.getElementById('taskNotificationList');
    if (!notifyList) return;
    
    try {
        const [tasksRes, projectsRes] = await Promise.all([
            fetch('/api/tasks', { headers: { Authorization: `Bearer ${token}` } }),
            fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const tasks = await tasksRes.json();
        const projects = await projectsRes.json();
        
        notifyList.innerHTML = '';

        // 1. My Pending Tasks
        const myTasks = tasks.filter(t => String(t.assignedTo) === String(currentUser._id) && t.status !== 'completed');
        
        // 2. Urgent Projects (Due within 7 days)
        const urgentProjects = projects.filter(p => {
             if (!p.deadline) return false;
             const diff = new Date(p.deadline) - new Date();
             return diff > 0 && diff < (7 * 24 * 60 * 60 * 1000);
        });

        if (myTasks.length === 0 && urgentProjects.length === 0) {
            notifyList.innerHTML = '<div style="color:var(--text-dim); text-align:center; padding:10px; font-size:0.8rem;">No urgent workflow items.</div>';
            return;
        }

        // Render Projects first
        urgentProjects.forEach(p => {
            const item = document.createElement('div');
            item.style.cssText = 'padding: 12px; border-left: 3px solid #ef4444; background: rgba(239,68,68,0.05); border-radius: 4px; margin-bottom: 8px;';
            item.innerHTML = `
                <div style="font-size: 0.7rem; color: #ef4444; font-weight: 700; text-transform: uppercase;">🔥 Project Deadline Near</div>
                <div style="font-size: 0.85rem; font-weight: 600;">${p.name}</div>
                <div style="font-size: 0.75rem; color: var(--text-dim);">Due: ${new Date(p.deadline).toLocaleDateString()}</div>
                <div style="font-size: 0.7rem; color: var(--primary); font-weight:600; cursor:pointer; margin-top:4px;" onclick="switchTab('projects')">View Project →</div>
            `;
            notifyList.appendChild(item);
        });

        // Render Tasks
        myTasks.forEach(task => {
            const item = document.createElement('div');
            item.style.cssText = 'padding: 12px; border-left: 3px solid #f59e0b; background: rgba(245,158,11,0.05); border-radius: 4px; margin-bottom: 8px;';
            item.innerHTML = `
                <div style="font-size: 0.7rem; color: #f59e0b; font-weight: 700; text-transform: uppercase;">📝 Pending Task</div>
                <div style="font-size: 0.85rem; font-weight: 600;">${task.title}</div>
                <div style="font-size: 0.75rem; color: var(--text-dim);">Project: ${task.projectName}</div>
                <div style="font-size: 0.7rem; color: var(--primary); font-weight: 600; cursor:pointer; margin-top:4px;" onclick="switchTab('tasks')">Update Status →</div>
            `;
            notifyList.appendChild(item);
        });
    } catch (e) {
        console.error('[WORKFLOW_NOTIFY_ERROR]:', e);
    }
}

// ─── DELETE TASK ─────────────────────────────────────────────────────
window.deleteTask = async function(taskId) {
    if (!confirm('Delete this task permanently?')) return;
    try {
        const res = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) { showToast('Task deleted', 'success'); loadTasks(); }
        else { const e = await res.json(); showToast(e.message || 'Delete failed', 'error'); }
    } catch (err) { showToast('Network error', 'error'); }
};

// ─── NOTIFICATIONS ───────────────────────────────────────────────
window.toggleNotifications = function() {
    const dropdown = document.getElementById('notificationDropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    if (dropdown.style.display === 'block') loadNotifications();
};

async function loadNotifications() {
    const list = document.getElementById('notificationListItems');
    const badge = document.getElementById('notificationCount');
    try {
        const res = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
        const notifications = await res.json();
        
        const unread = notifications.filter(n => !n.isRead);
        if (unread.length > 0) {
            badge.textContent = unread.length;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }

        list.innerHTML = notifications.length === 0 ? '<div style="color:var(--text-dim); text-align:center;">No notifications</div>' : '';
        notifications.forEach(n => {
            const item = document.createElement('div');
            item.className = `notification-item ${n.isRead ? '' : 'unread'}`;
            item.innerHTML = `
                <div style="font-size:0.8rem; font-weight:600;">${n.title}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${n.message}</div>
                <div style="font-size:0.6rem; color:var(--text-muted); margin-top:4px;">${new Date(n.createdAt).toLocaleString()}</div>
            `;
            item.onclick = async () => {
                await fetch(`/api/notifications/${n._id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
                loadNotifications();
                if (n.link) window.location.hash = n.link;
            };
            list.appendChild(item);
        });
    } catch (e) {
        console.error('Notification fetch error', e);
    }
}

// ─── ANALYTICS ────────────────────────────────────────────────────
let revenueChart = null;
async function loadAnalytics() {
    try {
        const res = await fetch('/api/analytics/stats', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        
        // Update stats cards
        document.getElementById('userTotalRevenue').textContent = '$' + data.company.revenue.toLocaleString();
        document.getElementById('userTotalProfit').textContent = '$' + data.company.profit.toLocaleString();
        document.getElementById('userTotalEmployees').textContent = data.company.employees;
        document.getElementById('userTotalRecords').textContent = data.stats.totalProjects;
        
        // Update Billing Tab Data
        const planEl = document.getElementById('currentPlanDisplay');
        if (planEl) {
            planEl.textContent = data.company.plan.toUpperCase();
            document.getElementById('subscriptionStatus').textContent = 'Active';
        }

        // Render Revenue Trends Chart (if it exists in HTML, else we can skip or add it)
        // For now let's just use the projects bar chart but with real completion data
        // ... handled in loadProjects
        
    } catch (e) {
        console.error('Analytics fetch error', e);
    }
}

// ─── BILLING ──────────────────────────────────────────────────────
async function loadBilling() {
    // Analytics already loads some billing info
    loadAnalytics();
}

window.subscribe = async function(planId) {
    if (planId === 'enterprise') {
        alert('Please contact sales@orgmatrix.com for Enterprise plans.');
        return;
    }
    
    if (!confirm(`Upgrade to ${planId.toUpperCase()} plan?`)) return;

    try {
        const res = await fetch('/api/billing/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ planId, billingCycle: 'monthly' })
        });
        const data = await res.json();
        if (res.ok) {
            showToast(data.message, 'success');
            loadAnalytics();
        } else {
            showToast(data.message, 'error');
        }
    } catch (e) {
        showToast('Subscription error', 'error');
    }
};

// ─── 🔍 GLOBAL SEARCH LOGIC ─────────────────────────────────────────
const searchInput = document.getElementById('globalSearchInput');
const searchDropdown = document.getElementById('searchResultsDropdown');
const searchList = document.getElementById('searchResultsList');
const searchFilter = document.getElementById('searchTypeFilter');

let searchTimeout;

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(searchTimeout);
        
        if (query.length < 2) {
            searchDropdown.style.display = 'none';
            return;
        }

        searchTimeout = setTimeout(() => executeSearch(query), 300);
    });

    document.addEventListener('click', (e) => {
        const container = document.getElementById('globalSearchContainer');
        if (container && !container.contains(e.target)) {
            searchDropdown.style.display = 'none';
        }
    });
}

async function executeSearch(query) {
    try {
        const type = searchFilter ? searchFilter.value : '';
        const res = await fetch(`/api/search?query=${encodeURIComponent(query)}&type=${type}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const results = await res.json();
        
        searchList.innerHTML = '';
        searchDropdown.style.display = 'block';
        let hasResults = false;
        const categories = { projects: '🚀 Projects', tasks: '📝 Tasks', services: '⚙️ Services', users: '👥 People' };

        for (const [key, items] of Object.entries(results)) {
            if (items && items.length > 0) {
                hasResults = true;
                const header = document.createElement('div');
                header.style.cssText = 'font-size:0.7rem; font-weight:700; color:var(--text-dim); text-transform:uppercase; margin-top:8px; border-bottom:1px solid #f1f5f9; padding-bottom:4px;';
                header.textContent = categories[key];
                searchList.appendChild(header);

                items.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'search-result-item';
                    const title = item.name || item.title || item.email;
                    const subText = item.description || item.status || item.role;
                    div.innerHTML = `<div style="font-size:0.85rem; font-weight:600; color:var(--primary);">${title}</div><div style="font-size:0.75rem; color:var(--text-muted);">${subText}</div>`;
                    div.onclick = () => { searchDropdown.style.display = 'none'; switchTab(key === 'users' ? 'team' : key); };
                    searchList.appendChild(div);
                });
            }
        }
        if (!hasResults) searchList.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-dim); font-size:0.85rem;">No results matching your query.</div>';
    } catch (err) { console.error('Search error:', err); }
}

// ─── 📁 DOCUMENT MANAGEMENT ─────────────────────────────────────────
async function loadDocuments() {
    const body = document.getElementById('projectDocsTableBody');
    const pSelect = document.getElementById('docProjectSelect');
    if (!body) return;

    try {
        const pRes = await fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } });
        const projects = await pRes.ok ? await pRes.json() : [];
        if (pSelect) {
            const currentVal = pSelect.value;
            pSelect.innerHTML = '<option value="">— Choose Project —</option>';
            projects.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p._id;
                opt.textContent = p.name;
                pSelect.appendChild(opt);
            });
            pSelect.value = currentVal;
        }

        let allDocs = [];
        await Promise.all(projects.map(async (p) => {
            const dRes = await fetch(`/api/projects/${p._id}/documents`, { headers: { Authorization: `Bearer ${token}` } });
            if (dRes.ok) {
                const docs = await dRes.json();
                docs.forEach(d => allDocs.push({ ...d, projectName: p.name }));
            }
        }));

        body.innerHTML = '';
        if (allDocs.length === 0) {
            body.innerHTML = '<tr><td colspan="4" style="text-align:center;">No project documents found.</td></tr>';
            return;
        }

        allDocs.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(doc => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-weight:600;">📄 ${doc.name}</td>
                <td><small>${doc.projectName}</small></td>
                <td><small>${doc.uploadedBy?.email || 'System'}</small></td>
                <td><a href="${doc.fileUrl}" target="_blank" style="color:var(--primary); font-size:0.75rem; font-weight:600;">View / Download</a></td>
            `;
            body.appendChild(row);
        });
    } catch (e) {
        body.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Load failed.</td></tr>';
    }
}

const docForm = document.getElementById('doc-upload-form');
if (docForm) {
    docForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const projectId = document.getElementById('docProjectSelect').value;
        const nameInput = document.getElementById('docName');
        const fileInput = document.getElementById('docFile');

        if (!projectId || !fileInput.files[0]) {
            showToast('Please select a project and a file', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('document', fileInput.files[0]);
        formData.append('name', nameInput.value);

        try {
            const res = await fetch(`/api/projects/${projectId}/documents`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                showToast('Document uploaded successfully!', 'success');
                docForm.reset();
                loadDocuments();
            } else {
                const err = await res.json();
                showToast(err.message || 'Upload failed', 'error');
            }
        } catch (err) {
            showToast('Network error during upload', 'error');
        }
    });
}
// ─── TASK VIEW TOGGLE (LIST VS KANBAN) ──────────────────────────────
window.toggleTaskView = function(view) {
    const listContainer = document.getElementById('taskListContainer');
    const kanbanContainer = document.getElementById('taskKanbanContainer');
    const listBtn = document.getElementById('task-view-list');
    const kanbanBtn = document.getElementById('task-view-kanban');

    if (view === 'list') {
        listContainer.style.display = 'block';
        kanbanContainer.style.display = 'none';
        listBtn.classList.add('active');
        kanbanBtn.classList.remove('active');
    } else {
        listContainer.style.display = 'none';
        kanbanContainer.style.display = 'block';
        listBtn.classList.remove('active');
        kanbanBtn.classList.add('active');
        renderKanban(); 
    }
};

async function renderKanban() {
    const tasks = window.currentTasks || [];
    const lists = {
        pending: document.getElementById('list-pending'),
        'in-progress': document.getElementById('list-in-progress'),
        completed: document.getElementById('list-completed')
    };
    const counts = {
        pending: document.getElementById('count-pending'),
        'in-progress': document.getElementById('count-in-progress'),
        completed: document.getElementById('count-completed')
    };

    if (!lists.pending) return;

    // Clear
    Object.values(lists).forEach(l => l.innerHTML = '');
    
    const priorityDots = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };

    tasks.forEach(t => {
        const list = lists[t.status] || lists.pending;
        const item = document.createElement('div');
        item.className = 'kanban-item';
        item.draggable = true;
        item.dataset.taskId = t._id;
        
        const dotColor = priorityDots[t.priority] || '#64748b';
        
        item.innerHTML = `
            <div style="font-size:0.85rem; font-weight:700; margin-bottom:8px; color:var(--text-main);">${t.title}</div>
            <div style="font-size:0.75rem; color:var(--text-dim); margin-bottom:12px;">${t.projectName || 'General'}</div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:0.65rem; font-weight:600; text-transform:uppercase; color:${dotColor}">
                    <span class="priority-dot" style="background:${dotColor}"></span>${t.priority}
                </span>
                <span style="font-size:0.65rem; background:rgba(0,0,0,0.05); color:var(--text-dim); padding:2px 6px; border-radius:4px;">${t.assignedToName?.split('@')[0] || 'Unassigned'}</span>
            </div>
        `;

        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', t._id);
            item.style.opacity = '0.5';
        });

        item.addEventListener('dragend', () => {
            item.style.opacity = '1';
        });

        item.onclick = () => {
             const nextStatus = t.status === 'pending' ? 'in-progress' : (t.status === 'in-progress' ? 'completed' : 'pending');
             updateTaskStatus(t._id, nextStatus).then(() => loadTasks());
        };
        list.appendChild(item);
    });

    // Add drop zones to columns
    Object.keys(lists).forEach(status => {
        const col = lists[status].parentElement;
        col.addEventListener('dragover', (e) => {
            e.preventDefault();
            col.style.background = 'rgba(79, 70, 229, 0.05)';
            col.style.borderColor = 'var(--primary)';
        });

        col.addEventListener('dragleave', () => {
            col.style.background = 'rgba(0,0,0,0.02)';
            col.style.borderColor = 'var(--border)';
        });

        col.addEventListener('drop', async (e) => {
            e.preventDefault();
            col.style.background = 'rgba(0,0,0,0.02)';
            col.style.borderColor = 'var(--border)';
            const taskId = e.dataTransfer.getData('text/plain');
            if (taskId) {
                await updateTaskStatus(taskId, status);
                loadTasks();
            }
        });
    });

    // Update counts
    Object.keys(counts).forEach(vStatus => {
        const c = tasks.filter(t => t.status === vStatus).length;
        if (counts[vStatus]) counts[vStatus].textContent = c;
    });
}

/* ============================================================
   BARBERIA CRISTIAN - PANEL DE GESTION
   Connects through backend API (/panel/*) which reads from the
   same barber_* tables used by barberiacristian.reservabarbero.com
   ============================================================ */

const SUPABASE_URL = 'https://nzeblijzontrmizefssh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZWJsaWp6b250cm1pemVmc3NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMzMxOTUsImV4cCI6MjA4NjkwOTE5NX0.rLltqjuk5r-iuvDXZLBwTknQRZohPqk_o9viWn75_bA';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let accessToken = null;
let currentUser = null;
let professionals = [];
let services = [];
let allBookings = [];
let calendarDate = new Date();
let selectedCalendarDay = null;
let clientsData = [];

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('refreshBtn').addEventListener('click', refreshCurrentPage);

  document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });

  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.getElementById('calendarProFilter').addEventListener('change', renderCalendar);
  document.getElementById('apptProFilter').addEventListener('change', renderAppointmentsList);
  document.getElementById('apptStatusFilter').addEventListener('change', renderAppointmentsList);
  document.getElementById('apptDateFrom').addEventListener('change', loadAppointments);
  document.getElementById('apptDateTo').addEventListener('change', loadAppointments);
  document.getElementById('clientSearch').addEventListener('input', renderClients);

  checkSession();
});

// ============================================================
// API HELPER
// ============================================================
async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error del servidor' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ============================================================
// AUTH
// ============================================================
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');
  const errorEl = document.getElementById('loginError');

  errorEl.classList.add('hidden');
  btn.disabled = true;
  btn.textContent = 'Verificando...';

  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;

    accessToken = data.session.access_token;
    currentUser = data.user;
    showAdmin();
  } catch (err) {
    errorEl.textContent = err.message || 'Error al iniciar sesion';
    errorEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Iniciar sesion';
  }
}

async function checkSession() {
  const { data: { session } } = await sb.auth.getSession();
  if (session && session.user) {
    accessToken = session.access_token;
    currentUser = session.user;
    showAdmin();
  }
}

async function handleLogout() {
  await sb.auth.signOut();
  currentUser = null;
  accessToken = null;
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('adminLayout').classList.add('hidden');
}

function showAdmin() {
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('adminLayout').classList.remove('hidden');

  const name = currentUser.user_metadata?.full_name ||
    currentUser.user_metadata?.nombre ||
    currentUser.email.split('@')[0];
  document.getElementById('userName').textContent = name;
  document.getElementById('userRole').textContent = 'Administrador';
  document.getElementById('userAvatar').textContent = name.charAt(0).toUpperCase();

  // Listen for token refresh
  sb.auth.onAuthStateChange((event, session) => {
    if (session) accessToken = session.access_token;
  });

  navigateTo('dashboard');
}

// ============================================================
// NAVIGATION
// ============================================================
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  calendar: 'Calendario',
  appointments: 'Citas',
  professionals: 'Profesionales',
  services: 'Servicios',
  clients: 'Clientes'
};

function navigateTo(page) {
  document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById('page' + page.charAt(0).toUpperCase() + page.slice(1));
  if (pageEl) pageEl.classList.add('active');

  const navBtn = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navBtn) navBtn.classList.add('active');

  document.getElementById('headerTitle').textContent = PAGE_TITLES[page] || page;

  switch (page) {
    case 'dashboard': loadDashboard(); break;
    case 'calendar': loadCalendar(); break;
    case 'appointments': loadAppointments(); break;
    case 'professionals': loadProfessionals(); break;
    case 'services': loadServices(); break;
    case 'clients': loadClients(); break;
  }
}

function refreshCurrentPage() {
  const active = document.querySelector('.nav-item.active');
  if (active) navigateTo(active.dataset.page);
}

// ============================================================
// DASHBOARD
// ============================================================
async function loadDashboard() {
  try {
    const data = await api('/panel/dashboard');
    professionals = data.professionals || [];
    services = data.services || [];
    populateProFilters();

    const today = new Date();
    const active = (data.today?.bookings || []).filter(b => b.status !== 'cancelled');

    document.getElementById('statsGrid').innerHTML = `
      <div class="stat-card">
        <div class="stat-card-label">Citas hoy</div>
        <div class="stat-card-value">${active.length}</div>
        <div class="stat-card-sub">${formatDateLong(today)}</div>
      </div>
      <div class="stat-card stat-card--accent">
        <div class="stat-card-label">Ingresos del mes</div>
        <div class="stat-card-value">${formatCurrency(data.month?.revenue || 0)}</div>
        <div class="stat-card-sub">${data.month?.completed || 0} citas completadas</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">Total mes</div>
        <div class="stat-card-value">${data.month?.total || 0}</div>
        <div class="stat-card-sub">${data.month?.cancelled || 0} canceladas</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">Profesionales</div>
        <div class="stat-card-value">${professionals.length}</div>
        <div class="stat-card-sub">activos</div>
      </div>
    `;

    renderTodayAppointments(data.today?.bookings || []);

    // Initialize Flappy Barber game if canvas exists
    if (window.initGame && document.getElementById('flappyCanvas')) {
      window.initGame();
    }
  } catch (err) {
    toast('Error al cargar dashboard: ' + err.message, 'error');
  }
}

function renderTodayAppointments(bookings) {
  const container = document.getElementById('todayAppointments');
  const active = bookings.filter(b => b.status !== 'cancelled');

  if (active.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No hay citas programadas para hoy</p></div>';
    return;
  }

  container.innerHTML = active.map(b => renderAppointmentCardVertical(b)).join('');
}

function renderAppointmentCardVertical(booking) {
  const time = formatTime(booking.booking_time);
  const clientName = booking.client_name || 'Cliente';
  const service = booking.service_name || 'Servicio';
  const proName = booking.professional_name || 'Barbero';
  const pro = (professionals || []).find(p => p.id === booking.professional_id);
  const photoUrl = getProPhotoUrl(pro);

  const statusMap = {
    confirmed: { label: 'CONFIRMADA', cls: 'badge--confirmed' },
    pending: { label: 'PENDIENTE', cls: 'badge--pending' },
    completed: { label: 'COMPLETADA', cls: 'badge--completed' }
  };
  const status = statusMap[booking.status] || statusMap.confirmed;

  return `
    <div class="appointment-card-vertical">
      <div class="appt-card-header">
        <div class="appt-card-time">${time}</div>
        <div class="appt-card-pro">
          ${photoUrl ? `<img src="${photoUrl}" onerror="this.onerror=null; this.src='/${proName.toLowerCase().split(' ')[0]}.png';">` : ''}
          <span>${escapeHtml(proName)}</span>
        </div>
      </div>
      <div class="appt-card-body">
        <div class="appt-card-client">${escapeHtml(clientName)}</div>
        <div class="appt-card-service">${escapeHtml(service)}</div>
      </div>
      <div class="appt-card-footer">
        <span class="badge ${status.cls}" style="font-size: 9px; padding: 2px 8px;">${status.label}</span>
        <div class="appointment-actions" style="margin-top:0">
          ${booking.status === 'pending' ? `<button class="btn-confirm" style="padding: 4px 10px; font-size: 10px;" onclick="confirmBooking('${booking.id}')">Ok</button>` : ''}
          <button class="btn-danger" style="padding: 4px 10px; font-size: 10px;" onclick="cancelBooking('${booking.id}')">X</button>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// CALENDAR
// ============================================================
async function loadCalendar() {
  try {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth() + 1;

    const data = await api(`/panel/bookings/calendar?year=${year}&month=${month}`);
    allBookings = data || [];
    renderCalendar();
  } catch (err) {
    toast('Error al cargar calendario: ' + err.message, 'error');
  }
}

function renderCalendar() {
  const proFilter = document.getElementById('calendarProFilter').value;
  const filtered = proFilter ? allBookings.filter(b => b.professional_id === proFilter) : allBookings;

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7;

  const today = new Date();
  const todayStr = formatDateISO(today);

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  const byDay = {};
  filtered.forEach(b => {
    const d = b.start_datetime.substring(0, 10);
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(b);
  });

  let html = `
    <div class="calendar-header">
      <div class="calendar-nav">
        <button class="calendar-nav-btn" onclick="changeMonth(-1)">&#8249;</button>
        <button class="calendar-today-btn" onclick="goToday()">Hoy</button>
        <button class="calendar-nav-btn" onclick="changeMonth(1)">&#8250;</button>
      </div>
      <div class="calendar-title">${monthNames[month]} ${year}</div>
    </div>
    <div class="calendar-grid">
      ${dayNames.map(d => `<div class="calendar-day-header">${d}</div>`).join('')}
  `;

  const prevMonth = new Date(year, month, 0);
  for (let i = startDow - 1; i >= 0; i--) {
    html += `<div class="calendar-day calendar-day--other"><div class="calendar-day-number">${prevMonth.getDate() - i}</div></div>`;
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === selectedCalendarDay;
    const dayBookings = byDay[dateStr] || [];
    const activeBookings = dayBookings.filter(b => b.status !== 'cancelled');

    let classes = 'calendar-day';
    if (isToday) classes += ' calendar-day--today';
    if (isSelected) classes += ' calendar-day--selected';

    html += `<div class="${classes}" onclick="selectCalendarDay('${dateStr}')">`;
    html += `<div class="calendar-day-number">${day}</div>`;

    const maxShow = 3;
    activeBookings.slice(0, maxShow).forEach(b => {
      const time = formatTime(b.start_datetime);
      const svcName = b.barber_services?.name || 'Cita';
      html += `<div class="calendar-event">${time} ${escapeHtml(svcName)}</div>`;
    });

    if (activeBookings.length > maxShow) {
      html += `<div class="calendar-event-more">+${activeBookings.length - maxShow} mas</div>`;
    }

    html += '</div>';
  }

  const totalCells = startDow + lastDay.getDate();
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remaining; i++) {
    html += `<div class="calendar-day calendar-day--other"><div class="calendar-day-number">${i}</div></div>`;
  }

  html += '</div>';
  document.getElementById('calendarContainer').innerHTML = html;

  if (selectedCalendarDay) {
    showDayDetail(selectedCalendarDay, byDay[selectedCalendarDay] || []);
  } else {
    document.getElementById('dayDetail').classList.add('hidden');
  }
}

// Global functions for onclick handlers
window.changeMonth = function (delta) {
  calendarDate.setMonth(calendarDate.getMonth() + delta);
  selectedCalendarDay = null;
  document.getElementById('dayDetail').classList.add('hidden');
  loadCalendar();
};

window.goToday = function () {
  calendarDate = new Date();
  selectedCalendarDay = formatDateISO(new Date());
  loadCalendar();
};

window.selectCalendarDay = function (dateStr) {
  selectedCalendarDay = dateStr;
  renderCalendar();
};

function showDayDetail(dateStr, bookings) {
  const container = document.getElementById('dayDetail');
  const proFilter = document.getElementById('calendarProFilter').value;
  let active = bookings.filter(b => b.status !== 'cancelled');
  if (proFilter) active = active.filter(b => b.professional_id === proFilter);

  const date = new Date(dateStr + 'T12:00:00');
  const dayName = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  container.classList.remove('hidden');
  container.innerHTML = `
    <div class="day-detail">
      <div class="day-detail-header">
        <div class="day-detail-title">${dayName}</div>
        <div class="day-detail-count">${active.length} cita${active.length !== 1 ? 's' : ''}</div>
      </div>
      <div class="day-detail-body">
        ${active.length === 0 ?
      '<div class="day-detail-empty">Sin citas programadas</div>' :
      `<div class="appointments-list">${active.map(b => renderAppointmentRow(b)).join('')}</div>`
    }
      </div>
    </div>
  `;
}

// ============================================================
// APPOINTMENTS LIST
// ============================================================
async function loadAppointments() {
  const container = document.getElementById('appointmentsList');
  container.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';

  try {
    const dateFrom = document.getElementById('apptDateFrom').value;
    const dateTo = document.getElementById('apptDateTo').value;

    let url = '/panel/bookings?limit=200';
    if (dateFrom) url += `&from=${dateFrom}`;
    if (dateTo) url += `&to=${dateTo}`;

    const data = await api(url);
    allBookings = data || [];
    renderAppointmentsList();
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p>Error: ${err.message}</p></div>`;
  }
}

function renderAppointmentsList() {
  const container = document.getElementById('appointmentsList');
  const proFilter = document.getElementById('apptProFilter').value;
  const statusFilter = document.getElementById('apptStatusFilter').value;

  let filtered = [...allBookings];
  if (proFilter) filtered = filtered.filter(b => b.professional_id === proFilter);
  if (statusFilter) filtered = filtered.filter(b => b.status === statusFilter);

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No se encontraron citas</p><span>Prueba a cambiar los filtros</span></div>';
    return;
  }

  container.innerHTML = filtered.map(b => renderAppointmentRow(b)).join('');
}

function renderAppointmentRow(booking) {
  const time = formatTime(booking.start_datetime);
  const date = formatDateShort(booking.start_datetime);
  const clientName = booking.client_name || 'Cliente';
  const clientEmail = booking.client_email || '';
  const clientPhone = booking.client_phone || '';
  const clientContact = clientPhone || clientEmail || '-';
  const service = booking.barber_services?.name || '-';
  const pro = booking.barber_professionals || {};
  const proName = pro.name || 'Sin asignar';
  const photoUrl = getProPhotoUrl(pro);

  const statusMap = {
    confirmed: { label: 'Confirmada', cls: 'badge--confirmed' },
    pending: { label: 'Pendiente', cls: 'badge--pending' },
    cancelled: { label: 'Cancelada', cls: 'badge--cancelled' },
    completed: { label: 'Completada', cls: 'badge--completed' }
  };
  const status = statusMap[booking.status] || statusMap.confirmed;
  const isCancelled = booking.status === 'cancelled';

  return `
    <div class="appointment-row" style="${isCancelled ? 'opacity:0.5;' : ''}">
      <div class="appointment-time">${time}<div style="font-size:10px;color:var(--text-muted);font-weight:400;">${date}</div></div>
      <div class="appointment-client">
        <div class="appointment-client-name">${escapeHtml(clientName)}</div>
        <div class="appointment-client-contact">${escapeHtml(clientContact)}</div>
      </div>
      <div class="appointment-service">${escapeHtml(service)}</div>
      <div class="appointment-pro">
        ${photoUrl ? `<img class="appointment-pro-avatar" src="${photoUrl}" onerror="this.onerror=null; this.src='/${proName.toLowerCase().split(' ')[0]}.png';" alt="${escapeHtml(proName)}">` : ''}
        ${escapeHtml(proName)}
      </div>
      <div><span class="badge ${status.cls}">${status.label}</span></div>
      <div class="appointment-actions">
        ${booking.status === 'pending' ? `<button class="btn-confirm" onclick="confirmBooking('${booking.id}')">Confirmar</button>` : ''}
        ${!isCancelled ? `<button class="btn-danger" onclick="cancelBooking('${booking.id}')">Cancelar</button>` : ''}
      </div>
    </div>
  `;
}

window.confirmBooking = function (id) {
  showModal(
    'Confirmar cita',
    'Esta accion confirmará la cita del cliente.',
    async () => {
      try {
        await api(`/panel/bookings/${id}/confirm`, { method: 'PATCH' });
        toast('Cita confirmada correctamente', 'success');
        refreshCurrentPage();
      } catch (err) {
        toast('Error al confirmar: ' + err.message, 'error');
      }
      closeModal();
    }
  );
};

window.cancelBooking = function (id) {
  showModal(
    'Cancelar cita',
    'Esta accion cancelara la cita del cliente. No se puede deshacer.',
    async () => {
      try {
        await api(`/panel/bookings/${id}/cancel`, { method: 'PATCH' });
        toast('Cita cancelada correctamente', 'success');
        refreshCurrentPage();
      } catch (err) {
        toast('Error al cancelar: ' + err.message, 'error');
      }
      closeModal();
    }
  );
};

// ============================================================
// PROFESSIONALS
// ============================================================
async function loadProfessionals() {
  const container = document.getElementById('prosGrid');
  container.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';

  try {
    const data = await api('/panel/professionals');
    professionals = data || [];
    populateProFilters();

    if (professionals.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No hay profesionales registrados</p></div>';
      return;
    }

    container.innerHTML = professionals.map(p => {
      const photoUrl = getProPhotoUrl(p);
      return `
        <div class="pro-card">
          ${photoUrl ?
          `<img class="pro-card-photo" src="${photoUrl}" onerror="this.onerror=null; this.src='/${p.name.toLowerCase().split(' ')[0]}.png';" alt="${escapeHtml(p.name)}">` :
          `<div class="pro-card-photo pro-card-photo--placeholder">${p.name.charAt(0)}</div>`
        }
          <div class="pro-card-name">${escapeHtml(p.name)}</div>
          <div class="pro-card-status pro-card-status--active">Activo</div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p>Error: ${err.message}</p></div>`;
  }
}

// ============================================================
// SERVICES
// ============================================================
async function loadServices() {
  const container = document.getElementById('servicesList');
  container.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';

  try {
    const data = await api('/panel/services');
    services = data || [];

    if (services.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No hay servicios registrados</p></div>';
      return;
    }

    container.innerHTML = services.map(s => `
      <div class="service-row">
        <div class="service-name">${escapeHtml(s.name)}</div>
        <div class="service-price">${formatCurrency(s.price)}</div>
        <div class="service-duration">${s.duration_min} min</div>
        <div><span class="badge ${s.is_active ? 'badge--confirmed' : 'badge--cancelled'}">${s.is_active ? 'Activo' : 'Inactivo'}</span></div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p>Error: ${err.message}</p></div>`;
  }
}

// ============================================================
// CLIENTS
// ============================================================
async function loadClients() {
  const container = document.getElementById('clientsList');
  container.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';

  try {
    const data = await api('/panel/clients');
    clientsData = data || [];
    renderClients();
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p>Error: ${err.message}</p></div>`;
  }
}

function renderClients() {
  const container = document.getElementById('clientsList');
  const search = document.getElementById('clientSearch').value.toLowerCase();

  let filtered = clientsData;
  if (search) {
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(search) ||
      c.email.toLowerCase().includes(search)
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No se encontraron clientes</p></div>';
    return;
  }

  container.innerHTML = filtered.map(c => `
    <div class="client-row">
      <div style="font-weight:600;color:var(--text-primary);">${escapeHtml(c.name)}</div>
      <div style="font-size:12px;color:var(--text-secondary);">${escapeHtml(c.email)}</div>
      <div style="font-size:13px;color:var(--text-secondary);">${c.bookings} cita${c.bookings !== 1 ? 's' : ''}</div>
      <div style="font-size:12px;color:var(--text-muted);">${c.lastBooking ? formatDateShort(c.lastBooking) : '-'}</div>
    </div>
  `).join('');
}

// ============================================================
// HELPERS
// ============================================================
function populateProFilters() {
  ['calendarProFilter', 'apptProFilter'].forEach(id => {
    const el = document.getElementById(id);
    const val = el.value;
    el.innerHTML = '<option value="">Todos los profesionales</option>';
    professionals.forEach(p => {
      el.innerHTML += `<option value="${p.id}">${escapeHtml(p.name)}</option>`;
    });
    el.value = val;
  });
}

function getProPhotoUrl(pro) {
  if (!pro || !pro.photo_url) return null;
  const rawUrl = pro.photo_url;
  if (rawUrl.startsWith('http')) return rawUrl;

  // Extract filename
  const filename = rawUrl.split('/').pop().toLowerCase();

  // If it matches one of our local images, prioritize local root
  if (['cristian.png', 'daniel.png', 'nasir.png'].includes(filename)) {
    return '/' + filename;
  }

  if (rawUrl.startsWith('/')) return rawUrl;

  // If no path info, assume it's in the local root
  if (!rawUrl.includes('/')) return '/' + rawUrl;

  return `https://barberiacristian.reservabarbero.com/tenants/barberiacristian/${rawUrl}`;
}

function formatDateISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatTime(isoStr) {
  return new Date(isoStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(isoStr) {
  return new Date(isoStr).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

function formatDateLong(date) {
  return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================
// TOAST
// ============================================================
function toast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ============================================================
// MODAL
// ============================================================
let modalCallback = null;

function showModal(title, body, onConfirm) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').textContent = body;
  document.getElementById('modalOverlay').classList.remove('hidden');
  modalCallback = onConfirm;
  document.getElementById('modalConfirm').onclick = () => { if (modalCallback) modalCallback(); };
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  modalCallback = null;
}

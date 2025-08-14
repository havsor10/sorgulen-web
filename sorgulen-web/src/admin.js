// Adminside: håndterer innlogging via Supabase Auth, henter og oppdaterer bestillinger
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_ANON = import.meta.env.VITE_SUPABASE_ANON;
const API_BASE = import.meta.env.VITE_API_URL || '';

const supa = createClient(SUPA_URL, SUPA_ANON);

// DOM-elementer
const loginView = document.getElementById('loginView');
const adminView = document.getElementById('adminView');
const loginForm = document.getElementById('loginForm');
const loginMsg = document.getElementById('loginMelding');
const logoutBtn = document.getElementById('logout');
const ordersTableBody = document.querySelector('#ordersTable tbody');
const adminMsg = document.getElementById('adminMelding');

async function getAccessToken() {
  const { data } = await supa.auth.getSession();
  return data?.session?.access_token;
}

async function loadOrders() {
  adminMsg.textContent = 'Laster bestillinger…';
  try {
    const token = await getAccessToken();
    if (!token) throw new Error('Ingen tilgang');
    const res = await fetch(`${API_BASE}/v1/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('API-feil');
    const orders = await res.json();
    renderOrders(orders, token);
    adminMsg.textContent = orders.length ? '' : 'Ingen bestillinger funnet.';
  } catch (err) {
    console.error(err);
    adminMsg.textContent = 'Kunne ikke hente bestillinger.';
  }
}

function renderOrders(list, token) {
  ordersTableBody.innerHTML = '';
  list.forEach((order) => {
    const tr = document.createElement('tr');
    // Referanse viser de første 8 tegn av UUID
    const ref = order.id.slice(0, 8);
    tr.innerHTML = `
      <td>${ref}</td>
      <td>${order.customer_name}</td>
      <td>${order.service_type}</td>
      <td>${new Date(order.created_at).toLocaleString('nb-NO')}</td>
      <td></td>
    `;
    // Status celle med select
    const statusCell = tr.querySelector('td:last-child');
    const sel = document.createElement('select');
    sel.className = 'status';
    ['new','in_progress','done','cancelled'].forEach((st) => {
      const opt = document.createElement('option');
      opt.value = st;
      opt.textContent = {
        'new': 'Ny',
        'in_progress': 'Pågår',
        'done': 'Ferdig',
        'cancelled': 'Avbrutt'
      }[st];
      if (st === order.status) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', async () => {
      const newStatus = sel.value;
      try {
        const res = await fetch(`${API_BASE}/v1/orders/${order.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        });
        if (!res.ok) throw new Error('Oppdatering feilet');
      } catch (err) {
        console.error(err);
        alert('Kunne ikke oppdatere status.');
        // Tilbakestill select til opprinnelig verdi
        sel.value = order.status;
      }
    });
    statusCell.appendChild(sel);
    ordersTableBody.appendChild(tr);
  });
}

// Håndter innlogging
loginForm?.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  loginMsg.textContent = '';
  const email = loginForm.email.value.trim();
  const password = loginForm.password.value;
  try {
    const { error } = await supa.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Sjekk admin-flagget
    const { data: { user } } = await supa.auth.getUser();
    if (!user?.user_metadata?.is_admin) {
      await supa.auth.signOut();
      throw new Error('Du har ikke rettigheter');
    }
    // Skjul login, vis admin
    loginView.style.display = 'none';
    adminView.style.display = '';
    await loadOrders();
  } catch (err) {
    console.error(err);
    loginMsg.textContent = err.message || 'Innlogging feilet';
  }
});

// Håndter logout
logoutBtn?.addEventListener('click', async () => {
  await supa.auth.signOut();
  adminView.style.display = 'none';
  loginView.style.display = '';
  loginMsg.textContent = 'Logget ut.';
});

// Dersom brukeren allerede har en aktiv sesjon når siden lastes, vis admin-siden
supa.auth.getSession().then(({ data }) => {
  if (data?.session) {
    // Oppdater side uten å logge inn på nytt
    loginView.style.display = 'none';
    adminView.style.display = '';
    loadOrders();
  }
});
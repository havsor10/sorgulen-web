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

// Eksporter getAccessToken for bruk i andre moduler
window.getAccessToken = getAccessToken;

async function loadOrders() {
  adminMsg.className = 'loading';
  adminMsg.innerHTML = '🔄 Laster bestillinger... <div style="display: inline-block; animation: spin 1s linear infinite;">⚙️</div>';
  
  // Legg til CSS for spin-animasjon
  if (!document.querySelector('#spin-style')) {
    const style = document.createElement('style');
    style.id = 'spin-style';
    style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }
  
  try {
    const token = await getAccessToken();
    if (!token) throw new Error('Ingen tilgang');
    const res = await fetch(`${API_BASE}/v1/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('API-feil');
    const orders = await res.json();
    
    // Send event til dashboard
    document.dispatchEvent(new CustomEvent('ordersLoaded', {
      detail: { orders }
    }));
    
    adminMsg.className = orders.length ? '' : 'success';
    adminMsg.textContent = orders.length ? '' : '📭 Ingen bestillinger funnet.';
  } catch (err) {
    console.error(err);
    adminMsg.className = 'error';
    adminMsg.textContent = '❌ Kunne ikke hente bestillinger.';
  }
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
    
    // Vis velkomstmelding
    loginMsg.className = 'success';
    loginMsg.textContent = '✅ Innlogget som administrator';
    
    await loadOrders();
  } catch (err) {
    console.error(err);
    loginMsg.className = 'error';
    loginMsg.textContent = `❌ ${err.message || 'Innlogging feilet'}`;
  }
});

// Håndter logout
logoutBtn?.addEventListener('click', async () => {
  await supa.auth.signOut();
  adminView.style.display = 'none';
  loginView.style.display = '';
  loginMsg.className = 'success';
  loginMsg.textContent = '👋 Logget ut.';
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
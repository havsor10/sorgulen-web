// Klientside for bestillingsskjema. Sender data til API og gir tilbakemelding til bruker.

// Hent referanser til skjema og meldingsområde
const form = document.querySelector('#bestillSkjema');
const msgEl = document.querySelector('#melding');

// Hent API-basen fra miljøvariabel (erstattet ved bygg i Netlify/Vite)
const API_BASE = import.meta.env.VITE_API_URL || '';

async function sendBestilling(data) {
  try {
    const res = await fetch(`${API_BASE}/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      // Forsøk å hente mer info fra server
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || 'API');
    }
    return await res.json();
  } catch (e) {
    throw e;
  }
}

if (form) {
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    
    // Vis loading state med animasjon
    msgEl.className = 'loading';
    msgEl.innerHTML = '🚀 Sender bestilling... <div style="display: inline-block; animation: spin 1s linear infinite;">⚙️</div>';
    
    // Legg til CSS for spin-animasjon
    if (!document.querySelector('#spin-style')) {
      const style = document.createElement('style');
      style.id = 'spin-style';
      style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }
    
    // Les data fra skjema. FormData gir [key,value] for alle felter
    const fd = new FormData(form);
    const payload = {
      customer_name: fd.get('navn').trim(),
      phone: fd.get('telefon').trim(),
      email: fd.get('epost').trim(),
      address: fd.get('adresse').trim(),
      service_type: fd.get('tjeneste'),
      preferred_datetime: fd.get('dato') || null,
      extra_info: fd.get('tilleggsinfo') || null,
      price_estimate: fd.get('pris') ? parseFloat(fd.get('pris')) : null
    };
    try {
      const result = await sendBestilling(payload);
      
      // Vis suksess med animasjon
      msgEl.className = 'success';
      msgEl.innerHTML = `
        <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">🎉 Bestilling mottatt!</div>
        <div>Referanse: <strong>${result.id.slice(0, 8)}</strong></div>
        <div style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.8;">
          Du vil motta en bekreftelse på e-post snart
        </div>
      `;
      
      // Scroll til melding
      msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      form.reset();
      
      // Tilbakestill progress bar
      const progressFill = document.getElementById('progressFill');
      if (progressFill) {
        progressFill.style.width = '0%';
      }
      
      // Tilbakestill prisberegning
      const estimatedPrice = document.getElementById('estimatedPrice');
      if (estimatedPrice) {
        estimatedPrice.textContent = 'Estimat beregnes automatisk...';
      }
      
    } catch (err) {
      console.error(err);
      msgEl.className = 'error';
      msgEl.innerHTML = `
        <div style="font-size: 1.1rem; margin-bottom: 0.5rem;">❌ Noe gikk galt</div>
        <div>Det oppstod en feil under innsending. Prøv igjen senere.</div>
        <div style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.8;">
          Hvis problemet vedvarer, kontakt oss direkte
        </div>
      `;
    }
  });
}
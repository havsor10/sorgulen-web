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
    msgEl.textContent = 'Sender bestilling…';
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
      msgEl.textContent = `Bestilling mottatt! Referanse: ${result.id.slice(0, 8)}`;
      form.reset();
    } catch (err) {
      console.error(err);
      msgEl.textContent = 'Det oppstod en feil under innsending. Prøv igjen senere.';
    }
  });
}
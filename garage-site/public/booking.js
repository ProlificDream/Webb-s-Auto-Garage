document.addEventListener('DOMContentLoaded', async () => {
  const select = document.getElementById('service_id');
  const banner = document.getElementById('banner');
  const form = document.getElementById('apt-form');
  const ticketPreview = document.getElementById('ticket-preview');

  // Don't allow picking a date in the past.
  const dateInput = document.getElementById('preferred_date');
  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];

  try {
    const res = await fetch('/api/services');
    const services = await res.json();
    select.innerHTML = '<option value="">Choose a service…</option>' +
      services.map((s) => `<option value="${s.id}">${s.name} — from $${s.price_from}</option>`).join('');
  } catch (e) {
    select.innerHTML = '<option value="">Could not load services — refresh the page</option>';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';
    hideBanner();

    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');

      ticketPreview.textContent = `#${data.ticket}`;
      showBanner('ok', `Request received — your work order is ${data.ticket}. We'll confirm your time by phone or email.`);
      form.reset();
    } catch (err) {
      showBanner('err', err.message || 'Could not submit your request. Please call the shop instead.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Request';
    }
  });

  function showBanner(type, msg) {
    banner.className = `status-banner show ${type}`;
    banner.textContent = msg;
    banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function hideBanner() {
    banner.className = 'status-banner';
  }
});

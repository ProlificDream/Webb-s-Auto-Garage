let PRODUCTS = [];

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/products');
    PRODUCTS = await res.json();
  } catch (e) { /* ignore, summary will just be empty */ }

  renderSummary();

  const form = document.getElementById('order-form');
  const banner = document.getElementById('banner');
  const orderPreview = document.getElementById('order-preview');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cart = getCart();
    if (cart.length === 0) {
      showBanner('err', 'Your cart is empty — add something from the Parts Counter first.');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Placing order…';

    const payload = Object.fromEntries(new FormData(form).entries());
    payload.items = cart;

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');

      orderPreview.textContent = `#${data.order.order_number}`;
      showBanner('ok', `Order placed — confirmation ${data.order.order_number}. We'll reach out to arrange ${payload.fulfillment === 'delivery' ? 'delivery' : 'pickup'} and payment.`);
      clearCart();
      form.reset();
      renderSummary();
    } catch (err) {
      showBanner('err', err.message || 'Could not place your order. Please call the shop instead.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Place Order';
    }
  });

  function showBanner(type, msg) {
    banner.className = `status-banner show ${type}`;
    banner.textContent = msg;
    banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});

function renderSummary() {
  const cart = getCart();
  const linesEl = document.getElementById('cart-lines');
  const totalEl = document.getElementById('cart-total');
  if (!linesEl) return;

  if (cart.length === 0) {
    linesEl.innerHTML = '<p style="opacity:0.7;font-size:0.85rem;">Cart is empty — <a href="shop.html" style="color:var(--amber);">go shop</a>.</p>';
    totalEl.textContent = formatMoney(0);
    return;
  }

  let total = 0;
  linesEl.innerHTML = cart.map((item) => {
    const product = PRODUCTS.find((p) => p.id === item.id);
    if (!product) return '';
    const lineTotal = product.price * item.qty;
    total += lineTotal;
    return `<div class="cart-line"><span>${product.name} × ${item.qty}</span><span>${formatMoney(lineTotal)}</span></div>`;
  }).join('');
  totalEl.textContent = formatMoney(total);
}

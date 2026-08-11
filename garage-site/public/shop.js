let PRODUCTS = [];

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('product-grid');
  try {
    const res = await fetch('/api/products');
    PRODUCTS = await res.json();
    grid.innerHTML = PRODUCTS.map(productCard).join('');
  } catch (e) {
    grid.innerHTML = '<p>Could not load products — refresh the page.</p>';
  }

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-add]');
    if (!btn) return;
    addToCart(btn.dataset.add, 1);
    renderCartPanel();
    btn.textContent = 'Added ✓';
    setTimeout(() => { btn.textContent = 'Add to Cart'; }, 900);
  });

  renderCartPanel();
});

function productCard(p) {
  const outOfStock = p.stock <= 0;
  return `
    <div class="product-card">
      <span class="product-sku mono">${p.sku}</span>
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <div class="product-foot">
        <span class="product-price">${formatMoney(p.price)}</span>
        <button data-add="${p.id}" ${outOfStock ? 'disabled' : ''}>${outOfStock ? 'Out of Stock' : 'Add to Cart'}</button>
      </div>
    </div>`;
}

function renderCartPanel() {
  const cart = getCart();
  const linesEl = document.getElementById('cart-lines');
  const totalEl = document.getElementById('cart-total');
  if (!linesEl) return;

  if (cart.length === 0) {
    linesEl.innerHTML = '<p style="opacity:0.7;font-size:0.85rem;">Cart is empty.</p>';
    totalEl.textContent = formatMoney(0);
    return;
  }

  let total = 0;
  linesEl.innerHTML = cart.map((item) => {
    const product = PRODUCTS.find((p) => p.id === item.id);
    if (!product) return '';
    const lineTotal = product.price * item.qty;
    total += lineTotal;
    return `
      <div class="cart-line">
        <span>${product.name} × ${item.qty}</span>
        <span>
          ${formatMoney(lineTotal)}
          <button onclick="decrementLine('${item.id}')" aria-label="Remove one">−</button>
        </span>
      </div>`;
  }).join('');
  totalEl.textContent = formatMoney(total);
}

function decrementLine(id) {
  const cart = getCart();
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  updateQty(id, item.qty - 1);
  renderCartPanel();
}

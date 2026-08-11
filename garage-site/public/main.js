// Shared helpers used across pages.
document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  updateCartCountBadge();
});

// Cart is stored in localStorage so it survives navigation between shop -> checkout.
const CART_KEY = 'ironclad_cart_v1';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCountBadge();
}

function addToCart(id, qty = 1) {
  const cart = getCart();
  const existing = cart.find((i) => i.id === id);
  if (existing) existing.qty += qty;
  else cart.push({ id, qty });
  saveCart(cart);
}

function updateQty(id, qty) {
  let cart = getCart();
  if (qty <= 0) {
    cart = cart.filter((i) => i.id !== id);
  } else {
    const existing = cart.find((i) => i.id === id);
    if (existing) existing.qty = qty;
  }
  saveCart(cart);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartCountBadge();
}

function updateCartCountBadge() {
  const el = document.getElementById('cart-count');
  if (!el) return;
  const cart = getCart();
  el.textContent = cart.reduce((sum, i) => sum + i.qty, 0);
}

function formatMoney(n) {
  return `$${Number(n).toFixed(2)}`;
}

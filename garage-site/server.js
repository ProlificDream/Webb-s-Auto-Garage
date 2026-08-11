const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || 'change-me-admin-key';

const DATA_DIR = path.join(__dirname, 'data');
const APPTS_FILE = path.join(DATA_DIR, 'appointments.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(APPTS_FILE)) fs.writeFileSync(APPTS_FILE, '[]');
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, '[]');

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return []; }
}
function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
function nextTicketNumber(list, prefix) {
  const n = list.length + 1;
  return `${prefix}-${String(n).padStart(4, '0')}`;
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Static reference data: services + shop products ---
// Edit this list to change what shows up on the Services section / booking form.
const SERVICES = [
  { id: 'oil-change', name: 'Oil Change & Filter', duration_min: 30, price_from: 49 },
  { id: 'brakes', name: 'Brake Inspection & Repair', duration_min: 90, price_from: 129 },
  { id: 'tires', name: 'Tire Rotation & Balance', duration_min: 45, price_from: 59 },
  { id: 'diagnostics', name: 'Check Engine Diagnostics', duration_min: 60, price_from: 89 },
  { id: 'battery', name: 'Battery Test & Replacement', duration_min: 30, price_from: 39 },
  { id: 'ac', name: 'A/C Service', duration_min: 60, price_from: 99 },
  { id: 'general', name: 'General Inspection', duration_min: 45, price_from: 45 },
  { id: 'other', name: 'Something Else', duration_min: 60, price_from: 0 },
];

// Edit this list to change what's for sale in the shop.
const PRODUCTS = [
  { id: 'oil-filter-std', sku: 'PRT-1001', name: 'Standard Oil Filter', desc: 'Fits most 4-cylinder engines. Paper element, anti-drain valve.', price: 12.99, stock: 40 },
  { id: 'oil-5w30', sku: 'PRT-1002', name: 'Synthetic Oil 5W-30 (5qt)', desc: 'Full synthetic, jug of 5 quarts.', price: 34.5, stock: 25 },
  { id: 'wiper-set', sku: 'PRT-1003', name: 'Wiper Blade Set (Pair)', desc: 'All-season beam blades, universal clip.', price: 24.0, stock: 30 },
  { id: 'air-filter', sku: 'PRT-1004', name: 'Engine Air Filter', desc: 'OEM-spec replacement air filter.', price: 18.75, stock: 20 },
  { id: 'battery-terminal', sku: 'PRT-1005', name: 'Battery Terminal Cleaner Kit', desc: 'Brush + protective spray, prevents corrosion.', price: 9.5, stock: 50 },
  { id: 'gift-card-50', sku: 'GFT-2001', name: '$50 Service Gift Card', desc: 'Redeemable toward any service at the shop.', price: 50.0, stock: 999 },
  { id: 'floor-mats', sku: 'PRT-1006', name: 'All-Weather Floor Mat Set', desc: 'Universal fit, front + rear, trimmable.', price: 45.0, stock: 15 },
  { id: 'air-freshener', sku: 'PRT-1007', name: 'New Car Scent Air Freshener (3-Pack)', desc: 'Vent clip style, long lasting.', price: 6.0, stock: 60 },
];

app.get('/api/services', (req, res) => res.json(SERVICES));
app.get('/api/products', (req, res) => res.json(PRODUCTS));

// --- Appointments ---
app.post('/api/appointments', (req, res) => {
  const b = req.body || {};
  const required = ['name', 'phone', 'service_id', 'preferred_date'];
  const missing = required.filter((k) => !b[k] || String(b[k]).trim() === '');
  if (missing.length) {
    return res.status(400).json({ error: `Missing required field(s): ${missing.join(', ')}` });
  }
  const service = SERVICES.find((s) => s.id === b.service_id);

  const appointments = readJson(APPTS_FILE);
  const record = {
    ticket: nextTicketNumber(appointments, 'APT'),
    created_at: new Date().toISOString(),
    name: String(b.name).trim(),
    phone: String(b.phone).trim(),
    email: b.email ? String(b.email).trim() : '',
    vehicle: {
      year: b.vehicle_year || '',
      make: b.vehicle_make || '',
      model: b.vehicle_model || '',
    },
    service_id: b.service_id,
    service_name: service ? service.name : b.service_id,
    preferred_date: b.preferred_date,
    preferred_time: b.preferred_time || '',
    notes: b.notes || '',
    status: 'requested',
  };
  appointments.push(record);
  writeJson(APPTS_FILE, appointments);
  res.status(201).json({ ok: true, ticket: record.ticket, appointment: record });
});

function requireAdmin(req, res, next) {
  const key = req.header('x-admin-key') || req.query.key;
  if (key !== ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

app.get('/api/admin/appointments', requireAdmin, (req, res) => {
  res.json(readJson(APPTS_FILE));
});

// --- Orders ---
app.post('/api/orders', (req, res) => {
  const b = req.body || {};
  const required = ['name', 'email', 'items'];
  const missing = required.filter((k) => !b[k] || (Array.isArray(b[k]) && b[k].length === 0));
  if (missing.length) {
    return res.status(400).json({ error: `Missing required field(s): ${missing.join(', ')}` });
  }

  let total = 0;
  const lineItems = [];
  for (const item of b.items) {
    const product = PRODUCTS.find((p) => p.id === item.id);
    if (!product) continue;
    const qty = Math.max(1, parseInt(item.qty, 10) || 1);
    const lineTotal = Math.round(product.price * qty * 100) / 100;
    total += lineTotal;
    lineItems.push({ id: product.id, name: product.name, sku: product.sku, price: product.price, qty, lineTotal });
  }
  if (lineItems.length === 0) {
    return res.status(400).json({ error: 'No valid items in cart.' });
  }
  total = Math.round(total * 100) / 100;

  const orders = readJson(ORDERS_FILE);
  const record = {
    order_number: nextTicketNumber(orders, 'ORD'),
    created_at: new Date().toISOString(),
    name: String(b.name).trim(),
    email: String(b.email).trim(),
    phone: b.phone || '',
    fulfillment: b.fulfillment || 'pickup', // 'pickup' or 'delivery'
    notes: b.notes || '',
    items: lineItems,
    total,
    payment_status: 'pending', // no live payment processor connected yet
    status: 'received',
  };
  orders.push(record);
  writeJson(ORDERS_FILE, orders);
  res.status(201).json({ ok: true, order: record });
});

app.get('/api/admin/orders', requireAdmin, (req, res) => {
  res.json(readJson(ORDERS_FILE));
});

app.get('/api/admin/summary', requireAdmin, (req, res) => {
  const appts = readJson(APPTS_FILE);
  const orders = readJson(ORDERS_FILE);
  res.json({
    appointments_count: appts.length,
    orders_count: orders.length,
    revenue_pending: Math.round(orders.reduce((s, o) => s + o.total, 0) * 100) / 100,
  });
});

app.listen(PORT, () => {
  console.log(`Garage site running at http://localhost:${PORT}`);
});

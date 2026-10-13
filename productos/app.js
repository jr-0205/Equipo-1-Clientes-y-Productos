const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 3002);
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'productos.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(DB_PATH);
const run = (sql, params = []) => new Promise((resolve, reject) =>
  db.run(sql, params, function (err) { if (err) reject(err); else resolve({ lastID: this.lastID, changes: this.changes }); })
);
const all = (sql, params = []) => new Promise((resolve, reject) =>
  db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows))
);
const get = (sql, params = []) => new Promise((resolve, reject) =>
  db.get(sql, params, (err, row) => err ? reject(err) : resolve(row))
);
const serialize = row => ({ id: row.id, nombre: row.nombre, precio: row.precio, stock: row.stock });
function parseProduct(body) {
  const nombre = String(body?.nombre || '').trim();
  const precio = Number(body?.precio);
  const stock = Number(body?.stock ?? 0);
  if (!nombre) return { error: 'El nombre del producto es obligatorio' };
  if (!Number.isFinite(precio) || precio < 0) return { error: 'El precio debe ser numérico y mayor o igual a cero' };
  if (!Number.isInteger(stock) || stock < 0) return { error: 'Stock debe ser un entero mayor o igual a cero' };
  return { nombre, precio, stock };
}

app.get('/', (req, res) => res.json({
  servicio: 'Equipo 1 - Productos',
  endpoints: ['GET /health', 'GET /productos', 'GET /productos/:id', 'POST /productos', 'PUT /productos/:id', 'DELETE /productos/:id']
}));
app.get('/health', async (req, res) => {
  try { await get('SELECT 1 AS ok'); res.json({ status: 'ok', servicio: 'productos' }); }
  catch (e) { res.status(503).json({ status: 'error', error: e.message }); }
});
app.get('/productos', async (req, res, next) => {
  try { res.json((await all('SELECT * FROM productos ORDER BY id')).map(serialize)); } catch (e) { next(e); }
});
app.get('/productos/:id', async (req, res, next) => {
  try {
    const row = await get('SELECT * FROM productos WHERE id = ?', [Number(req.params.id)]);
    if (!row) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(serialize(row));
  } catch (e) { next(e); }
});
app.post('/productos', async (req, res, next) => {
  const data = parseProduct(req.body);
  if (data.error) return res.status(400).json({ error: data.error });
  try {
    const result = await run('INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)', [data.nombre, data.precio, data.stock]);
    res.status(201).json(serialize(await get('SELECT * FROM productos WHERE id = ?', [result.lastID])));
  } catch (e) { next(e); }
});
app.put('/productos/:id', async (req, res, next) => {
  const data = parseProduct(req.body);
  if (data.error) return res.status(400).json({ error: data.error });
  try {
    const result = await run('UPDATE productos SET nombre = ?, precio = ?, stock = ? WHERE id = ?', [data.nombre, data.precio, data.stock, Number(req.params.id)]);
    if (!result.changes) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(serialize(await get('SELECT * FROM productos WHERE id = ?', [Number(req.params.id)])));
  } catch (e) { next(e); }
});
app.delete('/productos/:id', async (req, res, next) => {
  try {
    const result = await run('DELETE FROM productos WHERE id = ?', [Number(req.params.id)]);
    if (!result.changes) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto eliminado correctamente', id: Number(req.params.id) });
  } catch (e) { next(e); }
});
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Error interno del servicio productos' }); });

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    precio REAL NOT NULL CHECK(precio >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0)
  )`, async err => {
    if (err) { console.error(err); process.exit(1); }
    try {
      const row = await get('SELECT COUNT(*) AS total FROM productos');
      if (row.total === 0) {
        await run('INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)', ['Laptop Dell', 12999, 8]);
        await run('INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)', ['Mouse Inalámbrico', 349, 25]);
      }
      app.listen(PORT, '0.0.0.0', () => console.log('Productos escuchando en ' + PORT));
    } catch (e) { console.error(e); process.exit(1); }
  });
});

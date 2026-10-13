const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 3001);
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'clientes.db');
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
const serialize = row => ({ id: row.id, nombre: row.nombre, correo: row.correo });

app.get('/', (req, res) => res.json({
  servicio: 'Equipo 1 - Clientes',
  endpoints: ['GET /health', 'GET /clientes', 'GET /clientes/:id', 'POST /clientes', 'PUT /clientes/:id', 'DELETE /clientes/:id']
}));
app.get('/health', async (req, res) => {
  try { await get('SELECT 1 AS ok'); res.json({ status: 'ok', servicio: 'clientes' }); }
  catch (e) { res.status(503).json({ status: 'error', error: e.message }); }
});
app.get('/clientes', async (req, res, next) => {
  try { res.json((await all('SELECT * FROM clientes ORDER BY id')).map(serialize)); } catch (e) { next(e); }
});
app.get('/clientes/:id', async (req, res, next) => {
  try {
    const row = await get('SELECT * FROM clientes WHERE id = ?', [Number(req.params.id)]);
    if (!row) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(serialize(row));
  } catch (e) { next(e); }
});
app.post('/clientes', async (req, res, next) => {
  const nombre = String(req.body?.nombre || req.body?.name || '').trim();
  const correo = String(req.body?.correo || '').trim().toLowerCase();
  if (!nombre || !correo) return res.status(400).json({ error: "Los campos 'nombre' y 'correo' son obligatorios" });
  try {
    const result = await run('INSERT INTO clientes (nombre, correo) VALUES (?, ?)', [nombre, correo]);
    res.status(201).json(serialize(await get('SELECT * FROM clientes WHERE id = ?', [result.lastID])));
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT') return res.status(409).json({ error: 'Ya existe un cliente con ese correo' });
    next(e);
  }
});
app.put('/clientes/:id', async (req, res, next) => {
  const nombre = String(req.body?.nombre || req.body?.name || '').trim();
  const correo = String(req.body?.correo || req.body?.email || '').trim().toLowerCase();
  if (!nombre || !correo) return res.status(400).json({ error: "Los campos 'nombre' y 'correo/email' son obligatorios" });
  try {
    const result = await run('UPDATE clientes SET nombre = ?, correo = ? WHERE id = ?', [nombre, correo, Number(req.params.id)]);
    if (!result.changes) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(serialize(await get('SELECT * FROM clientes WHERE id = ?', [Number(req.params.id)])));
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT') return res.status(409).json({ error: 'Ya existe un cliente con ese correo' });
    next(e);
  }
});
app.delete('/clientes/:id', async (req, res, next) => {
  try {
    const result = await run('DELETE FROM clientes WHERE id = ?', [Number(req.params.id)]);
    if (!result.changes) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ mensaje: 'Cliente eliminado correctamente', id: Number(req.params.id) });
  } catch (e) { next(e); }
});
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Error interno del servicio clientes' }); });

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    correo TEXT NOT NULL UNIQUE
  )`, async err => {
    if (err) { console.error(err); process.exit(1); }
    try {
      const row = await get('SELECT COUNT(*) AS total FROM clientes');
      if (row.total === 0) {
        await run('INSERT INTO clientes (nombre, correo) VALUES (?, ?)', ['Ana Gómez', 'ana@example.com']);
        await run('INSERT INTO clientes (nombre, correo) VALUES (?, ?)', ['Carlos López', 'carlos@example.com']);
      }
      app.listen(PORT, '0.0.0.0', () => console.log('Clientes escuchando en ' + PORT));
    } catch (e) { console.error(e); process.exit(1); }
  });
});

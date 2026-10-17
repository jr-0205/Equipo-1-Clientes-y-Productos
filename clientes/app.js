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

// Contrato de datos oficial del Equipo 1: id, nombre, correo.
const serialize = row => ({ id: row.id, nombre: row.nombre, correo: row.correo });

const ENDPOINTS = [
  'GET /health',
  'GET /clientes',
  'GET /clientes/:id',
  'POST /clientes',
  'PUT /clientes/:id',
  'PATCH /clientes/:id',
  'DELETE /clientes/:id'
];

// El id debe ser un entero positivo; si no, se responde 400 y no se toca la base.
function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizarCorreo(value) {
  return String(value ?? '').trim().toLowerCase();
}

function parseCliente(body = {}, { parcial = false, actual = null } = {}) {
  const nombre = body.nombre === undefined
    ? (parcial && actual ? actual.nombre : '')
    : String(body.nombre).trim();
  const correo = body.correo === undefined
    ? (parcial && actual ? actual.correo : '')
    : normalizarCorreo(body.correo);

  if (!nombre) return { error: "El campo 'nombre' es obligatorio" };
  if (!correo) return { error: "El campo 'correo' es obligatorio" };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
    return { error: "El campo 'correo' no tiene un formato válido" };
  }
  return { nombre, correo };
}

app.get('/', (req, res) => res.json({
  servicio: 'clientes',
  equipo: 'Equipo 1 - Clientes y Productos',
  puertoInterno: PORT,
  contrato: { request: ['nombre', 'correo'], response: ['id', 'nombre', 'correo'] },
  endpoints: ENDPOINTS
}));

app.get('/health', async (req, res) => {
  try {
    await get('SELECT 1 AS ok');
    res.json({ status: 'ok', servicio: 'clientes', puertoInterno: PORT });
  } catch (e) {
    res.status(503).json({ status: 'error', servicio: 'clientes', error: e.message });
  }
});

app.get('/clientes', async (req, res, next) => {
  try {
    res.json((await all('SELECT * FROM clientes ORDER BY id')).map(serialize));
  } catch (e) { next(e); }
});

app.get('/clientes/:id', async (req, res, next) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'El id debe ser un número entero positivo' });
  try {
    const row = await get('SELECT * FROM clientes WHERE id = ?', [id]);
    if (!row) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(serialize(row));
  } catch (e) { next(e); }
});

app.post('/clientes', async (req, res, next) => {
  const data = parseCliente(req.body);
  if (data.error) return res.status(400).json({ error: data.error });
  try {
    const result = await run('INSERT INTO clientes (nombre, correo) VALUES (?, ?)', [data.nombre, data.correo]);
    res.status(201).json(serialize(await get('SELECT * FROM clientes WHERE id = ?', [result.lastID])));
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT') return res.status(409).json({ error: 'Ya existe un cliente con ese correo' });
    next(e);
  }
});

app.put('/clientes/:id', async (req, res, next) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'El id debe ser un número entero positivo' });
  const data = parseCliente(req.body);
  if (data.error) return res.status(400).json({ error: data.error });
  try {
    const result = await run('UPDATE clientes SET nombre = ?, correo = ? WHERE id = ?', [data.nombre, data.correo, id]);
    if (!result.changes) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(serialize(await get('SELECT * FROM clientes WHERE id = ?', [id])));
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT') return res.status(409).json({ error: 'Ya existe un cliente con ese correo' });
    next(e);
  }
});

// PATCH actualiza solo los campos enviados (el gateway del Equipo 2 lo reenvía tal cual).
app.patch('/clientes/:id', async (req, res, next) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'El id debe ser un número entero positivo' });
  try {
    const actual = await get('SELECT * FROM clientes WHERE id = ?', [id]);
    if (!actual) return res.status(404).json({ error: 'Cliente no encontrado' });
    const data = parseCliente(req.body, { parcial: true, actual });
    if (data.error) return res.status(400).json({ error: data.error });
    await run('UPDATE clientes SET nombre = ?, correo = ? WHERE id = ?', [data.nombre, data.correo, id]);
    res.json(serialize(await get('SELECT * FROM clientes WHERE id = ?', [id])));
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT') return res.status(409).json({ error: 'Ya existe un cliente con ese correo' });
    next(e);
  }
});

app.delete('/clientes/:id', async (req, res, next) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'El id debe ser un número entero positivo' });
  try {
    const result = await run('DELETE FROM clientes WHERE id = ?', [id]);
    if (!result.changes) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ mensaje: 'Cliente eliminado correctamente', id });
  } catch (e) { next(e); }
});

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
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
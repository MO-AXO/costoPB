const express = require('express');
const { Pool } = require('pg');
const path = require('path');


const app = express();

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL no está configurada. Ve a Railway → tu servicio → Variables y agrega DATABASE_URL.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

app.use(express.json({ limit: '10mb' }));

app.get('/api/store', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT value FROM app_data WHERE key = 'store'");
    res.json(rows[0]?.value ?? null);
  } catch (e) {
    console.error('GET /api/store', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/store', async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO app_data (key, value, updated_at)
       VALUES ('store', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [req.body]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('POST /api/store', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/health', (_, res) => res.json({ ok: true }));

const SHEET_ID = '1pur7cS93mLA0U6oqs6bCn1WzyJ8gkHu3emLYUgLuVwg';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Datos`;

const parseSheetDate = (value) => {
  const match = typeof value === 'string' && value.match(/^Date\((\d+),(\d+),(\d+)\)$/);
  if (!match) return '';
  return `${match[1]}-${String(Number(match[2]) + 1).padStart(2, '0')}-${match[3].padStart(2, '0')}`;
};

app.get('/api/gastos-sheet', async (req, res) => {
  try {
    const response = await fetch(SHEET_URL);
    if (!response.ok) throw new Error(`Google Sheets respondió ${response.status}`);
    const text = await response.text();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end < 0) throw new Error('La hoja no devolvió datos válidos');
    const data = JSON.parse(text.slice(start, end + 1));
    const columns = data.table.cols.map(col => col.label);
    const rows = data.table.rows.map(row => {
      const item = {};
      columns.forEach((label, index) => {
        if (!label) return;
        const cell = row.c?.[index];
        item[label] = label === 'Fecha' ? parseSheetDate(cell?.v) : (cell?.v ?? '');
      });
      return item;
    }).filter(item => item.Fecha && item['Total ($)'] !== '');
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ rows, updatedAt: new Date().toISOString() });
  } catch (e) {
    console.error('GET /api/gastos-sheet', e.message);
    res.status(502).json({ error: 'No se pudo leer Google Sheets: ' + e.message });
  }
});

app.get('/api/reset', async (req, res) => {
  try {
    await pool.query("DELETE FROM app_data WHERE key = 'store'");
    res.send('<h2>Datos borrados. <a href="/">Volver al app</a></h2>');
  } catch (e) {
    res.status(500).send('Error: ' + e.message);
  }
});

app.use(express.static(path.join(__dirname)));

const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_data (
      key        TEXT PRIMARY KEY,
      value      JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('DB lista');
};

const PORT = process.env.PORT || 3000;

// Arranca el servidor siempre; intenta conectar la DB en paralelo
app.listen(PORT, () => console.log(`Pig Brothers Costeo en :${PORT}`));

initDB().catch(e => {
  console.error('Advertencia: no se pudo inicializar la DB:', e.message);
  console.error('El servidor sigue activo pero /api/store fallará hasta que DATABASE_URL esté configurada.');
});

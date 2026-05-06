const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.use(express.json({ limit: '10mb' }));

// API routes antes de static
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

// Static files (el app HTML)
app.use(express.static(path.join(__dirname)));

// Inicializar tabla y arrancar
const init = async () => {
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
init()
  .then(() => app.listen(PORT, () => console.log(`Pig Brothers Costeo en :${PORT}`)))
  .catch(e => { console.error('Error al iniciar DB:', e); process.exit(1); });

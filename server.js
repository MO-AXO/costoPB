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

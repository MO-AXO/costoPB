const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const https = require('https');

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

// ─── Endpoint IA ──────────────────────────────────────────────────────────────
app.post('/api/ai', async (req, res) => {
  const { messages, system } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada en Railway → Variables.' });
  }

  const body = JSON.stringify({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system,
    messages,
  });

  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  const proxyReq = https.request(options, proxyRes => {
    let data = '';
    proxyRes.on('data', chunk => { data += chunk; });
    proxyRes.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log('Anthropic raw response:', JSON.stringify(parsed).slice(0, 500));
        if (parsed.error) {
          const errMsg = typeof parsed.error === 'string'
            ? parsed.error
            : parsed.error.message || parsed.error.type || JSON.stringify(parsed.error);
          console.error('Anthropic API error:', JSON.stringify(parsed.error));
          return res.status(400).json({ error: errMsg });
        }
        res.json({ content: parsed.content?.[0]?.text || '' });
      } catch (e) {
        console.error('Parse error, raw data:', data.slice(0, 500));
        res.status(500).json({ error: 'Error parseando respuesta de Anthropic: ' + e.message });
      }
    });
  });
  proxyReq.on('error', e => res.status(500).json({ error: e.message }));
  proxyReq.write(body);
  proxyReq.end();
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

const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3000;

let pool;

async function connectWithRetry(retries = 10, delay = 2000) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  while (retries > 0) {
    try {
      // Use a test query to verify connection
      await pool.query('SELECT 1');
      console.log('✅ Connected to PostgreSQL (via pool)');
      break;
    } catch (err) {
      console.error(`DB connection failed: ${err.message}`);
      retries--;
      if (retries === 0) {
        console.error('❌ Could not connect to PostgreSQL. Exiting.');
        process.exit(1);
      }
      console.log(`🔁 Retrying in ${delay / 1000} seconds...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

connectWithRetry();

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(`Hello! DB time: ${result.rows[0].now}`);
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).send('DB query failed');
  }
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await pool.end();
  process.exit();
});

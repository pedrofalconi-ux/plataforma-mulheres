const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Defina DATABASE_URL antes de executar este script.');
}

async function runMigration() {
  const client = new Client({ connectionString });

  try {
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', '013_backend_compat_institutional.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.connect();
    console.log('Connected to Postgres.');

    await client.query(sql);
    console.log('Backend compatibility migration applied successfully.');
  } catch (err) {
    console.error('SQL Error:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

runMigration();

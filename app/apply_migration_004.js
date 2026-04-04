const { Client } = require('pg');
const fs = require('fs');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Defina DATABASE_URL antes de executar este script.');
}

async function runMigration() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    const sql = fs.readFileSync(__dirname + '/supabase/migrations/004_certificates_rls.sql', 'utf8');
    await client.connect();
    console.log('Connected to Postgres.');

    const res = await client.query(sql);
    console.log('Migration applied.');

  } catch (err) {
    console.error('SQL Error:', err);
  } finally {
    await client.end();
  }
}

runMigration();

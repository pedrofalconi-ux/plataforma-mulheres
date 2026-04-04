const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Defina DATABASE_URL antes de executar este script.');
}

async function runMigration() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', '006_customization_and_cart.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.connect();
    console.log('Connected to Postgres.');

    await client.query(sql);
    console.log('Migration 006 (Cart & Customization) applied successfully!');

  } catch (err) {
    console.error('SQL Error:', err);
  } finally {
    await client.end();
  }
}

runMigration();

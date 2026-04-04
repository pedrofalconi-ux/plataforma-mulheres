const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Defina DATABASE_URL antes de executar este script.');
}

async function runSql() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    await client.connect();
    console.log('Connected to Postgres.');

    const res = await client.query("UPDATE profiles SET role = 'admin' WHERE email = 'pedrofalconi11@gmail.com';");
    console.log('Update result:', res.rowCount, 'row(s) affected.');

    const check = await client.query("SELECT role FROM profiles WHERE email = 'pedrofalconi11@gmail.com';");
    console.log('Current role:', check.rows[0]);

  } catch (err) {
    console.error('SQL Error:', err);
  } finally {
    await client.end();
  }
}

runSql();

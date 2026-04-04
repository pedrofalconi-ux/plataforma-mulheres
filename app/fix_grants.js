const { Client } = require('pg');
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Defina DATABASE_URL antes de executar este script.');
}

async function runSql() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    await client.query('GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;');
    await client.query('GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;');
    await client.query('GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;');
    console.log('Grants applied successfully.');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
runSql();

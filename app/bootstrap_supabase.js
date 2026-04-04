const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;

if (!connectionString || connectionString.includes('[YOUR-DB-PASSWORD]')) {
  throw new Error('Defina DATABASE_URL com a senha real do banco antes de executar este script.');
}

const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
const seedPath = path.join(__dirname, 'supabase', 'seed.sql');

async function runFile(client, filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const name = path.basename(filePath);
  console.log(`Applying ${name}...`);
  await client.query(sql);
  console.log(`Applied ${name}`);
}

async function bootstrap() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to Postgres.');

    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    for (const file of migrationFiles) {
      await runFile(client, path.join(migrationsDir, file));
    }

    if (process.env.APPLY_SEED === 'true') {
      await runFile(client, seedPath);
    }

    console.log('Supabase bootstrap completed successfully.');
  } catch (error) {
    console.error('Bootstrap failed:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

bootstrap();

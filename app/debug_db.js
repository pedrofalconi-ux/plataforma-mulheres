const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv(filename) {
  try {
    const envPath = path.join(__dirname, filename);
    if (!fs.existsSync(envPath)) return;
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        process.env[key] = value;
      }
    });
    console.log(`Carregado: ${filename}`);
  } catch (err) {
    console.error(`Erro ao ler ${filename}:`, err.message);
  }
}

loadEnv('.env');
loadEnv('.env.local');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('URL ou Key do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
  console.log('Testando query na tabela courses...');
  const columns = ['id', 'title', 'price', 'total_modules', 'duration_minutes'];
  
  for (const col of columns) {
    const { error } = await supabase.from('courses').select(col).limit(1);
    if (error) {
      console.error(`ERRO na coluna [${col}]:`, error.message);
    } else {
      console.log(`SUCESSO na coluna [${col}]`);
    }
  }
}

debug();

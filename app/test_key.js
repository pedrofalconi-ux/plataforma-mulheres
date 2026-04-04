const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv(filename) {
    const envPath = path.join(__dirname, filename);
    if (!fs.existsSync(envPath)) return;

    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
        if (!match) return;
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        process.env[match[1]] = value;
    });
}

loadEnv('.env');
loadEnv('.env.local');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    throw new Error('Defina NEXT_PUBLIC_SUPABASE_URL antes de executar este script.');
}

if (!supabaseServiceKey) {
    throw new Error('Defina SUPABASE_SERVICE_ROLE_KEY antes de executar este script.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSelect() {
    console.log(`Testing SELECT on profiles with service key...`);
    
    const { data, compute, error } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });

    if (error) {
        console.error('Select failed:', error);
    } else {
        console.log('Select successful! Data:', data);
    }
}

testSelect();

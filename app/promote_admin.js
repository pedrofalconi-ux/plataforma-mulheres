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

async function promote() {
    const email = 'pedrofalconi11@gmail.com';
    console.log(`Attempting to promote ${email} to 'admin'...`);
    
    const { data, error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('email', email)
        .select();

    if (error) {
        console.error('Update failed:', error);
    } else {
        console.log('Update successful! Result:', data);
    }
}

promote();

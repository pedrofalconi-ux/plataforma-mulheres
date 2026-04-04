const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://illjlpovvzhnxiobmnfq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

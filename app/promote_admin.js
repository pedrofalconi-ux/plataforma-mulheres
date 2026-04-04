const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://illjlpovvzhnxiobmnfq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

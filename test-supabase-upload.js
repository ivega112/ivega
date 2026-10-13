const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('uploads', { public: true });
    console.log('Create Bucket:', bucketError ? bucketError.message : 'Success or already exists');

    const buffer = Buffer.from('hello world');
    const { data: uploadData, error: uploadError } = await supabase.storage.from('uploads').upload('test/hello.txt', buffer, { upsert: true });
    console.log('Upload:', uploadError ? uploadError.message : 'Success');

    const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl('test/hello.txt');
    console.log('Public URL:', publicUrlData.publicUrl);

    const fetch = (await import('node-fetch')).default;
    const res = await fetch(publicUrlData.publicUrl);
    console.log('Fetch Public URL Status:', res.status);
    console.log('Fetch Body:', await res.text());
  } catch (err) {
    console.error(err);
  }
}

test();

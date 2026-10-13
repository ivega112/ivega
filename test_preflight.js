require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(url, key);
  
  const { data, error } = await supabase.storage.from('smartline_uploads').createSignedUploadUrl('test_preflight.bin');
  const signedUrl = data.signedUrl;
  
  const res = await fetch(signedUrl, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://www.smart-line.business',
      'Access-Control-Request-Method': 'PUT',
      'Access-Control-Request-Headers': 'content-type'
    }
  });
  
  console.log("Status:", res.status);
  console.log("Headers:", Object.fromEntries(res.headers.entries()));
}
run();

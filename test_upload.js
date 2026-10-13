require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(url, key);
  
  const { data, error } = await supabase.storage.from('smartline_uploads').createSignedUploadUrl('test.txt');
  if (error) {
    console.log("Error creating url:", error.message);
    return;
  }
  
  console.log("Signed URL created:", data.signedUrl);
  
  const res = await fetch(data.signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'text/plain' },
    body: 'hello world'
  });
  
  console.log("Upload status:", res.status, res.statusText);
  const text = await res.text();
  console.log("Upload response:", text);
}
run();

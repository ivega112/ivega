require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(url, key);
  
  const { data, error } = await supabase.storage.getBucket('smartline_uploads');
  console.log("Bucket config:", data);
}
run();

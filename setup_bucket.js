require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(url, key);
  
  console.log("Creating smartline_uploads bucket if missing...");
  const { data, error } = await supabase.storage.createBucket('smartline_uploads', { public: true });
  if (error) {
    console.log("Bucket creation result:", error.message);
  } else {
    console.log("Bucket created!");
  }
  
  // also check if uploads bucket exists
  const { error: err2 } = await supabase.storage.createBucket('uploads', { public: true });
  
  console.log("Done");
}
run();

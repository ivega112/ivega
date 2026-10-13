require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  const query = `
    -- Enable RLS just in case it's disabled
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

    -- Create policy for public uploads to smartline_uploads
    DROP POLICY IF EXISTS "Public Uploads to smartline_uploads" ON storage.objects;
    CREATE POLICY "Public Uploads to smartline_uploads"
    ON storage.objects FOR INSERT TO public
    WITH CHECK (bucket_id = 'smartline_uploads');
  `;
  
  try {
    await pool.query(query);
    console.log("Policy created successfully!");
  } catch (err) {
    console.error("Error creating policy:", err.message);
  } finally {
    pool.end();
  }
}
run();

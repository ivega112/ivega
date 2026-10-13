import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import fs from "fs";

const supabaseUrl = process.env.SUPABASE_URL || "https://dmusaacbismezykaodgh.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_secret_1aiKSczyXKg-pF3kDlZpWg_Z8nnTLkG";
const BUCKET_NAME = "smartline_uploads";

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const key = `test-${randomUUID()}.txt`;
  
  console.log("Generating signed upload URL...");
  const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUploadUrl(key);
  
  if (error) {
    console.error("Failed to generate URL:", error);
    return;
  }
  
  console.log("URL generated:", data.path);
  
  console.log("Uploading via fetch to simulate browser...");
  // Construct the full URL:
  const uploadUrl = `${supabaseUrl}/storage/v1/object/upload/sign/${BUCKET_NAME}/${data.path}?token=${data.token}`;
  
  try {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/plain',
        // 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` // Usually not needed for signed upload URLs
      },
      body: "Hello world"
    });
    
    if (res.ok) {
      console.log("Upload successful!");
    } else {
      const text = await res.text();
      console.error("Upload failed with status:", res.status, text);
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

main();

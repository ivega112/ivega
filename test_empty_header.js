async function run() {
  try {
    const res = await fetch('https://example.com', {
      headers: { 'Content-Type': '' }
    });
    console.log("Success", res.status);
  } catch(e) {
    console.log("Error:", e.message);
  }
}
run();

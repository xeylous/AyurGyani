async function testMulBatch() {
  const batchId = "MUL-2026-4871";
  const url = `https://ayur-sathi.vercel.app/api/public/batch?batchId=${encodeURIComponent(batchId)}`;
  console.log("🌐 Fetching:", url);

  try {
    const res = await fetch(url);
    console.log("HTTP Status:", res.status);
    const data = await res.json();
    console.log("JSON Response Data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

testMulBatch();

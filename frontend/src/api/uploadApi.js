export async function initUpload(meta) {
  const res = await fetch("http://localhost:4000/upload/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(meta)
  });

  return res.json();
}
export async function getUploadStatus(uploadId) {
  const res = await fetch(
    `http://localhost:4000/upload/status/${uploadId}`
  );
  return res.json();
}

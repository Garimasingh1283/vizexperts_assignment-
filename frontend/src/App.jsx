import { useState, useEffect } from "react";
import { createChunks } from "./utils/chunkFile";
import { initUpload, getUploadStatus } from "./api/uploadApi";

function App() {
  const [file, setFile] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [uploadId, setUploadId] = useState(null);

  function handleFile(e) {
    const selected = e.target.files[0];
    setFile(selected);

    const generatedChunks = createChunks(selected);
    setChunks(generatedChunks);
    setUploadedCount(0);
  }

  async function startUpload() {
    console.log("Start Upload clicked");

    const res = await initUpload({
      filename: file.name,
      totalSize: file.size,
      totalChunks: chunks.length,
    });

    console.log("UPLOAD INIT RESPONSE", res);

    localStorage.setItem("uploadId", res.uploadId);
    setUploadId(res.uploadId);

    await uploadWithConcurrency(res.uploadId, []);
    alert("Upload completed!");
    await fetch("http://localhost:4000/upload/complete", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ uploadId }),
});

  }

  async function uploadOneChunk(chunk, uploadId) {
    const blob = file.slice(chunk.start, chunk.end);

    await fetch(
      `http://localhost:4000/upload/chunk?uploadId=${uploadId}&chunkIndex=${chunk.index}&startByte=${chunk.start}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: blob,
      }
    );

    setUploadedCount((prev) => prev + 1);
  }

  async function uploadWithConcurrency(uploadId, uploadedChunks) {
    const MAX_CONCURRENT = 3;
    let currentIndex = 0;

    const remainingChunks = chunks.filter(
      (c) => !uploadedChunks.includes(c.index)
    );

    async function worker() {
      while (currentIndex < remainingChunks.length) {
        const idx = currentIndex++;
        const chunk = remainingChunks[idx];

        console.log("Uploading chunk", chunk.index);
        await uploadOneChunk(chunk, uploadId);
      }
    }

    const workers = [];
    for (let i = 0; i < MAX_CONCURRENT; i++) {
      workers.push(worker());
    }

    await Promise.all(workers);
  }

  useEffect(() => {
    const savedUploadId = localStorage.getItem("uploadId");
    if (!savedUploadId || !file || chunks.length === 0) return;

    getUploadStatus(savedUploadId).then((status) => {
      console.log("Resuming upload", status);

      setUploadId(savedUploadId);
      setUploadedCount(status.uploadedChunks.length);

      uploadWithConcurrency(savedUploadId, status.uploadedChunks);
    });
  }, [file, chunks]);

  const progress =
    chunks.length === 0
      ? 0
      : Math.round((uploadedCount / chunks.length) * 100);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Resumable Chunk Upload</h1>

      <input type="file" onChange={handleFile} />

      {chunks.length > 0 && (
        <>
          <p>Total Chunks: {chunks.length}</p>
          <p>Progress: {progress}%</p>
          <progress value={uploadedCount} max={chunks.length} />
        </>
      )}

      <br />
      <br />

      <button onClick={startUpload} disabled={!file}>
        Start Upload
      </button>
    </div>
  );
}

export default App;

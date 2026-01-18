# 📁 Resumable Chunk-Based File Upload System
This project implements a **robust, resumable, chunk-based file upload system** designed to handle very large files (tested locally and designed for 1GB+ uploads).  
The system can **survive network interruptions, browser refreshes, and partial failures** without corrupting the uploaded file.
---

## 🧱 Tech Stack
- **Frontend:** React (Vite)
- **Backend:** Node.js + Express
- **Database:** MySQL (Prisma ORM)
- **Storage:** Local filesystem
- **Containerization:** Docker & Docker Compose

---
## 🔄 Upload Flow
1. Frontend slices a large file into **5MB chunks** using the `Blob.slice()` API.
2. A handshake request (`/upload/init`) creates an upload session.
3. Each chunk is uploaded with metadata:
   - `uploadId`
   - `chunkIndex`
   - `startByte`
4. Backend writes each chunk **directly at the correct byte offset**.
5. Database tracks the status of **every individual chunk**.
6. Upload can be paused, resumed, or continued after a page refresh.
7. Once all chunks are uploaded, the upload is marked as `COMPLETED`.

---

## 🔐 File Integrity Handling 
### Current Implementation
- File integrity is ensured using **byte-accurate writes**.
- Each chunk is written at its exact offset using `fs.writeSync`.
- Duplicate or retried chunk uploads are prevented using:
  - A composite unique constraint (`upload_id + chunk_index`)
  - Idempotent chunk-handling logic on the backend
This guarantees:
- No overlapping writes
- No duplicated data
- Correct reconstruction of the final file
---

## ⏸️ Pause / Resume Logic
- Each uploaded chunk is persisted in the database with status `UPLOADED`.
- Backend exposes:
- On page reload or restart:
- Frontend fetches already uploaded chunk indices.
- Only missing chunks are uploaded again.
- Chunk uploads are **idempotent**, making retries safe.

This works even after:
- Network disconnects
- Browser refresh
- Backend restarts
---

## 🚦 Concurrency Control
- Uploads are limited to **3 concurrent chunk uploads**.
- Implemented using a worker-pool pattern on the frontend.
- Prevents backend overload and network congestion.

---
## 📊 Progress Tracking

The frontend tracks:
- Total number of chunks
- Number of uploaded chunks
- Overall upload progress percentage
This enables accurate progress visualization and reliable resume behavior.

---
## 🐳 Running the Project Locally

```bash
docker-compose up --build
```
--- 
## 🐳 The working video of the project can be downloaded with the raw files, added with the code section 

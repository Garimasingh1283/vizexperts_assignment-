import { PrismaClient } from "@prisma/client";
import { v4 as uuid } from "uuid";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

/**
 * INIT UPLOAD HANDSHAKE
 */
export const initUpload = async (req, res) => {
  try {
    const { filename, totalSize, totalChunks } = req.body;

    if (!filename || !totalSize || !totalChunks) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const upload = await prisma.upload.create({
      data: {
        id: uuid(),
        filename,
        total_size: BigInt(totalSize),
        total_chunks: totalChunks,
        status: "UPLOADING",
      },
    });

    res.json({
      uploadId: upload.id,
      uploadedChunks: [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to initialize upload" });
  }
};

/**
 * CHUNK UPLOAD
 */
export const uploadChunk = async (req, res) => {
  try {
    const { uploadId, chunkIndex, startByte } = req.query;

    if (!uploadId || chunkIndex === undefined || startByte === undefined) {
      return res.status(400).json({ error: "Missing chunk parameters" });
    }

    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
    });

    if (!upload) {
      return res.status(404).json({ error: "Upload not found" });
    }

    if (upload.status === "COMPLETED") {
      return res.status(400).json({ error: "Upload already completed" });
    }

    if (!req.body || req.body.length === 0) {
      return res.status(400).json({ error: "Empty chunk received" });
    }

    if (!fs.existsSync("storage")) {
      fs.mkdirSync("storage");
    }

    const filePath = path.join("storage", `${uploadId}.bin`);
    const start = Number(startByte);
    const totalSize = Number(upload.total_size);

    if (start < 0 || start >= totalSize) {
      return res.status(400).json({ error: "Invalid startByte" });
    }

    if (start + req.body.length > totalSize) {
      return res.status(400).json({ error: "Chunk exceeds file size" });
    }

    // Idempotency check
    const existing = await prisma.chunk.findUnique({
      where: {
        upload_id_chunk_index: {
          upload_id: uploadId,
          chunk_index: Number(chunkIndex),
        },
      },
    });

    if (existing?.status === "UPLOADED") {
      return res.json({ ok: true });
    }

    // Write binary chunk at exact offset
    const fd = fs.openSync(filePath, "a+");
    fs.writeSync(fd, req.body, 0, req.body.length, start);
    fs.closeSync(fd);

    await prisma.chunk.upsert({
      where: {
        upload_id_chunk_index: {
          upload_id: uploadId,
          chunk_index: Number(chunkIndex),
        },
      },
      update: {
        status: "UPLOADED",
        received_at: new Date(),
      },
      create: {
        upload_id: uploadId,
        chunk_index: Number(chunkIndex),
        status: "UPLOADED",
        received_at: new Date(),
      },
    });

    // Auto-complete upload
    const uploadedCount = await prisma.chunk.count({
      where: {
        upload_id: uploadId,
        status: "UPLOADED",
      },
    });

    if (uploadedCount === upload.total_chunks) {
      const stats = fs.statSync(filePath);

      if (stats.size !== totalSize) {
        return res.status(500).json({
          error: "File size mismatch after upload",
        });
      }

      await prisma.upload.update({
        where: { id: uploadId },
        data: { status: "COMPLETED" },
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chunk upload failed" });
  }
};

/**
 * GET UPLOAD STATUS (RESUME SUPPORT)
 */
export const getUploadStatus = async (req, res) => {
  try {
    const { uploadId } = req.params;

    const chunks = await prisma.chunk.findMany({
      where: { upload_id: uploadId },
      select: { chunk_index: true },
    });

    res.json({
      uploadId,
      uploadedChunks: chunks.map(c => c.chunk_index),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get upload status" });
  }
};

/**
 * COMPLETE UPLOAD (OPTIONAL MANUAL ENDPOINT)
 */
// POST /upload/complete
export const completeUpload = async (req, res) => {
  const { uploadId } = req.body;

  const upload = await prisma.upload.findUnique({
    where: { id: uploadId },
    include: { chunks: true },
  });

  if (!upload) return res.status(404).json({ error: "Upload not found" });

  if (upload.chunks.length !== upload.total_chunks) {
    return res.status(400).json({ error: "Missing chunks" });
  }

  const tempPath = `storage/${uploadId}.bin`;
  const finalPath = `storage/${upload.filename}`;

  fs.renameSync(tempPath, finalPath);

  await prisma.upload.update({
    where: { id: uploadId },
    data: { status: "COMPLETED" },
  });

  res.json({ ok: true });
};

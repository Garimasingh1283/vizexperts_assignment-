import express from "express";
import {
  initUpload,
  uploadChunk,
  getUploadStatus,
  completeUpload,
} from "../controllers/upload.controller.js";

const router = express.Router();

router.post("/init", initUpload);
router.post("/chunk", uploadChunk);
router.get("/status/:uploadId", getUploadStatus);
router.post("/complete", completeUpload);

export default router;

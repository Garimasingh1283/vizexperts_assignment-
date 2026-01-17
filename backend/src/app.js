import express from "express";
import cors from "cors";
import uploadRoutes from "./routes/upload.routes.js";

const app = express();

/**
 * ✅ Allow frontend origin
 */
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

/**
 * 🔥 RAW parser ONLY for chunk uploads
 */
app.use(
  "/upload/chunk",
  express.raw({
    type: "application/octet-stream",
    limit: "1gb",
  })
);

/**
 * JSON parser for other routes
 */
app.use(express.json());

app.use("/upload", uploadRoutes);

export default app;

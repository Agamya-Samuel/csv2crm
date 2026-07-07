import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import healthRoutes from "./routes/health";
import uploadRoutes from "./routes/uploads";
import { createWorker } from "./services/queue/bull";
import { processBatch } from "./services/queue/processor";

const app = express();

app.use(helmet());
app.use(cors({ origin: config.FRONTEND_URL, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/uploads", uploadRoutes);

app.use(errorHandler);

const worker = createWorker(async (job) => {
  console.log(`Processing batch ${job.data.batchIndex} for upload ${job.data.uploadId}`);
  return processBatch(job);
});

worker.on("completed", (job) => {
  console.log(`Batch ${job.data.batchIndex} completed for upload ${job.data.uploadId}`);
});

worker.on("failed", (job, err) => {
  console.error(`Batch ${job?.data?.batchIndex} failed:`, err.message);
});

app.listen(config.PORT, () => {
  console.log(`API server running on port ${config.PORT}`);
});

export default app;

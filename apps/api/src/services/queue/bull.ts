import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { config } from "../../config";

const connection = new IORedis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const aiExtractionQueue = new Queue("ai-extraction", {
  connection: connection as any,
  defaultJobOptions: {
    attempts: config.MAX_RETRIES,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 100 },
  },
});

export function createWorker(processor: (job: any) => Promise<any>): Worker {
  return new Worker("ai-extraction", processor, {
    connection: connection as any,
    concurrency: config.BATCH_CONCURRENCY,
  });
}

export { connection as redisConnection };

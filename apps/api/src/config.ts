import { z } from "zod";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  AI_PROVIDER: z.enum(["openrouter", "openai", "gemini", "claude"]).default("openrouter"),
  AI_MODEL: z.string().default("openai/gpt-4o-mini"),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  BATCH_SIZE: z.coerce.number().int().positive().default(20),
  BATCH_CONCURRENCY: z.coerce.number().int().positive().default(3),
  MAX_RETRIES: z.coerce.number().int().positive().default(3),
  PORT: z.coerce.number().int().default(3001),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
});

export const config = envSchema.parse(process.env);

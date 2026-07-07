import { config } from "../../config";
import { OpenAICompatibleAdapter } from "./OpenAICompatibleAdapter";
import { GeminiAdapter } from "./GeminiAdapter";
import { ClaudeAdapter } from "./ClaudeAdapter";
import type { AIExtractor } from "./AIExtractor";

export function createAIExtractor(): AIExtractor {
  const provider = config.AI_PROVIDER;

  switch (provider) {
    case "openrouter":
      return new OpenAICompatibleAdapter(
        "https://openrouter.ai/api/v1",
        config.OPENROUTER_API_KEY,
        config.AI_MODEL
      );
    case "openai":
      return new OpenAICompatibleAdapter(
        "https://api.openai.com/v1",
        config.OPENAI_API_KEY,
        config.AI_MODEL
      );
    case "gemini":
      return new GeminiAdapter(config.GEMINI_API_KEY, config.AI_MODEL);
    case "claude":
      return new ClaudeAdapter(config.ANTHROPIC_API_KEY, config.AI_MODEL);
    default:
      return new OpenAICompatibleAdapter(
        "https://openrouter.ai/api/v1",
        config.OPENROUTER_API_KEY,
        config.AI_MODEL
      );
  }
}

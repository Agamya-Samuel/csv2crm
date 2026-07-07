const PRICING: Record<string, { input: number; output: number }> = {
  "xiaomimimo": { input: 0.10 / 1_000_000, output: 0.30 / 1_000_000 },
  "openai":     { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
  "openrouter": { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
  "gemini":     { input: 0.075 / 1_000_000, output: 0.30 / 1_000_000 },
  "claude":     { input: 3.00 / 1_000_000, output: 15.00 / 1_000_000 },
};

const DEFAULT_RATE = { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 };

export function estimateCost(
  provider: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const rate = PRICING[provider] || DEFAULT_RATE;
  return promptTokens * rate.input + completionTokens * rate.output;
}

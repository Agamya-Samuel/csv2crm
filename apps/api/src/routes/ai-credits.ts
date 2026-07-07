import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../db/client";
import { config } from "../config";

const router = Router();

interface MimoBalanceResult {
  available: boolean;
  balance?: number;
  currency?: string;
  tokenPlan?: {
    used: number;
    limit: number;
    percent: number;
    planName?: string;
    periodEnd?: string;
  };
  error?: string;
}

const MIMO_BASE = "https://platform.xiaomimimo.com/api/v1";

function mimoHeaders(cookie: string): Record<string, string> {
  return {
    Cookie: cookie,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
    Accept: "*/*",
    "Content-Type": "application/json",
    Referer: "https://platform.xiaomimimo.com/console/balance",
    "Accept-Language": "en",
  };
}

async function mimoFetch(path: string, cookie: string): Promise<any | null> {
  try {
    const res = await fetch(`${MIMO_BASE}${path}`, {
      headers: mimoHeaders(cookie),
      signal: AbortSignal.timeout(10000),
    });

    if (res.status === 401) return { _authError: true };
    if (!res.ok) return null;

    return await res.json();
  } catch {
    return null;
  }
}

function parseMimoNumber(val: unknown): number | undefined {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = parseFloat(val);
    if (!isNaN(n)) return n;
  }
  return undefined;
}

async function fetchMimoLiveBalance(cookie: string): Promise<MimoBalanceResult> {
  const [balanceRes, usageRes, detailRes] = await Promise.all([
    mimoFetch("/balance", cookie),
    mimoFetch("/tokenPlan/usage", cookie),
    mimoFetch("/tokenPlan/detail", cookie),
  ]);

  if (balanceRes?._authError) {
    return {
      available: false,
      error: "Session expired \u2014 re-copy cookies from platform.xiaomimimo.com",
    };
  }

  if (!balanceRes || balanceRes.code !== 0 || !balanceRes.data) {
    return {
      available: false,
      error: "Unexpected response from MiMo",
    };
  }

  const d = balanceRes.data;

  const result: MimoBalanceResult = {
    available: true,
    balance: parseMimoNumber(d.balance),
    currency: d.currency ?? "USD",
  };

  const usageData = usageRes?.data;
  const detailData = detailRes?.data;

  if (usageData?.usage != null) {
    const u = usageData.usage;
    result.tokenPlan = {
      used: parseMimoNumber(u.used) ?? 0,
      limit: parseMimoNumber(u.limit) ?? 0,
      percent: usageData.monthUsage?.percent ?? 0,
      planName: detailData?.planName ?? undefined,
      periodEnd: detailData?.currentPeriodEnd ?? undefined,
    };
  }

  return result;
}

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const provider = config.AI_PROVIDER;
    const model = config.AI_MODEL;

    const aggregate = await prisma.aiUsage.aggregate({
      _sum: {
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
      },
      _count: { id: true },
    });

    const localUsage = {
      promptTokens: aggregate._sum.promptTokens ?? 0,
      completionTokens: aggregate._sum.completionTokens ?? 0,
      totalTokens: aggregate._sum.totalTokens ?? 0,
      requestCount: aggregate._count.id,
    };

    let liveBalance: MimoBalanceResult = {
      available: false,
      error: "Live balance not supported for this provider",
    };

    if (provider === "xiaomimimo" && config.MIMO_COOKIE) {
      liveBalance = await fetchMimoLiveBalance(config.MIMO_COOKIE);
    }

    res.json({
      provider,
      model,
      localUsage,
      liveBalance,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

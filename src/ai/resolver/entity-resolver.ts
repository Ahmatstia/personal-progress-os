import { prisma } from "@/lib/prisma";
import { normalizeText, tokenize } from "../normalization";

export type EntityMatchCandidate<T = Record<string, unknown>> = {
  id: string;
  name: string;
  type: "GOAL" | "STAGE" | "TASK";
  score: number;
  parentName?: string;
  parentId?: string;
  data: T;
};

export type EntityResolutionResult<T = Record<string, unknown>> = {
  status: "EXACT" | "FUZZY" | "AMBIGUOUS" | "NOT_FOUND";
  confidence: number;
  confidenceCategory: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  resolvedEntity?: EntityMatchCandidate<T>;
  candidates: EntityMatchCandidate<T>[];
  query: string;
};

// ─── Similarity Functions ─────────────────────────────────

export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[m][n];
}

export function computeSimilarity(query: string, target: string): number {
  const q = normalizeText(query);
  const t = normalizeText(target);
  if (!q || !t) return 0;
  if (q === t) return 1.0;
  if (t.includes(q)) {
    return 0.85 + 0.14 * (q.length / t.length);
  }
  if (q.includes(t)) {
    return 0.8 + 0.1 * (t.length / q.length);
  }

  // Normalized Levenshtein whole string
  const maxLen = Math.max(q.length, t.length);
  const levDist = levenshteinDistance(q, t);
  const levSim = maxLen > 0 ? 1 - levDist / maxLen : 0;

  // Pairwise best token similarity
  const qTokens = tokenize(q);
  const tTokens = tokenize(t);
  let tokenMatchSum = 0;

  for (const qTok of qTokens) {
    let bestTokSim = 0;
    for (const tTok of tTokens) {
      if (qTok === tTok) {
        bestTokSim = 1.0;
        break;
      }
      const tokMax = Math.max(qTok.length, tTok.length);
      const tokDist = levenshteinDistance(qTok, tTok);
      const tokSim = tokMax > 0 ? 1 - tokDist / tokMax : 0;
      if (tokSim > bestTokSim) bestTokSim = tokSim;
    }
    tokenMatchSum += bestTokSim;
  }

  const avgTokenSim = qTokens.length > 0 ? tokenMatchSum / qTokens.length : 0;

  // Weighted score: 50% token-level fuzzy alignment + 50% full string Levenshtein
  const score = avgTokenSim * 0.5 + levSim * 0.5;
  return Number(Math.min(0.99, Math.max(0, score)).toFixed(3));
}

// ─── Entity Resolvers ─────────────────────────────────────

export async function resolveTaskEntity(
  query: string,
  userId: string,
  options?: { goalId?: string; stageId?: string; statusFilter?: "ACTIVE" | "COMPLETED" | "ALL" }
): Promise<EntityResolutionResult> {
  const normQuery = normalizeText(query);
  if (!normQuery) {
    return {
      status: "NOT_FOUND",
      confidence: 0,
      confidenceCategory: "UNKNOWN",
      candidates: [],
      query,
    };
  }

  const allTasks = await prisma.task.findMany({
    where: {
      userId,
      ...(options?.stageId ? { stageId: options.stageId } : {}),
      ...(options?.goalId ? { stage: { goalId: options.goalId } } : {}),
      ...(options?.statusFilter === "ACTIVE"
        ? { status: { not: "COMPLETED" } }
        : options?.statusFilter === "COMPLETED"
        ? { status: "COMPLETED" }
        : {}),
    },
    include: {
      stage: { include: { goal: true } },
    },
  });

  const scored: EntityMatchCandidate[] = allTasks
    .map((task) => {
      const score = computeSimilarity(normQuery, task.title);
      return {
        id: task.id,
        name: task.title,
        type: "TASK" as const,
        score,
        parentName: `${task.stage?.goal?.title ?? ""} / ${task.stage?.name ?? ""}`,
        parentId: task.stageId ?? undefined,
        data: task,
      };
    })
    .filter((c) => c.score >= 0.4)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return {
      status: "NOT_FOUND",
      confidence: 0,
      confidenceCategory: "UNKNOWN",
      candidates: [],
      query,
    };
  }

  const top = scored[0];

  // Exact match
  if (top.score >= 0.95) {
    return {
      status: "EXACT",
      confidence: 0.98,
      confidenceCategory: "HIGH",
      resolvedEntity: top,
      candidates: scored.slice(0, 5),
      query,
    };
  }

  // Ambiguity check: if 2nd candidate is very close in score (diff < 0.15)
  if (scored.length > 1 && scored[1].score >= 0.55 && top.score - scored[1].score < 0.15) {
    return {
      status: "AMBIGUOUS",
      confidence: top.score,
      confidenceCategory: "MEDIUM",
      candidates: scored.slice(0, 5),
      query,
    };
  }

  if (top.score >= 0.6) {
    return {
      status: "FUZZY",
      confidence: top.score,
      confidenceCategory: top.score >= 0.8 ? "HIGH" : "MEDIUM",
      resolvedEntity: top,
      candidates: scored.slice(0, 5),
      query,
    };
  }

  return {
    status: "NOT_FOUND",
    confidence: top.score,
    confidenceCategory: "LOW",
    candidates: scored.slice(0, 5),
    query,
  };
}

export async function resolveGoalEntity(query: string, userId: string): Promise<EntityResolutionResult> {
  const normQuery = normalizeText(query);
  if (!normQuery) {
    return { status: "NOT_FOUND", confidence: 0, confidenceCategory: "UNKNOWN", candidates: [], query };
  }

  const goals = await prisma.goal.findMany({
    where: { userId },
    include: { _count: { select: { stages: true } } },
  });

  const scored: EntityMatchCandidate[] = goals
    .map((goal) => ({
      id: goal.id,
      name: goal.title,
      type: "GOAL" as const,
      score: computeSimilarity(normQuery, goal.title),
      data: goal,
    }))
    .filter((c) => c.score >= 0.4)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return { status: "NOT_FOUND", confidence: 0, confidenceCategory: "UNKNOWN", candidates: [], query };
  }

  const top = scored[0];
  if (top.score >= 0.95) {
    return { status: "EXACT", confidence: 0.98, confidenceCategory: "HIGH", resolvedEntity: top, candidates: scored, query };
  }
  if (scored.length > 1 && scored[1].score >= 0.55 && top.score - scored[1].score < 0.15) {
    return { status: "AMBIGUOUS", confidence: top.score, confidenceCategory: "MEDIUM", candidates: scored.slice(0, 5), query };
  }
  if (top.score >= 0.6) {
    return { status: "FUZZY", confidence: top.score, confidenceCategory: top.score >= 0.8 ? "HIGH" : "MEDIUM", resolvedEntity: top, candidates: scored.slice(0, 5), query };
  }

  return { status: "NOT_FOUND", confidence: top.score, confidenceCategory: "LOW", candidates: scored.slice(0, 5), query };
}

export async function resolveStageEntity(
  query: string,
  userId: string,
  goalId?: string
): Promise<EntityResolutionResult> {
  const normQuery = normalizeText(query);
  if (!normQuery) {
    return { status: "NOT_FOUND", confidence: 0, confidenceCategory: "UNKNOWN", candidates: [], query };
  }

  const stages = await prisma.stage.findMany({
    where: {
      userId,
      ...(goalId ? { goalId } : {}),
    },
    include: { goal: true },
  });

  const scored: EntityMatchCandidate[] = stages
    .map((stage) => ({
      id: stage.id,
      name: stage.name,
      type: "STAGE" as const,
      score: computeSimilarity(normQuery, stage.name),
      parentName: stage.goal.title,
      parentId: stage.goalId,
      data: stage,
    }))
    .filter((c) => c.score >= 0.4)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return { status: "NOT_FOUND", confidence: 0, confidenceCategory: "UNKNOWN", candidates: [], query };
  }

  const top = scored[0];
  if (top.score >= 0.95) {
    return { status: "EXACT", confidence: 0.98, confidenceCategory: "HIGH", resolvedEntity: top, candidates: scored, query };
  }
  if (scored.length > 1 && scored[1].score >= 0.55 && top.score - scored[1].score < 0.15) {
    return { status: "AMBIGUOUS", confidence: top.score, confidenceCategory: "MEDIUM", candidates: scored.slice(0, 5), query };
  }
  if (top.score >= 0.6) {
    return { status: "FUZZY", confidence: top.score, confidenceCategory: top.score >= 0.8 ? "HIGH" : "MEDIUM", resolvedEntity: top, candidates: scored.slice(0, 5), query };
  }

  return { status: "NOT_FOUND", confidence: top.score, confidenceCategory: "LOW", candidates: scored.slice(0, 5), query };
}

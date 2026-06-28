// ============================================================
// server/src/services/cascadeflow.ts
// CascadeFlow budget enforcement layer — wraps every Gemini call
// ============================================================

export interface CascadeStats {
  run_id: string;
  cost: number;
  budget_max: number;
  budget_remaining: number;
  latency_ms: number;
  step_count: number;
  last_action: "allow" | "block";
}

export class BudgetExceededError extends Error {
  cascadeStats: CascadeStats;
  constructor(message: string, stats: CascadeStats) {
    super(message);
    this.name = "BudgetExceededError";
    this.cascadeStats = stats;
  }
}

// Gemini Flash pricing: ~$0.075 per 1M output tokens = $0.000000075 per char
const COST_PER_CHAR = 0.000000075;

function makeRunId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function estimateCost(input: string, output: string): number {
  return (input.length + output.length) * COST_PER_CHAR;
}

/**
 * Wraps a Gemini call with CascadeFlow budget enforcement.
 *
 * Usage:
 *   const { result, cascadeStats } = await withBudget(0.01, prompt, () => gemini.generateContent(prompt));
 *
 * Throws BudgetExceededError if cost exceeds budget.
 * Returns cascadeStats alongside the result for every response.
 */
export async function withBudget<T>(
  budget: number,
  prompt: string,
  fn: () => Promise<T>,
  extractOutput?: (r: T) => string
): Promise<{ result: T; cascadeStats: CascadeStats }> {
  const run_id = makeRunId();
  const start = Date.now();

  // Pre-flight budget check on input size alone
  const preflightCost = prompt.length * COST_PER_CHAR;
  if (preflightCost > budget) {
    const stats: CascadeStats = {
      run_id, cost: 0, budget_max: budget,
      budget_remaining: budget, latency_ms: 0,
      step_count: 0, last_action: "block",
    };
    throw new BudgetExceededError(
      `CascadeFlow blocked: estimated input cost $${preflightCost.toFixed(6)} exceeds budget $${budget}`,
      stats
    );
  }

  // Execute the Gemini call
  let result: T;
  try {
    result = await fn();
  } catch (err: any) {
    const latency_ms = Date.now() - start;
    const stats: CascadeStats = {
      run_id,
      cost: preflightCost,
      budget_max: budget,
      budget_remaining: budget - preflightCost,
      latency_ms,
      step_count: 1,
      last_action: "allow",
    };
    if (err) {
      err.cascadeStats = stats;
    }
    throw err;
  }
  const latency_ms = Date.now() - start;

  // Extract output text for cost estimation
  const outputText = extractOutput
    ? extractOutput(result)
    : typeof (result as any)?.response?.text === "function"
      ? (result as any).response.text()
      : JSON.stringify(result);

  const cost = estimateCost(prompt, outputText);
  const budget_remaining = budget - cost;
  const last_action: "allow" | "block" = cost <= budget ? "allow" : "block";

  const stats: CascadeStats = {
    run_id, cost, budget_max: budget,
    budget_remaining, latency_ms,
    step_count: 1, last_action,
  };

  if (cost > budget) {
    throw new BudgetExceededError(
      `CascadeFlow blocked: actual cost $${cost.toFixed(6)} exceeded budget $${budget}`,
      stats
    );
  }

  return { result, cascadeStats: stats };
}

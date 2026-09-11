export class ProviderControlError extends Error {
  constructor(readonly status: "RATE_LIMITED" | "BUDGET_EXHAUSTED", message: string, readonly retryAfterMs?: number) { super(message); this.name = "ProviderControlError"; }
}

interface CacheEntry<T> { value: T; expiresAt: number; }

export interface ControlledResult<T> { value: T; cacheHit: boolean; requestExecuted: boolean; }

export class RequestController {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly inFlight = new Map<string, Promise<unknown>>();
  private active = 0;
  private readonly queue: Array<() => void> = [];
  private cooldownUntil = 0;
  private consecutiveRateLimits = 0;
  private budgetDay = "";
  private budgetUsed = 0;

  constructor(private readonly policy: { ttlMs: number; concurrency: number; dailyRequestBudget?: number; cooldownBaseMs?: number; cooldownMaxMs?: number }, private readonly now: () => number = Date.now) {}

  async run<T>(key: string, request: () => Promise<T>, isRateLimit: (error: unknown) => boolean = () => false): Promise<ControlledResult<T>> {
    const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, " ");
    const cached = this.cache.get(normalizedKey) as CacheEntry<T> | undefined;
    if (cached && cached.expiresAt > this.now()) return { value: cached.value, cacheHit: true, requestExecuted: false };
    if (cached) this.cache.delete(normalizedKey);
    const pending = this.inFlight.get(normalizedKey) as Promise<T> | undefined;
    if (pending) return { value: await pending, cacheHit: true, requestExecuted: false };
    this.assertAvailable();
    const promise = this.withSlot(async () => {
      this.recordRequest();
      try {
        const value = await request();
        this.consecutiveRateLimits = 0;
        this.cache.set(normalizedKey, { value, expiresAt: this.now() + this.policy.ttlMs });
        return value;
      } catch (error) {
        if (isRateLimit(error)) this.recordRateLimit();
        throw error;
      }
    });
    this.inFlight.set(normalizedKey, promise);
    try { return { value: await promise, cacheHit: false, requestExecuted: true }; }
    finally { this.inFlight.delete(normalizedKey); }
  }

  state() { this.resetBudgetIfNeeded(); return { cacheEntries: this.cache.size, inFlight: this.inFlight.size, active: this.active, cooldownUntil: this.cooldownUntil || undefined, budgetUsed: this.budgetUsed, dailyRequestBudget: this.policy.dailyRequestBudget }; }

  clear() { this.cache.clear(); this.inFlight.clear(); this.cooldownUntil = 0; this.consecutiveRateLimits = 0; this.budgetUsed = 0; }

  private assertAvailable() {
    this.resetBudgetIfNeeded();
    if (this.cooldownUntil > this.now()) throw new ProviderControlError("RATE_LIMITED", "Provider cooldown is active after an upstream rate limit.", this.cooldownUntil - this.now());
    if (this.policy.dailyRequestBudget !== undefined && this.budgetUsed >= this.policy.dailyRequestBudget) throw new ProviderControlError("BUDGET_EXHAUSTED", "The provider-specific daily request budget is exhausted.");
  }

  private recordRequest() { this.resetBudgetIfNeeded(); this.budgetUsed += 1; }
  private resetBudgetIfNeeded() { const day = new Date(this.now()).toISOString().slice(0, 10); if (day !== this.budgetDay) { this.budgetDay = day; this.budgetUsed = 0; } }
  private recordRateLimit() { this.consecutiveRateLimits += 1; const base = this.policy.cooldownBaseMs ?? 60_000; const cap = this.policy.cooldownMaxMs ?? 30 * 60_000; this.cooldownUntil = this.now() + Math.min(cap, base * 2 ** (this.consecutiveRateLimits - 1)); }
  private async withSlot<T>(work: () => Promise<T>): Promise<T> { if (this.active >= this.policy.concurrency) await new Promise<void>((resolve) => this.queue.push(resolve)); this.active += 1; try { return await work(); } finally { this.active -= 1; this.queue.shift()?.(); } }
}

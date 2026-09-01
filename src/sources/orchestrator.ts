import type { ProviderHealth, ProviderHealthStatus } from "./provider";

export interface IsolatedProviderResult<T> {
  providerId: string;
  status: ProviderHealthStatus;
  records: T[];
  error?: string;
  health?: ProviderHealth;
}

export interface ProviderTask<T> {
  providerId: string;
  run(): Promise<{ records: T[]; health?: ProviderHealth }>;
}

export async function runIsolatedProviders<T>(tasks: ProviderTask<T>[]): Promise<IsolatedProviderResult<T>[]> {
  const settled = await Promise.allSettled(tasks.map((task) => task.run()));
  return settled.map((result, index) => {
    const providerId = tasks[index].providerId;
    if (result.status === "fulfilled") {
      return { providerId, status: result.value.health?.status ?? "HEALTHY", records: result.value.records, health: result.value.health };
    }
    return { providerId, status: "UNAVAILABLE", records: [], error: result.reason instanceof Error ? result.reason.message : "Provider failed." };
  });
}

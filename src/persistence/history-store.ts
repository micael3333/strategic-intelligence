import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { CrossSourceStrategicEvent } from "@/domain/multi-source";
import type { EnergyObservation, TradeObservation } from "@/domain/physical-economy";
import type { SignalGraphEdge } from "@/domain/signal-graph";

export interface ProviderSnapshot { providerId: string; status: string; recordsRetrieved: number; error?: string; }
export interface IntelligenceSnapshot {
  id: string;
  queryKey: string;
  query: string;
  dimension: string;
  technologyCluster?: string;
  retrievedAt: string;
  firstSeen: string;
  lastSeen: string;
  providers: ProviderSnapshot[];
  events: CrossSourceStrategicEvent[];
  energyObservations: EnergyObservation[];
  tradeObservations: TradeObservation[];
  relationships: SignalGraphEdge[];
}

export interface HealthSnapshot { id: string; providerId: string; status: string; checkedAt: string; recordsRetrieved?: number; message: string; performedExternalCheck?: boolean; mode?: string; authenticationRequired?: boolean; lastError?: string; }
type HistoryRecord = { kind: "INTELLIGENCE_SNAPSHOT"; data: IntelligenceSnapshot } | { kind: "HEALTH_SNAPSHOT"; data: HealthSnapshot };

export class HistoryStore {
  private writeQueue: Promise<void> = Promise.resolve();
  constructor(private readonly filePath = path.join(process.cwd(), ".data", "intelligence-history.jsonl")) {}

  appendSnapshot(snapshot: IntelligenceSnapshot): Promise<void> { return this.append({ kind: "INTELLIGENCE_SNAPSHOT", data: snapshot }); }
  appendHealth(snapshot: HealthSnapshot): Promise<void> { return this.append({ kind: "HEALTH_SNAPSHOT", data: snapshot }); }

  async snapshots(): Promise<IntelligenceSnapshot[]> { return (await this.readAll()).flatMap((record) => record.kind === "INTELLIGENCE_SNAPSHOT" ? [record.data] : []); }
  async healthSnapshots(): Promise<HealthSnapshot[]> { return (await this.readAll()).flatMap((record) => record.kind === "HEALTH_SNAPSHOT" ? [record.data] : []); }

  async latestByQuery(): Promise<IntelligenceSnapshot[]> {
    const byKey = new Map<string, IntelligenceSnapshot>();
    for (const snapshot of await this.snapshots()) { const existing = byKey.get(snapshot.queryKey); if (!existing || existing.retrievedAt < snapshot.retrievedAt) byKey.set(snapshot.queryKey, snapshot); }
    return [...byKey.values()].sort((a, b) => b.retrievedAt.localeCompare(a.retrievedAt));
  }

  private append(record: HistoryRecord): Promise<void> {
    this.writeQueue = this.writeQueue.then(async () => { await mkdir(path.dirname(this.filePath), { recursive: true }); await appendFile(this.filePath, `${JSON.stringify(record)}\n`, "utf8"); });
    return this.writeQueue;
  }

  private async readAll(): Promise<HistoryRecord[]> {
    try { const text = await readFile(this.filePath, "utf8"); return text.split(/\r?\n/).filter(Boolean).flatMap((line) => { try { return [JSON.parse(line) as HistoryRecord]; } catch { return []; } }); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; }
  }
}

export const historyStore = new HistoryStore();

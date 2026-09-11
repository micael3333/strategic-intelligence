import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { HistoryStore, type IntelligenceSnapshot } from "./history-store";

const folders: string[] = [];
afterEach(async () => { await Promise.all(folders.splice(0).map((folder) => rm(folder, { recursive: true, force: true }))); });
describe("HistoryStore", () => { it("appends snapshots and returns the latest per query without mutating history", async () => { const folder = await mkdtemp(path.join(tmpdir(), "allmarkets-history-")); folders.push(folder); const store = new HistoryStore(path.join(folder, "history.jsonl")); const base: IntelligenceSnapshot = { id: "one", queryKey: "q", query: "nuclear", dimension: "TECHNOLOGY", retrievedAt: "2026-01-01", firstSeen: "2026-01-01", lastSeen: "2026-01-01", providers: [], events: [], energyObservations: [], tradeObservations: [], relationships: [] }; await Promise.all([store.appendSnapshot(base), store.appendSnapshot({ ...base, id: "two", retrievedAt: "2026-01-02", lastSeen: "2026-01-02" })]); expect(await store.snapshots()).toHaveLength(2); expect((await store.latestByQuery())[0].id).toBe("two"); }); });

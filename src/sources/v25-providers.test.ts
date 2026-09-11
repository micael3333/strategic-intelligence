import { readFile, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { RequestController } from "./runtime/request-control";
import { TEDProvider } from "./ted";
import { UKFindATenderProvider } from "./uk-fts";
import { parseDIUOfficialHtml, normalizeDIURecord } from "./diu";
import { parseBlueUASOfficialHtml, normalizeBlueUASRecord } from "./blue-uas";
import { HouseDisclosureProvider } from "./house-disclosures";
import { ExportControlsProvider } from "./export-controls";
import type { HouseDisclosureRow } from "./house-disclosures";

const fixture = (name: string) => readFile(path.join(process.cwd(), "src", "test", "fixtures", name), "utf8");
const controller = () => new RequestController({ ttlMs: 60_000, concurrency: 1, dailyRequestBudget: 5 });

describe("V2.5 official provider normalizers", () => {
  it("preserves EU jurisdiction, currency, provenance and strategic taxonomy from TED", async () => {
    const raw = JSON.parse(await fixture("ted-search.json"));
    const provider = new TEDProvider({ fetchImplementation: async () => Response.json(raw), now: () => new Date("2026-08-22T00:00:00Z"), requestController: controller() });
    const result = await provider.search({ keywords: "navigation", limit: 10 });
    expect(result.records).toHaveLength(1);
    expect(result.records[0]).toMatchObject({ jurisdiction: "EU", currency: "EUR", sourceFamily: "TED_EU", procurementStage: "TENDER" });
    expect(result.records[0].event.evidenceLevel).toBe("CONFIRMED");
    expect(result.records[0].rawProvenanceHash).toHaveLength(64);
  });

  it("normalizes UK OCDS awards without collapsing them into US records", async () => {
    const raw = JSON.parse(await fixture("uk-ocds.json"));
    const provider = new UKFindATenderProvider({ fetchImplementation: async () => Response.json(raw), now: () => new Date("2026-08-22T00:00:00Z"), requestController: controller() });
    const result = await provider.search({ stages: ["award"], limit: 10 });
    expect(result.records[0]).toMatchObject({ jurisdiction: "UK", supplier: "Fixture Systems Ltd", currency: "GBP", procurementStage: "AWARD", sourceFamily: "UK_FIND_A_TENDER" });
    expect(result.records[0].event.funnelStageCandidate).toBe(5);
  });

  it("keeps bounded official-page DIU and Blue UAS facts separate from inference", async () => {
    const diu = parseDIUOfficialHtml(await fixture("diu.html"));
    const blue = parseBlueUASOfficialHtml(await fixture("blue-uas.html"));
    expect(normalizeDIURecord(diu[0], "2026-08-22T00:00:00Z").event).toMatchObject({ sourceFamily: "DIU", evidenceLevel: "CONFIRMED", entityName: "Fixture Robotics", funnelStageCandidate: 3 });
    expect(normalizeBlueUASRecord(blue[0], "2026-08-22T00:00:00Z").event).toMatchObject({ sourceFamily: "BLUE_UAS", evidenceLevel: "CONFIRMED", entityName: "Fixture Avionics" });
  });

  it("deduplicates House rows and preserves reported value ranges", async () => {
    const rows = JSON.parse(await fixture("house-disclosures.json")) as HouseDisclosureRow[];
    const result = new HouseDisclosureProvider(() => new Date("2026-08-22T00:00:00Z")).ingest([...rows, ...rows]);
    expect(result.records).toHaveLength(1);
    expect(result.duplicatesBlocked).toBe(1);
    expect(result.records[0].valueRange).toMatchObject({ minimum: 1001, maximum: 15000, currency: "USD" });
  });

  it("confirms only exact official snapshot matches and marks partial names as candidates", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "strategic-intelligence-csl-"));
    const snapshotPath = path.join(dir, "csl.json");
    await writeFile(snapshotPath, await fixture("export-controls.json"), "utf8");
    const provider = new ExportControlsProvider({ snapshotPath, now: () => new Date("2026-08-22T00:00:00Z") });
    const exact = await provider.search("ERE Holdings");
    const partial = await provider.search("Restricted Entity");
    expect(exact).toMatchObject({ status: "CONFIRMED_MATCH", relationshipStatus: "CONFIRMED", confidence: 1 });
    expect(partial).toMatchObject({ status: "POSSIBLE_MATCH", relationshipStatus: "CANDIDATE", confidence: 0.5 });
    expect(exact.event?.eventType).toBe("OFFICIAL_RESTRICTION_OBSERVATION");
  });
});

import { describe, expect, it } from "vitest";
import { validateSignalEdge, type SignalGraphEdge } from "./signal-graph";

const edge: SignalGraphEdge = { id: "edge", fromNodeId: "a", toNodeId: "b", type: "SUPPLIES", assertionClass: "FACT", status: "CANDIDATE", confidence: .9, reason: "fixture", firstSeen: "2026-01-01", lastSeen: "2026-01-01", sourceProviders: ["provider:test"], evidenceIds: ["source"], evidence: [{ sourceId: "source", sourceUrl: "official", retrievedAt: "2026-01-01", evidenceLevel: "INFERRED", confidence: .9, reason: "fixture" }] };
describe("signal graph evidence", () => { it("rejects facts without confirmed evidence", () => expect(validateSignalEdge(edge)).toContain("A FACT requires confirmed evidence.")); it("accepts a confirmed fact", () => expect(validateSignalEdge({ ...edge, status: "CONFIRMED", evidence: [{ ...edge.evidence[0], evidenceLevel: "CONFIRMED" }] })).toEqual([])); });

import type { EvidenceLevel } from "./models";

export type SignalNodeType = "TECHNOLOGY" | "CAPABILITY" | "COMPONENT" | "MATERIAL" | "MINERAL" | "COMMODITY" | "COMPANY" | "AGENCY" | "PROGRAM" | "AWARD" | "GRANT" | "COUNTRY" | "TRADE_PRODUCT" | "ENERGY_SERIES" | "FILING" | "EVENT";
export type SignalEdgeType = "FUNDS" | "PROCURES" | "DEVELOPS" | "USES" | "DEPENDS_ON" | "SUPPLIES" | "PRODUCES" | "IMPORTS_FROM" | "EXPORTS_TO" | "AWARDED_TO" | "MENTIONED_IN" | "DISCLOSED_TRANSACTION" | "MAPS_TO" | "INTERSECTS" | "HAS_EVENT" | "RELATED_TO";
export type AssertionClass = "FACT" | "DERIVED_SIGNAL" | "HYPOTHESIS";

export interface SignalGraphNode { id: string; type: SignalNodeType; label: string; aliases: string[]; properties?: Readonly<Record<string, unknown>>; }
export interface SignalGraphEvidence { sourceId: string; sourceUrl: string; sourceRecordId?: string; retrievedAt: string; evidenceLevel: EvidenceLevel; confidence: number; excerpt?: string; reason: string; }
export interface SignalGraphEdge { id: string; fromNodeId: string; toNodeId: string; type: SignalEdgeType; assertionClass: AssertionClass; status: "CONFIRMED" | "CANDIDATE" | "HYPOTHESIS"; evidence: SignalGraphEvidence[]; evidenceIds: string[]; confidence: number; reason: string; firstSeen: string; lastSeen: string; sourceProviders: string[]; }
export interface StrategicSignalGraph { nodes: SignalGraphNode[]; edges: SignalGraphEdge[]; generatedAt: string; }

export function validateSignalEdge(edge: SignalGraphEdge): string[] {
  const errors: string[] = [];
  if (!edge.evidence.length) errors.push("Every graph edge requires evidence.");
  if (edge.confidence < 0 || edge.confidence > 1) errors.push("Edge confidence must be between 0 and 1.");
  if (edge.assertionClass === "FACT" && edge.evidence.every((item) => item.evidenceLevel !== "CONFIRMED")) errors.push("A FACT requires confirmed evidence.");
  if (edge.status === "CONFIRMED" && edge.evidence.every((item) => item.evidenceLevel !== "CONFIRMED")) errors.push("A confirmed relationship requires confirmed evidence.");
  if (edge.evidenceIds.length !== edge.evidence.length) errors.push("Evidence IDs must identify every attached evidence record.");
  if (!edge.sourceProviders.length) errors.push("Every graph edge requires at least one source provider.");
  if (!edge.firstSeen || !edge.lastSeen || edge.firstSeen > edge.lastSeen) errors.push("Graph edge first/last seen timestamps must be valid and ordered.");
  if (edge.assertionClass === "HYPOTHESIS" && edge.evidence.some((item) => item.evidenceLevel === "CONFIRMED")) errors.push("Confirmed evidence should be represented as a fact or derived signal, not only a hypothesis.");
  return errors;
}

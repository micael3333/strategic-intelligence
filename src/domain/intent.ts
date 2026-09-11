import { matchTechnologyTaxonomy, type TechnologyCluster } from "@/config/technology-clusters";

export type InvestigationDimension = "TECHNOLOGY" | "COMPANY" | "MATERIAL" | "AGENCY" | "MARKET" | "SUPPLY_CHAIN";
export interface IntentOption { id: string; label: string; dimension: InvestigationDimension; cluster?: TechnologyCluster; normalizedQuery: string; description: string; }
export interface IntentResolution { query: string; requiresChoice: boolean; inferredDimension?: InvestigationDimension; cluster?: TechnologyCluster; options: IntentOption[]; explanation: string; }

const DRONE_OPTIONS: IntentOption[] = [
  { id: "counter-uas", label: "Counter-UAS", dimension: "TECHNOLOGY", cluster: "COUNTER_UAS", normalizedQuery: "counter-UAS", description: "Demand for detecting, defeating, or intercepting drones." },
  { id: "military-uav", label: "Military UAVs", dimension: "TECHNOLOGY", cluster: "AUTONOMOUS_SYSTEMS", normalizedQuery: "unmanned systems", description: "Military unmanned-aircraft procurement and programs." },
  { id: "autonomous-systems", label: "Autonomous Systems", dimension: "TECHNOLOGY", cluster: "AUTONOMOUS_SYSTEMS", normalizedQuery: "autonomous systems", description: "Navigation, autonomy, swarm, and robotic capabilities." },
  { id: "drone-components", label: "Drone Components", dimension: "SUPPLY_CHAIN", cluster: "AUTONOMOUS_SYSTEMS", normalizedQuery: "drone components", description: "Components and materials; unresolved links stay explicit." },
  { id: "electronic-warfare", label: "Electronic Warfare", dimension: "TECHNOLOGY", cluster: "ELECTRONIC_WARFARE", normalizedQuery: "electronic warfare", description: "RF detection, jamming, and spectrum operations." },
  { id: "commercial-dual-use", label: "Commercial Dual-Use", dimension: "MARKET", cluster: "AUTONOMOUS_SYSTEMS", normalizedQuery: "dual-use drones", description: "Commercial technologies moving into government use." },
  { id: "drone-procurement", label: "Drone Procurement", dimension: "AGENCY", cluster: "AUTONOMOUS_SYSTEMS", normalizedQuery: "unmanned", description: "Solicitations and awards involving unmanned systems." },
];

export function resolveInvestigationIntent(query: string, selectedOptionId?: string, explicitDimension?: InvestigationDimension): IntentResolution {
  const normalized = query.trim(); const lower = normalized.toLowerCase();
  if (/^(drone|drones|uas|uav)$/.test(lower) && !selectedOptionId) return { query: normalized, requiresChoice: true, options: DRONE_OPTIONS, explanation: "The query is ambiguous. Choose an investigation before any upstream request is made." };
  const selected = selectedOptionId ? DRONE_OPTIONS.find((option) => option.id === selectedOptionId) : undefined;
  if (selected) return { query: selected.normalizedQuery, requiresChoice: false, inferredDimension: selected.dimension, cluster: selected.cluster, options: DRONE_OPTIONS, explanation: `Resolved locally to ${selected.label}.` };
  const taxonomy = matchTechnologyTaxonomy(normalized); const cluster = taxonomy.technologyTags[0];
  return { query: normalized, requiresChoice: false, inferredDimension: explicitDimension ?? (cluster ? "TECHNOLOGY" : "TECHNOLOGY"), cluster, options: [], explanation: cluster ? `Resolved locally to the ${cluster.replaceAll("_", " ")} taxonomy.` : "No deterministic taxonomy match; results remain a keyword investigation." };
}

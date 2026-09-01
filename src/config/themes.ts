export type TaxonomyNodeType = "THEME" | "SYSTEM" | "SUBSYSTEM" | "COMPONENT" | "MATERIAL" | "CAPABILITY" | "SOFTWARE";

export interface TaxonomyNode {
  id: string;
  label: string;
  type: TaxonomyNodeType;
  aliases: string[];
  parentId?: string;
  relationshipEvidenceDefault: "INFERRED";
}

export interface TechnologyTheme {
  id: string;
  name: string;
  description: string;
  nodes: TaxonomyNode[];
}

const node = (id: string, label: string, type: TaxonomyNodeType, parentId?: string, aliases: string[] = []): TaxonomyNode => ({
  id,
  label,
  type,
  parentId,
  aliases,
  relationshipEvidenceDefault: "INFERRED",
});

export const GNSS_DENIED_THEME: TechnologyTheme = {
  id: "theme:gnss-denied-autonomous-systems",
  name: "GNSS-Denied Autonomous Systems",
  description: "A reusable research taxonomy, not a claim that every autonomous platform contains every listed element.",
  nodes: [
    node("cap:gnss-denied", "GNSS denied", "CAPABILITY", undefined, ["GPS denied"]),
    node("cap:resilient-pnt", "Resilient PNT", "CAPABILITY", "cap:gnss-denied", ["assured PNT"]),
    node("sys:autonomous-navigation", "Autonomous navigation", "SYSTEM", "cap:gnss-denied"),
    node("sub:inertial-navigation", "Inertial navigation", "SUBSYSTEM", "sys:autonomous-navigation", ["INS"]),
    node("cmp:imu", "Inertial measurement unit", "COMPONENT", "sub:inertial-navigation", ["IMU"]),
    node("cmp:flight-controller", "Flight controller", "COMPONENT", "sys:autonomous-navigation"),
    node("cmp:edge-computer", "Edge computer", "COMPONENT", "sys:autonomous-navigation"),
    node("cap:edge-ai", "Edge AI", "CAPABILITY", "cmp:edge-computer"),
    node("cap:machine-vision", "Machine vision", "CAPABILITY", "sys:autonomous-navigation"),
    node("cap:visual-navigation", "Visual navigation", "CAPABILITY", "cap:machine-vision"),
    node("sub:rf-comms", "RF communications", "SUBSYSTEM"),
    node("cmp:data-link", "Data link", "COMPONENT", "sub:rf-comms"),
    node("cap:ew-resilience", "Electronic warfare resilience", "CAPABILITY"),
    node("cmp:eo-sensor", "EO sensor", "COMPONENT", "cap:machine-vision"),
    node("cmp:ir-sensor", "IR sensor", "COMPONENT", "cap:machine-vision"),
    node("cmp:esc", "Electronic speed controller", "COMPONENT", undefined, ["ESC"]),
    node("cmp:electric-motor", "Electric motor", "COMPONENT"),
    node("soft:autonomy", "Autonomy software", "SOFTWARE", "sys:autonomous-navigation"),
  ],
};

export const TECHNOLOGY_THEMES = [GNSS_DENIED_THEME] as const;

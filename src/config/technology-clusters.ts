export const TECHNOLOGY_CLUSTERS = {
  COUNTER_UAS: ["counter-uas", "counter uas", "c-uas", "counter drone", "drone defeat", "uas defeat", "interceptor drone", "rf defeat", "electronic attack", "directed energy", "high-power microwave", "high power microwave"],
  DIRECTED_ENERGY: ["laser", "high-energy laser", "high energy laser", "hel", "directed energy", "high-power microwave", "high power microwave", "hpm"],
  MISSILE_PROPULSION: ["solid rocket motor", "rocket motor", "energetics", "propellant", "energetic materials"],
  POWER_ELECTRONICS: ["gan", "gallium nitride", "sic", "silicon carbide", "power semiconductor"],
  CRITICAL_MINERALS: ["critical minerals", "rare earth", "gallium", "germanium", "antimony", "tungsten", "lithium", "graphite", "cobalt", "nickel"],
  ELECTRONIC_WARFARE: ["electronic warfare", "electronic attack", "rf detection", "radio frequency detection", "spectrum warfare"],
  AUTONOMOUS_SYSTEMS: ["autonomous systems", "unmanned systems", "swarm", "autonomy", "robotics", "autonomous navigation"],
  ENERGY_INFRASTRUCTURE: ["grid resilience", "nuclear", "battery", "energy infrastructure", "microgrid"],
  SEMICONDUCTORS: ["semiconductor", "microelectronics", "gan", "gallium nitride", "sic", "silicon carbide"],
} as const;

export type TechnologyCluster = keyof typeof TECHNOLOGY_CLUSTERS;

export interface TaxonomyMatch {
  technologyTags: TechnologyCluster[];
  matchedTerms: string[];
}

export function matchTechnologyTaxonomy(...values: Array<string | undefined>): TaxonomyMatch {
  const searchable = values.filter(Boolean).join(" ").toLowerCase();
  const technologyTags: TechnologyCluster[] = [];
  const matchedTerms = new Set<string>();
  for (const [cluster, terms] of Object.entries(TECHNOLOGY_CLUSTERS) as Array<[TechnologyCluster, readonly string[]]>) {
    const matches = terms.filter((term) => searchable.includes(term));
    if (matches.length) { technologyTags.push(cluster); matches.forEach((term) => matchedTerms.add(term)); }
  }
  return { technologyTags, matchedTerms: [...matchedTerms] };
}

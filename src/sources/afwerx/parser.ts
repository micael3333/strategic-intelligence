import { sha256 } from "@/sources/usaspending/hash";
import { matchTechnologyTaxonomy } from "@/config/technology-clusters";
import { AFWERX_FUNDING_URL, type AFWERXOpportunity, type AFWERXOpportunityType } from "./types";

const decode = (value: string) => value.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#8211;|&ndash;/g, "–").replace(/&#8217;|&rsquo;/g, "'").replace(/\s+/g, " ").trim();
const attr = (attributes: string, name: string) => new RegExp(`${name}=["']([^"']+)["']`, "i").exec(attributes)?.[1];

function topicType(title: string): AFWERXOpportunityType {
  if (/specific topic/i.test(title)) return "SPECIFIC_TOPIC";
  if (/open topic/i.test(title)) return "OPEN_TOPIC";
  if (/STRATFI|TACFI|sequential/i.test(title)) return "SEQUENTIAL_OPPORTUNITY";
  return "OTHER_OFFICIAL_AFWERX_OPPORTUNITY";
}

export function parseAFWERXFundingPage(html: string, retrievedAt: string): AFWERXOpportunity[] {
  const rawSourceHash = sha256(html); const matches = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)]; const seen = new Set<string>(); const records: AFWERXOpportunity[] = [];
  for (const match of matches) {
    const title = decode(match[2]);
    if (!/(?:SBIR|STTR|STRATFI|TACFI).*(?:TOPIC|RELEASE|OPPORTUNIT)|(?:SPECIFIC|OPEN) TOPIC/i.test(title)) continue;
    const href = attr(match[1], "href") ?? AFWERX_FUNDING_URL; const key = title.toUpperCase(); if (seen.has(key)) continue; seen.add(key);
    const context = decode(html.slice(match.index ?? 0, (match.index ?? 0) + 1600));
    const date = (label: string) => new RegExp(`${label}:?\\s*([0-9]{1,2}\\s+[A-Z]{3,9}\\s+[0-9]{2,4})`, "i").exec(context)?.[1];
    const code = /\b(\d{2}\.[A-Z]{1,3})\b/i.exec(title)?.[1]; const type = topicType(title);
    const taxonomy = matchTechnologyTaxonomy(title, context);
    const recordId = sha256(`${title}:${href}`).slice(0, 24);
    records.push({
      id: `afwerx:${recordId}`, title, release: code, topicCode: code, topicType: type, preReleaseDate: date("PRE-RELEASE"), openDate: date("OPEN"), closeDate: date("CLOSE"),
      airForceRelevant: /\bAF\b|AIR FORCE|DOW|DOD/i.test(context), spaceForceRelevant: /\bSF\b|SPACE FORCE/i.test(context), directToPhaseTwo: /D2P2|Direct.to.Phase.II/i.test(context),
      officialSourceUrl: href.startsWith("http") ? href : new URL(href, AFWERX_FUNDING_URL).toString(), description: context.slice(0, 600), status: /OPEN:/i.test(context) ? "OPEN" : /PRE-RELEASE:/i.test(context) ? "UPCOMING" : "UNKNOWN",
      retrievedAt, rawSourceHash, evidenceLevel: "CONFIRMED",
      event: { id: `event:afwerx:${recordId}`, sourceFamily: "AFWERX_SPACEWERX", sourceRecordId: recordId, ingestionMethod: "OFFICIAL_WEB", sourceType: "AFWERX_PROGRAM", eventType: type, title, description: context.slice(0, 600), eventDate: date("OPEN") ?? date("PRE-RELEASE"), agency: "Department of the Air Force", program: "AFWERX SBIR/STTR", topicCode: code, deadline: date("CLOSE"), technologyTags: taxonomy.technologyTags, capabilityTags: taxonomy.matchedTerms, materialTags: taxonomy.technologyTags.includes("CRITICAL_MINERALS") ? taxonomy.matchedTerms : [], strategicTags: ["DUAL_USE_TRANSITION", type], funnelStageCandidate: type === "SEQUENTIAL_OPPORTUNITY" ? 3 : 2, evidenceLevel: "CONFIRMED", sourceUrl: AFWERX_FUNDING_URL, retrievedAt, rawProvenanceHash: rawSourceHash },
    });
  }
  return records;
}

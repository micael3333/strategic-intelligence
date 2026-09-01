import { sha256 } from "@/sources/usaspending/hash";
import { matchTechnologyTaxonomy } from "@/config/technology-clusters";
import { SAM_OPPORTUNITY_TYPES, type NormalizedSAMOpportunity, type SAMOpportunityTypeCode, type SAMRawOpportunity } from "./types";

const CODE_BY_LABEL: Readonly<Record<string, SAMOpportunityTypeCode>> = {
  "sources sought": "r", presolicitation: "p", solicitation: "o", "combined synopsis/solicitation": "k", "special notice": "s", "award notice": "a",
};

export function normalizeSAMOpportunity(raw: SAMRawOpportunity, retrievedAt: string, rawProvenanceHash: string): NormalizedSAMOpportunity {
  const noticeId = String(raw.noticeId ?? "").trim();
  if (!noticeId) throw new Error("SAM opportunity is missing noticeId.");
  const rawType = String(raw.type ?? "").trim();
  const typeCode = (rawType.length === 1 && rawType.toLowerCase() in SAM_OPPORTUNITY_TYPES ? rawType.toLowerCase() : CODE_BY_LABEL[rawType.toLowerCase()]) as SAMOpportunityTypeCode | undefined;
  const type = typeCode ? SAM_OPPORTUNITY_TYPES[typeCode] : rawType || "UNKNOWN";
  const isAward = typeCode === "a";
  const sourceUrl = raw.uiLink || `https://sam.gov/opp/${encodeURIComponent(noticeId)}/view`;
  const resourceLinks = (raw.links ?? []).map((link) => link.href).filter(Boolean) as string[];
  const funnelInterpretation = isAward
    ? "Official award notice; later procurement evidence only. It does not prove production, validation, or structural scale."
    : typeCode === "r"
      ? "Demand exploration signal. The government is gathering market information; no award or validation is implied."
      : typeCode === "p"
        ? "Demand formation signal. A future solicitation is indicated; no award or validation is implied."
        : "Active or informational government demand signal; no award, validation, production, or scale is inferred.";
  const taxonomy = matchTechnologyTaxonomy(raw.title, raw.description);
  return {
    id: `sam:${noticeId}`,
    noticeId,
    title: raw.title,
    solicitationNumber: raw.solicitationNumber?.trim(),
    postedDate: raw.postedDate,
    responseDeadline: raw.responseDeadLine,
    typeCode,
    type,
    baseType: raw.baseType,
    department: raw.department,
    subTier: raw.subTier,
    office: raw.office,
    organizationHierarchy: raw.fullParentPathName,
    organizationCodeHierarchy: raw.fullParentPathCode,
    naicsCode: raw.naicsCode,
    classificationCode: raw.classificationCode,
    setAside: raw.setAside,
    active: raw.active,
    description: raw.description,
    placeOfPerformance: raw.placeOfPerformance,
    sourceUrl,
    resourceLinks,
    award: raw.award ? { number: raw.award.number, amount: raw.award.amount, date: raw.award.date, awardeeName: raw.award.awardee?.name, awardeeUei: raw.award.awardee?.ueiSAM } : undefined,
    funnelInterpretation,
    funnelStageCandidate: isAward ? 5 : 1,
    evidenceLevel: "CONFIRMED",
    retrievedAt,
    rawProvenanceHash,
    raw,
    event: {
      id: `event:sam:${noticeId}`,
      sourceFamily: "SAM",
      sourceRecordId: noticeId,
      ingestionMethod: "API",
      sourceType: isAward ? "CONTRACT" : "SOLICITATION",
      eventType: type,
      title: raw.title,
      description: raw.description,
      eventDate: raw.postedDate,
      entityName: raw.award?.awardee?.name,
      uei: raw.award?.awardee?.ueiSAM,
      agency: raw.department ?? raw.fullParentPathName,
      subAgency: raw.subTier,
      office: raw.office,
      solicitationNumber: raw.solicitationNumber?.trim(),
      amount: raw.award?.amount,
      deadline: raw.responseDeadLine,
      naics: raw.naicsCode,
      classificationCode: raw.classificationCode,
      technologyTags: taxonomy.technologyTags,
      capabilityTags: taxonomy.matchedTerms,
      materialTags: taxonomy.technologyTags.includes("CRITICAL_MINERALS") ? taxonomy.matchedTerms : [],
      strategicTags: ["GOVERNMENT_DEMAND", type],
      funnelStageCandidate: isAward ? 5 : 1,
      evidenceLevel: "CONFIRMED",
      sourceUrl,
      retrievedAt,
      rawProvenanceHash,
      rawData: raw,
    },
  };
}

export function samDeduplicationKey(record: NormalizedSAMOpportunity): string { return sha256(`sam:${record.noticeId}`); }

import {
  CONTRACT_AWARD_TYPE_CODES,
  type USAspendingAwardTypeCode,
  type USAspendingSearchQuery,
  type USAspendingUpstreamRequest,
} from "./types";

export const DOD_AGENCY_PRESET = "Department of Defense";
export const GNSS_DENIED_SEARCH_TERMS = [
  "GNSS denied",
  "GNSS-denied",
  "resilient PNT",
  "resilient positioning",
  "autonomous navigation",
  "inertial navigation",
  "GPS denied",
  "GPS-denied",
  "electronic warfare navigation",
] as const;

export const USASPENDING_RESULT_FIELDS = [
  "Award ID", "generated_internal_id", "Recipient Name", "recipient_id", "prime_award_recipient_id",
  "Recipient UEI", "Recipient DUNS Number", "Award Amount", "Start Date", "End Date", "Base Obligation Date", "Last Modified Date",
  "Contract Award Type", "Awarding Agency", "Awarding Agency Code", "Awarding Sub Agency",
  "Awarding Sub Agency Code", "Funding Agency", "Funding Agency Code", "Funding Sub Agency",
  "Funding Sub Agency Code", "Description", "NAICS", "PSC", "Primary Place of Performance", "Recipient Location",
] as const;

const ALL_AWARD_CODES = new Set<USAspendingAwardTypeCode>([
  "A", "B", "C", "D", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11",
  "IDV_A", "IDV_B", "IDV_B_A", "IDV_B_B", "IDV_B_C", "IDV_C", "IDV_D", "IDV_E",
]);

function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function cleanStrings(values: string[] | undefined, maxItems: number, maxLength: number): string[] | undefined {
  const cleaned = values?.map((value) => value.trim()).filter(Boolean).slice(0, maxItems).map((value) => value.slice(0, maxLength));
  return cleaned?.length ? cleaned : undefined;
}

export function validateUSAspendingQuery(query: USAspendingSearchQuery): string[] {
  const errors: string[] = [];
  if (!validDate(query.startDate)) errors.push("startDate must use YYYY-MM-DD");
  if (!validDate(query.endDate)) errors.push("endDate must use YYYY-MM-DD");
  if (validDate(query.startDate) && validDate(query.endDate) && query.startDate > query.endDate) errors.push("startDate must not be after endDate");
  if (query.minimumAwardAmount !== undefined && (!Number.isFinite(query.minimumAwardAmount) || query.minimumAwardAmount < 0)) errors.push("minimumAwardAmount must be a non-negative number");
  if (query.maximumAwardAmount !== undefined && (!Number.isFinite(query.maximumAwardAmount) || query.maximumAwardAmount < 0)) errors.push("maximumAwardAmount must be a non-negative number");
  if (query.minimumAwardAmount !== undefined && query.maximumAwardAmount !== undefined && query.minimumAwardAmount > query.maximumAwardAmount) errors.push("minimumAwardAmount must not exceed maximumAwardAmount");
  if (query.page !== undefined && (!Number.isInteger(query.page) || query.page < 1)) errors.push("page must be a positive integer");
  if (query.limit !== undefined && (!Number.isInteger(query.limit) || query.limit < 1 || query.limit > 50)) errors.push("limit must be between 1 and 50");
  if (query.awardTypeCodes?.some((code) => !ALL_AWARD_CODES.has(code))) errors.push("awardTypeCodes contains an unsupported code");
  return errors;
}

export function mapUSAspendingQuery(query: USAspendingSearchQuery): USAspendingUpstreamRequest {
  const errors = validateUSAspendingQuery(query);
  if (errors.length) throw new TypeError(errors.join("; "));

  const keywords = cleanStrings(query.keywords, 12, 120);
  const agency = query.agency?.trim().slice(0, 160);
  const recipient = query.recipientSearchText?.trim().slice(0, 160);
  const naicsCodes = cleanStrings(query.naicsCodes, 20, 6);
  const pscCodes = cleanStrings(query.pscCodes, 20, 8);
  const awardTypeCodes = query.awardTypeCodes?.length ? query.awardTypeCodes : [...CONTRACT_AWARD_TYPE_CODES];
  const amountBound = query.minimumAwardAmount !== undefined || query.maximumAwardAmount !== undefined
    ? [{ lower_bound: query.minimumAwardAmount, upper_bound: query.maximumAwardAmount }]
    : undefined;

  return {
    spending_level: "awards",
    subawards: false,
    fields: [...USASPENDING_RESULT_FIELDS],
    filters: {
      time_period: [{ start_date: query.startDate, end_date: query.endDate, date_type: "new_awards_only" }],
      award_type_codes: awardTypeCodes,
      ...(keywords ? { keywords } : {}),
      ...(agency ? { agencies: [{ type: "awarding", tier: "toptier", name: agency }] } : {}),
      ...(recipient ? { recipient_search_text: [recipient] } : {}),
      ...(amountBound ? { award_amounts: amountBound } : {}),
      ...(naicsCodes ? { naics_codes: { require: naicsCodes } } : {}),
      ...(pscCodes ? { psc_codes: pscCodes } : {}),
    },
    page: query.page ?? 1,
    limit: query.limit ?? 10,
    sort: query.sort ?? "Award Amount",
    order: query.order ?? "desc",
  };
}

export function defaultDefenseSearch(today = new Date()): USAspendingSearchQuery {
  const end = today.toISOString().slice(0, 10);
  const startDate = new Date(Date.UTC(today.getUTCFullYear() - 2, today.getUTCMonth(), today.getUTCDate())).toISOString().slice(0, 10);
  return {
    startDate,
    endDate: end,
    agency: DOD_AGENCY_PRESET,
    keywords: [...GNSS_DENIED_SEARCH_TERMS],
    awardTypeCodes: [...CONTRACT_AWARD_TYPE_CODES],
    page: 1,
    limit: 10,
    sort: "Award Amount",
    order: "desc",
  };
}

const CRM_STATUS_MAP: Record<string, string> = {
  "GOOD_LEAD_FOLLOW_UP": "GOOD_LEAD_FOLLOW_UP",
  "GOOD_LEAD": "GOOD_LEAD_FOLLOW_UP",
  "GOOD": "GOOD_LEAD_FOLLOW_UP",
  "FOLLOW_UP": "GOOD_LEAD_FOLLOW_UP",
  "FOLLOW_UP_NEEDED": "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT": "DID_NOT_CONNECT",
  "DNC": "DID_NOT_CONNECT",
  "NOT_CONNECTED": "DID_NOT_CONNECT",
  "BAD_LEAD": "BAD_LEAD",
  "BAD": "BAD_LEAD",
  "NOT_INTERESTED": "BAD_LEAD",
  "SALE_DONE": "SALE_DONE",
  "CLOSED": "SALE_DONE",
  "CONVERTED": "SALE_DONE",
  "WON": "SALE_DONE",
};

const ALLOWED_DATA_SOURCES = ["leads_on_demand", "meridian_tower", "eden_park", "varah_swamy", "sarjapur_plots"];

export function normalizeCrmStatus(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const key = raw.toUpperCase().replace(/[\s-]+/g, "_");
  return CRM_STATUS_MAP[key] || null;
}

export function normalizeDataSource(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const key = raw.toLowerCase().replace(/[\s-]+/g, "_");
  return ALLOWED_DATA_SOURCES.includes(key) ? key : null;
}

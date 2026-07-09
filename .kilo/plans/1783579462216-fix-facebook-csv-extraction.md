# Fix Facebook CSV Extraction — Validation & AI Adapter Plan

## Problem

The Facebook lead CSV (`apps/web/public/samples/facebook-leads.csv`) uploads and previews correctly, but the AI extraction step fails silently — 0 records are imported. Three root causes identified in the LLM→validation pipeline.

## Root Causes

### RC1: `data_source` strict enum rejects non-matching values
**File:** `apps/api/src/utils/validation.ts` lines 10-16, 31
The Facebook CSV has `"Facebook"` as Source. The `dataSourceSchema` only allows 5 real-estate-specific values. If the AI returns anything other than `null` or one of those 5, Zod rejects the entire batch.

### RC2: `crm_status` strict enum rejects non-exact matches
**File:** `apps/api/src/utils/validation.ts` lines 3-8, 29
The Facebook CSV has `"Good Lead"`, `"Did Not Connect"`, `"Bad Lead"`, `"Sale Done"`, `"Follow Up"`. If the AI returns `"GOOD_LEAD"` instead of `"GOOD_LEAD_FOLLOW_UP"`, or `"FOLLOW_UP"`, Zod rejects the entire batch.

### RC3: `response_format: json_object` conflict with array prompt
**File:** `apps/api/src/services/ai/OpenAICompatibleAdapter.ts` line 30, 45
The adapter forces `json_object` mode, but the prompt asks for a JSON array. The AI wraps the array in an object with an unpredictable key. The adapter only checks `.records` and `.data` — any other key silently returns `[]`.

## Affected Files

| File | Change |
|------|--------|
| `apps/api/src/utils/validation.ts` | Relax `crm_status` and `data_source` to accept any string |
| `apps/api/src/services/queue/processor.ts` | Add normalization functions for `crm_status` and `data_source` |
| `apps/api/src/services/ai/OpenAICompatibleAdapter.ts` | Improve JSON array extraction fallback |
| `apps/api/tests/ai/extractor.test.ts` | Update tests for new validation behavior + add normalization tests |

## Implementation Steps

### Step 1: Relax Zod schemas in `validation.ts`

**File:** `apps/api/src/utils/validation.ts`

Change `crm_status` from strict enum to permissive string:
```typescript
// crmStatusSchema stays defined (used by Prisma enum mapping in processor)
// but the Zod extraction schema accepts any string
crm_status: z.string().optional().nullable(),
```

Change `data_source` from strict enum to permissive string:
```typescript
data_source: z.string().optional().nullable(),
```

Keep `crmStatusSchema` and `dataSourceSchema` exports intact — they're used for reference/typing elsewhere.

### Step 2: Add normalization functions in `processor.ts`

**File:** `apps/api/src/services/queue/processor.ts`

Add two normalization functions before `mapToLeadRecord`:

```typescript
function normalizeCrmStatus(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const upper = raw.toUpperCase().replace(/[\s-]+/g, "_");
  const mapping: Record<string, string> = {
    "GOOD_LEAD_FOLLOW_UP": "GOOD_LEAD_FOLLOW_UP",
    "GOOD_LEAD": "GOOD_LEAD_FOLLOW_UP",
    "FOLLOW_UP": "GOOD_LEAD_FOLLOW_UP",
    "GOOD": "GOOD_LEAD_FOLLOW_UP",
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
  return mapping[upper] || null;
}

function normalizeDataSource(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().replace(/[\s-]+/g, "_");
  const allowed = ["leads_on_demand", "meridian_tower", "eden_park", "varah_swamy", "sarjapur_plots"];
  return allowed.includes(lower) ? lower : null;
}
```

Update `mapToLeadRecord` to use these normalizers:
```typescript
crmStatus: normalizeCrmStatus(record.crm_status) as any,
dataSource: normalizeDataSource(record.data_source) as any,
```

### Step 3: Improve JSON array extraction in `OpenAICompatibleAdapter.ts`

**File:** `apps/api/src/services/ai/OpenAICompatibleAdapter.ts`

Replace line 45:
```typescript
// Before:
const records = Array.isArray(parsed) ? parsed : (parsed as any).records || (parsed as any).data || [];

// After:
const records = Array.isArray(parsed)
  ? parsed
  : (parsed as any).records
    || (parsed as any).data
    || Object.values(parsed as Record<string, unknown>).find((v) => Array.isArray(v))
    || [];
```

This handles any wrapper key (e.g., `{ "extracted_records": [...] }`, `{ "leads": [...] }`).

### Step 4: Update tests in `extractor.test.ts`

**File:** `apps/api/tests/ai/extractor.test.ts`

- **Update** "should reject invalid crm_status" test → now it should PASS (permissive schema accepts any string)
- **Update** "should reject invalid data_source" test → now it should PASS (permissive schema accepts any string)
- **Add** test: `"Facebook"` data_source passes Zod validation
- **Add** test: `"Good Lead"` crm_status passes Zod validation
- **Add** tests for `normalizeCrmStatus` — maps `"Good Lead"` → `"GOOD_LEAD_FOLLOW_UP"`, `"Follow Up"` → `"GOOD_LEAD_FOLLOW_UP"`, `"Facebook"` → `null` for data_source
- **Add** tests for `normalizeDataSource` — maps `"Facebook"` → `null`, `"leads_on_demand"` → `"leads_on_demand"`

### Step 5: Verification

1. Install dependencies: `npm install` (root)
2. Run parser tests: `cd apps/api && npx vitest run tests/csv/parser.test.ts`
3. Run extractor/validation tests: `cd apps/api && npx vitest run tests/ai/extractor.test.ts`
4. Run all tests: `cd apps/api && npx vitest run`
5. Run TypeScript check: `cd apps/api && npx tsc --noEmit`

## Design Decisions

- **Normalization lives in processor, not validation**: The Zod schema accepts any string from the AI (since we can't predict LLM output). The processor normalizes to Prisma enum values before DB insert. This separates "AI output parsing" from "business logic mapping".
- **`crmStatusSchema` and `dataSourceSchema` kept as exports**: They may be useful for reference types, but are no longer used in `extractedRecordSchema`.
- **Generic array fallback uses `Object.values().find(Array.isArray)`**: This handles any wrapper key without hardcoding every possible key name.

## Risks

- **Over-permissive validation**: Accepting any string from the AI means garbage values could reach the processor. Mitigated by the normalization functions returning `null` for unrecognized values.
- **Normalization mapping incomplete**: The `normalizeCrmStatus` mapping covers common variants but may miss obscure ones. Those return `null` (field left empty) rather than crashing the batch.

## Rollback

All changes are in 4 files. Revert the git commit to restore previous behavior.

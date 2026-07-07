# API Reference

Base URL: `http://localhost:3001`

All endpoints return JSON. Errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": {}
  }
}
```

## Error Codes

| HTTP Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid request input |
| 404 | `NOT_FOUND` | Resource doesn't exist |
| 422 | `CSV_PARSE_ERROR` | CSV parsing failed |
| 500 | `INTERNAL_ERROR` | Unexpected server error |
| 502 | `AI_SERVICE_ERROR` | AI provider failure after retries |

---

## Endpoints

### Health Check

```
GET /api/health
```

**Response (200)**
```json
{
  "status": "ok",
  "timestamp": "2026-07-07T12:00:00.000Z"
}
```

---

### Upload CSV

```
POST /api/uploads
Content-Type: multipart/form-data
```

**Request Body**

| Field | Type | Description |
|---|---|---|
| `file` | File | CSV file (max 10MB, `.csv` extension) |

**Response (201)**
```json
{
  "uploadId": "550e8400-e29b-41d4-a716-446655440000",
  "totalRows": 128,
  "columns": ["Full Name", "Email Address", "Phone", "Company"],
  "previewRows": [
    { "Full Name": "John Doe", "Email Address": "john@example.com", "Phone": "+1234567890", "Company": "Acme" }
  ]
}
```

**Errors**
- `400` — No file uploaded
- `422` — Empty CSV or parse failure

---

### List All Uploads

```
GET /api/uploads
```

**Response (200)**
```json
{
  "uploads": [
    {
      "uploadId": "550e8400-e29b-41d4-a716-446655440000",
      "fileName": "leads.csv",
      "totalRows": 128,
      "status": "DONE",
      "createdAt": "2026-07-07T12:00:00.000Z",
      "batchesTotal": 7,
      "batchesDone": 7,
      "importedCount": 118,
      "skippedCount": 10,
      "totalTokens": 15000,
      "promptTokens": 10000,
      "completionTokens": 5000,
      "estimatedCost": 0.0045
    }
  ]
}
```

---

### Get Upload Status

```
GET /api/uploads/:uploadId
```

Poll this endpoint to track AI processing progress.

**Response (200)**
```json
{
  "uploadId": "550e8400-e29b-41d4-a716-446655440000",
  "fileName": "leads.csv",
  "createdAt": "2026-07-07T12:00:00.000Z",
  "status": "PROCESSING",
  "totalRows": 128,
  "batchesTotal": 7,
  "batchesDone": 4,
  "importedCount": 80,
  "skippedCount": 5,
  "totalTokens": 8500,
  "promptTokens": 6000,
  "completionTokens": 2500,
  "estimatedCost": 0.0024
}
```

**Status Values:** `PENDING`, `PARSING`, `PROCESSING`, `DONE`, `FAILED`

**Notes:**
- When all batches reach `SUCCESS` or `FAILED`, the upload status auto-transitions to `DONE`.
- `importedCount` and `skippedCount` update in real-time as batches complete.

**Errors:** `404` — Upload not found

---

### Confirm Import (Start AI Processing)

```
POST /api/uploads/:uploadId/confirm
```

Chunks stored rows into batches and enqueues BullMQ jobs for AI extraction.

**Response (200)**
```json
{
  "uploadId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Processing started",
  "batchesTotal": 7
}
```

**Errors:**
- `404` — Upload not found
- `400` — Upload has already been processed (status is not `PENDING`)

---

### Get Records

```
GET /api/uploads/:uploadId/records
```

Returns all lead records for a completed upload.

**Response (200)**
```json
{
  "records": [
    {
      "id": "...",
      "status": "IMPORTED",
      "skipReason": null,
      "created_at": "2026-07-01T00:00:00.000Z",
      "name": "John Doe",
      "email": "john@example.com",
      "country_code": "+1",
      "mobile_without_country_code": "234567890",
      "company": "Acme Corp",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "lead_owner": "sales@acme.com",
      "crm_status": "GOOD_LEAD_FOLLOW_UP",
      "crm_note": "Also reached out via LinkedIn",
      "data_source": "leads_on_demand",
      "possession_time": null,
      "description": "Interested in enterprise plan"
    },
    {
      "id": "...",
      "status": "SKIPPED",
      "skipReason": "No email or mobile number found",
      "created_at": null,
      "name": "Jane Smith",
      "email": null,
      "country_code": null,
      "mobile_without_country_code": null,
      "company": null,
      "city": null,
      "state": null,
      "country": null,
      "lead_owner": null,
      "crm_status": null,
      "crm_note": null,
      "data_source": null,
      "possession_time": null,
      "description": null
    }
  ]
}
```

**Record Status:** `PENDING`, `IMPORTED`, `SKIPPED`

**Errors:** `404` — Upload not found

---

### Export CRM CSV

```
GET /api/uploads/:uploadId/export
```

Downloads imported records as a CRM-formatted CSV file.

**Response (200)**
- `Content-Type: text/csv`
- `Content-Disposition: attachment; filename="crm-export-{uploadId}.csv"`

**CSV Columns:** `created_at`, `name`, `email`, `country_code`, `mobile_without_country_code`, `company`, `city`, `state`, `country`, `lead_owner`, `crm_status`, `crm_note`, `data_source`, `possession_time`, `description`

**Errors:** `404` — Upload not found

---

### Delete Upload

```
DELETE /api/uploads/:uploadId
```

Deletes an upload and all related records (batches, lead records, AI usage) via cascade delete.

**Response (200)**
```json
{
  "uploadId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Job deleted"
}
```

**Errors:** `404` — Upload not found

---

### AI Credits Dashboard

```
GET /api/ai-credits
```

Returns AI provider usage statistics and optional live balance.

**Response (200)**
```json
{
  "provider": "openrouter",
  "model": "openai/gpt-4o-mini",
  "localUsage": {
    "promptTokens": 50000,
    "completionTokens": 20000,
    "totalTokens": 70000,
    "requestCount": 15
  },
  "liveBalance": {
    "available": false,
    "error": "Live balance not supported for this provider"
  }
}
```

**XiaomiMiMo Live Balance (when `AI_PROVIDER=xiaomimimo` and `MIMO_COOKIE` is set):**
```json
{
  "liveBalance": {
    "available": true,
    "balance": 10.50,
    "currency": "USD",
    "tokenPlan": {
      "used": 500000,
      "limit": 1000000,
      "percent": 50.0,
      "planName": "Pro Plan",
      "periodEnd": "2026-08-07T00:00:00.000Z"
    }
  }
}
```

---

## Enums Reference

### UploadStatus
`PENDING` → `PARSING` → `PROCESSING` → `DONE` | `FAILED`

### BatchStatus
`PENDING` → `IN_PROGRESS` → `SUCCESS` | `FAILED`

### RecordStatus
`PENDING` | `IMPORTED` | `SKIPPED`

### CrmStatus
`GOOD_LEAD_FOLLOW_UP` | `DID_NOT_CONNECT` | `BAD_LEAD` | `SALE_DONE`

### DataSource
`leads_on_demand` | `meridian_tower` | `eden_park` | `varah_swamy` | `sarjapur_plots`

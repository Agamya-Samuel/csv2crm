export interface RawRow {
  [key: string]: string;
}

export interface UploadResult {
  uploadId: string;
  totalRows: number;
  columns: string[];
  previewRows: RawRow[];
}

export interface ConfirmResult {
  uploadId: string;
  message: string;
  batchesTotal: number;
}

export interface UploadStatus {
  uploadId: string;
  fileName: string;
  createdAt: string;
  status: "PENDING" | "PARSING" | "PROCESSING" | "DONE" | "FAILED";
  batchesTotal: number;
  batchesDone: number;
  importedCount: number;
  skippedCount: number;
}

export interface UploadSummary {
  uploadId: string;
  fileName: string;
  totalRows: number;
  status: UploadStatus["status"];
  createdAt: string;
  batchesTotal: number;
  batchesDone: number;
  importedCount: number;
  skippedCount: number;
}

export interface UploadsListResult {
  uploads: UploadSummary[];
}

export interface CRMRecord {
  id: string;
  status: "IMPORTED" | "SKIPPED" | "PENDING";
  skipReason: string | null;
  created_at: string | null;
  name: string | null;
  email: string | null;
  country_code: string | null;
  mobile_without_country_code: string | null;
  company: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  lead_owner: string | null;
  crm_status: string | null;
  crm_note: string | null;
  data_source: string | null;
  possession_time: string | null;
  description: string | null;
}

export interface RecordsResult {
  records: CRMRecord[];
}

export interface RawRow {
  [key: string]: string;
}

export interface ExtractedRecord {
  created_at?: string;
  name?: string;
  email?: string;
  country_code?: string;
  mobile_without_country_code?: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  lead_owner?: string;
  crm_status?: string;
  crm_note?: string;
  data_source?: string;
  possession_time?: string;
  description?: string;
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
}

export interface UploadStatusResult {
  uploadId: string;
  status: string;
  batchesTotal: number;
  batchesDone: number;
  importedCount: number;
  skippedCount: number;
}

export interface ExportRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}

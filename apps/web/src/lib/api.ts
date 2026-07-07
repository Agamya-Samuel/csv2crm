import type { UploadResult, ConfirmResult, UploadStatus, RecordsResult, UploadsListResult, AiCredits } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options);

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: { message: "Request failed" } }));
    throw new Error(error.error?.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function uploadCSV(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  return request<UploadResult>("/api/uploads", {
    method: "POST",
    body: formData,
  });
}

export async function confirmUpload(uploadId: string): Promise<ConfirmResult> {
  return request<ConfirmResult>(`/api/uploads/${uploadId}/confirm`, {
    method: "POST",
  });
}

export async function getUploadStatus(uploadId: string): Promise<UploadStatus> {
  return request<UploadStatus>(`/api/uploads/${uploadId}`);
}

export async function getRecords(uploadId: string): Promise<RecordsResult> {
  return request<RecordsResult>(`/api/uploads/${uploadId}/records`);
}

export async function getUploads(): Promise<UploadsListResult> {
  return request<UploadsListResult>("/api/uploads");
}

export async function getExportUrl(uploadId: string): Promise<string> {
  return `${API_BASE}/api/uploads/${uploadId}/export`;
}

export async function getAiCredits(): Promise<AiCredits> {
  return request<AiCredits>("/api/ai-credits");
}

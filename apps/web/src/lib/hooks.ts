"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { UploadResult, UploadStatus, RecordsResult, UploadsListResult } from "@/types";
import * as api from "./api";

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const upload = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const data = await api.uploadCSV(file);
      setResult(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { upload, uploading, error, result, reset };
}

export function useConfirm() {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = useCallback(async (uploadId: string) => {
    setConfirming(true);
    setError(null);
    try {
      return await api.confirmUpload(uploadId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Confirm failed";
      setError(message);
      throw err;
    } finally {
      setConfirming(false);
    }
  }, []);

  return { confirm, confirming, error };
}

export function useProcessingPoll(uploadId: string | null, enabled: boolean) {
  const [status, setStatus] = useState<UploadStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!uploadId || !enabled) return;

    const poll = async () => {
      try {
        const data = await api.getUploadStatus(uploadId);
        setStatus(data);

        if (data.status === "DONE" || data.status === "FAILED") {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Polling failed");
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [uploadId, enabled]);

  return { status, error };
}

export function useRecords(uploadId: string | null) {
  const [records, setRecords] = useState<RecordsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    if (!uploadId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRecords(uploadId);
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch records");
    } finally {
      setLoading(false);
    }
  }, [uploadId]);

  return { records, loading, error, fetchRecords };
}

export function useUploads() {
  const [data, setData] = useState<UploadsListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUploads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getUploads();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch uploads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  return { data, loading, error, refetch: fetchUploads };
}

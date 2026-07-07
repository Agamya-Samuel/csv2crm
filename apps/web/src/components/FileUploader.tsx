"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, AlertCircle } from "lucide-react";

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  error: string | null;
}

export default function FileUploader({ onFileSelect, isUploading, error }: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: isUploading,
  });

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
            : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
          }
          ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          {isDragActive ? (
            <Upload className="w-12 h-12 text-blue-500" />
          ) : (
            <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          )}

          {isUploading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">Uploading...</span>
            </div>
          ) : isDragActive ? (
            <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
              Drop your CSV file here
            </p>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                Drag & drop a CSV file here, or click to browse
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Supports any valid CSV format (Facebook Ads, Google Ads, Excel exports, etc.)
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Max file size: 10MB</p>
            </>
          )}
        </div>
      </div>

      {selectedFile && !isUploading && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-3">
          <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}

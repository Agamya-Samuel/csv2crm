"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, AlertCircle, Download, Info, FileSpreadsheet, Megaphone, Table2, Database } from "lucide-react";

const SAMPLE_FILES = [
  {
    name: "Facebook Leads",
    filename: "facebook-leads.csv",
    description: "Social media ad leads with names, phones, and lead status",
    rows: "5 rows",
    icon: <Megaphone className="w-4 h-4" />,
    color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30",
  },
  {
    name: "Google Ads",
    filename: "google-ads.csv",
    description: "Search ad leads with campaign data and contact info",
    rows: "4 rows",
    icon: <FileSpreadsheet className="w-4 h-4" />,
    color: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30",
  },
  {
    name: "Messy Spreadsheet",
    filename: "messy-spreadsheet.csv",
    description: "Mixed-format data with combined fields and inconsistent columns",
    rows: "5 rows",
    icon: <Table2 className="w-4 h-4" />,
    color: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30",
  },
  {
    name: "Large Leads Dataset",
    filename: "large-leads-dataset.csv",
    description: "500 leads across multiple countries, sources, and statuses",
    rows: "500 rows",
    icon: <Database className="w-4 h-4" />,
    color: "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30",
  },
];

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  error: string | null;
  onCancel: () => void;
}

const REQUIRED_HEADERS = "created_at, name, email, country_code, mobile_without_country_code, company, city, state, country, lead_owner, crm_status, crm_note";

export default function FileUploader({ onFileSelect, isUploading, error, onCancel }: FileUploaderProps) {
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
    maxSize: 5 * 1024 * 1024,
    disabled: isUploading,
  });

  return (
    <div className="flex items-start justify-center py-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Import Leads via CSV
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Upload a CSV file to bulk import leads into your system.
          </p>
        </div>

        {/* Body */}
        <div className="px-8 pb-6">
          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={`
              relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
              transition-all duration-200 ease-in-out
              ${isDragActive
                ? "border-orange-400 bg-orange-50 dark:bg-orange-950/20"
                : "border-gray-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-500 bg-gray-50 dark:bg-gray-800/50"
              }
              ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            <input {...getInputProps()} />

            <div className="flex flex-col items-center gap-3">
              {/* Upload icon */}
              <div className="w-14 h-14 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                {isUploading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
                ) : (
                  <Upload className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                )}
              </div>

              {isUploading ? (
                <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
                  Uploading...
                </p>
              ) : isDragActive ? (
                <p className="text-base font-semibold text-orange-600 dark:text-orange-400">
                  Drop your CSV file here
                </p>
              ) : (
                <>
                  <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
                    Drop your CSV file here
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 -mt-1">
                    or click to browse files
                  </p>
                </>
              )}

              {/* Supported file badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400 shadow-sm mt-1">
                <Info className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Supported file: .csv (max 5MB)</span>
              </div>
            </div>
          </div>

          {/* Required headers info */}
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3 leading-relaxed px-2">
            Required headers: <span className="text-gray-500 dark:text-gray-400">{REQUIRED_HEADERS}</span>
            {" "}+ custom CRM fields to reduce upload errors.
          </p>

          {/* Sample files section */}
          <div className="mt-5">
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-3">
              Don&apos;t have a CSV file? Try one of these sample datasets
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SAMPLE_FILES.map((file) => (
                <a
                  key={file.filename}
                  href={`/samples/${file.filename}`}
                  download
                  className="group flex items-center gap-3 p-3 rounded-xl border border-gray-200
                    dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60
                    hover:border-orange-300 dark:hover:border-orange-600
                    hover:bg-orange-50 dark:hover:bg-orange-900/10
                    transition-all duration-200"
                >
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${file.color}`}>
                    {file.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200
                        group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                        {file.name}
                      </p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700
                        text-gray-500 dark:text-gray-400 font-medium flex-shrink-0">
                        {file.rows}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      {file.description}
                    </p>
                  </div>
                  <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-orange-500 transition-colors flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
          <button
            onClick={onCancel}
            disabled={isUploading}
            className="px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300
              hover:text-gray-900 dark:hover:text-white transition-colors duration-200
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            onClick={() => selectedFile && onFileSelect(selectedFile)}
            disabled={!selectedFile || isUploading}
            className="flex-1 max-w-[260px] px-6 py-2.5 rounded-xl text-sm font-semibold text-white
              transition-all duration-200 shadow-md
              disabled:opacity-40 disabled:cursor-not-allowed
              bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400"
          >
            {isUploading ? "Uploading..." : "Upload File"}
          </button>
        </div>
      </div>
    </div>
  );
}

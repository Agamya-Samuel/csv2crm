"use client";

import { Download, FileSpreadsheet, Users, Megaphone, Table2, Database } from "lucide-react";

interface SampleFile {
  name: string;
  filename: string;
  description: string;
  rows: string;
  icon: React.ReactNode;
  color: string;
}

const SAMPLE_FILES: SampleFile[] = [
  {
    name: "Facebook Leads",
    filename: "facebook-leads.csv",
    description: "Social media ad leads with names, phones, and lead status",
    rows: "5 rows",
    icon: <Megaphone className="w-5 h-5" />,
    color: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
  },
  {
    name: "Google Ads",
    filename: "google-ads.csv",
    description: "Search ad leads with campaign data and contact info",
    rows: "4 rows",
    icon: <FileSpreadsheet className="w-5 h-5" />,
    color: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
  },
  {
    name: "Messy Spreadsheet",
    filename: "messy-spreadsheet.csv",
    description: "Mixed-format data with combined fields and inconsistent columns",
    rows: "5 rows",
    icon: <Table2 className="w-5 h-5" />,
    color: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30",
  },
  {
    name: "Large Leads Dataset",
    filename: "large-leads-dataset.csv",
    description: "500 leads across multiple countries, sources, and statuses",
    rows: "500 rows",
    icon: <Database className="w-5 h-5" />,
    color: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30",
  },
];

export default function SampleFiles() {
  return (
    <div className="mt-8 max-w-3xl mx-auto">
      <div className="text-center mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Don&apos;t have a CSV file? Try one of these sample datasets
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SAMPLE_FILES.map((file) => (
          <a
            key={file.filename}
            href={`/samples/${file.filename}`}
            download
            className="group flex items-center gap-3 p-4 rounded-xl border border-gray-200
              dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-blue-300
              dark:hover:border-blue-600 hover:shadow-md transition-all duration-200"
          >
            <div className={`p-2 rounded-lg ${file.color}`}>
              {file.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {file.name}
                </p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium">
                  {file.rows}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {file.description}
              </p>
            </div>
            <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}

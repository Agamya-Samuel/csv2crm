import { stringify } from "csv-stringify/sync";
import { prisma } from "../db/client";

const CRM_FIELDS = [
  "created_at",
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "lead_owner",
  "crm_status",
  "crm_note",
  "data_source",
  "possession_time",
  "description",
];

export async function exportToCSV(uploadId: string): Promise<string> {
  const records = await prisma.leadRecord.findMany({
    where: { uploadId, status: "IMPORTED" },
    orderBy: { name: "asc" },
  });

  const rows = records.map((r: any) => ({
    created_at: r.createdAtField?.toISOString() || "",
    name: r.name || "",
    email: r.email || "",
    country_code: r.countryCode || "",
    mobile_without_country_code: r.mobileWithoutCountryCode || "",
    company: r.company || "",
    city: r.city || "",
    state: r.state || "",
    country: r.country || "",
    lead_owner: r.leadOwner || "",
    crm_status: r.crmStatus || "",
    crm_note: r.crmNote || "",
    data_source: r.dataSource || "",
    possession_time: r.possessionTime || "",
    description: r.description || "",
  }));

  return stringify(rows, { header: true, columns: CRM_FIELDS });
}

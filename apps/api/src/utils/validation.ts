import { z } from "zod";

export const crmStatusSchema = z.enum([
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
]);

export const dataSourceSchema = z.enum([
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
]);

export const extractedRecordSchema = z.object({
  created_at: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  country_code: z.string().optional().nullable(),
  mobile_without_country_code: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  lead_owner: z.string().optional().nullable(),
  crm_status: crmStatusSchema.optional().nullable(),
  crm_note: z.string().optional().nullable(),
  data_source: dataSourceSchema.optional().nullable(),
  possession_time: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const extractedBatchSchema = z.array(extractedRecordSchema);

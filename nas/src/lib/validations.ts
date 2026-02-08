import { z } from "zod"

// Customer validation schema
export const customerSchema = z.object({
  company_name: z.string().min(1, "Nama perusahaan wajib diisi"),
  contact_name: z.string().min(1, "Nama kontak wajib diisi"),
  email: z.string().email("Alamat email tidak valid"),
  phone: z.string().min(1, "Nomor telepon wajib diisi"),
  address: z.string().optional(),
})

export type CustomerInput = z.infer<typeof customerSchema>

// Material validation schema
export const materialSchema = z.object({
  name: z.string().min(1, "Nama material wajib diisi"),
  description: z.string().optional(),
  category: z.string().min(1, "Kategori wajib diisi"),
  unit_type: z.string().min(1, "Jenis satuan wajib diisi"),
  unit_cost: z.number().positive("Harga satuan harus lebih dari 0"),
  supplier: z.string().optional(),
  part_number: z.string().optional(),
})

export type MaterialInput = z.infer<typeof materialSchema>

// Quotation validation schema
export const quotationSchema = z.object({
  customer_id: z.number().positive("Pelanggan wajib dipilih"),
  title: z.string().min(1, "Judul wajib diisi"),
  description: z.string().optional(),
  labor_hours: z.number().nonnegative("Jam kerja tidak boleh negatif"),
  labor_rate: z.number().positive("Tarif kerja harus lebih dari 0"),
  profit_margin: z
    .number()
    .min(0, "Margin keuntungan tidak boleh negatif")
    .max(1, "Margin keuntungan harus antara 0 dan 1"),
})

export type QuotationInput = z.infer<typeof quotationSchema>

// Quotation line item validation schema
export const quotationLineItemSchema = z.object({
  quotation_id: z.number().positive(),
  material_id: z.number().positive().optional().nullable().transform(val => val ?? undefined),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  quantity: z.number().positive("Jumlah harus lebih dari 0"),
  unit_price: z.number().nonnegative("Harga satuan tidak boleh negatif"),
})

export type QuotationLineItemInput = z.infer<typeof quotationLineItemSchema>

// Quotation scope of work validation schema
export const quotationScopeWorkSchema = z.object({
  quotation_id: z.number().positive(),
  step_number: z.number().positive("Nomor langkah harus lebih dari 0"),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  work_category: z.string().optional(),
})

export type QuotationScopeWorkInput = z.infer<typeof quotationScopeWorkSchema>

// Project validation schema
export const projectSchema = z
  .object({
    customer_id: z.number().positive("Pelanggan wajib dipilih"),
    quotation_id: z.number().positive().optional(),
    title: z.string().min(1, "Judul wajib diisi"),
    description: z.string().optional(),
    project_manager_id: z.number().positive().optional(),
    start_date: z.date().optional(),
    end_date: z.date().optional(),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return data.start_date <= data.end_date
      }
      return true
    },
    {
      message: "Tanggal penyelesaian harus setelah tanggal mulai",
      path: ["end_date"],
    }
  )

export type ProjectInput = z.infer<typeof projectSchema>

// Material request validation schema
export const materialRequestSchema = z.object({
  project_id: z.number().positive("Proyek wajib dipilih"),
  request_type: z.enum(["purchase", "warehouse"], {
    message: "Jenis permintaan harus purchase atau warehouse",
  }),
  title: z.string().min(1, "Judul wajib diisi"),
  urgency: z.enum(["low", "medium", "high"], {
    message: "Urgensi harus low, medium, atau high",
  }),
})

export type MaterialRequestInput = z.infer<typeof materialRequestSchema>

// Material request item validation schema
export const materialRequestItemSchema = z.object({
  material_request_id: z.number().positive(),
  material_id: z.number().positive().optional(),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  quantity: z.number().positive("Jumlah harus lebih dari 0"),
  estimated_unit_cost: z.number().nonnegative("Estimasi harga satuan tidak boleh negatif"),
})

export type MaterialRequestItemInput = z.infer<typeof materialRequestItemSchema>

// Project cost validation schema
export const projectCostSchema = z.object({
  project_id: z.number().positive("Proyek wajib dipilih"),
  cost_type: z.enum(["labor", "material", "equipment", "subcontractor", "travel", "other"], {
    message: "Jenis biaya tidak valid",
  }),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  material_id: z.number().positive().optional(),
  quantity: z.number().positive().optional(),
  unit_cost: z.number().nonnegative().optional(),
  total_cost: z.number().nonnegative("Total biaya tidak boleh negatif"),
  vendor: z.string().optional(),
  purchase_date: z.date(),
})

export type ProjectCostInput = z.infer<typeof projectCostSchema>

// Invoice validation schema
export const invoiceSchema = z.object({
  project_id: z.number().positive("Proyek wajib dipilih"),
  customer_id: z.number().positive("Pelanggan wajib dipilih"),
  due_date: z.date(),
  notes: z.string().optional(),
})

export type InvoiceInput = z.infer<typeof invoiceSchema>

// Invoice line item validation schema
export const invoiceLineItemSchema = z.object({
  invoice_id: z.number().positive(),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  quantity: z.number().positive("Jumlah harus lebih dari 0"),
  unit_price: z.number().nonnegative("Harga satuan tidak boleh negatif"),
})

export type InvoiceLineItemInput = z.infer<typeof invoiceLineItemSchema>

// Project report validation schema
export const projectReportSchema = z.object({
  project_id: z.number().positive("Proyek wajib dipilih"),
  completion_date: z.date(),
  work_summary: z.string().min(1, "Ringkasan pekerjaan wajib diisi"),
  materials_used: z.string().min(1, "Material yang digunakan wajib diisi"),
  customer_signature_url: z.string().url().optional(),
})

export type ProjectReportInput = z.infer<typeof projectReportSchema>

// Date range validation helper
export function validateDateRange(
  startDate: Date | null | undefined,
  endDate: Date | null | undefined,
  fieldNames: { start: string; end: string } = { start: "tanggal mulai", end: "tanggal selesai" }
): { valid: boolean; error?: string } {
  if (!startDate || !endDate) {
    return { valid: true } // If either is missing, let required validation handle it
  }

  if (startDate > endDate) {
    return {
      valid: false,
      error: `${fieldNames.end} harus setelah ${fieldNames.start}`,
    }
  }

  return { valid: true }
}

// Helper to format validation errors for API responses
export function formatZodErrors(error: z.ZodError): string[] {
  return error.issues.map((err: any) => {
    const path = err.path.join(".")
    return `${path}: ${err.message}`
  })
}

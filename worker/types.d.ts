interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta: { last_row_id: number; [key: string]: unknown };
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
  first<T = unknown>(): Promise<T | null>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

interface Env {
  DB: D1Database;
  ASSETS?: { fetch(request: Request): Promise<Response> };
  SENDGRID_API_KEY?: string;
  EMAIL_FROM?: string;
  WHATSAPP_ACCESS_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_BUSINESS_ACCOUNT_ID?: string;
}

interface BananaTypeRow {
  id: number;
  name: string;
  active: number;
}

interface FarmerRow {
  id: number;
  name: string;
  phone: string;
  village: string;
  address: string;
  gst: string;
  email: string;
  notes: string;
}

interface VendorRow {
  id: number;
  name: string;
  phone: string;
  market: string;
  address: string;
  gst: string;
  email: string;
  notes: string;
}

interface PurchaseInvoiceRow {
  id: number;
  invoice_no: string;
  invoice_date: string;
  farmer_id: number;
  farmer_name: string;
  total: number;
  paid: number;
  pending: number;
  status: string;
  notes: string;
}

interface PurchaseInvoiceItemRow {
  id: number;
  invoice_id: number;
  banana_type: string;
  grade: string;
  units: number;
  gross_weight_kg: number;
  stem_reduction_per_unit: number;
  net_weight_kg: number;
  rate: number;
  amount: number;
  vehicle_no: string;
  notes: string;
}

interface SaleInvoiceRow {
  id: number;
  invoice_no: string;
  invoice_date: string;
  vendor_id: number;
  vendor_name: string;
  vehicle_no: string;
  total: number;
  paid: number;
  pending: number;
  status: string;
  notes: string;
}

interface SaleInvoiceItemRow {
  id: number;
  invoice_id: number;
  banana_type: string;
  grade: string;
  net_weight_kg: number;
  rate: number;
  amount: number;
  notes: string;
}

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
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
}

interface PurchaseRow {
  id: number;
  purchase_date: string;
  farmer_id: number | null;
  farmer_name: string;
  banana_type: string;
  bunches: number;
  weight_kg: number;
  rate: number;
  vehicle_no: string;
  notes: string;
  trip_id: number | null;
}

interface SaleRow {
  id: number;
  sale_date: string;
  vendor_id: number | null;
  vendor_name: string;
  banana_type: string;
  weight_kg: number;
  rate: number;
  paid: number;
  vehicle_no: string;
  notes: string;
  trip_id: number | null;
}

interface InvoiceItemRow {
  id: number;
  invoice_id: number;
  item_type: "purchase" | "sale";
  source_id: number;
  item_date: string;
  description: string;
  quantity_kg: number;
  rate: number;
  amount: number;
}

interface InvoiceRow {
  id: number;
  invoice_no: string;
  party_type: "farmer" | "vendor";
  party_id: number;
  party_name: string;
  from_date: string;
  to_date: string;
  invoice_date: string;
  total: number;
  paid: number;
  pending: number;
  status: string;
}

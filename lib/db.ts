import { getServiceClient } from "@/lib/supabase/client";

export interface Database {
  public: {
    Tables: {
      app_users: {
        Row: { id: string; email: string; password_hash: string; name: string; company_name: string; gstin: string | null; phone: string | null; address: string | null; created_at: string; updated_at: string; };
        Insert: Omit<Database["public"]["Tables"]["app_users"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["app_users"]["Insert"]>;
      };
      customers: {
        Row: { id: string; user_id: string; name: string; email: string | null; phone: string | null; gstin: string | null; pan: string | null; billing_address: string | null; shipping_address: string | null; state: string | null; created_at: string; updated_at: string; };
        Insert: Omit<Database["public"]["Tables"]["customers"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
      };
      invoices: {
        Row: { id: string; user_id: string; customer_id: string; invoice_number: string; invoice_date: string; due_date: string; status: "draft" | "sent" | "paid" | "overdue" | "cancelled"; items: any[]; subtotal: number; total_tax: number; total_amount: number; notes: string | null; terms: string | null; place_of_supply: string | null; reverse_charge: boolean; version: number; created_at: string; updated_at: string; };
        Insert: Omit<Database["public"]["Tables"]["invoices"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>;
      };
      invoice_versions: {
        Row: { id: string; invoice_id: string; version: number; snapshot: any; diff: string | null; created_at: string; };
        Insert: Omit<Database["public"]["Tables"]["invoice_versions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["invoice_versions"]["Insert"]>;
      };
    };
  };
}

let dbClient: ReturnType<typeof getServiceClient> | null = null;

function getDb() {
  if (!dbClient) dbClient = getServiceClient();
  return dbClient;
}

export async function select<T = any>(table: string, query?: { eq?: Record<string, any>; order?: string; limit?: number }): Promise<T[]> {
  const db = getDb();
  let q = (db.from(table) as any).select("*");
  if (query?.eq) for (const [k, v] of Object.entries(query.eq)) q = q.eq(k, v);
  if (query?.order) { const [c, d] = query.order.split("."); q = q.order(c, { ascending: d === "asc" }); }
  if (query?.limit) q = q.limit(query.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data as T[]) || [];
}

export async function insert<T = any>(table: string, record: Record<string, any>): Promise<T> {
  const db = getDb();
  const { data, error } = await (db.from(table) as any).insert(record).select().single();
  if (error) throw error;
  return data as T;
}

export async function update<T = any>(table: string, id: string, record: Record<string, any>): Promise<T> {
  const db = getDb();
  const { data, error } = await (db.from(table) as any).update(record).eq("id", id).select().single();
  if (error) throw error;
  return data as T;
}

export async function remove(table: string, id: string): Promise<void> {
  const db = getDb();
  const { error } = await (db.from(table) as any).delete().eq("id", id);
  if (error) throw error;
}

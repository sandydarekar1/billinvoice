import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db";

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
}

function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

let _client: ReturnType<typeof createClient<Database>> | null = null;
let _serviceClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabase() {
  if (!_client) {
    _client = createClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
  }
  return _client;
}

export function getServiceClient() {
  if (!_serviceClient) {
    _serviceClient = createClient<Database>(
      getSupabaseUrl(),
      getServiceRoleKey(),
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return _serviceClient;
}

export { getSupabase as supabase };

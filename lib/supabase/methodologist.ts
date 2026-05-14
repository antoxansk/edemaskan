import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase env vars");
}

// Anon client with RLS — read-only for methodologists via Supabase Auth
export const supabaseMethodologist = createClient(supabaseUrl, supabaseAnonKey);

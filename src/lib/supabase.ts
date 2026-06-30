import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "https://fbioswmvoqcuuogqwuut.supabase.co";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "sb_publishable_vWrmigIIRz_QpT8ZwP7-OQ_WziS-hSc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Log connection info for debugging
console.log("Supabase Client initialized with URL:", supabaseUrl);

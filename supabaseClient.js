import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xonhjvvgyccmhcjcrgyy.supabase.co";

const SUPABASE_KEY = process.env.SUPABASE_API; 

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export { supabase };

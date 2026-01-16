import { createClient } from '@supabase/supabase-js';

// Fix: Property 'env' does not exist on type 'ImportMeta'. Using process.env instead for environment variables.
export const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);
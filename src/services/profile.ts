import { supabase } from '@/lib/supabaseClient';

export async function ensureProfile(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (!data) {
    await supabase.from('profiles').insert({
      id: userId,
      plan: 'basic',
      status: 'active',
    });
  }
}

import { supabase } from '@/lib/supabaseClient';

export type LicenseInfo = {
  id: string;
  max_devices: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
};

/**
 * Retorna a licença ativa do usuário
 */
export async function getUserLicense(
  userId: string
): Promise<LicenseInfo | null> {
  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .or('expires_at.is.null,expires_at.gt.now()')
    .single();

  if (error) {
    return null;
  }

  return data;
}

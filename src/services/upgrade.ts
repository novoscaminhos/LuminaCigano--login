import { supabase } from '@/lib/supabaseClient';

export type UpgradePlan = {
  max_devices: number;
  expires_at?: string | null;
};

/**
 * Atualiza a licença do usuário
 * (base para upgrade de plano)
 */
export async function upgradeLicense(
  userId: string,
  plan: UpgradePlan
): Promise<void> {
  const { error } = await supabase
    .from('licenses')
    .update({
      max_devices: plan.max_devices,
      expires_at: plan.expires_at ?? null,
      active: true,
    })
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}

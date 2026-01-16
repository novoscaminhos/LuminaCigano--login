import { supabase } from '@/lib/supabaseClient';

/**
 * Lista todos os dispositivos ativos do usuário logado
 */
export async function listUserDevices(userId: string) {
  const { data, error } = await supabase
    .from('devices')
    .select(
      `
      id,
      device_name,
      device_fingerprint,
      last_seen,
      active,
      created_at
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Desativa um dispositivo específico
 * (libera slot de licença)
 */
export async function deactivateDevice(
  userId: string,
  deviceId: string
) {
  const { error } = await supabase
    .from('devices')
    .update({
      active: false,
      last_seen: new Date().toISOString(),
    })
    .eq('id', deviceId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return true;
}

/**
 * Conta quantos dispositivos ativos o usuário possui
 */
export async function countActiveDevices(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('devices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('active', true);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

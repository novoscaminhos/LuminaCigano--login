import { supabase } from '@/lib/supabaseClient';
import {
  getDeviceFingerprint,
  getDeviceName,
} from '@/utils/deviceFingerprint';

/**
 * Valida se o dispositivo atual pode acessar o app.
 * - Se já estiver registrado: libera
 * - Se não estiver: valida licença e registra
 */
export async function validateDeviceAccess(userId: string): Promise<boolean> {
  const fingerprint = getDeviceFingerprint();
  const deviceName = getDeviceName();

  // 1. Verifica se o dispositivo já está registrado
  const { data: existingDevice, error: existingError } = await supabase
    .from('devices')
    .select('*')
    .eq('user_id', userId)
    .eq('device_fingerprint', fingerprint)
    .eq('active', true)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingDevice) {
    // Atualiza last_seen
    await supabase
      .from('devices')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', existingDevice.id);

    return true;
  }

  // 2. Busca licença ativa
  const { data: license, error: licenseError } = await supabase
    .from('licenses')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .or('expires_at.is.null,expires_at.gt.now()')
    .single();

  if (licenseError || !license) {
    throw new Error('Nenhuma licença ativa encontrada.');
  }

  // 3. Valida se pode registrar novo dispositivo
  const { data: allowed, error: allowedError } = await supabase.rpc(
    'can_register_device',
    { p_user_id: userId }
  );

  if (allowedError) {
    throw allowedError;
  }

  if (!allowed) {
    throw new Error('Limite de dispositivos atingido para esta licença.');
  }

  // 4. Registra o dispositivo
  const { error: insertError } = await supabase.from('devices').insert({
    user_id: userId,
    license_id: license.id,
    device_fingerprint: fingerprint,
    device_name: deviceName,
    active: true,
    last_seen: new Date().toISOString(),
  });

  if (insertError) {
    throw insertError;
  }

  return true;
}

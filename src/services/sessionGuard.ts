import { supabase } from '@/lib/supabaseClient';
import { getUserLicense } from '@/services/license';

/**
 * Garante que a sessão do usuário ainda é válida
 * (licença ativa e não expirada)
 */
export async function guardActiveSession(): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || !session.user) {
    throw new Error('Sessão inválida.');
  }

  const license = await getUserLicense(session.user.id);

  if (!license) {
    throw new Error('Licença inativa ou expirada.');
  }
}

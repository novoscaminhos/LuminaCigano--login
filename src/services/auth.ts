import { supabase } from '@/lib/supabaseClient';
import { ensureProfile } from '@/services/profile';
import { validateDeviceAccess } from '@/services/device';

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  if (data.user) {
    await ensureProfile(data.user.id);
    await validateDeviceAccess(data.user.id);
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  if (data.user) {
    await ensureProfile(data.user.id);
    await validateDeviceAccess(data.user.id);
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'lunara_device_id';

export function getDeviceFingerprint(): string {
  let id = localStorage.getItem(STORAGE_KEY);

  if (!id) {
    id = uuidv4();
    localStorage.setItem(STORAGE_KEY, id);
  }

  return id;
}

export function getDeviceName(): string {
  const platform = navigator.platform || 'Unknown';
  const ua = navigator.userAgent;

  if (/android/i.test(ua)) return 'Android Device';
  if (/iphone|ipad/i.test(ua)) return 'iOS Device';

  return `Web - ${platform}`;
}

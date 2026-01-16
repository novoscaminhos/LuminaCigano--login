import { useEffect, useState } from 'react';
import { listUserDevices, deactivateDevice } from '@/services/devicesPanel';
import { supabase } from '@/lib/supabaseClient';

type Device = {
  id: string;
  device_name: string;
  last_seen: string;
  active: boolean;
};

export default function DevicesPanel() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDevices() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      const data = await listUserDevices(session.user.id);
      setDevices(data);
      setLoading(false);
    }

    loadDevices();
  }, []);

  async function handleDeactivate(deviceId: string) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) return;

    await deactivateDevice(session.user.id, deviceId);

    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId ? { ...d, active: false } : d
      )
    );
  }

  if (loading) {
    return <p>Carregando dispositivos...</p>;
  }

  return (
    <div>
      <h2>Meus dispositivos</h2>

      {devices.map((device) => (
        <div key={device.id} style={{ marginBottom: 12 }}>
          <strong>{device.device_name}</strong>
          <br />
          <small>
            Último acesso:{' '}
            {new Date(device.last_seen).toLocaleString()}
          </small>
          <br />
          {device.active ? (
            <button onClick={() => handleDeactivate(device.id)}>
              Desativar
            </button>
          ) : (
            <span>Desativado</span>
          )}
        </div>
      ))}
    </div>
  );
}

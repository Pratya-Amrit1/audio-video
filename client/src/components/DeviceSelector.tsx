import React, { useEffect, useState } from 'react';

type MediaDevice = { deviceId: string; label: string };

export function DeviceSelector({ disabled }: { disabled?: boolean }) {
  const [mics, setMics] = useState<MediaDevice[]>([]);
  const [cams, setCams] = useState<MediaDevice[]>([]);
  const [micId, setMicId] = useState<string>('');
  const [camId, setCamId] = useState<string>('');

  useEffect(() => {
    async function load() {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch {}
      const devices = await navigator.mediaDevices.enumerateDevices();
      setMics(devices.filter(d => d.kind === 'audioinput').map(d => ({ deviceId: d.deviceId, label: d.label || 'Microphone' })));
      setCams(devices.filter(d => d.kind === 'videoinput').map(d => ({ deviceId: d.deviceId, label: d.label || 'Camera' })));
    }
    load();
  }, []);

  useEffect(() => {
    if (micId) localStorage.setItem('pref_mic', micId);
  }, [micId]);
  useEffect(() => {
    if (camId) localStorage.setItem('pref_cam', camId);
  }, [camId]);

  return (
    <div className="row" style={{ marginTop: 12 }}>
      <select className="select" disabled={disabled} value={micId} onChange={(e) => setMicId(e.target.value)}>
        <option value="">Default Mic</option>
        {mics.map(m => <option key={m.deviceId} value={m.deviceId}>{m.label}</option>)}
      </select>
      <select className="select" disabled={disabled} value={camId} onChange={(e) => setCamId(e.target.value)}>
        <option value="">Default Cam</option>
        {cams.map(c => <option key={c.deviceId} value={c.deviceId}>{c.label}</option>)}
      </select>
    </div>
  );
}



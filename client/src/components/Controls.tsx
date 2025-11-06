import React from 'react';

export function Controls({ onToggleAudio, onToggleVideo, onShareScreen, onStopShare, onRestartIce, quality, onBitrateChange }:{
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onShareScreen: () => void;
  onStopShare: () => void;
  onRestartIce: () => void;
  quality: { bitrateKbps: number };
  onBitrateChange: (kbps: number) => void;
}) {
  return (
    <div className="row">
      <button className="btn secondary" onClick={onToggleAudio}>🎙️ Mute/Unmute</button>
      <button className="btn secondary" onClick={onToggleVideo}>📷 Camera</button>
      <button className="btn ok" onClick={onShareScreen}>🖥️ Share</button>
      <button className="btn danger" onClick={onStopShare}>⛔ Stop</button>
      <button className="btn secondary" onClick={onRestartIce}>❄️ Restart ICE</button>
      <label className="row" style={{ marginLeft: 8 }}>
        <span style={{ color: 'var(--muted)' }}>Bitrate</span>
        <input className="input" type="number" min={64} max={4096} value={quality.bitrateKbps}
          onChange={(e) => onBitrateChange(Number(e.target.value || 0))} style={{ width: 110 }} />
        <span style={{ color: 'var(--muted)' }}>kbps</span>
      </label>
    </div>
  );
}



import React, { useEffect, useRef } from 'react';
import { ParticipantTile } from './ParticipantTile';

type MediaView = { stream: MediaStream | null; label: string; speaking?: boolean };

export function VideoGrid({ local, peers }:{ local: MediaView; peers: Record<string, MediaView> }) {
  const totalParticipants = 1 + Object.keys(peers).length;
  // Adaptive grid: 1 person = full width, 2 = 2 cols, 3+ = 2 cols on large screens
  const gridCols = totalParticipants === 1 ? 'grid-cols-1' : totalParticipants === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2';
  
  return (
    <div className={`grid ${gridCols} gap-4 p-4`}>
      <ParticipantTile stream={local.stream || undefined} name="You" speaking={!!local.speaking} qualityColor="green" />
      {Object.entries(peers).map(([id, p]) => (
        <ParticipantTile key={id} stream={p.stream || undefined} name={p.label} speaking={!!p.speaking} qualityColor="green" />
      ))}
    </div>
  );
}

const Tile = ({ title, stream, speaking }: { title: string; stream?: MediaStream; speaking?: boolean }) => {
  const ref = useMedia(stream);
  return (
    <>
      <video ref={ref} autoPlay playsInline muted={title === 'You'} />
      <div className="label">{title}</div>
    </>
  );
};

function useMedia(stream?: MediaStream | null) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream || null;
  }, [stream]);
  return ref;
}



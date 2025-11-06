import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ConnectionQuality } from './ConnectionQuality';

export function ParticipantTile({ stream, name, speaking, qualityColor }:{ stream?: MediaStream | null; name: string; speaking?: boolean; qualityColor?: 'green'|'yellow'|'red' }) {
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (ref.current) ref.current.srcObject = stream || null; }, [stream]);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .2 }}
      className={`relative rounded-2xl overflow-hidden border ${speaking ? 'shadow-[0_0_15px_#00C2FF] border-cyan-300/60' : 'border-white/15'} bg-black/60 backdrop-blur-xl min-h-[400px]`}
    >
      <video ref={ref} autoPlay playsInline muted={name === 'You'} className="w-full h-full min-h-[400px] object-cover" />
      <div className="absolute left-2 bottom-2 px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-white/90 text-xs">
        {name}
      </div>
      <div className="absolute right-2 top-2">
        <ConnectionQuality quality={connectionQuality} />
      </div>
    </motion.div>
  );
}



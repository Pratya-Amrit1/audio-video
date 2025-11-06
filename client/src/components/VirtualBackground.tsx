import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const BACKGROUNDS = [
  { id: 'none', name: 'None', image: null },
  { id: 'blur', name: 'Blur', image: 'blur' },
  { id: 'space1', name: 'Space Nebula', image: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1920&h=1080&fit=crop' },
  { id: 'space2', name: 'Galaxy', image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&h=1080&fit=crop' },
  { id: 'space3', name: 'Star Field', image: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=1920&h=1080&fit=crop' },
  { id: 'office', name: 'Office', image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1920&h=1080&fit=crop' },
  { id: 'beach', name: 'Beach', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop' },
];

export function VirtualBackground({ videoTrack, onBackgroundChange }: {
  videoTrack: MediaStreamTrack | null;
  onBackgroundChange?: (bg: string | null) => void;
}) {
  const [selected, setSelected] = useState<string>('none');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (selected === 'none' || !videoTrack || !canvasRef.current) return;
    if (selected === 'blur') {
      // Simple blur effect - would need more sophisticated implementation for production
      return;
    }
    // For space/images, we'll use CSS background-image overlay approach
  }, [selected, videoTrack]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4">
      <div className="text-white/90 text-sm font-semibold mb-3">Virtual Background</div>
      <div className="grid grid-cols-4 gap-2">
        {BACKGROUNDS.map((bg) => (
          <button
            key={bg.id}
            onClick={() => {
              setSelected(bg.id);
              onBackgroundChange?.(bg.id === 'none' ? null : bg.image || 'blur');
            }}
            className={`relative rounded-lg overflow-hidden border-2 transition ${
              selected === bg.id ? 'border-brand shadow-[0_0_10px_#00C2FF]' : 'border-white/10'
            }`}
          >
            {bg.image === 'blur' ? (
              <div className="aspect-video bg-gradient-to-r from-purple-500/30 to-cyan-500/30 flex items-center justify-center">
                <span className="text-xs">Blur</span>
              </div>
            ) : bg.image ? (
              <img src={bg.image} alt={bg.name} className="w-full h-full object-cover aspect-video" />
            ) : (
              <div className="aspect-video bg-black/40 flex items-center justify-center">
                <span className="text-xs">None</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-xs p-1 text-center text-white/90 truncate">
              {bg.name}
            </div>
          </button>
        ))}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  );
}





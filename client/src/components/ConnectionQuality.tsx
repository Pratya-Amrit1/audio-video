import React from 'react';

export function ConnectionQuality({ quality }: { quality: 'excellent' | 'good' | 'fair' | 'poor' }) {
  const colors = {
    excellent: 'bg-green-400',
    good: 'bg-green-300',
    fair: 'bg-yellow-400',
    poor: 'bg-red-400',
  };
  const labels = {
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
  };

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 border border-white/10">
      <div className={`w-2 h-2 rounded-full ${colors[quality]}`} />
      <span className="text-xs text-white/80">{labels[quality]}</span>
    </div>
  );
}





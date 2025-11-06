import React from 'react';
import { motion } from 'framer-motion';

export function ControlBar({ onToggleAudio, onToggleVideo, onShareScreen, onStopShare, onParticipants, onChat, onSettings, onLeave }:{
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onShareScreen: () => void;
  onStopShare: () => void;
  onParticipants: () => void;
  onChat: () => void;
  onSettings: () => void;
  onLeave: () => void;
}) {
  return (
    <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.25 }}
      className="fixed left-1/2 -translate-x-1/2 bottom-6 z-20">
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_0_15px_#00C2FF] rounded-2xl px-3 py-2 flex items-center gap-2">
        <IconBtn onClick={onToggleAudio} label="Mute">🎙️</IconBtn>
        <IconBtn onClick={onToggleVideo} label="Camera">🎥</IconBtn>
        <IconBtn onClick={onShareScreen} label="Share">🖥️</IconBtn>
        <IconBtn onClick={onStopShare} label="Stop" variant="danger">⛔</IconBtn>
        <div className="w-px h-6 bg-white/20 mx-1" />
        <IconBtn onClick={onParticipants} label="People">🧑‍🤝‍🧑</IconBtn>
        <IconBtn onClick={onChat} label="Chat">💬</IconBtn>
        <IconBtn onClick={onSettings} label="Settings">⚙️</IconBtn>
        <div className="w-px h-6 bg-white/20 mx-1" />
        <IconBtn onClick={onLeave} label="Leave" variant="danger">🔴</IconBtn>
      </div>
    </motion.div>
  );
}

function IconBtn({ children, label, onClick, variant }:{ children: React.ReactNode; label: string; onClick: () => void; variant?: 'danger' | 'default' }) {
  const danger = variant === 'danger';
  return (
    <button onClick={onClick} className={`px-3 py-2 rounded-xl text-white/90 hover:text-white transition backdrop-blur-xl border border-white/10 ${danger ? 'bg-red-500/30 hover:bg-red-500/40' : 'bg-white/10 hover:bg-white/15'}`}>
      <span className="text-lg align-middle">{children}</span>
      <span className="ml-2 text-sm align-middle hidden sm:inline">{label}</span>
    </button>
  );
}



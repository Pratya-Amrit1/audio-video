import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const REACTIONS = ['❤️', '👍', '👎', '😂', '🎉', '🔥', '👏', '💯'];

export function LiveReactions({ onSend }: { onSend?: (emoji: string) => void }) {
  const [active, setActive] = useState<string[]>([]);

  const handleReaction = (emoji: string) => {
    setActive((prev) => [...prev, emoji]);
    onSend?.(emoji);
    setTimeout(() => {
      setActive((prev) => prev.filter((e) => e !== emoji));
    }, 3000);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="text-white/70 text-xs">Reactions:</div>
      {REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => handleReaction(emoji)}
          className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition text-lg"
        >
          {emoji}
        </button>
      ))}
      <AnimatePresence>
        {active.map((emoji, i) => (
          <motion.div
            key={`${emoji}-${i}`}
            initial={{ scale: 0, y: 0 }}
            animate={{ scale: 1.2, y: -50 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute pointer-events-none text-3xl"
            style={{ left: '50%', transform: 'translateX(-50%)' }}
          >
            {emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function ReactionOverlay({ reactions }: { reactions: Array<{ emoji: string; id: string; x: number; y: number }> }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {reactions.map((r) => (
        <motion.div
          key={r.id}
          initial={{ scale: 0, x: r.x, y: r.y }}
          animate={{ scale: 1.5, y: r.y - 100, opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute text-4xl"
        >
          {r.emoji}
        </motion.div>
      ))}
    </div>
  );
}





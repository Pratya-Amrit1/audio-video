import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Sidebar({ open, title, children, onClose }:{ open: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }} transition={{ type: 'spring', stiffness: 240, damping: 26 }}
          className="fixed right-4 top-4 bottom-4 w-80 z-30 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-[0_0_15px_#00C2FF] overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-white/10">
            <div className="font-semibold text-white/90">{title}</div>
            <button onClick={onClose} className="px-2 py-1 rounded-lg hover:bg-white/10">✖</button>
          </div>
          <div className="flex-1 overflow-hidden flex flex-col">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}



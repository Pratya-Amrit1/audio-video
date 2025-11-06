import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

type Message = { id: string; from: string; text: string; time: Date };

export function ChatPanel({ messages, onSend, currentUser }: {
  messages: Message[];
  onSend: (text: string) => void;
  currentUser: string;
}) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2 p-2" ref={scrollRef}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-2 rounded-lg ${
              msg.from === currentUser ? 'bg-brand/20 ml-4' : 'bg-white/10 mr-4'
            }`}
          >
            <div className="text-xs text-white/60 mb-1">{msg.from}</div>
            <div className="text-white/90 text-sm">{msg.text}</div>
            <div className="text-xs text-white/40 mt-1">
              {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="border-t border-white/10 p-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white/90 placeholder-white/40 text-sm outline-none focus:border-brand"
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 rounded-lg bg-brand hover:bg-brand/80 text-white font-semibold transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}





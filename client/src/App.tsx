import React, { useEffect, useMemo, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWebRTC } from './hooks/useWebRTC';
import { DeviceSelector } from './components/DeviceSelector';
import { Controls } from './components/Controls';
import { VideoGrid } from './components/VideoGrid';
import { ControlBar } from './components/ControlBar';
import { Sidebar } from './components/Sidebar';
import { ChatPanel } from './components/ChatPanel';
import { LiveReactions, ReactionOverlay } from './components/LiveReactions';
import { VirtualBackground } from './components/VirtualBackground';

const API_BASE = 'https://audio-video-y5hr.onrender.com/api';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:room" element={<Conference />} />
      </Routes>
    </BrowserRouter>
  );
}

function Home() {
  const [code, setCode] = useState('demo');
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slatebg text-white font-grotesk">
      <div className="max-w-6xl mx-auto p-6">
        <header className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-purple-500 shadow-[0_8px_24px_rgba(0,194,255,0.35)]" />
            <span className="text-xl font-bold tracking-wide">Wirone</span>
          </div>
          <button onClick={() => document.documentElement.classList.toggle('dark')} className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition">Theme</button>
        </header>

        <main className="grid lg:grid-cols-2 gap-10 mt-10">
          <div>
            <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-5xl md:text-6xl font-bold leading-tight">
              Seamless. Secure. <span className="text-brand">Real-time</span> Connections.
            </motion.h1>
            <p className="text-slate-300 mt-4 max-w-xl">Next-gen multi-party conferencing with adaptive quality, screen share, and robust connectivity.</p>
            <div className="flex gap-3 mt-8">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_BASE}/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
                    if (!res.ok) throw new Error(await res.text());
                    const data = await res.json();
                    const rid = data.roomId || Math.random().toString(36).slice(2,7);
                    navigate('/room/' + rid);
                  } catch (e: any) {
                    alert('Failed to create room: ' + (e?.message || e));
                  }
                }}
                className="btn"
              >Start Meeting</button>
              <div className="flex items-center gap-2">
                <input className="input" placeholder="Enter code" value={code} onChange={(e) => setCode(e.target.value)} />
                <button className="btn secondary" onClick={() => navigate('/room/' + code)}>Join with Code</button>
              </div>
            </div>
          </div>
          <div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.1 }} className="grid grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.02 * i }} className="aspect-video rounded-xl bg-black/70 border border-white/10 shadow-lg" />
              ))}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Conference() {
  const params = useParams();
  const [roomId, setRoomId] = useState<string>('demo');
  const [displayName, setDisplayName] = useState<string>('Guest');
  const [token, setToken] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
  const [showPeople, setShowPeople] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; from: string; text: string; time: Date }>>([]);
  const [reactions, setReactions] = useState<Array<{ emoji: string; id: string; x: number; y: number }>>([]);
  const [virtualBg, setVirtualBg] = useState<string | null>(null);

  const { connect, disconnect, localMedia, peers, toggleAudio, toggleVideo, shareScreen, stopShare, quality, setPreferredBitrate, restartIce } = useWebRTC();

  const decoded: any = useMemo(() => (token ? jwtDecode(token) : null), [token]);

  useEffect(() => {
    const onBeforeUnload = () => {
      if (joined) disconnect();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [joined, disconnect]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (params.room) setRoomId(params.room);
  }, [params.room]);

  async function handleJoin() {
    try {
      const res = await fetch(`${API_BASE}/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName })
      });
      if (!res.ok) {
        const text = await res.text();
        alert(`Join failed: ${res.status} ${text}`);
        return;
      }
      const data = await res.json();
      if (!data.token) {
        alert('Join failed: missing token');
        return;
      }
      setToken(data.token);
      await connect({ token: data.token });
      setJoined(true);
    } catch (e: any) {
      alert(`Join error: ${e?.message || e}`);
    }
  }

  async function handleLeave() {
    if (token) {
      await fetch(`${API_BASE}/rooms/${roomId}/leave`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    }
    disconnect();
    setJoined(false);
    setToken(null);
  }

  return (
    <div className="wirone-app fade-in">
      <div className="nav">
        <div className="brand">
          <div className="brand-logo" />
          <div>Wirone</div>
        </div>
        <div className="row">
          <input className="input" placeholder="Room ID" value={roomId} onChange={(e) => setRoomId(e.target.value)} />
          <input className="input" placeholder="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          {!joined ? (
            <button className="btn" onClick={handleJoin}>Join</button>
          ) : (
            <button className="btn danger" onClick={handleLeave}>Leave</button>
          )}
          <div className="spacer" />
          <button className="btn secondary" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      <div style={{ height: 8 }} />

      <DeviceSelector disabled={joined} />
      {joined && (
        <>
          <div className="relative">
            <VideoGrid local={localMedia} peers={peers} />
            {joined && (
              <div className="absolute top-4 left-4 z-10">
                <LiveReactions
                  onSend={(emoji) => {
                    const r = {
                      emoji,
                      id: Date.now().toString(),
                      x: Math.random() * window.innerWidth,
                      y: Math.random() * window.innerHeight,
                    };
                    setReactions((prev) => [...prev, r]);
                    setTimeout(() => setReactions((prev) => prev.filter((item) => item.id !== r.id)), 2000);
                  }}
                />
              </div>
            )}
          </div>
          <ReactionOverlay reactions={reactions} />
          <ControlBar
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onShareScreen={shareScreen}
            onStopShare={stopShare}
            onParticipants={() => setShowPeople(true)}
            onChat={() => setShowChat(true)}
            onSettings={() => setShowSettings(true)}
            onLeave={handleLeave}
          />
        </>
      )}
      <Sidebar open={showPeople} title="Participants" onClose={() => setShowPeople(false)}>
        <div>Count: {1 + Object.keys(peers).length}</div>
      </Sidebar>
      <Sidebar open={showChat} title="Chat" onClose={() => setShowChat(false)}>
        <ChatPanel
          messages={chatMessages}
          currentUser={displayName}
          onSend={(text) => {
            const msg = { id: Date.now().toString(), from: displayName, text, time: new Date() };
            setChatMessages((prev) => [...prev, msg]);
            // TODO: Broadcast via WebSocket signaling
          }}
        />
      </Sidebar>
      <Sidebar open={showSettings} title="Settings" onClose={() => setShowSettings(false)}>
        <div className="space-y-4">
          <div>
            <div className="text-white/70 text-sm mb-2">Bitrate (kbps)</div>
            <input className="input w-full" type="number" min={64} max={4096} value={quality.bitrateKbps}
              onChange={(e) => setPreferredBitrate(Number(e.target.value || 0))} />
          </div>
          <VirtualBackground
            videoTrack={localMedia.stream?.getVideoTracks()[0] || null}
            onBackgroundChange={(bg) => setVirtualBg(bg)}
          />
          <button className="btn secondary w-full" onClick={restartIce}>Restart ICE</button>
        </div>
      </Sidebar>
    </div>
  );
}



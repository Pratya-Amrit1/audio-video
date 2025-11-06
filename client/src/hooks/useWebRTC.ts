import { useCallback, useEffect, useRef, useState } from 'react';

type Peer = {
  pc: RTCPeerConnection;
  stream: MediaStream;
  label: string;
  speaking?: boolean;
};

type ConnectArgs = { token: string };

export function useWebRTC() {
  const [peers, setPeers] = useState<Record<string, { stream: MediaStream; label: string; speaking?: boolean }>>({});
  const [quality, setQuality] = useState({ bitrateKbps: 1200 });
  const [localMedia, setLocalMedia] = useState<{ stream: MediaStream | null; label: string; speaking?: boolean }>({ stream: null, label: 'You' });
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analysersRef = useRef<Map<string, AnalyserNode>>(new Map());

  const wsRef = useRef<WebSocket | null>(null);
  const connIdRef = useRef<string>('');
  const peersRef = useRef<Map<string, Peer>>(new Map());
  const sendersRef = useRef<RTCRtpSender[]>([]);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const iceServersRef = useRef<RTCIceServer[] | undefined>(undefined);

  const applyBitrate = useCallback(async () => {
    const bitrate = quality.bitrateKbps * 1000;
    await Promise.all(sendersRef.current.map(async (s) => {
      const p = s.getParameters();
      p.encodings = p.encodings || [{}];
      p.encodings[0].maxBitrate = bitrate;
      p.degradationPreference = 'balanced';
      await s.setParameters(p);
    }));
  }, [quality.bitrateKbps]);

  useEffect(() => { applyBitrate(); }, [applyBitrate]);

  const connect = useCallback(async ({ token }: ConnectArgs) => {
    const url = new URL('/ws', 'wss://audio-video-y5hr.onrender.com');
    url.searchParams.set('token', token);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onclose = (e) => {
      console.error('WebSocket closed', e);
      alert('Signaling connection closed. Check server is running on :4000 and CORS/proxy config.');
    };
    ws.onerror = (e) => {
      console.error('WebSocket error', e);
      alert('Signaling connection error. See console for details.');
    };
    ws.onmessage = async (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'welcome') {
        connIdRef.current = msg.connectionId;
        iceServersRef.current = msg.iceServers;
        await initLocalMedia();
        // Proactively connect to existing peers
        const peersList: Array<{connectionId: string; userId: string; displayName: string}> = msg.peers || [];
        for (const p of peersList) {
          if (p.connectionId !== connIdRef.current) {
            await ensurePeer(p.connectionId, p.displayName || 'Peer', true);
          }
        }
      } else if (msg.type === 'presence') {
        if (msg.event === 'join' && msg.connectionId !== connIdRef.current) {
          await ensurePeer(msg.connectionId, msg.userId, true);
        } else if (msg.event === 'leave') {
          removePeer(msg.connectionId);
        }
      } else if (msg.type === 'offer') {
        await ensurePeer(msg.from, 'Peer', false);
        const p = peersRef.current.get(msg.from)!;
        await p.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        const answer = await p.pc.createAnswer();
        await p.pc.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: 'answer', to: msg.from, sdp: p.pc.localDescription }));
      } else if (msg.type === 'answer') {
        const p = peersRef.current.get(msg.from);
        if (p) await p.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      } else if (msg.type === 'ice-candidate') {
        const p = peersRef.current.get(msg.from);
        if (p && msg.candidate) await p.pc.addIceCandidate(msg.candidate);
      } else if (msg.type === 'restart-ice') {
        for (const [, peer] of peersRef.current) {
          peer.pc.restartIce();
        }
      }
    };
  }, []);

  const initLocalMedia = useCallback(async () => {
    const audioDeviceId = localStorage.getItem('pref_mic') || undefined;
    const videoDeviceId = localStorage.getItem('pref_cam') || undefined;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: audioDeviceId ? { exact: audioDeviceId } : undefined, echoCancellation: true, noiseSuppression: true },
      video: { deviceId: videoDeviceId ? { exact: videoDeviceId } : undefined, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } }
    });
    setLocalMedia({ stream, label: 'You' });
    // Setup analyser for local speaking detection
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtxRef.current;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analysersRef.current.set('local', analyser);
      monitorLevels();
    } catch {}
  }, []);

  const ensurePeer = useCallback(async (id: string, label: string, isInitiator: boolean) => {
    if (peersRef.current.has(id)) return peersRef.current.get(id)!;
    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
    const stream = new MediaStream();
    const peer: Peer = { pc, stream, label };
    peersRef.current.set(id, peer);

    pc.onicecandidate = (e) => {
      if (e.candidate) wsRef.current?.send(JSON.stringify({ type: 'ice-candidate', to: id, candidate: e.candidate }));
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') pc.restartIce();
    };
    pc.ontrack = (e) => {
      e.streams[0].getTracks().forEach(() => {});
      e.streams.forEach(s => s.getTracks().forEach(() => {}));
      e.streams.forEach(s => s.getTracks());
      peer.stream = e.streams[0];
      setPeers((prev) => ({ ...prev, [id]: { stream: peer.stream, label: peer.label } }));
      // analyser for remote
      try {
        if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = audioCtxRef.current;
        const source = ctx.createMediaStreamSource(peer.stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analysersRef.current.set(id, analyser);
        monitorLevels();
      } catch {}
    };

    if (localMedia.stream) {
      localMedia.stream.getTracks().forEach((t) => {
        const sender = pc.addTrack(t, localMedia.stream!);
        sendersRef.current.push(sender);
      });
      await applyBitrate();
    }

    if (isInitiator) {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      wsRef.current?.send(JSON.stringify({ type: 'offer', to: id, sdp: pc.localDescription }));
    }

    return peer;
  }, [applyBitrate, localMedia.stream]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    connIdRef.current = '';
    for (const [, p] of peersRef.current) {
      p.pc.close();
    }
    peersRef.current.clear();
    setPeers({});
    if (localMedia.stream) localMedia.stream.getTracks().forEach(t => t.stop());
    setLocalMedia({ stream: null, label: 'You' });
  }, [localMedia.stream]);

  const toggleAudio = useCallback(() => {
    localMedia.stream?.getAudioTracks().forEach(t => t.enabled = !t.enabled);
  }, [localMedia.stream]);

  const toggleVideo = useCallback(() => {
    localMedia.stream?.getVideoTracks().forEach(t => t.enabled = !t.enabled);
  }, [localMedia.stream]);

  const shareScreen = useCallback(async () => {
    const scr = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: false });
    const track: MediaStreamTrack = scr.getVideoTracks()[0];
    screenTrackRef.current = track;
    for (const [, p] of peersRef.current) {
      const sender = p.pc.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender) await sender.replaceTrack(track);
    }
    track.onended = async () => { await stopShare(); };
  }, []);

  const stopShare = useCallback(async () => {
    if (!screenTrackRef.current) return;
    const cam = localMedia.stream?.getVideoTracks()[0] || null;
    for (const [, p] of peersRef.current) {
      const sender = p.pc.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender) await sender.replaceTrack(cam);
    }
    screenTrackRef.current.stop();
    screenTrackRef.current = null;
  }, [localMedia.stream]);

  const setPreferredBitrate = useCallback((kbps: number) => {
    setQuality((q) => ({ ...q, bitrateKbps: kbps }));
  }, []);

  const restartIce = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'restart-ice' }));
    for (const [, p] of peersRef.current) p.pc.restartIce();
  }, []);

  function monitorLevels() {
    if (!audioCtxRef.current) return;
    const dataArray = new Uint8Array(128);
    const update = () => {
      const localAn = analysersRef.current.get('local');
      if (localAn) {
        localAn.getByteTimeDomainData(dataArray);
        const amp = rms(dataArray);
        const speaking = amp > 20;
        setLocalMedia((prev) => ({ ...prev, speaking }));
      }
      // remotes
      const updates: Record<string, boolean> = {};
      for (const [id, an] of analysersRef.current.entries()) {
        if (id === 'local') continue;
        an.getByteTimeDomainData(dataArray);
        const amp = rms(dataArray);
        updates[id] = amp > 20;
      }
      if (Object.keys(updates).length) {
        setPeers((prev) => {
          const next = { ...prev } as any;
          for (const [id, speaking] of Object.entries(updates)) {
            if (next[id]) next[id] = { ...next[id], speaking };
          }
          return next;
        });
      }
      requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  function rms(arr: Uint8Array) {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i] - 128; // center
      sum += v * v;
    }
    return Math.sqrt(sum / arr.length);
  }

  return {
    connect,
    disconnect,
    localMedia,
    peers,
    toggleAudio,
    toggleVideo,
    shareScreen,
    stopShare,
    quality,
    setPreferredBitrate,
    restartIce,
  } as const;
}



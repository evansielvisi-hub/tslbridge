'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  doc, setDoc, getDoc, addDoc, collection, onSnapshot, updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import SignDisplay from '@/components/SignDisplay';
import SignDisplay from '@/components/SignDisplay';const STUN = { iceServers: [{ urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }] };

// ── Improved 20-sign TSL classifier ─────────────────────
function classifyGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;

  // Improved accuracy: compare fingertip to PIP (middle knuckle) with threshold
  // This is more reliable than comparing tip to MCP base knuckle
  const MIN = 0.03;

  const indexExtended  = (landmarks[6].y  - landmarks[8].y)  > MIN;
  const middleExtended = (landmarks[10].y - landmarks[12].y) > MIN;
  const ringExtended   = (landmarks[14].y - landmarks[16].y) > MIN;
  const pinkyExtended  = (landmarks[18].y - landmarks[20].y) > MIN;

  // Thumb: measure horizontal distance from tip to index base
  const thumbExtended = Math.abs(landmarks[4].x - landmarks[5].x) > MIN;

  const t = thumbExtended, i = indexExtended,
        m = middleExtended, r = ringExtended, p = pinkyExtended;

  // ── Original 8 signs ──────────────────────────────────
  if ( t &&  i &&  m &&  r &&  p) return { sign: 'HELLO',      swahili: 'Habari',    emoji: '👋' };
  if ( t && !i && !m && !r && !p) return { sign: 'GOOD',       swahili: 'Nzuri',     emoji: '👍' };
  if (!t && !i && !m && !r && !p) return { sign: 'STOP',       swahili: 'Simama',    emoji: '✊' };
  if (!t &&  i && !m && !r && !p) return { sign: 'YES',        swahili: 'Ndio',      emoji: '☝️' };
  if (!t &&  i &&  m && !r && !p) return { sign: 'NO',         swahili: 'Hapana',    emoji: '✌️' };
  if (!t &&  i &&  m &&  r && !p) return { sign: 'HELP',       swahili: 'Msaada',    emoji: '🤟' };
  if (!t &&  i &&  m &&  r &&  p) return { sign: 'WATER',      swahili: 'Maji',      emoji: '💧' };
  if (!t && !i && !m && !r &&  p) return { sign: 'I LOVE YOU', swahili: 'Nakupenda', emoji: '🤙' };

  // ── New 12 signs ──────────────────────────────────────
  if ( t &&  i && !m && !r && !p) return { sign: 'THANK YOU',  swahili: 'Asante',    emoji: '🙏' };
  if ( t &&  i &&  m && !r && !p) return { sign: 'NAME',       swahili: 'Jina',      emoji: '✍️' };
  if ( t &&  i &&  m &&  r && !p) return { sign: 'FOOD',       swahili: 'Chakula',   emoji: '🍽️' };
  if ( t && !i &&  m &&  r &&  p) return { sign: 'MONEY',      swahili: 'Pesa',      emoji: '💰' };
  if ( t && !i && !m && !r &&  p) return { sign: 'SCHOOL',     swahili: 'Shule',     emoji: '🏫' };
  if (!t &&  i && !m && !r &&  p) return { sign: 'DOCTOR',     swahili: 'Daktari',   emoji: '🏥' };
  if (!t && !i &&  m &&  r &&  p) return { sign: 'FRIEND',     swahili: 'Rafiki',    emoji: '👥' };
  if ( t && !i &&  m && !r && !p) return { sign: 'SORRY',      swahili: 'Samahani',  emoji: '😔' };
  if (!t && !i &&  m &&  r && !p) return { sign: 'COME',       swahili: 'Kuja',      emoji: '👉' };
  if ( t && !i &&  m &&  r && !p) return { sign: 'PLEASE',     swahili: 'Tafadhali', emoji: '🤲' };
  if (!t && !i && !m &&  r &&  p) return { sign: 'WHERE',      swahili: 'Wapi',      emoji: '❓' };
  if ( t && !i && !m &&  r &&  p) return { sign: 'HOME',       swahili: 'Nyumbani',  emoji: '🏠' };

  return null;
}

function waitForHands(maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      if (typeof window.Hands === 'function') resolve();
      else if (attempts >= maxAttempts) reject(new Error('MediaPipe failed to load'));
      else setTimeout(check, 200);
    };
    check();
  });
}

export default function CallRoomPage() {
  const params = useParams();
  const roomId = params.roomId;
  const { user, profile } = useAuth();
  const router = useRouter();

  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef          = useRef(null);
  const localStreamRef = useRef(null);
  const dataChannelRef = useRef(null);
  const handsRef       = useRef(null);
  const rafRef         = useRef(null);
  const lastSignRef    = useRef('');
  const stabilityRef   = useRef({ sign: '', count: 0 }); // ← accuracy improvement
  const canvasRef      = useRef(null);
  const recognitionRef = useRef(null);

  const [status,       setStatus]       = useState('Starting camera…');
  const [isMuted,      setIsMuted]      = useState(false);
  const [isCameraOff,  setIsCameraOff]  = useState(false);
  const [mySign,       setMySign]       = useState(null);
  const [remoteSign,   setRemoteSign]   = useState('');
  const [remoteSpeech, setRemoteSpeech] = useState('');
  const [myLastSpeech, setMyLastSpeech] = useState('');
  const [isListening,  setIsListening]  = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [speechLang,   setSpeechLang]   = useState('en-US');

  const isDeaf      = profile?.role === 'deaf';
  const isConnected = status === 'connected';

  function sendData(type, text) {
    const ch = dataChannelRef.current;
    if (ch?.readyState === 'open') ch.send(JSON.stringify({ type, text }));
  }

  function setupDataChannel(channel) {
    channel.onopen = () => console.log('Data channel open');
    channel.onmessage = (e) => {
      try {
        const { type, text } = JSON.parse(e.data);
        if (type === 'sign')   setRemoteSign(text);
        if (type === 'speech') setRemoteSpeech(text);
      } catch {}
    };
    dataChannelRef.current = channel;
  }

  function copyRoomId() {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleMute() {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(p => !p);
  }
  function toggleCamera() {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCameraOff(p => !p);
  }
  function hangUp() {
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    router.push('/dashboard');
  }

  // ── MediaPipe (deaf users) ───────────────────────────
  const onHandResults = useCallback((results) => {
    const canvas = canvasRef.current;
    const video  = localVideoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks?.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      // Draw landmark dots + connections
      ctx.fillStyle = '#06D6A0';
      ctx.strokeStyle = 'rgba(6,214,160,0.35)';
      ctx.lineWidth = 1.5;
      landmarks.forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 4, 0, 2 * Math.PI);
        ctx.fill();
      });

      // ── Stability buffer: require 3 consistent frames ──
      const result = classifyGesture(landmarks);
      if (result) {
        const stab = stabilityRef.current;
        if (result.sign === stab.sign) {
          stab.count++;
          if (stab.count === 3 && result.sign !== lastSignRef.current) {
            lastSignRef.current = result.sign;
            setMySign(result);
            sendData('sign', `${result.emoji} ${result.sign} (${result.swahili})`);
          }
        } else {
          stab.sign  = result.sign;
          stab.count = 1;
        }
      } else {
        stabilityRef.current = { sign: '', count: 0 };
        lastSignRef.current = '';
      }
    } else {
      stabilityRef.current = { sign: '', count: 0 };
      lastSignRef.current = '';
    }
  }, []);

  const processFrame = useCallback(async () => {
    const video = localVideoRef.current;
    const hands = handsRef.current;
    if (hands && video && video.readyState >= 2 && !isCameraOff) {
      await hands.send({ image: video });
    }
    rafRef.current = requestAnimationFrame(processFrame);
  }, [isCameraOff]);

  useEffect(() => {
    if (!isDeaf) return;
    let mounted = true;
    function loadScript(src) {
      return new Promise((res, rej) => {
        if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
        const s = document.createElement('script');
        s.src = src; s.crossOrigin = 'anonymous';
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    async function initHands() {
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.js');
        await waitForHands();
        if (!mounted) return;
        const hands = new window.Hands({
          locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${f}`,
        });
        hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.75, minTrackingConfidence: 0.6 });
        hands.onResults(onHandResults);
        handsRef.current = hands;
        rafRef.current = requestAnimationFrame(processFrame);
      } catch (err) {
        console.error('Gesture detection unavailable:', err);
      }
    }
    initHands();
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isDeaf, onHandResults, processFrame]);

  // ── Speech recognition (hearing users) ──────────────
  useEffect(() => {
    if (isDeaf || typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsListening(false);
    const rec = new SpeechRecognition();
    rec.continuous = true; rec.interimResults = true; rec.lang = speechLang;
    rec.onresult = (e) => {
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
      }
      if (final) { setMyLastSpeech(final.trim()); sendData('speech', final.trim()); }
    };
    rec.onerror = () => setIsListening(false);
    rec.onend   = () => setIsListening(false);
    recognitionRef.current = rec;
  }, [isDeaf, speechLang]);

  // ── TTS for deaf users ───────────────────────────────
  useEffect(() => {
    if (!remoteSpeech || !isDeaf || typeof window === 'undefined') return;
    const u = new SpeechSynthesisUtterance(remoteSpeech);
    u.lang = speechLang; u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }, [remoteSpeech, isDeaf, speechLang]);

  function toggleListening() {
    if (!recognitionRef.current) return;
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
    else             { recognitionRef.current.start(); setIsListening(true); }
  }

  // ── WebRTC ───────────────────────────────────────────
  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    let unsubAnswer = null, unsubCallerICE = null, unsubCalleeICE = null;

    async function start() {
      const pendingCandidates = [];
      let remoteDescSet = false;

      async function addCandidateSafely(pc, data) {
        if (remoteDescSet) {
          try { await pc.addIceCandidate(new RTCIceCandidate(data)); } catch (e) { console.warn(e); }
        } else { pendingCandidates.push(data); }
      }

      setStatus('Starting camera…');
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        setStatus('Camera/mic access denied. Please allow and reload.'); return;
      }
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection(STUN);
      pcRef.current = pc;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      const remoteStream = new MediaStream();
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      pc.ontrack = (e) => e.streams[0].getTracks().forEach(t => remoteStream.addTrack(t));
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected')    setStatus('connected');
        if (pc.connectionState === 'disconnected') setStatus('Peer disconnected');
        if (pc.connectionState === 'failed')       setStatus('Connection failed');
      };

      setStatus('Connecting to room…');
      const roomRef  = doc(db, 'calls', roomId);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists() || !roomSnap.data()?.offer) {
        setStatus('Waiting for someone to join…');
        const dc = pc.createDataChannel('translation');
        setupDataChannel(dc);
        pc.onicecandidate = async (e) => {
          if (e.candidate) await addDoc(collection(db, 'calls', roomId, 'callerCandidates'), e.candidate.toJSON());
        };
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await setDoc(roomRef, { offer: { type: offer.type, sdp: offer.sdp } });

        unsubAnswer = onSnapshot(roomRef, async (snap) => {
          const data = snap.data();
          if (data?.answer && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            remoteDescSet = true;
            for (const c of pendingCandidates) {
              try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (e) { console.warn(e); }
            }
            pendingCandidates.length = 0;
          }
        });
        unsubCalleeICE = onSnapshot(collection(db, 'calls', roomId, 'calleeCandidates'), (snap) => {
          snap.docChanges().forEach(c => { if (c.type === 'added') addCandidateSafely(pc, c.doc.data()); });
        });
      } else {
        setStatus('Joining call…');
        pc.ondatachannel = (e) => setupDataChannel(e.channel);
        pc.onicecandidate = async (e) => {
          if (e.candidate) await addDoc(collection(db, 'calls', roomId, 'calleeCandidates'), e.candidate.toJSON());
        };
        await pc.setRemoteDescription(new RTCSessionDescription(roomSnap.data().offer));
        remoteDescSet = true;
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await updateDoc(roomRef, { answer: { type: answer.type, sdp: answer.sdp } });

        unsubCallerICE = onSnapshot(collection(db, 'calls', roomId, 'callerCandidates'), (snap) => {
          snap.docChanges().forEach(c => { if (c.type === 'added') addCandidateSafely(pc, c.doc.data()); });
        });
      }
    }

    start();
    return () => {
      unsubAnswer?.(); unsubCallerICE?.(); unsubCalleeICE?.();
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [user, roomId]);

  return (
    <div style={{ background: '#080D1A', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* TOP BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid #1E2D4A' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#F8FAFC' }}>
          TSL<span style={{ color: '#06D6A0' }}>Bridge</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600,
            background: isConnected ? 'rgba(6,214,160,.1)' : 'rgba(245,158,11,.1)',
            color: isConnected ? '#06D6A0' : '#F59E0B',
            border: `1px solid ${isConnected ? 'rgba(6,214,160,.3)' : 'rgba(245,158,11,.3)'}` }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: isConnected ? '#06D6A0' : '#F59E0B', display: 'inline-block' }} />
            {isConnected ? 'Connected' : status}
          </div>
          <button onClick={copyRoomId} style={{ padding: '6px 14px', borderRadius: 8, background: '#101828', border: '1px solid #1E2D4A', color: '#94A3B8', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            🔑 {roomId} {copied ? '✓ Copied!' : '— Copy ID'}
          </button>
        </div>
      </div>

      {/* VIDEO AREA */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 16 }}>

        {/* LOCAL */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
            YOU — {isDeaf ? '🤟 Deaf User' : '🎙️ Hearing User'}
          </div>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: '#0A1628', borderRadius: 14, overflow: 'hidden' }}>
            <video ref={localVideoRef} autoPlay muted playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            {isDeaf && (
              <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' }} />
            )}
            <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 11, color: 'rgba(6,214,160,.8)', background: 'rgba(0,0,0,.5)', padding: '2px 8px', borderRadius: 6 }}>YOU</div>
          </div>

          {/* My output */}
          <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 12, background: '#101828', border: '1px solid #1E2D4A' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
              {isDeaf ? 'Your sign detected →' : 'Your speech →'}
            </div>
            <div style={{ fontSize: 15, color: '#F8FAFC', minHeight: 22 }}>
              {isDeaf
                ? (mySign ? `${mySign.emoji} ${mySign.sign} · ${mySign.swahili}` : 'Show a hand sign to the camera…')
                : (myLastSpeech || 'Press Start and speak…')}
            </div>
          </div>

          {/* Speech controls — hearing users only */}
          {!isDeaf && (
            <div style={{ marginTop: 10, padding: '12px 16px', borderRadius: 12, background: '#101828', border: '1px solid #1E2D4A' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#3B82F6' }}>🎙️ Speech-to-Text</span>
                <button onClick={toggleListening}
                  style={{ padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: isListening ? 'rgba(239,68,68,.2)' : 'rgba(59,130,246,.2)',
                    color: isListening ? '#FCA5A5' : '#3B82F6',
                    border: `1px solid ${isListening ? 'rgba(239,68,68,.4)' : 'rgba(59,130,246,.4)'}` }}>
                  {isListening ? '⏹ Stop' : '▶ Start'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ code: 'en-US', label: '🇬🇧 English' }, { code: 'sw-TZ', label: '🇹🇿 Swahili' }].map(lang => (
                  <button key={lang.code}
                    onClick={() => { if (isListening) { recognitionRef.current?.stop(); setIsListening(false); } setSpeechLang(lang.code); }}
                    style={{ flex: 1, padding: '7px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      background: speechLang === lang.code ? 'rgba(6,214,160,.15)' : '#0A1628',
                      color: speechLang === lang.code ? '#06D6A0' : '#64748B',
                      border: `1px solid ${speechLang === lang.code ? 'rgba(6,214,160,.4)' : '#1E2D4A'}` }}>
                    {lang.label}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: '#334155' }}>
                {speechLang === 'sw-TZ' ? 'Sema kwa Kiswahili — maneno yatakuonyeshwa.' : 'Speak in English — words will be shown to the deaf user.'}
              </div>
            </div>
          )}
        </div>

        {/* REMOTE */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>REMOTE USER</div>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: '#0A1628', borderRadius: 14, overflow: 'hidden' }}>
            <video ref={remoteVideoRef} autoPlay playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {!isConnected && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #06D6A0', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 13, color: '#475569' }}>
                  {status === 'Waiting for someone to join…' ? `Share Room ID: ${roomId}` : status}
                </span>
              </div>
            )}
            <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 11, color: 'rgba(255,255,255,.5)', background: 'rgba(0,0,0,.5)', padding: '2px 8px', borderRadius: 6 }}>REMOTE</div>
          </div>

          {isDeaf ? (
  /* Deaf user sees incoming speech as ASL signs */
  <SignDisplay text={remoteSpeech} active={!!remoteSpeech} />
) : (
  /* Hearing user sees incoming sign text */
  <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 12, background: '#101828', border: '1px solid #1E2D4A' }}>
    <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
      Their sign →
    </div>
    <div style={{ fontSize: 15, minHeight: 22, color: '#06D6A0' }}>
      {remoteSign || 'Waiting for deaf user to sign…'}
    </div>
  </div>
)}
        </div>
      </div>

      {/* CALL CONTROLS */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '16px', borderTop: '1px solid #1E2D4A' }}>
        <button onClick={toggleMute}
          style={{ width: 48, height: 48, borderRadius: '50%', fontSize: 20, cursor: 'pointer', border: '1px solid #1E2D4A', background: isMuted ? 'rgba(239,68,68,.2)' : '#101828', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isMuted ? '🔇' : '🎙️'}
        </button>
        <button onClick={toggleCamera}
          style={{ width: 48, height: 48, borderRadius: '50%', fontSize: 20, cursor: 'pointer', border: '1px solid #1E2D4A', background: isCameraOff ? 'rgba(239,68,68,.2)' : '#101828', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isCameraOff ? '📵' : '📹'}
        </button>
        <button onClick={hangUp}
          style={{ width: 56, height: 56, borderRadius: '50%', fontSize: 22, cursor: 'pointer', border: 'none', background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          📵
        </button>
        <button onClick={copyRoomId}
          style={{ width: 48, height: 48, borderRadius: '50%', fontSize: 20, cursor: 'pointer', border: '1px solid #1E2D4A', background: '#101828', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {copied ? '✅' : '🔗'}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
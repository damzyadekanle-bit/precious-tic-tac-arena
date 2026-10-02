import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useGame } from '../contexts/GameContext';
import { socket } from '../services/socket';

type VoiceSignal =
  | { description: RTCSessionDescriptionInit }
  | { candidate: RTCIceCandidateInit };

interface PeerConnection {
  connection: RTCPeerConnection;
  audio: HTMLAudioElement;
}

/** Browser-to-browser voice chat. Socket.IO only relays WebRTC setup messages. */
export function VoiceChatControl() {
  const { room, identity } = useGame();
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const activeRef = useRef(false);
  const peersRef = useRef(new Map<string, PeerConnection>());
  const roomRef = useRef(room);
  const identityRef = useRef(identity);
  roomRef.current = room;
  identityRef.current = identity;

  const sendSignal = (targetPlayerId: string, signal: VoiceSignal) => {
    if (roomRef.current)
      socket.emit('voice-signal', { code: roomRef.current.code, targetPlayerId, signal });
  };
  const closePeer = (playerId: string) => {
    const peer = peersRef.current.get(playerId);
    if (!peer) return;
    peer.connection.close();
    peer.audio.remove();
    peersRef.current.delete(playerId);
  };
  const ensurePeer = (playerId: string) => {
    const existing = peersRef.current.get(playerId);
    if (existing) return existing.connection;
    const connection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    const audio = document.createElement('audio');
    audio.autoplay = true;
    connection.onicecandidate = ({ candidate }) => {
      if (candidate) sendSignal(playerId, { candidate: candidate.toJSON() });
    };
    connection.ontrack = ({ streams }) => {
      audio.srcObject = streams[0] ?? null;
      void audio.play().catch(() => undefined);
    };
    connection.onconnectionstatechange = () => {
      if (connection.connectionState === 'failed' || connection.connectionState === 'closed') closePeer(playerId);
    };
    streamRef.current?.getTracks().forEach((track) => connection.addTrack(track, streamRef.current!));
    peersRef.current.set(playerId, { connection, audio });
    return connection;
  };
  const offer = async (playerId: string) => {
    const connection = ensurePeer(playerId);
    if (connection.signalingState !== 'stable') return;
    await connection.setLocalDescription(await connection.createOffer());
    if (connection.localDescription) sendSignal(playerId, { description: connection.localDescription });
  };

  useEffect(() => {
    const onSignal = async ({ fromPlayerId, signal }: { fromPlayerId: string; signal: VoiceSignal }) => {
      if (!roomRef.current || fromPlayerId === identityRef.current.playerId) return;
      const connection = ensurePeer(fromPlayerId);
      try {
        if ('description' in signal) {
          await connection.setRemoteDescription(signal.description);
          if (signal.description.type === 'offer') {
            await connection.setLocalDescription(await connection.createAnswer());
            if (connection.localDescription) sendSignal(fromPlayerId, { description: connection.localDescription });
          }
        } else if ('candidate' in signal) {
          await connection.addIceCandidate(signal.candidate);
        }
      } catch {
        toast.error('Voice connection could not be established');
      }
    };
    const onPeerLeft = ({ playerId }: { playerId: string }) => closePeer(playerId);
    const onPeerJoined = ({ playerId }: { playerId: string }) => {
      if (activeRef.current && identityRef.current.playerId < playerId) void offer(playerId);
    };
    socket.on('voice-signal', onSignal);
    socket.on('voice-peer-left', onPeerLeft);
    socket.on('voice-peer-joined', onPeerJoined);
    return () => {
      socket.off('voice-signal', onSignal);
      socket.off('voice-peer-left', onPeerLeft);
      socket.off('voice-peer-joined', onPeerJoined);
    };
  // Event handlers deliberately access current room/identity through refs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    peersRef.current.forEach(({ connection, audio }) => { connection.close(); audio.remove(); });
    peersRef.current.clear();
  }, []);

  if (!room) return null;
  const otherPlayers = room.players.filter((player) => player.id !== identity.playerId && player.connected);
  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return toast.error('Voice chat is not supported by this browser');
    setStarting(true);
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      activeRef.current = true;
      setActive(true);
      await Promise.all(otherPlayers.filter((player) => identity.playerId < player.id).map((player) => offer(player.id)));
    } catch {
      toast.error('Microphone access was not granted');
    } finally { setStarting(false); }
  };
  const stop = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    activeRef.current = false;
    peersRef.current.forEach(({ connection, audio }) => { connection.close(); audio.remove(); });
    peersRef.current.clear();
    setActive(false);
  };
  return <button type="button" onClick={active ? stop : () => void start()} disabled={starting || otherPlayers.length === 0} className={`rounded-xl border p-3 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 ${active ? 'border-emerald-400/70 bg-emerald-400/10 text-emerald-300' : 'border-white/10'}`} aria-label={active ? 'Leave voice chat' : 'Join voice chat'} title={otherPlayers.length === 0 ? 'Voice chat is available when another player joins' : active ? 'Leave voice chat' : 'Join voice chat'}>{active ? <PhoneOff size={18} /> : starting ? <MicOff size={18} className="animate-pulse" /> : <Mic size={18} />}</button>;
}

import { useCallback, useState } from 'react';
export function useSound() {
  const [muted, setMuted] = useState(false);
  const play = useCallback((type: 'move'|'win'|'draw'|'join'|'leave') => {
    if (muted) return;
    const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextCtor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const map = { move: 440, win: 760, draw: 220, join: 560, leave: 180 } as const;
    osc.frequency.value = map[type];
    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.16);
  }, [muted]);
  return { muted, setMuted, play };
}

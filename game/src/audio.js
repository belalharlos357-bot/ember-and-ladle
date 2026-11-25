// Every sound the kitchen makes, synthesised with the Web Audio API — no
// audio files, no network. The context is created on the first gesture, so
// a quiet first paint (a screenshot) simply stays silent.
export function createSoundBoard() {
  let context = null;
  let master = null;

  function ensure() {
    if (context) return context;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.22;
      master.connect(context.destination);
    } catch {
      context = null;
    }
    return context;
  }

  function tone(freq, seconds, type, volume, delay) {
    const ctx = ensure();
    if (!ctx || ctx.state !== 'running') return;
    const start = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume || 0.5, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + seconds + 0.05);
  }

  function noiseBurst(seconds, volume, cutoff) {
    const ctx = ensure();
    if (!ctx || ctx.state !== 'running') return;
    const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff || 1800;
    const gain = ctx.createGain();
    gain.gain.value = volume || 0.5;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start();
  }

  function unlock() {
    const ctx = ensure();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  }

  return {
    unlock,
    pickup() { tone(520, 0.08, 'triangle', 0.4); },
    place() { tone(340, 0.09, 'triangle', 0.45); noiseBurst(0.05, 0.2, 900); },
    chop() { noiseBurst(0.07, 0.7, 2400); tone(180, 0.06, 'square', 0.25); },
    chopDone() { tone(660, 0.09, 'triangle', 0.4); tone(880, 0.12, 'triangle', 0.35, 0.07); },
    sizzle() { noiseBurst(0.35, 0.3, 4200); },
    grillDone() { tone(740, 0.1, 'sine', 0.45); tone(988, 0.14, 'sine', 0.4, 0.09); },
    ready() { tone(784, 0.12, 'triangle', 0.5); tone(1047, 0.18, 'triangle', 0.45, 0.1); },
    coin() { tone(988, 0.09, 'square', 0.3); tone(1319, 0.16, 'square', 0.28, 0.08); },
    error() { tone(140, 0.18, 'sawtooth', 0.35); },
    lost() { tone(330, 0.25, 'sine', 0.4); tone(233, 0.35, 'sine', 0.35, 0.18); },
    tick() { tone(1200, 0.05, 'square', 0.25); },
    rush() { tone(523, 0.12, 'triangle', 0.5); tone(659, 0.12, 'triangle', 0.5, 0.12); tone(784, 0.2, 'triangle', 0.5, 0.24); },
    start() { tone(392, 0.1, 'triangle', 0.45); tone(523, 0.1, 'triangle', 0.45, 0.1); tone(659, 0.18, 'triangle', 0.45, 0.2); },
  };
}

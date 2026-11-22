// The Velvet Vault — sound, made in code.
//
// One file, one job: every sound the game makes, synthesised with WebAudio so the game ships no
// audio file. A low pulse quickens as the alarm climbs (the tension you can hear), and each
// event has its own short cue: the two-note sting of being spotted, the click of the pick, the
// chime of the loot, the hiss of smoke, the ring of a coin. Browsers only allow sound after a
// key or a click, so the context is made on the first one.

/** The sound desk. Every method is safe to call before the first key press: it does nothing. */
export function createAudio() {
  let context = null;
  let master = null;
  let muted = false;
  let pulseAt = 0;

  /** Make the audio context on the first user gesture. */
  function wake() {
    if (context) {
      if (context.state === 'suspended') context.resume();
      return;
    }
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    context = new Context();
    master = context.createGain();
    master.gain.value = 0.5;
    master.connect(context.destination);
  }

  /** One shaped tone: a frequency (optionally sliding to another) with a quick fade. */
  function tone(frequency, seconds, { type = 'sine', gain = 0.2, slideTo = 0, delay = 0 } = {}) {
    if (!context || muted) return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (slideTo > 0) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + seconds);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    oscillator.connect(envelope).connect(master);
    oscillator.start(start);
    oscillator.stop(start + seconds + 0.02);
  }

  /** A burst of filtered noise: smoke, footsteps on marble. */
  function hiss(seconds, { gain = 0.2, frequency = 1200 } = {}) {
    if (!context || muted) return;
    const frames = Math.floor(context.sampleRate * seconds);
    const buffer = context.createBuffer(1, frames, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < frames; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / frames);
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    envelope.gain.value = gain;
    source.connect(filter).connect(envelope).connect(master);
    source.start();
  }

  return {
    wake,
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted: () => muted,
    /** The heartbeat under the heist: slow and soft when unseen, fast and hard near a full meter. */
    pulse(now, alarmLevel) {
      if (!context || muted) return;
      const gap = 1.15 - 0.8 * Math.min(1, alarmLevel / 100);
      if (now - pulseAt < gap) return;
      pulseAt = now;
      tone(58 + alarmLevel * 0.5, 0.16, { type: 'triangle', gain: 0.1 + alarmLevel * 0.0022 });
      tone(46 + alarmLevel * 0.4, 0.2, { type: 'sine', gain: 0.1, delay: 0.14 });
    },
    footstep: () => hiss(0.05, { gain: 0.05, frequency: 700 }),
    spotted() {
      tone(880, 0.12, { type: 'square', gain: 0.14 });
      tone(1320, 0.2, { type: 'square', gain: 0.14, delay: 0.1 });
    },
    heard: () => tone(520, 0.16, { type: 'triangle', gain: 0.1, slideTo: 700 }),
    pickTick: () => tone(1500 + Math.random() * 500, 0.03, { type: 'square', gain: 0.05 }),
    lifted() {
      [660, 880, 1100, 1320].forEach((note, index) => tone(note, 0.3, { gain: 0.16, delay: index * 0.08 }));
    },
    grabbed() {
      tone(990, 0.12, { gain: 0.14 });
      tone(1480, 0.18, { gain: 0.14, delay: 0.07 });
    },
    fuse() {
      tone(180, 0.5, { type: 'sawtooth', gain: 0.16, slideTo: 40 });
      hiss(0.25, { gain: 0.12, frequency: 3000 });
    },
    smoke: () => hiss(0.7, { gain: 0.22, frequency: 900 }),
    coin() {
      tone(2100, 0.25, { gain: 0.12 });
      tone(2600, 0.3, { gain: 0.1, delay: 0.09 });
    },
    escaped() {
      [523, 659, 784, 1047, 1319].forEach((note, index) => tone(note, 0.4, { type: 'triangle', gain: 0.18, delay: index * 0.11 }));
    },
    caught() {
      for (let index = 0; index < 6; index += 1) tone(index % 2 ? 620 : 880, 0.2, { type: 'sawtooth', gain: 0.16, delay: index * 0.2 });
    },
  };
}

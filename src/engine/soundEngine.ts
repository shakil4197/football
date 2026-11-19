// Synthesized stadium audio effects using Web Audio API (no external sound files required)

class StadiumSoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private lastKickTime = 0;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public playWhistle(pattern: 'kickoff' | 'halftime' | 'fulltime' = 'kickoff'): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const blasts =
      pattern === 'kickoff'
        ? [{ start: 0, dur: 0.36 }]
        : pattern === 'halftime'
        ? [
            { start: 0, dur: 0.22 },
            { start: 0.3, dur: 0.42 },
          ]
        : [
            { start: 0, dur: 0.18 },
            { start: 0.24, dur: 0.18 },
            { start: 0.48, dur: 0.58 },
          ];

    blasts.forEach((blast) => {
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2820, now + blast.start);
      osc.frequency.exponentialRampToValueAtTime(2680, now + blast.start + blast.dur);

      // Pea-whistle trill modulation
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(42, now + blast.start);
      lfoGain.gain.setValueAtTime(95, now + blast.start);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      gain.gain.setValueAtTime(0.001, now + blast.start);
      gain.gain.linearRampToValueAtTime(0.11, now + blast.start + 0.03);
      gain.gain.setValueAtTime(0.1, now + blast.start + blast.dur - 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + blast.start + blast.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + blast.start);
      lfo.start(now + blast.start);
      osc.stop(now + blast.start + blast.dur + 0.02);
      lfo.stop(now + blast.start + blast.dur + 0.02);
    });
  }

  public playKick(power: 'pass' | 'shot' = 'pass'): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    if (now - this.lastKickTime < 0.08) return;
    this.lastKickTime = now;

    // 1. Low ball thump body
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    const startFreq = power === 'shot' ? 185 : 145;
    const endFreq = power === 'shot' ? 44 : 55;
    const vol = power === 'shot' ? 0.36 : 0.21;
    const dur = power === 'shot' ? 0.14 : 0.09;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + dur);

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + dur + 0.01);

    // 2. Crisp short leather boot-hit 'tus' transient
    const clickDur = power === 'shot' ? 0.045 : 0.032;
    const bufLen = Math.floor(ctx.sampleRate * clickDur);
    const buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.012));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(power === 'shot' ? 1150 : 920, now);
    filter.Q.setValueAtTime(1.1, now);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(power === 'shot' ? 0.24 : 0.14, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + clickDur);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);

    noise.start(now);
  }

  public playSave(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Glove slap noise burst + crowd gasp swell
    const bufferSize = Math.floor(ctx.sampleRate * 0.45);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.14));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, now);
    filter.Q.setValueAtTime(1.4, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
  }

  public playGoal(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Stadium crowd roar swell (filtered noise)
    const duration = 1.9;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420, now);
    filter.frequency.linearRampToValueAtTime(880, now + 0.45);
    filter.frequency.linearRampToValueAtTime(520, now + duration);
    filter.Q.setValueAtTime(0.85, now);

    const crowdGain = ctx.createGain();
    crowdGain.gain.setValueAtTime(0.001, now);
    crowdGain.gain.linearRampToValueAtTime(0.17, now + 0.2);
    crowdGain.gain.setValueAtTime(0.14, now + 1.0);
    crowdGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(crowdGain);
    crowdGain.connect(ctx.destination);
    noise.start(now);

    // 2. Crisp broadcast goal brass chime (major chord pulse)
    const freqs = [261.63, 329.63, 392.0, 523.25];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      const t0 = now + idx * 0.045;
      osc.frequency.setValueAtTime(f, t0);

      g.gain.setValueAtTime(0.001, t0);
      g.gain.linearRampToValueAtTime(0.065, t0 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.9);

      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.95);
    });
  }

  public playChampionFanfare(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 392.0, start: 0, dur: 0.22 },
      { freq: 523.25, start: 0.22, dur: 0.22 },
      { freq: 659.25, start: 0.44, dur: 0.22 },
      { freq: 783.99, start: 0.66, dur: 0.95 },
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, now + n.start);

      gain.gain.setValueAtTime(0.001, now + n.start);
      gain.gain.linearRampToValueAtTime(0.1, now + n.start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.start + n.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + n.start);
      osc.stop(now + n.start + n.dur + 0.05);
    });
  }
}

export const soundEngine = new StadiumSoundEngine();

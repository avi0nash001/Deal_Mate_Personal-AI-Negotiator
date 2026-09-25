/**
 * Web Audio API synthesizer for futuristic cybernetic feedback and ambient background music (BGM)
 * Generates synthetic acoustic pulses, frequencies, chimes, and ambient chord pads client-side
 */

export type BgmTrackId = 'cyber-dreamscape' | 'deep-zen' | 'pulse-lofi';

export interface BgmTrackInfo {
  id: BgmTrackId;
  name: string;
  genre: string;
  description: string;
}

export const BGM_TRACKS: BgmTrackInfo[] = [
  {
    id: 'cyber-dreamscape',
    name: 'Cyber Dreamscape',
    genre: 'Ambient Synth Pad',
    description: 'Lush 432Hz D-minor chord progressions with warm resonant filters',
  },
  {
    id: 'deep-zen',
    name: 'Deep Zen Meditation',
    genre: 'Binaural Harmonic Wave',
    description: 'Slow oceanic frequency drifts, deep sub-harmonics, and astral tranquility',
  },
  {
    id: 'pulse-lofi',
    name: 'Pulse Lo-Fi Chime',
    genre: 'Chilled Cyber Chords',
    description: 'Gently rhythmic harmonic pulses, mellow Rhodes-style electric bell tones',
  },
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public bgmPlaying: boolean = false;
  public currentTrackId: BgmTrackId = 'cyber-dreamscape';
  private bgmGainNode: GainNode | null = null;
  private bgmOscillators: OscillatorNode[] = [];
  private bgmIntervalId: number | null = null;
  private bgmVolume: number = 0.04;
  private onBgmStateChangeListeners: ((isPlaying: boolean, trackId: BgmTrackId) => void)[] = [];

  private getContext(): AudioContext | null {
    if (!this.enabled && !this.bgmPlaying) return null;
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public subscribeBgmState(listener: (isPlaying: boolean, trackId: BgmTrackId) => void) {
    this.onBgmStateChangeListeners.push(listener);
    return () => {
      this.onBgmStateChangeListeners = this.onBgmStateChangeListeners.filter((l) => l !== listener);
    };
  }

  private notifyBgmChange() {
    this.onBgmStateChangeListeners.forEach((listener) => listener(this.bgmPlaying, this.currentTrackId));
  }

  /**
   * Set and switch BGM Track
   */
  public setBgmTrack(trackId: BgmTrackId) {
    this.currentTrackId = trackId;
    if (this.bgmPlaying) {
      this.stopBGM(false);
      this.startBGM(trackId);
    } else {
      this.notifyBgmChange();
    }
  }

  /**
   * Toggle Ambient Futuristic BGM
   */
  public toggleBGM(): boolean {
    if (this.bgmPlaying) {
      this.stopBGM();
    } else {
      this.startBGM(this.currentTrackId);
    }
    return this.bgmPlaying;
  }

  /**
   * Start generative ambient cyberpunk BGM (lush chord progression pad)
   */
  public startBGM(track: BgmTrackId = this.currentTrackId) {
    const ctx = this.getContext();
    if (!ctx) return;

    this.currentTrackId = track;
    this.bgmPlaying = true;
    this.notifyBgmChange();

    try {
      // Master BGM gain
      const masterBgmGain = ctx.createGain();
      masterBgmGain.gain.setValueAtTime(0.001, ctx.currentTime);
      masterBgmGain.gain.linearRampToValueAtTime(this.bgmVolume, ctx.currentTime + 1.8);

      // Lowpass filter for warm, dreamy ambient tone
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(track === 'pulse-lofi' ? 780 : 520, ctx.currentTime);
      filter.Q.setValueAtTime(2.2, ctx.currentTime);

      masterBgmGain.connect(filter);
      filter.connect(ctx.destination);
      this.bgmGainNode = masterBgmGain;

      // Chord palettes per track
      let chordProgressions: number[][];
      let cycleIntervalMs = 7800;

      if (track === 'deep-zen') {
        // Binaural ethereal drone in Eb
        chordProgressions = [
          [155.56, 233.08, 311.13, 466.16], // Eb Maj9
          [130.81, 196.0, 293.66, 392.0], // C min9
          [116.54, 174.61, 233.08, 349.23], // Bb sus4
        ];
        cycleIntervalMs = 9500;
      } else if (track === 'pulse-lofi') {
        // Melodic chilled neo-soul cyber progression
        chordProgressions = [
          [174.61, 220.0, 261.63, 329.63], // F Maj7
          [146.83, 174.61, 220.0, 261.63], // D min7
          [130.81, 164.81, 196.0, 246.94], // C Maj7
          [110.0, 130.81, 164.81, 196.0], // A min7
        ];
        cycleIntervalMs = 6200;
      } else {
        // Cyber Dreamscape in D minor
        chordProgressions = [
          [146.83, 220.0, 349.23, 440.0], // Dm9
          [116.54, 174.61, 261.63, 349.23], // BbMaj7
          [130.81, 196.0, 261.63, 392.0], // Csus2
          [98.0, 146.83, 220.0, 293.66], // Gm7
        ];
        cycleIntervalMs = 7800;
      }

      let chordIndex = 0;

      const playChord = () => {
        if (!this.bgmPlaying || !this.ctx) return;
        const freqs = chordProgressions[chordIndex];
        chordIndex = (chordIndex + 1) % chordProgressions.length;

        // Clean up previous cycle oscillators
        this.bgmOscillators.forEach((osc) => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {
            // ignore
          }
        });
        this.bgmOscillators = [];

        freqs.forEach((freq, idx) => {
          if (!this.ctx || !this.bgmGainNode) return;
          const osc = this.ctx.createOscillator();
          const voiceGain = this.ctx.createGain();

          osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
          // Subtle detuning for lush stereo chorus effect
          const detune = (idx - 1.5) * 5;
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          osc.detune.setValueAtTime(detune, this.ctx.currentTime);

          // Gentle envelope: fade-in, sustain, fade-out
          const now = this.ctx.currentTime;
          const fadeDuration = cycleIntervalMs / 1000;
          voiceGain.gain.setValueAtTime(0.001, now);
          voiceGain.gain.linearRampToValueAtTime(0.22, now + 1.8);
          voiceGain.gain.setValueAtTime(0.22, now + (fadeDuration * 0.7));
          voiceGain.gain.linearRampToValueAtTime(0.001, now + fadeDuration);

          osc.connect(voiceGain);
          voiceGain.connect(this.bgmGainNode);

          osc.start(now);
          osc.stop(now + fadeDuration + 0.2);
          this.bgmOscillators.push(osc);
        });
      };

      playChord();
      this.bgmIntervalId = window.setInterval(playChord, cycleIntervalMs - 200);
    } catch {
      this.bgmPlaying = false;
      this.notifyBgmChange();
    }
  }

  /**
   * Stop Ambient BGM
   */
  public stopBGM(notify: boolean = true) {
    this.bgmPlaying = false;
    if (notify) this.notifyBgmChange();

    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }

    if (this.bgmGainNode && this.ctx) {
      try {
        this.bgmGainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
        setTimeout(() => {
          this.bgmOscillators.forEach((osc) => {
            try {
              osc.stop();
              osc.disconnect();
            } catch {
              // ignore
            }
          });
          this.bgmOscillators = [];
        }, 850);
      } catch {
        // ignore
      }
    }
  }

  public setBGMVolume(vol: number) {
    this.bgmVolume = Math.max(0.005, Math.min(0.2, vol));
    if (this.bgmGainNode && this.ctx) {
      try {
        this.bgmGainNode.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
      } catch {
        // ignore
      }
    }
  }

  /**
   * Subtle cyber interaction blip
   */
  playBlip() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Ignore audio failure
    }
  }

  /**
   * Buyer Agent dispatches offer
   */
  playBuyerOffer() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // Ignore
    }
  }

  /**
   * Seller Agent counters offer
   */
  playSellerCounter() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.22);

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch {
      // Ignore
    }
  }

  /**
   * Deal secured harmonic celebration chime
   */
  playDealSecured() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C Major chord arpeggio
      frequencies.forEach((freq, idx) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.07, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.65);
      });
    } catch {
      // Ignore
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

export const soundEffects = new SoundEngine();

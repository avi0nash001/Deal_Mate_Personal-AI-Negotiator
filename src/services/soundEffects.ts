/**
 * Web Audio API synthesizer for subtle UI interaction feedback
 */

export type BgmTrackId = 'cyber-dreamscape' | 'deep-zen' | 'pulse-lofi';

export interface BgmTrackInfo {
  id: BgmTrackId;
  name: string;
  genre: string;
  description: string;
}

export const BGM_TRACKS: BgmTrackInfo[] = [];

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public bgmPlaying: boolean = false;
  public currentTrackId: BgmTrackId = 'cyber-dreamscape';

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
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

  public subscribeBgmState(_listener: (isPlaying: boolean, trackId: BgmTrackId) => void) {
    return () => {};
  }

  public setBgmTrack(_trackId: BgmTrackId) {}

  public toggleBGM(): boolean {
    this.bgmPlaying = false;
    return false;
  }

  public startBGM(_track?: BgmTrackId) {
    this.bgmPlaying = false;
  }

  public stopBGM(_notify: boolean = true) {
    this.bgmPlaying = false;
  }

  public setBGMVolume(_vol: number) {}

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

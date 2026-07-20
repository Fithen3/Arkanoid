// Small synthesized-beep sound effects via WebAudio - no external audio
// assets needed. The context is created lazily on first use, since
// browsers require a user gesture before audio can play; by the time a
// collision happens the player has already pressed a key to get here.
export class SoundManager {
  constructor() {
    this.ctx = null;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playBeep({ frequency, duration = 0.06, type = 'square', volume = 0.15 }) {
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  playBrickHit() {
    this.playBeep({ frequency: 660, duration: 0.05, type: 'square', volume: 0.12 });
  }

  playPaddleHit() {
    this.playBeep({ frequency: 220, duration: 0.07, type: 'triangle', volume: 0.15 });
  }
}

/** One reusable Web Audio context; audio only starts after a player gesture. */
export class ArcadeAudio {
  constructor() { this.enabled = false; this.context = null; this.master = null; this.voices = new Set(); }
  stopAll() {
    for (const voice of this.voices) { try { voice.stop(); } catch { /* Already ended. */ } }
    this.voices.clear();
  }
  syncMute() {
    if (!this.enabled) this.stopAll();
    if (this.master) this.master.gain.setTargetAtTime(this.enabled ? 1 : 0, this.context.currentTime, .01);
  }
  async unlock() {
    if (!this.enabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (this.context?.state === 'closed') { this.context = null; this.master = null; this.voices.clear(); }
      this.context ||= new AudioContext();
      if (!this.master) { this.master = this.context.createGain(); this.master.connect(this.context.destination); }
      this.syncMute();
      if (this.context.state === 'suspended') await this.context.resume();
    } catch { /* Audio is optional; restrictive browsers can still run the game. */ }
  }
  tone(frequency, duration, type = 'sine', end = frequency, delay = 0, volume = .045) {
    if (!this.enabled || this.context?.state !== 'running' || this.voices.size >= 24) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const at = this.context.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, end), at + duration);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(volume, at + .008);
    gain.gain.exponentialRampToValueAtTime(.001, at + duration);
    oscillator.connect(gain); gain.connect(this.master);
    this.voices.add(oscillator);
    oscillator.start(at); oscillator.stop(at + duration + .01);
    oscillator.onended = () => { this.voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
  }
  play(event) {
    if (event === 'shoot') this.tone(900, .08, 'square', 180, 0, .015);
    if (event === 'hit') this.tone(160, .12, 'sawtooth', 40, 0, .025);
    if (event === 'damage') this.tone(120, .3, 'sawtooth', 30);
    if (event === 'shield') this.tone(180, .35, 'sine', 900);
    if (event === 'wave' || event === 'clear') [330, 440, 660].forEach((f, i) => this.tone(f, .2, 'sine', f, i * .1));
    if (event === 'victory') [330, 440, 550, 660, 880].forEach((f, i) => this.tone(f, .35, 'triangle', f, i * .13));
    if (event === 'defeat') [220, 180, 120].forEach((f, i) => this.tone(f, .3, 'triangle', f * .8, i * .17));
  }
}

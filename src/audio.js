// Original synthesised sounds. No audio downloads, tracking or external services.
export const DEFAULT_SETTINGS = {
  enabled: true,
  effects: true,
  music: false,
  volume: 60,
  animations: true,
  landscape: true,
};
const STORAGE_KEY = "montagem-settings";

export function loadSettings(storage) {
  try {
    storage ??= globalThis.localStorage;
    const saved = JSON.parse(storage?.getItem(STORAGE_KEY) || "{}");
    const settings = { ...DEFAULT_SETTINGS };
    for (const key of [
      "enabled",
      "effects",
      "music",
      "animations",
      "landscape",
    ])
      if (typeof saved?.[key] === "boolean") settings[key] = saved[key];
    if (typeof saved?.volume === "number" && Number.isFinite(saved.volume))
      settings.volume = Math.max(0, Math.min(100, saved.volume));
    if (
      typeof saved?.animations !== "boolean" &&
      globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
      settings.animations = false;
    return settings;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}
export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

const profiles = {
  "drink-coke": { tone: 330, noise: 0.1, filter: 4200, type: "triangle" },
  "drink-pepsi": { tone: 290, noise: 0.12, filter: 3800, type: "triangle" },
  "drink-sumol": { tone: 400, noise: 0.09, filter: 4700, type: "sine" },
  "fries-small": { tone: 250, noise: 0.1, filter: 2800, type: "triangle" },
  "fries-medium": { tone: 220, noise: 0.13, filter: 2600, type: "triangle" },
  "fries-large": { tone: 190, noise: 0.16, filter: 2400, type: "triangle" },
  seeds: { tone: 190, noise: 0.035, filter: 750, type: "triangle" },
  mini: { tone: 220, noise: 0.035, filter: 850, type: "triangle" },
  brioche: { tone: 165, noise: 0.03, filter: 650, type: "triangle" },
  fillet: { tone: 120, noise: 0.15, filter: 2600, type: "triangle" },
  tender: { tone: 150, noise: 0.12, filter: 3000, type: "triangle" },
  lettuce: { tone: 600, noise: 0.12, filter: 5000, type: "sine" },
  tomato: { tone: 380, noise: 0.04, filter: 1200, type: "sine" },
  cheese: { tone: 320, noise: 0, filter: 900, type: "sine" },
  bacon: { tone: 170, noise: 0.13, filter: 3500, type: "triangle" },
  mayo: { tone: 560, noise: 0.025, filter: 900, type: "sine" },
  bbq: { tone: 430, noise: 0.025, filter: 800, type: "sine" },
  cheddar: { tone: 650, noise: 0.025, filter: 1000, type: "sine" },
};

export class SoundEngine {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.context = null;
    this.master = null;
    this.visible = true;
    this.voices = new Set();
    this.musicTimer = null;
    this.musicStep = 0;
    this.nextBeat = 0;
  }
  unlock() {
    if (!this.settings.enabled || !this.visible) return;
    try {
      if (!this.context) {
        const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Audio) return;
        this.context = new Audio();
        this.master = this.context.createGain();
        this.master.connect(this.context.destination);
        this.master.gain.value = (this.settings.volume / 100) * 0.36;
      }
      if (this.context.state === "suspended")
        this.context.resume().catch(() => {});
      this.syncMusic();
    } catch {
      /* The game remains playable on devices without an audio output. */
    }
  }
  configure(settings) {
    this.settings = settings;
    if (this.master)
      this.master.gain.setTargetAtTime(
        settings.enabled ? (settings.volume / 100) * 0.36 : 0,
        this.context.currentTime,
        0.015,
      );
    if (!settings.enabled || !settings.effects) this.stopVoices("effect");
    this.syncMusic();
  }
  setVisible(visible) {
    this.visible = visible;
    if (!visible) {
      this.stopVoices();
      this.stopMusic();
      if (this.context?.state === "running")
        this.context.suspend().catch(() => {});
    } else if (this.context && this.settings.enabled) this.unlock();
  }
  stopVoices(group) {
    for (const voice of this.voices)
      if (!group || voice.group === group) {
        try {
          voice.node.stop();
        } catch {}
      }
  }
  voice(node, gain, start, duration, volume, group = "effect") {
    const context = this.context,
      envelope = context.createGain();
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(volume, start + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.001, start + duration);
    node.connect(gain || envelope);
    if (gain) gain.connect(envelope);
    envelope.connect(this.master);
    const voice = { node, group };
    this.voices.add(voice);
    node.onended = () => {
      this.voices.delete(voice);
      node.disconnect();
      gain?.disconnect();
      envelope.disconnect();
    };
    node.start(start);
    node.stop(start + duration + 0.015);
  }
  note(
    frequency,
    start,
    duration = 0.15,
    volume = 0.25,
    type = "sine",
    group = "effect",
    endFrequency,
  ) {
    const osc = this.context.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    if (endFrequency)
      osc.frequency.exponentialRampToValueAtTime(
        endFrequency,
        start + duration,
      );
    this.voice(osc, null, start, duration, volume, group);
  }
  noise(start, duration, frequency) {
    const buffer = this.context.createBuffer(
      1,
      Math.ceil(this.context.sampleRate * duration),
      this.context.sampleRate,
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = frequency;
    filter.Q.value = 0.7;
    this.voice(source, filter, start, duration, 0.35);
  }
  ingredient(id, remove = false) {
    if (!this.canPlay()) return;
    const now = this.context.currentTime;
    if (remove) {
      this.note(420, now, 0.12, 0.2, "sine", "effect", 180);
      return;
    }
    const p = profiles[id];
    if (!p) return;
    this.note(p.tone, now, 0.13, 0.28, p.type, "effect", p.tone * 0.45);
    if (p.noise) this.noise(now, p.noise, p.filter);
    if (["mayo", "bbq", "cheddar"].includes(id))
      this.note(
        p.tone * 0.8,
        now + 0.075,
        0.13,
        0.2,
        "sine",
        "effect",
        p.tone * 0.3,
      );
  }
  canPlay() {
    if (
      !this.settings.enabled ||
      !this.settings.effects ||
      !this.visible ||
      !this.settings.volume
    )
      return false;
    this.unlock();
    return !!this.context;
  }
  play(event) {
    if (!this.canPlay()) return;
    const now = this.context.currentTime;
    const melodies = {
      click: [700],
      start: [440, 660, 880],
      serve: [600, 900],
      success: [523, 659, 784, 1047],
      error: [300, 220],
      timeout: [440, 330, 220],
      tick: [1000],
      preview: [523, 659, 784],
    };
    const notes = melodies[event] || melodies.click;
    notes.forEach((frequency, i) =>
      this.note(
        frequency,
        now + i * 0.1,
        event === "tick" ? 0.055 : 0.18,
        event === "tick" ? 0.14 : 0.25,
        "sine",
      ),
    );
  }
  syncMusic() {
    const shouldPlay =
      this.context &&
      this.visible &&
      this.settings.enabled &&
      this.settings.music &&
      this.settings.volume > 0;
    if (!shouldPlay) {
      this.stopMusic();
      return;
    }
    if (this.musicTimer) return;
    this.musicStep = 0;
    this.nextBeat = this.context.currentTime + 0.03;
    const schedule = () => {
      // Soft, original 72 BPM arpeggio in C major; no remote audio asset.
      const tune = [
        262, 0, 330, 392, 0, 330, 294, 0, 220, 0, 262, 330, 0, 294, 247, 0,
      ];
      while (this.nextBeat < this.context.currentTime + 0.18) {
        const frequency = tune[this.musicStep % tune.length];
        if (frequency)
          this.note(frequency, this.nextBeat, 0.65, 0.085, "sine", "music");
        if (this.musicStep % 4 === 0)
          this.note(
            this.musicStep % 16 < 8 ? 131 : 110,
            this.nextBeat,
            1.5,
            0.06,
            "sine",
            "music",
          );
        this.musicStep++;
        this.nextBeat += 60 / 72 / 2;
      }
    };
    schedule();
    this.musicTimer = setInterval(schedule, 100);
  }
  stopMusic() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
    this.stopVoices("music");
  }
  dispose() {
    this.stopMusic();
    this.stopVoices();
    this.context?.close().catch(() => {});
    this.context = null;
  }
}
export const sound = new SoundEngine();

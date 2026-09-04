// src/services/soundService.ts
import { settingsService } from './settingsService';

export type TimerSoundType = 'sizzle' | 'ovenBell' | 'beep' | 'melody';

export interface SoundOption {
  id: TimerSoundType;
  name: string;
  description: string;
  icon: string;
}

export const TIMER_SOUND_OPTIONS: SoundOption[] = [
  {
    id: 'sizzle',
    name: '지글지글 프라이팬',
    description: '팬에서 맛있게 볶아지는 리얼 요리 사운드',
    icon: '🍳',
  },
  {
    id: 'ovenBell',
    name: '오븐 땡! 벨',
    description: '맑고 경쾌하게 울리는 주방 타이머 벨',
    icon: '🔔',
  },
  {
    id: 'beep',
    name: '전자레인지 삐-삐-',
    description: '놓칠 일 없는 확실하고 친숙한 주방 알람',
    icon: '⏲️',
  },
  {
    id: 'melody',
    name: '요리 완성 멜로디',
    description: '기분 좋은 요리 완성 축하 아르페지오',
    icon: '🎵',
  },
];

class SoundService {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private getMasterGain(): number {
    const settings = settingsService.getSettings().sound;
    if (!settings.masterEnabled) return 0;
    return Math.max(0, Math.min(1, settings.volume / 100));
  }

  // 1. 지글지글 프라이팬 볶는 소리 (노이즈 필터링 합성)
  playSizzle(duration = 2.0) {
    const ctx = this.getContext();
    const masterGain = this.getMasterGain();
    if (!ctx || masterGain === 0) return;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.9));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // 대역 필터로 팬의 기름 튀는 사운드 모사
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 3.0;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(masterGain * 0.8, ctx.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noise.start();
  }

  // 2. 오븐 땡! 벨소리 (배음 합성 벨)
  playOvenBell() {
    const ctx = this.getContext();
    const masterGain = this.getMasterGain();
    if (!ctx || masterGain === 0) return;

    const fundamental = 880; // A5
    const freqs = [fundamental, fundamental * 1.6, fundamental * 2.4];
    const duration = 2.2;

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const amp = (masterGain * 0.45) / (idx + 1);
      gain.gain.setValueAtTime(amp, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    });
  }

  // 3. 전자레인지 삐-삐- 알람
  playBeep() {
    const ctx = this.getContext();
    const masterGain = this.getMasterGain();
    if (!ctx || masterGain === 0) return;

    const beeps = [0, 0.25, 0.5];
    beeps.forEach((startTime) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(1400, ctx.currentTime + startTime);

      gain.gain.setValueAtTime(masterGain * 0.25, ctx.currentTime + startTime);
      gain.gain.setValueAtTime(masterGain * 0.25, ctx.currentTime + startTime + 0.12);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + startTime + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + 0.15);
    });
  }

  // 4. 완성 멜로디 (도-미-솔-도)
  playMelody() {
    const ctx = this.getContext();
    const masterGain = this.getMasterGain();
    if (!ctx || masterGain === 0) return;

    const notes = [
      { freq: 523.25, time: 0.0, dur: 0.18 }, // C5
      { freq: 659.25, time: 0.18, dur: 0.18 }, // E5
      { freq: 783.99, time: 0.36, dur: 0.22 }, // G5
      { freq: 1046.5, time: 0.58, dur: 0.6 },  // C6
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      gain.gain.setValueAtTime(masterGain * 0.4, ctx.currentTime + time);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + dur);
    });
  }

  // 사운드 종류별 재생
  playSound(type: TimerSoundType) {
    switch (type) {
      case 'sizzle':
        this.playSizzle();
        break;
      case 'ovenBell':
        this.playOvenBell();
        break;
      case 'beep':
        this.playBeep();
        break;
      case 'melody':
        this.playMelody();
        break;
      default:
        this.playOvenBell();
    }
  }

  // 버튼 클릭 시 톡 사운드
  playButtonClick() {
    const settings = settingsService.getSettings().sound;
    if (!settings.masterEnabled || !settings.buttonClickSound) return;
    const ctx = this.getContext();
    const masterGain = this.getMasterGain();
    if (!ctx || masterGain === 0) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(masterGain * 0.15, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  // 타이머 째깍 소리
  playTick() {
    const settings = settingsService.getSettings().sound;
    if (!settings.masterEnabled || !settings.timerTickingSound) return;
    const ctx = this.getContext();
    const masterGain = this.getMasterGain();
    if (!ctx || masterGain === 0) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);

    gain.gain.setValueAtTime(masterGain * 0.05, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.02);
  }
}

export const soundService = new SoundService();

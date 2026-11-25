import * as Speech from 'expo-speech';

type SpeechState = {
  isSpeaking: boolean;
  isPaused: boolean;
  rate: number;
  title: string;
  currentChunk: number;
  totalChunks: number;
};

type Listener = (state: SpeechState) => void;

class SpeechService {
  private chunks: string[] = [];
  private chunkIndex = 0;
  private currentTitle = '';
  private currentRate = 1.0;
  private active = false;
  private paused = false;
  private listeners: Set<Listener> = new Set();

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((fn) => fn(state));
  }

  public getState(): SpeechState {
    return {
      isSpeaking: this.active && !this.paused,
      isPaused: this.paused,
      rate: this.currentRate,
      title: this.currentTitle,
      currentChunk: this.chunkIndex,
      totalChunks: this.chunks.length,
    };
  }

  public start(title: string, fullText: string, rate = 1.0): void {
    this.stop();

    this.currentTitle = title;
    this.currentRate = rate;

    // Split text into manageable paragraphs or sentences (~200 chars each)
    const paragraphs = fullText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const splitChunks: string[] = [];
    for (const para of paragraphs) {
      if (para.length <= 250) {
        splitChunks.push(para);
      } else {
        const sentences = para.match(/[^.!?]+[.!?]+(\s+|$)/g) || [para];
        for (const s of sentences) {
          const trimmed = s.trim();
          if (trimmed.length > 0) splitChunks.push(trimmed);
        }
      }
    }

    if (splitChunks.length === 0) return;

    this.chunks = splitChunks;
    this.chunkIndex = 0;
    this.active = true;
    this.paused = false;

    this.speakCurrent();
  }

  private speakCurrent(): void {
    if (!this.active || this.paused || this.chunkIndex >= this.chunks.length) {
      if (this.chunkIndex >= this.chunks.length) {
        this.stop();
      }
      return;
    }

    const textToSpeak = this.chunks[this.chunkIndex];
    this.notify();

    Speech.speak(textToSpeak, {
      rate: this.currentRate,
      pitch: 1.0,
      onDone: () => {
        if (!this.active || this.paused) return;
        this.chunkIndex += 1;
        this.speakCurrent();
      },
      onError: () => {
        if (!this.active) return;
        this.chunkIndex += 1;
        this.speakCurrent();
      },
      onStopped: () => {
        // Handle stop event
      },
    });
  }

  public pause(): void {
    if (!this.active || this.paused) return;
    Speech.stop();
    this.paused = true;
    this.notify();
  }

  public resume(): void {
    if (!this.active || !this.paused) return;
    this.paused = false;
    this.speakCurrent();
  }

  public stop(): void {
    Speech.stop();
    this.active = false;
    this.paused = false;
    this.chunkIndex = 0;
    this.chunks = [];
    this.notify();
  }

  public setRate(newRate: number): void {
    this.currentRate = newRate;
    if (this.active && !this.paused) {
      Speech.stop();
      this.speakCurrent();
    } else {
      this.notify();
    }
  }

  public next(): void {
    if (!this.active) return;
    Speech.stop();
    if (this.chunkIndex < this.chunks.length - 1) {
      this.chunkIndex += 1;
      this.speakCurrent();
    } else {
      this.stop();
    }
  }

  public previous(): void {
    if (!this.active) return;
    Speech.stop();
    if (this.chunkIndex > 0) {
      this.chunkIndex -= 1;
      this.speakCurrent();
    } else {
      // At the first chunk there is nothing earlier to return to; stopping
      // matches `next()` at the last chunk, instead of re-speaking from the
      // start of a chunk the reader is already into.
      this.stop();
    }
  }
}

export const speechService = new SpeechService();

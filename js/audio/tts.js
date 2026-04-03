/**
 * Text-to-Speech manager using Web Speech API.
 * Handles Korean pronunciation playback with speed control and fallbacks.
 */
export class TTS {
  constructor() {
    this.synth = window.speechSynthesis;
    this.koreanVoice = null;
    this.rate = 0.8; // slower default for learning
    this.supported = 'speechSynthesis' in window;
    this.ready = false;
    this._voiceLoadAttempts = 0;
  }

  async init() {
    if (!this.supported) {
      console.warn('TTS: Web Speech API not supported in this browser');
      return false;
    }

    return new Promise((resolve) => {
      const tryLoadVoices = () => {
        const voices = this.synth.getVoices();
        this.koreanVoice = this._findKoreanVoice(voices);
        if (this.koreanVoice) {
          this.ready = true;
          console.log('TTS: Korean voice loaded:', this.koreanVoice.name);
          resolve(true);
        } else if (this._voiceLoadAttempts < 10) {
          this._voiceLoadAttempts++;
          setTimeout(tryLoadVoices, 200);
        } else {
          // No Korean voice found - TTS will still work with default voice
          console.warn('TTS: No Korean voice found, using default voice');
          this.ready = true;
          resolve(true);
        }
      };

      // Voices may load asynchronously
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = tryLoadVoices;
      }
      tryLoadVoices();
    });
  }

  _findKoreanVoice(voices) {
    // Priority order: native Korean > Google Korean > any Korean
    const priorities = [
      (v) => v.lang === 'ko-KR' && !v.name.includes('Google'),
      (v) => v.lang === 'ko-KR' && v.name.includes('Google'),
      (v) => v.lang.startsWith('ko'),
    ];

    for (const predicate of priorities) {
      const voice = voices.find(predicate);
      if (voice) return voice;
    }
    return null;
  }

  /**
   * Speak Korean text aloud.
   * @param {string} text - Korean text to speak
   * @param {object} options - { rate, onStart, onEnd, onError }
   * @returns {Promise<void>}
   */
  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.supported) {
        reject(new Error('TTS not supported'));
        return;
      }

      // Cancel any ongoing speech
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = options.rate || this.rate;
      utterance.pitch = 1;
      utterance.volume = 1;

      if (this.koreanVoice) {
        utterance.voice = this.koreanVoice;
      }

      utterance.onstart = () => {
        if (options.onStart) options.onStart();
      };

      utterance.onend = () => {
        if (options.onEnd) options.onEnd();
        resolve();
      };

      utterance.onerror = (event) => {
        // 'interrupted' and 'canceled' are not real errors
        if (event.error === 'interrupted' || event.error === 'canceled') {
          resolve();
          return;
        }
        console.error('TTS error:', event.error);
        if (options.onError) options.onError(event.error);
        reject(new Error(event.error));
      };

      this.synth.speak(utterance);

      // Chrome bug workaround: speech can pause after ~15s
      // Resume periodically to prevent freezing
      this._keepAlive();
    });
  }

  _keepAlive() {
    if (this._keepAliveTimer) clearInterval(this._keepAliveTimer);
    this._keepAliveTimer = setInterval(() => {
      if (this.synth.speaking) {
        this.synth.pause();
        this.synth.resume();
      } else {
        clearInterval(this._keepAliveTimer);
      }
    }, 10000);
  }

  stop() {
    if (this.supported) {
      this.synth.cancel();
    }
    if (this._keepAliveTimer) {
      clearInterval(this._keepAliveTimer);
    }
  }

  setRate(rate) {
    this.rate = Math.max(0.3, Math.min(2, rate));
  }

  get isSpeaking() {
    return this.supported && this.synth.speaking;
  }

  get isSupported() {
    return this.supported;
  }
}

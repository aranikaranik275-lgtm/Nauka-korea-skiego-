import { TTS } from './tts.js';
import { SpeechRecognitionManager } from './speech-recognition.js';

/**
 * Unified audio manager combining TTS and speech recognition.
 * Coordinates playback and recording to avoid conflicts.
 */
export class AudioManager {
  constructor() {
    this.tts = new TTS();
    this.speech = new SpeechRecognitionManager();
    this._initialized = false;
  }

  async init() {
    await this.tts.init();
    this.speech.init();
    this._initialized = true;
    return {
      ttsSupported: this.tts.isSupported,
      speechSupported: this.speech.isSupported,
    };
  }

  /**
   * Speak Korean text. Stops any ongoing recognition first.
   */
  async speak(text, options = {}) {
    // Stop recognition to avoid feedback
    if (this.speech.isListening) {
      this.speech.stop();
    }
    return this.tts.speak(text, options);
  }

  /**
   * Start listening for Korean speech. Stops any ongoing TTS first.
   */
  listen(callbacks = {}) {
    // Stop TTS to avoid picking up playback
    this.tts.stop();
    return this.speech.start(callbacks);
  }

  stopListening() {
    this.speech.stop();
  }

  stopSpeaking() {
    this.tts.stop();
  }

  setRate(rate) {
    this.tts.setRate(rate);
  }

  get isSpeaking() {
    return this.tts.isSpeaking;
  }

  get isListening() {
    return this.speech.isListening;
  }

  get ttsSupported() {
    return this.tts.isSupported;
  }

  get speechSupported() {
    return this.speech.isSupported;
  }

  /**
   * Compare pronunciation result with expected text.
   */
  comparePronunciation(expected, actual) {
    return SpeechRecognitionManager.comparePronunciation(expected, actual);
  }
}

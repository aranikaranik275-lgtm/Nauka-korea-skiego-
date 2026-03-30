import { TTS } from './tts.js';
import { SpeechRecognitionManager } from './speech-recognition.js';

export class AudioManager {
  constructor() {
    this.tts = new TTS();
    this.speech = new SpeechRecognitionManager();
  }

  async init() {
    await this.tts.init();
    this.speech.init();
  }

  speak(text) { this.tts.speak(text); }
  listen(callback) { this.speech.start(callback); }
}


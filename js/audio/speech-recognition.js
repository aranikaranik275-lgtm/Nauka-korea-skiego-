/**
 * Speech Recognition manager using Web Speech API.
 * Handles microphone input for Korean pronunciation practice.
 */
export class SpeechRecognitionManager {
  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.supported = !!SpeechRecognition;
    this.recognition = this.supported ? new SpeechRecognition() : null;
    this.isListening = false;
    this._callback = null;
    this._errorCallback = null;
    this._statusCallback = null;

    if (this.recognition) {
      this.recognition.lang = 'ko-KR';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 3;
      this._setupHandlers();
    }
  }

  init() {
    if (!this.supported) {
      console.warn('SpeechRecognition: Not supported in this browser');
    }
    return this.supported;
  }

  _setupHandlers() {
    this.recognition.onresult = (event) => {
      const results = [];
      for (let i = 0; i < event.results[0].length; i++) {
        results.push({
          transcript: event.results[0][i].transcript.trim(),
          confidence: event.results[0][i].confidence,
        });
      }

      if (this._callback) {
        this._callback(results);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;

      let userMessage = '';
      switch (event.error) {
        case 'not-allowed':
          userMessage = 'Brak dostępu do mikrofonu. Zezwól na użycie mikrofonu w ustawieniach przeglądarki.';
          break;
        case 'no-speech':
          userMessage = 'Nie wykryto mowy. Spróbuj ponownie.';
          break;
        case 'audio-capture':
          userMessage = 'Nie znaleziono mikrofonu. Podłącz mikrofon i spróbuj ponownie.';
          break;
        case 'network':
          userMessage = 'Błąd sieci. Sprawdź połączenie internetowe.';
          break;
        case 'aborted':
          // User aborted — not a real error
          return;
        default:
          userMessage = `Błąd rozpoznawania mowy: ${event.error}`;
      }

      if (this._errorCallback) {
        this._errorCallback(userMessage);
      }
    };

    this.recognition.onstart = () => {
      this.isListening = true;
      if (this._statusCallback) {
        this._statusCallback('listening');
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this._statusCallback) {
        this._statusCallback('stopped');
      }
    };
  }

  /**
   * Start listening for Korean speech.
   * @param {object} callbacks - { onResult, onError, onStatus }
   */
  start(callbacks = {}) {
    if (!this.supported) {
      if (callbacks.onError) {
        callbacks.onError('Rozpoznawanie mowy nie jest obsługiwane w tej przeglądarce. Użyj Chrome lub Edge.');
      }
      return false;
    }

    if (this.isListening) {
      this.stop();
    }

    this._callback = callbacks.onResult || null;
    this._errorCallback = callbacks.onError || null;
    this._statusCallback = callbacks.onStatus || null;

    try {
      this.recognition.start();
      return true;
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      if (callbacks.onError) {
        callbacks.onError('Nie udało się uruchomić rozpoznawania mowy.');
      }
      return false;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore — may already be stopped
      }
    }
    this.isListening = false;
  }

  /**
   * Compare user's speech to expected Korean text.
   * Returns a similarity score 0-100.
   */
  static comparePronunciation(expected, actual) {
    if (!expected || !actual) return 0;

    const clean = (s) => s.replace(/\s+/g, '').toLowerCase();
    const e = clean(expected);
    const a = clean(actual);

    if (e === a) return 100;

    // Character-level comparison for Korean
    let matches = 0;
    const maxLen = Math.max(e.length, a.length);

    for (let i = 0; i < Math.min(e.length, a.length); i++) {
      if (e[i] === a[i]) matches++;
    }

    // Also check for contained substrings
    if (a.includes(e) || e.includes(a)) {
      return Math.max(80, Math.round((matches / maxLen) * 100));
    }

    return Math.round((matches / maxLen) * 100);
  }

  get isSupported() {
    return this.supported;
  }
}

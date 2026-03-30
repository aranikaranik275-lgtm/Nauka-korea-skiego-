
export class SpeechRecognitionManager {
  constructor() {
    this.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.supported = !!this.SpeechRecognition;
    this.recognition = null;
  }

  init() {
    if (!this.supported) return;
    this.recognition = new this.SpeechRecognition();
    this.recognition.lang = 'ko-KR';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
  }

  start(callback) {
    if (!this.supported) {
      alert('Rozpoznawanie mowy nie jest obsługiwane w tej przeglądarce.');
      return;
    }
    if (!this.recognition) this.init();
    this.recognition.onresult = event => {
      const transcript = event.results[0][0].transcript;
      callback(transcript);
    };
    this.recognition.onerror = event => {
      [span_5](start_span)if (event.error === 'not-allowed') alert('Brak zgody na mikrofon.');[span_5](end_span)
    };
    this.recognition.onend = () => {
      this.recognition = new this.SpeechRecognition();
    };
    this.recognition.start();
  }
}

export class TTS {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voice = null;
    this.supported = 'speechSynthesis' in window;
  }

  async init() {
    if (!this.supported) return;
    const loadVoices = () =>
      new Promise(resolve => {
        let voices = this.synth.getVoices();
        if (voices.length) {
          resolve(voices);
        } else {
          this.synth.onvoiceschanged = () => {
            resolve(this.synth.getVoices());
          };
        }
      });

    const voices = await loadVoices();
    // Szukamy głosu koreańskiego, jeśli nie ma, bierzemy pierwszy dostępny
    this.voice = voices.find(v => v.lang.startsWith('ko')) || voices[0] || null;
  }

  speak(text) {
    if (!this.supported || !text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) utterance.voice = this.voice;
    this.synth.cancel();
    this.synth.speak(utterance);
  }
}


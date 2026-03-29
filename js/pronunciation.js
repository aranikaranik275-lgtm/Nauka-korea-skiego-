'use strict';

const PronunciationModule = (() => {
  let currentTab = 'chars';
  let practiceItems = [];
  let practiceIdx = 0;
  let autoPlayInterval = null;
  let isAutoPlaying = false;
  let ttsAvailable = false;
  let koreanVoice = null;
  let currentUtterance = null;
  let listenedCount = 0;
  let activeRecognition = null;

  function init() {
    checkTTS();
    buildGrids();
    buildVocabList();
    buildPracticeList();
    loadProgress();
  }

  function loadProgress() {
    const stored = localStorage.getItem('pronunciation-progress');
    if (stored) {
      const data = JSON.parse(stored);
      listenedCount = data.listenedCount || 0;
    }
  }

  function saveProgress() {
    localStorage.setItem('pronunciation-progress', JSON.stringify({
      listenedCount
    }));
    App.updateProgressBars();
  }

  function getScore() {
    const total = HANGUL_DATA.consonants.length + HANGUL_DATA.doubleConsonants.length + HANGUL_DATA.vowels.length + VOCABULARY.length;
    return Math.min(100, Math.round((listenedCount / Math.max(1, total)) * 100));
  }

  function checkTTS() {
    if (!window.speechSynthesis) {
      showTTSWarning();
      return;
    }

    // Wait for voices to load
    const tryGetVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      koreanVoice = voices.find(v =>
        v.lang === 'ko-KR' ||
        v.lang === 'ko' ||
        v.lang.startsWith('ko')
      ) || null;

      if (koreanVoice) {
        ttsAvailable = true;
      } else if (voices.length > 0) {
        // No Korean voice but TTS exists
        showTTSWarning();
        // Still mark as available with fallback
        ttsAvailable = true;
      }
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      tryGetVoice();
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', tryGetVoice, { once: true });
      // Timeout fallback
      setTimeout(tryGetVoice, 1000);
    }
  }

  function showTTSWarning() {
    document.getElementById('tts-unavailable').classList.add('show');
  }

  function buildGrids() {
    buildGrid('pron-consonants-grid', HANGUL_DATA.consonants);
    buildGrid('pron-doubles-grid', HANGUL_DATA.doubleConsonants);
    buildGrid('pron-vowels-grid', HANGUL_DATA.vowels);
  }

  function buildGrid(containerId, items) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'pron-item';
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', `${item.char} - ${item.romanization || item.name}`);
      el.innerHTML = `
        <span class="pron-char korean-text">${item.char}</span>
        <span class="pron-roman">${item.romanization || item.name}</span>
      `;
      el.addEventListener('click', () => speakItem(el, item.char));
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') speakItem(el, item.char);
      });
      container.appendChild(el);
    });
  }

  function buildVocabList() {
    const container = document.getElementById('pron-vocab-grid');
    container.innerHTML = '';
    VOCABULARY.forEach(word => {
      const el = document.createElement('div');
      el.className = 'pron-vocab-item';
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', `${word.korean} - ${word.polish}`);
      el.innerHTML = `
        <div class="pron-vocab-left">
          <span class="pron-korean korean-text">${word.korean}</span>
          <span class="pron-roman-small">${word.romanization}</span>
        </div>
        <div class="pron-vocab-right">${word.polish}</div>
      `;
      el.addEventListener('click', () => speakItem(el, word.korean));
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') speakItem(el, word.korean);
      });
      container.appendChild(el);
    });
  }

  function buildPracticeList() {
    // Combine all chars and vocabulary for practice
    const charItems = [
      ...HANGUL_DATA.consonants.map(c => ({
        text: c.char,
        info: c.romanization + ' - ' + c.description
      })),
      ...HANGUL_DATA.doubleConsonants.map(c => ({
        text: c.char,
        info: c.romanization + ' - ' + c.description
      })),
      ...HANGUL_DATA.vowels.map(v => ({
        text: v.char,
        info: v.romanization + ' - ' + v.description
      })),
      ...VOCABULARY.map(w => ({
        text: w.korean,
        info: w.romanization + ' - ' + w.polish
      }))
    ];
    practiceItems = charItems;
    practiceIdx = 0;
    updatePracticeDisplay();
  }

  function updatePracticeDisplay() {
    if (practiceItems.length === 0) return;
    const item = practiceItems[practiceIdx];
    const charEl = document.getElementById('pron-practice-char');
    const infoEl = document.getElementById('pron-practice-info');
    charEl.textContent = item.text;
    infoEl.textContent = item.info;
    charEl.classList.remove('speaking');
    // Reset recognition result
    const resultEl = document.getElementById('pron-recognition-result');
    if (resultEl) { resultEl.className = 'pron-recognition-result'; resultEl.textContent = ''; }
    const btn = document.getElementById('pron-record-btn');
    if (btn) { btn.textContent = '🎤 Nagraj wymowę'; btn.disabled = false; }
  }

  function startRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const resultEl = document.getElementById('pron-recognition-result');
    const btn = document.getElementById('pron-record-btn');

    if (!SpeechRecognition) {
      resultEl.className = 'pron-recognition-result error';
      resultEl.textContent = '⚠ Rozpoznawanie mowy niedostępne. Użyj Chrome lub Edge na Androidzie.';
      return;
    }
    if (practiceItems.length === 0) return;

    // Stop ongoing recognition
    if (activeRecognition) { activeRecognition.abort(); activeRecognition = null; }

    const item = practiceItems[practiceIdx];
    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    activeRecognition = recognition;

    btn.textContent = '🔴 Nagrywam...';
    btn.disabled = true;
    resultEl.className = 'pron-recognition-result listening';
    resultEl.textContent = '🎙 Słucham… mów teraz';

    recognition.onresult = (event) => {
      const alternatives = Array.from(event.results[0]).map(r => r.transcript.trim());
      const expected = item.text.trim();
      const matched = alternatives.some(r => r === expected || r.replace(/\s/g, '') === expected.replace(/\s/g, ''));
      btn.textContent = '🎤 Nagraj wymowę';
      btn.disabled = false;
      activeRecognition = null;
      if (matched) {
        resultEl.className = 'pron-recognition-result correct';
        resultEl.textContent = '✓ Świetnie! Rozpoznano: ' + alternatives[0];
      } else {
        resultEl.className = 'pron-recognition-result incorrect';
        resultEl.textContent = '✗ Rozpoznano: „' + alternatives[0] + '"  (oczekiwano: ' + expected + ')';
      }
    };

    recognition.onerror = (event) => {
      btn.textContent = '🎤 Nagraj wymowę';
      btn.disabled = false;
      activeRecognition = null;
      const msgs = {
        'not-allowed': 'Brak dostępu do mikrofonu — zezwól w przeglądarce',
        'no-speech': 'Nie wykryto mowy — spróbuj mówić głośniej',
        'network': 'Brak internetu — rozpoznawanie wymaga połączenia',
        'aborted': ''
      };
      const msg = msgs[event.error] || ('Błąd: ' + event.error);
      if (msg) { resultEl.className = 'pron-recognition-result error'; resultEl.textContent = '⚠ ' + msg; }
    };

    recognition.onend = () => {
      if (activeRecognition === recognition) activeRecognition = null;
      btn.textContent = '🎤 Nagraj wymowę';
      btn.disabled = false;
      if (resultEl.className.includes('listening')) {
        resultEl.className = 'pron-recognition-result error';
        resultEl.textContent = '⚠ Nie wykryto mowy. Spróbuj ponownie.';
      }
    };

    recognition.start();
  }

  function speakItem(el, text) {
    // Remove speaking from all items
    document.querySelectorAll('.pron-item.speaking, .pron-vocab-item.speaking').forEach(e => {
      e.classList.remove('speaking');
    });
    el.classList.add('speaking');
    speakText(text, () => {
      el.classList.remove('speaking');
    });
  }

  function speakText(text, onEnd) {
    if (!window.speechSynthesis) {
      App.showToast('Synteza mowy niedostępna na tym urządzeniu', 'error');
      return;
    }

    // Cancel ongoing
    window.speechSynthesis.cancel();
    if (currentUtterance) {
      currentUtterance = null;
    }

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ko-KR';
    utter.rate = 0.8;
    utter.pitch = 1.0;
    utter.volume = 1.0;

    if (koreanVoice) {
      utter.voice = koreanVoice;
    }

    utter.onend = () => {
      currentUtterance = null;
      if (onEnd) onEnd();
    };

    utter.onerror = (e) => {
      currentUtterance = null;
      if (e.error !== 'interrupted') {
        console.warn('[TTS] Error:', e.error);
      }
    };

    currentUtterance = utter;
    window.speechSynthesis.speak(utter);

    // Track listened items
    listenedCount = Math.min(
      HANGUL_DATA.consonants.length + HANGUL_DATA.doubleConsonants.length + HANGUL_DATA.vowels.length + VOCABULARY.length,
      listenedCount + 1
    );
    saveProgress();
  }

  function speakCurrent() {
    if (practiceItems.length === 0) return;
    const item = practiceItems[practiceIdx];
    const charEl = document.getElementById('pron-practice-char');
    charEl.classList.add('speaking');
    speakText(item.text, () => {
      charEl.classList.remove('speaking');
      if (isAutoPlaying) {
        setTimeout(() => {
          nextChar();
          speakCurrent();
        }, 1000);
      }
    });
  }

  function prevChar() {
    if (practiceItems.length === 0) return;
    practiceIdx = (practiceIdx - 1 + practiceItems.length) % practiceItems.length;
    updatePracticeDisplay();
  }

  function nextChar() {
    if (practiceItems.length === 0) return;
    practiceIdx = (practiceIdx + 1) % practiceItems.length;
    updatePracticeDisplay();
  }

  function toggleAutoPlay() {
    isAutoPlaying = !isAutoPlaying;
    const btn = document.getElementById('pron-autoplay-btn');
    if (isAutoPlaying) {
      btn.textContent = '⏹ Zatrzymaj';
      btn.className = 'btn btn-secondary btn-sm';
      speakCurrent();
    } else {
      btn.textContent = '▶ Auto-odtwarzanie';
      btn.className = 'btn btn-accent btn-sm';
      window.speechSynthesis.cancel();
      document.getElementById('pron-practice-char').classList.remove('speaking');
    }
  }

  function showTab(tab) {
    currentTab = tab;
    document.getElementById('pron-tab-chars').classList.toggle('active', tab === 'chars');
    document.getElementById('pron-tab-vocab').classList.toggle('active', tab === 'vocab');
    document.getElementById('pron-tab-practice').classList.toggle('active', tab === 'practice');

    document.getElementById('pron-chars-content').classList.toggle('hidden', tab !== 'chars');
    document.getElementById('pron-vocab-content').classList.toggle('hidden', tab !== 'vocab');
    document.getElementById('pron-practice-content').classList.toggle('hidden', tab !== 'practice');

    // Stop auto play when leaving practice tab
    if (tab !== 'practice' && isAutoPlaying) {
      toggleAutoPlay();
    }
  }

  return {
    init,
    showTab,
    speakText,
    speakCurrent,
    prevChar,
    nextChar,
    toggleAutoPlay,
    startRecognition,
    getScore
  };
})();

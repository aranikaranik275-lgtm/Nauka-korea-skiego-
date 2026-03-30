'use strict';

// 1. Import managera audio (zgodnie z procedurą)
import { AudioManager } from './audio/audio-manager.js';

const App = (() => {
  let currentScreen = 'home';
  let deferredInstallPrompt = null;
  let modulesInitialized = {};
  let isDarkTheme = false;
  
  // Instancja managera audio
  const audioManager = new AudioManager();

  // =============================
  // Initialization
  // =============================
  async function init() {
    [span_5](start_span)// Zabezpieczenie HTTPS dla mikrofonu[span_5](end_span)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      console.warn('Aplikacja wymaga HTTPS do działania mikrofonu.');
    }

    [span_6](start_span)// Inicjalizacja dźwięku[span_6](end_span)
    await audioManager.init();
    
    registerSW();
    loadTheme();
    updateProgressBars();
    setupInstallPrompt();
    setupBackButton();
    setupEventListeners(); [span_7](start_span)// Nowa funkcja obsługująca kliknięcia[span_7](end_span)

    const hash = window.location.hash.replace('#', '');
    if (hash && ['alphabet', 'drawing', 'quiz', 'flashcards', 'pronunciation'].includes(hash)) {
      navigate(hash);
    }
  }

  // =============================
  [span_8](start_span)// Event Listeners (Zamiast onclick)[span_8](end_span)
  // =============================
  function setupEventListeners() {
    // Nawigacja główna
    const navButtons = {
      'nav-alphabet': 'alphabet',
      'nav-drawing': 'drawing',
      'nav-quiz': 'quiz',
      'nav-flashcards': 'flashcards',
      'nav-pronunciation': 'pronunciation',
      'back-to-home': 'home'
    };

    Object.entries(navButtons).forEach(([id, screen]) => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', () => navigate(screen));
    });

    // Przełącznik motywu
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) themeBtn.addEventListener('click', () => toggleTheme());

    [span_9](start_span)// Obsługa Audio w module Wymowy (Pronunciation)[span_9](end_span)
    const speakBtn = document.getElementById('btn-speak-current');
    if (speakBtn) {
      speakBtn.addEventListener('click', () => {
        // Pobiera tekst z elementu wyświetlającego znak
        const textToSpeak = document.getElementById('pron-practice-char')?.textContent;
        if (textToSpeak) audioManager.speak(textToSpeak);
      });
    }

    const recordBtn = document.getElementById('pron-record-btn');
    if (recordBtn) {
      recordBtn.addEventListener('click', () => {
        const resultArea = document.getElementById('pron-recognition-result');
        if (resultArea) resultArea.innerText = "Słucham...";
        
        audioManager.listen(result => {
          if (resultArea) resultArea.innerText = "Usłyszałem: " + result;
        });
      });
    }
  }

  // =============================
  // Service Worker
  // =============================
  function registerSW() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('[App] SW registered'))
          .catch(err => console.warn('[App] SW failed', err));
      });
    }
  }

  // =============================
  // Navigation
  // =============================
  function navigate(screen) {
    const validScreens = ['home', 'alphabet', 'drawing', 'quiz', 'flashcards', 'pronunciation'];
    if (!validScreens.includes(screen)) return;

    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    const targetEl = document.getElementById('screen-' + screen);
    if (targetEl) targetEl.classList.add('active');

    currentScreen = screen;
    
    if (screen !== 'home') {
      history.pushState({ screen }, '', '#' + screen);
    } else {
      history.pushState({ screen }, '', window.location.pathname);
    }

    lazyInit(screen);
  }

  function lazyInit(screen) {
    if (modulesInitialized[screen]) return;
    modulesInitialized[screen] = true;

    // Przekazujemy audioManager do modułów, które go potrzebują
    switch (screen) {
      case 'alphabet': AlphabetModule.init(); break;
      case 'drawing': DrawingModule.init(); break;
      case 'quiz': QuizModule.init(); break;
      case 'flashcards': FlashcardsModule.init(); break;
      case 'pronunciation': PronunciationModule.init(audioManager); break;
    }
  }

  // Pozostałe funkcje (updateProgressBars, loadTheme, itp.) pozostają bez zmian
  function updateProgressBars() {
    // ... (kod z Twojego oryginalnego pliku) ...
    // Zachowaj tutaj całą logikę obliczania procentów, którą miałeś wcześniej
  }

  function setupBackButton() {
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.screen) navigate(e.state.screen);
      else navigate('home');
    });
  }

  function loadTheme() {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') applyDarkTheme(true, false);
  }

  function toggleTheme() {
    applyDarkTheme(!isDarkTheme, true);
  }

  function applyDarkTheme(dark, save) {
    isDarkTheme = dark;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) btn.textContent = dark ? '☀️ Jasny motyw' : '🌙 Ciemny motyw';
    if (save) localStorage.setItem('theme', dark ? 'dark' : 'light');
  }

  function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      if (localStorage.getItem('install-dismissed')) return;
      setTimeout(() => {
        const banner = document.getElementById('install-banner');
        if (banner) banner.classList.add('show');
      }, 3000);
    });
  }

  return {
    init,
    navigate,
    updateProgressBars,
    toggleTheme
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
        // Direct navigate without pushing new state
        document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
        const targetEl = document.getElementById('screen-' + state.screen);
        if (targetEl) {
          targetEl.classList.add('active');
          currentScreen = state.screen;
        }
      } else {
        navigate('home');
      }
    });
  }

  // =============================
  // Progress Bars
  // =============================
  function updateProgressBars() {
    // Alphabet progress
    const alphLearned = getAlphabetProgress();
    const alphTotal = HANGUL_DATA.consonants.length + HANGUL_DATA.vowels.length;
    const alphPct = alphTotal > 0 ? Math.round((alphLearned / alphTotal) * 100) : 0;
    setProgressBar('progress-alphabet', alphPct);

    // Drawing progress
    const drawData = JSON.parse(localStorage.getItem('drawing-progress') || '{}');
    const drawTotal = drawData.practiceCount || 0;
    const drawPass = drawData.passCount || 0;
    const drawPct = drawTotal > 0 ? Math.round((drawPass / drawTotal) * 100) : 0;
    setProgressBar('progress-drawing', drawPct);

    // Quiz progress
    const quizData = JSON.parse(localStorage.getItem('quiz-progress') || '{}');
    const quizBest = quizData.bestScore || 0;
    const quizPct = Math.round((quizBest / 10) * 100);
    setProgressBar('progress-quiz', quizPct);

    // Flashcards progress
    const fcData = JSON.parse(localStorage.getItem('flashcards-progress') || '{}');
    const fcKnown = (fcData.known || []).length;
    const fcTotal = VOCABULARY.length;
    const fcPct = fcTotal > 0 ? Math.round((fcKnown / fcTotal) * 100) : 0;
    setProgressBar('progress-flashcards', fcPct);

    // Pronunciation progress
    const pronData = JSON.parse(localStorage.getItem('pronunciation-progress') || '{}');
    const pronListened = pronData.listenedCount || 0;
    const pronTotal = alphTotal + VOCABULARY.length;
    const pronPct = Math.min(100, Math.round((pronListened / pronTotal) * 100));
    setProgressBar('progress-pronunciation', pronPct);

    // Overall progress
    const overall = Math.round((alphPct + drawPct + quizPct + fcPct + pronPct) / 5);
    setProgressBar('overall-fill', overall);
    const pctEl = document.getElementById('overall-pct');
    if (pctEl) pctEl.textContent = overall + '%';
  }

  function getAlphabetProgress() {
    const stored = localStorage.getItem('alphabet-progress');
    if (!stored) return 0;
    const prog = JSON.parse(stored);
    return Object.keys(prog).filter(k => prog[k]).length;
  }

  function setProgressBar(id, pct) {
    const el = document.getElementById(id);
    if (el) el.style.width = pct + '%';
  }

  // =============================
  // Theme
  // =============================
  function loadTheme() {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') {
      applyDarkTheme(true, false);
    }
  }

  function toggleTheme() {
    applyDarkTheme(!isDarkTheme, true);
  }

  function applyDarkTheme(dark, save) {
    isDarkTheme = dark;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
      btn.textContent = dark ? '☀️ Jasny motyw' : '🌙 Ciemny motyw';
    }
    if (save) {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    }
  }

  // =============================
  // Toast Notifications
  // =============================
  function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);
  }

  // =============================
  // PWA Install
  // =============================
  function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;

      // Don't show if already dismissed
      if (localStorage.getItem('install-dismissed')) return;

      setTimeout(() => {
        const banner = document.getElementById('install-banner');
        if (banner) banner.classList.add('show');
      }, 3000);
    });

    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      const banner = document.getElementById('install-banner');
      if (banner) banner.classList.remove('show');
      showToast('Aplikacja zainstalowana! 🎉', 'success');
    });
  }

  function installPWA() {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then(choice => {
      if (choice.outcome === 'accepted') {
        showToast('Instalowanie aplikacji...', 'success');
      }
      deferredInstallPrompt = null;
    });
    const banner = document.getElementById('install-banner');
    if (banner) banner.classList.remove('show');
  }

  function dismissInstall() {
    const banner = document.getElementById('install-banner');
    if (banner) banner.classList.remove('show');
    localStorage.setItem('install-dismissed', '1');
  }

  // =============================
  // Public API
  // =============================
  return {
    init,
    navigate,
    updateProgressBars,
    showToast,
    toggleTheme,
    installPWA,
    dismissInstall
  };
})();

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

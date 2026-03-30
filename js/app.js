'use strict';
import { AudioManager } from './audio/audio-manager.js';

const App = (() => {
  const audioManager = new AudioManager();

  async function init() {
    [span_4](start_span)[span_5](start_span)// Zabezpieczenie HTTPS wg procedury[span_4](end_span)[span_5](end_span)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      console.warn('Wymagane HTTPS dla mikrofonu.');
    }

    await audioManager.init();
    setupListeners();
    registerSW();
  }

  function setupListeners() {
    const navMap = {
      'nav-alphabet': 'alphabet',
      'nav-drawing': 'drawing',
      'nav-quiz': 'quiz',
      'nav-flashcards': 'flashcards',
      'nav-pronunciation': 'pronunciation',
      'back-to-home': 'home'
    };

    Object.entries(navMap).forEach(([id, screen]) => {
      document.getElementById(id)?.addEventListener('click', () => navigate(screen));
    });

    document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);
    
    document.getElementById('btn-speak-current')?.addEventListener('click', () => {
      const text = document.getElementById('pron-practice-char').innerText;
      audioManager.speak(text);
    });

    document.getElementById('pron-record-btn')?.addEventListener('click', () => {
      const res = document.getElementById('pron-recognition-result');
      res.innerText = "Słucham...";
      audioManager.listen(text => res.innerText = "Wynik: " + text);
    });
  }

  function navigate(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + screen)?.classList.add('active');
  }

  function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  }

  function registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js');
    }
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
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

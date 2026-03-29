'use strict';

const App = (() => {
  let currentScreen = 'home';
  let deferredInstallPrompt = null;
  let modulesInitialized = {};
  let isDarkTheme = false;

  // =============================
  // Initialization
  // =============================
  function init() {
    registerSW();
    loadTheme();
    updateProgressBars();
    setupInstallPrompt();
    setupBackButton();

    // Handle hash navigation
    const hash = window.location.hash.replace('#', '');
    if (hash && ['alphabet', 'drawing', 'quiz', 'flashcards', 'pronunciation'].includes(hash)) {
      navigate(hash);
    }
  }

  // =============================
  // Service Worker
  // =============================
  function registerSW() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => {
            console.log('[App] SW registered:', reg.scope);
          })
          .catch(err => {
            console.warn('[App] SW registration failed:', err);
          });
      });
    }
  }

  // =============================
  // Navigation / Screen routing
  // =============================
  function navigate(screen) {
    // Validate
    const validScreens = ['home', 'alphabet', 'drawing', 'quiz', 'flashcards', 'pronunciation'];
    if (!validScreens.includes(screen)) return;

    // Hide all screens
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));

    // Show target screen
    const targetEl = document.getElementById('screen-' + screen);
    if (!targetEl) return;
    targetEl.classList.add('active');

    currentScreen = screen;

    // Update URL hash (no page reload)
    if (screen !== 'home') {
      history.pushState({ screen }, '', '#' + screen);
    } else {
      history.pushState({ screen }, '', window.location.pathname);
    }

    // Lazy-initialize modules on first visit
    lazyInit(screen);
  }

  function lazyInit(screen) {
    if (modulesInitialized[screen]) return;
    modulesInitialized[screen] = true;

    switch (screen) {
      case 'alphabet':
        AlphabetModule.init();
        break;
      case 'drawing':
        DrawingModule.init();
        break;
      case 'quiz':
        QuizModule.init();
        break;
      case 'flashcards':
        FlashcardsModule.init();
        break;
      case 'pronunciation':
        PronunciationModule.init();
        break;
    }
  }

  // =============================
  // Back button support
  // =============================
  function setupBackButton() {
    window.addEventListener('popstate', (e) => {
      const state = e.state;
      if (state && state.screen) {
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

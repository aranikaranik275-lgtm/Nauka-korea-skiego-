import { AudioManager } from './audio/audio-manager.js';
import { LESSONS, HANGUL_VOWELS, HANGUL_CONSONANTS, getLessonById } from './data/lessons.js';
import { SpeechRecognitionManager } from './audio/speech-recognition.js';

class KoreanApp {
  constructor() {
    this.audio = new AudioManager();
    this.currentScreen = 'home';
    this.currentLesson = null;
    this.currentItemIndex = 0;
    this.quizAnswers = [];
    this.ttsRate = 0.8;
    this.progress = this._loadProgress();
  }

  async init() {
    const support = await this.audio.init();
    this._cacheDOM();
    this._bindEvents();
    this._renderHome();
    this._checkBrowserSupport(support);
    this._updateStats();
  }

  // ===== DOM CACHE =====
  _cacheDOM() {
    this.dom = {
      screens: document.querySelectorAll('.screen'),
      navItems: document.querySelectorAll('.nav-item'),
      headerTitle: document.getElementById('header-title'),
      headerBack: document.getElementById('header-back'),
      headerProgress: document.getElementById('header-progress'),
      progressFill: document.getElementById('progress-fill-mini'),
      progressText: document.getElementById('progress-text'),
      // Home
      lessonList: document.getElementById('lesson-list'),
      statLessons: document.getElementById('stat-lessons'),
      statWords: document.getElementById('stat-words'),
      statStreak: document.getElementById('stat-streak'),
      // Lesson
      lessonTitle: document.getElementById('lesson-title'),
      lessonSubtitle: document.getElementById('lesson-subtitle'),
      lessonProgress: document.getElementById('lesson-progress-fill'),
      lessonContent: document.getElementById('lesson-content'),
      btnPrev: document.getElementById('btn-prev'),
      btnNext: document.getElementById('btn-next'),
      // Alphabet
      vowelGrid: document.getElementById('vowel-grid'),
      consonantGrid: document.getElementById('consonant-grid'),
      // Audio
      btnSpeak: document.getElementById('btn-speak'),
      btnMic: document.getElementById('btn-mic'),
      audioStatus: document.getElementById('audio-status'),
      speedBtns: document.querySelectorAll('.speed-btn'),
      // Toast
      toast: document.getElementById('toast'),
      // Warning
      browserWarning: document.getElementById('browser-warning'),
    };
  }

  // ===== EVENT BINDING =====
  _bindEvents() {
    // Navigation
    this.dom.navItems.forEach((item) => {
      item.addEventListener('click', () => {
        const screen = item.dataset.screen;
        this._navigateTo(screen);
      });
    });

    // Back button
    this.dom.headerBack.addEventListener('click', () => {
      this._navigateBack();
    });

    // Speed buttons
    this.dom.speedBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.ttsRate = parseFloat(btn.dataset.rate);
        this.audio.setRate(this.ttsRate);
        this.dom.speedBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // TTS button
    this.dom.btnSpeak.addEventListener('click', () => this._handleSpeak());

    // Mic button
    this.dom.btnMic.addEventListener('click', () => this._handleMic());

    // Reset progress
    const btnReset = document.getElementById('btn-reset-progress');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('Czy na pewno chcesz zresetować cały postęp nauki?')) {
          this.progress = {};
          this._saveProgress();
          localStorage.removeItem('korean_streak');
          localStorage.removeItem('korean_last_visit');
          this._updateStats();
          this._renderHome();
          this._showToast('Postęp został zresetowany');
        }
      });
    }
  }

  // ===== NAVIGATION =====
  _navigateTo(screenId, options = {}) {
    this.dom.screens.forEach((s) => s.classList.remove('active'));
    const target = document.getElementById(`screen-${screenId}`);
    if (target) {
      target.classList.add('active');
    }

    // Update nav
    this.dom.navItems.forEach((n) => {
      n.classList.toggle('active', n.dataset.screen === screenId);
    });

    // Header
    const titles = {
      home: '한국어 학습',
      alphabet: 'Alfabet Hangul',
      lesson: options.title || 'Lekcja',
      quiz: 'Quiz',
      settings: 'Ustawienia',
    };
    this.dom.headerTitle.textContent = titles[screenId] || '한국어 학습';

    // Back button visibility
    const showBack = ['lesson', 'quiz'].includes(screenId);
    this.dom.headerBack.classList.toggle('visible', showBack);
    this.dom.headerProgress.classList.toggle('visible', screenId === 'lesson');

    this.currentScreen = screenId;

    // Stop any audio when navigating
    this.audio.stopSpeaking();
    this.audio.stopListening();
    this._setAudioStatus('');
  }

  _navigateBack() {
    if (this.currentScreen === 'lesson' || this.currentScreen === 'quiz') {
      this._navigateTo('home');
      this._renderHome();
    }
  }

  // ===== HOME SCREEN =====
  _renderHome() {
    this.dom.lessonList.innerHTML = '';

    LESSONS.forEach((lesson) => {
      const progress = this._getLessonProgress(lesson.id);
      const percent = Math.round((progress / lesson.items.length) * 100);

      const card = document.createElement('button');
      card.className = 'lesson-card';
      card.innerHTML = `
        <div class="lesson-icon" style="background: ${lesson.color}15; color: ${lesson.color}">
          ${lesson.icon}
        </div>
        <div class="lesson-info">
          <h3>${lesson.title}</h3>
          <p>${lesson.subtitle}</p>
          <div class="lesson-progress">
            <div class="lesson-progress-fill" style="width: ${percent}%"></div>
          </div>
        </div>
        <span class="lesson-arrow">›</span>
      `;
      card.addEventListener('click', () => this._startLesson(lesson.id));
      this.dom.lessonList.appendChild(card);
    });
  }

  // ===== LESSON =====
  _startLesson(lessonId) {
    this.currentLesson = getLessonById(lessonId);
    if (!this.currentLesson) return;

    this.currentItemIndex = 0;
    this._navigateTo('lesson', { title: this.currentLesson.title });
    this._renderLessonItem();
  }

  _renderLessonItem() {
    const lesson = this.currentLesson;
    if (!lesson) return;

    const item = lesson.items[this.currentItemIndex];
    const total = lesson.items.length;
    const current = this.currentItemIndex + 1;
    const percent = Math.round((current / total) * 100);

    // Update header progress
    this.dom.progressFill.style.width = `${percent}%`;
    this.dom.progressText.textContent = `${current}/${total}`;

    // Update lesson header
    this.dom.lessonTitle.textContent = lesson.title;
    this.dom.lessonSubtitle.textContent = `Karta ${current} z ${total}`;
    this.dom.lessonProgress.style.width = `${percent}%`;

    // Render flashcard
    this.dom.lessonContent.innerHTML = `
      <div class="flashcard-container">
        <div class="flashcard" id="flashcard">
          <div class="flashcard-front">
            <span class="flashcard-korean">${item.korean}</span>
            <span class="flashcard-romanization">${item.roman}</span>
            <span class="flashcard-hint">Kliknij, aby zobaczyć tłumaczenie</span>
          </div>
          <div class="flashcard-back">
            <span class="flashcard-korean">${item.korean}</span>
            <span class="flashcard-romanization">${item.roman}</span>
            <span class="flashcard-translation">${item.polish}</span>
          </div>
        </div>
      </div>
    `;

    // Flashcard flip
    const flashcard = document.getElementById('flashcard');
    flashcard.addEventListener('click', () => {
      flashcard.classList.toggle('flipped');
    });

    // Navigation buttons
    this.dom.btnPrev.disabled = this.currentItemIndex === 0;
    this.dom.btnNext.textContent = this.currentItemIndex === total - 1 ? 'Quiz ➜' : 'Następna ➜';

    this.dom.btnPrev.onclick = () => {
      if (this.currentItemIndex > 0) {
        this.currentItemIndex--;
        this._renderLessonItem();
      }
    };

    this.dom.btnNext.onclick = () => {
      // Mark as learned
      this._markItemLearned(lesson.id, this.currentItemIndex);

      if (this.currentItemIndex < total - 1) {
        this.currentItemIndex++;
        this._renderLessonItem();
      } else {
        this._startQuiz(lesson);
      }
    };

    // Reset audio status
    this._setAudioStatus('');
  }

  // ===== AUDIO HANDLING =====
  _handleSpeak() {
    const item = this._getCurrentItem();
    if (!item) return;

    if (this.audio.isSpeaking) {
      this.audio.stopSpeaking();
      return;
    }

    this.dom.btnSpeak.disabled = true;
    this._setAudioStatus('Odtwarzanie...');

    this.audio.speak(item.audio || item.korean, {
      rate: this.ttsRate,
      onStart: () => {
        this.dom.btnSpeak.disabled = false;
      },
      onEnd: () => {
        this._setAudioStatus('');
        this.dom.btnSpeak.disabled = false;
      },
      onError: (err) => {
        this._setAudioStatus('Błąd odtwarzania: ' + err, 'error');
        this.dom.btnSpeak.disabled = false;
      },
    }).catch(() => {
      this.dom.btnSpeak.disabled = false;
      this._setAudioStatus('Nie udało się odtworzyć dźwięku', 'error');
    });
  }

  _handleMic() {
    const item = this._getCurrentItem();
    if (!item) return;

    if (this.audio.isListening) {
      this.audio.stopListening();
      this.dom.btnMic.classList.remove('listening');
      this._setAudioStatus('');
      return;
    }

    this.dom.btnMic.classList.add('listening');
    this._setAudioStatus('Słucham... Powiedz: ' + item.korean);

    this.audio.listen({
      onResult: (results) => {
        this.dom.btnMic.classList.remove('listening');
        const best = results[0];
        const score = SpeechRecognitionManager.comparePronunciation(
          item.korean,
          best.transcript
        );

        if (score >= 80) {
          this._setAudioStatus(
            `Świetnie! "${best.transcript}" — ${score}% zgodności`,
            'success'
          );
          this._showToast('Doskonała wymowa!');
        } else if (score >= 50) {
          this._setAudioStatus(
            `Nieźle! "${best.transcript}" — ${score}%. Spróbuj jeszcze raz.`,
            ''
          );
        } else {
          this._setAudioStatus(
            `Rozpoznano: "${best.transcript}" — ${score}%. Posłuchaj wzorca i spróbuj ponownie.`,
            'error'
          );
        }
      },
      onError: (msg) => {
        this.dom.btnMic.classList.remove('listening');
        this._setAudioStatus(msg, 'error');
      },
      onStatus: (status) => {
        if (status === 'stopped') {
          this.dom.btnMic.classList.remove('listening');
        }
      },
    });
  }

  _setAudioStatus(text, type = '') {
    this.dom.audioStatus.textContent = text;
    this.dom.audioStatus.className = 'audio-status' + (type ? ' ' + type : '');
  }

  _getCurrentItem() {
    if (this.currentScreen === 'lesson' && this.currentLesson) {
      return this.currentLesson.items[this.currentItemIndex];
    }
    return null;
  }

  // ===== QUIZ =====
  _startQuiz(lesson) {
    this.quizAnswers = [];
    this.quizItems = this._shuffleArray([...lesson.items]).slice(0, Math.min(5, lesson.items.length));
    this.quizIndex = 0;
    this._navigateTo('quiz', { title: `Quiz: ${lesson.title}` });
    this._renderQuizQuestion();
  }

  _renderQuizQuestion() {
    const content = document.getElementById('quiz-content');
    if (this.quizIndex >= this.quizItems.length) {
      this._renderQuizResults(content);
      return;
    }

    const item = this.quizItems[this.quizIndex];
    const allItems = this.currentLesson.items;

    // Generate 4 options including the correct one
    const wrongOptions = allItems
      .filter((i) => i.korean !== item.korean)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const options = this._shuffleArray([item, ...wrongOptions]);

    content.innerHTML = `
      <div class="quiz-question">
        <div class="korean-large">${item.korean}</div>
        <p>Wybierz poprawne tłumaczenie:</p>
      </div>
      <div class="quiz-options" id="quiz-options">
        ${options
          .map(
            (opt, i) => `
          <button class="quiz-option" data-index="${i}" data-korean="${opt.korean}">
            ${opt.polish}
          </button>
        `
          )
          .join('')}
      </div>
    `;

    // Bind option clicks
    document.querySelectorAll('.quiz-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        const isCorrect = btn.dataset.korean === item.korean;
        this.quizAnswers.push(isCorrect);

        // Highlight correct/wrong
        document.querySelectorAll('.quiz-option').forEach((b) => {
          b.disabled = true;
          if (b.dataset.korean === item.korean) {
            b.classList.add('correct');
          } else if (b === btn && !isCorrect) {
            b.classList.add('wrong');
          }
        });

        // Auto-advance after delay
        setTimeout(() => {
          this.quizIndex++;
          this._renderQuizQuestion();
        }, 1200);
      });
    });
  }

  _renderQuizResults(content) {
    const correct = this.quizAnswers.filter(Boolean).length;
    const total = this.quizAnswers.length;
    const percent = Math.round((correct / total) * 100);

    let message = '';
    if (percent === 100) message = 'Perfekcyjnie! Jesteś mistrzem!';
    else if (percent >= 80) message = 'Świetny wynik! Tak trzymaj!';
    else if (percent >= 60) message = 'Nieźle! Powtórz lekcję dla lepszego wyniku.';
    else message = 'Warto powtórzyć lekcję. Nie poddawaj się!';

    content.innerHTML = `
      <div class="quiz-result">
        <div class="score">${correct}/${total}</div>
        <p>${percent}% poprawnych odpowiedzi</p>
        <p style="margin-top: 8px; font-weight: 600;">${message}</p>
        <div style="margin-top: 24px; display: flex; gap: 12px; justify-content: center;">
          <button class="btn btn-secondary" id="btn-retry">Powtórz lekcję</button>
          <button class="btn btn-primary" id="btn-home">Strona główna</button>
        </div>
      </div>
    `;

    document.getElementById('btn-retry').addEventListener('click', () => {
      this._startLesson(this.currentLesson.id);
    });
    document.getElementById('btn-home').addEventListener('click', () => {
      this._navigateTo('home');
      this._renderHome();
    });

    // Save progress
    this._updateStats();
  }

  // ===== ALPHABET SCREEN =====
  _renderAlphabet() {
    this._renderAlphabetGrid(this.dom.vowelGrid, HANGUL_VOWELS);
    this._renderAlphabetGrid(this.dom.consonantGrid, HANGUL_CONSONANTS);
  }

  _renderAlphabetGrid(container, data) {
    container.innerHTML = data
      .map(
        (item) => `
      <div class="alphabet-item" data-sound="${item.sound}" title="Kliknij aby odsłuchać">
        <span class="char">${item.char}</span>
        <span class="romanization">${item.roman}</span>
      </div>
    `
      )
      .join('');

    container.querySelectorAll('.alphabet-item').forEach((el) => {
      el.addEventListener('click', () => {
        const sound = el.dataset.sound;
        this.audio.speak(sound, { rate: 0.7 });
      });
    });
  }

  // ===== PROGRESS =====
  _loadProgress() {
    try {
      return JSON.parse(localStorage.getItem('korean_progress') || '{}');
    } catch {
      return {};
    }
  }

  _saveProgress() {
    try {
      localStorage.setItem('korean_progress', JSON.stringify(this.progress));
    } catch {
      // localStorage may be unavailable
    }
  }

  _markItemLearned(lessonId, itemIndex) {
    if (!this.progress[lessonId]) {
      this.progress[lessonId] = [];
    }
    if (!this.progress[lessonId].includes(itemIndex)) {
      this.progress[lessonId].push(itemIndex);
    }
    this._saveProgress();
    this._updateStats();
  }

  _getLessonProgress(lessonId) {
    return (this.progress[lessonId] || []).length;
  }

  _updateStats() {
    let totalWords = 0;
    let completedLessons = 0;

    LESSONS.forEach((lesson) => {
      const progress = this._getLessonProgress(lesson.id);
      totalWords += progress;
      if (progress >= lesson.items.length) {
        completedLessons++;
      }
    });

    if (this.dom.statLessons) this.dom.statLessons.textContent = completedLessons;
    if (this.dom.statWords) this.dom.statWords.textContent = totalWords;
    if (this.dom.statStreak) {
      const streak = parseInt(localStorage.getItem('korean_streak') || '0', 10);
      this.dom.statStreak.textContent = streak;
      // Update streak
      this._updateStreak();
    }
  }

  _updateStreak() {
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem('korean_last_visit');
    if (lastVisit !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      let streak = parseInt(localStorage.getItem('korean_streak') || '0', 10);
      if (lastVisit === yesterday) {
        streak++;
      } else if (lastVisit !== today) {
        streak = 1;
      }
      localStorage.setItem('korean_streak', streak.toString());
      localStorage.setItem('korean_last_visit', today);
      if (this.dom.statStreak) this.dom.statStreak.textContent = streak;
    }
  }

  // ===== BROWSER SUPPORT =====
  _checkBrowserSupport(support) {
    const warnings = [];
    if (!support.ttsSupported) {
      warnings.push('Synteza mowy (TTS) nie jest obsługiwana w tej przeglądarce.');
    }
    if (!support.speechSupported) {
      warnings.push('Rozpoznawanie mowy nie jest obsługiwane. Użyj Chrome lub Edge.');
    }

    if (warnings.length > 0) {
      this.dom.browserWarning.innerHTML = `
        <strong>Uwaga:</strong> ${warnings.join(' ')}
        <br>Dla pełnej funkcjonalności zalecamy przeglądarkę Google Chrome.
      `;
      this.dom.browserWarning.classList.add('visible');
    }
  }

  // ===== UTILS =====
  _shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  _showToast(message) {
    this.dom.toast.textContent = message;
    this.dom.toast.classList.add('show');
    setTimeout(() => {
      this.dom.toast.classList.remove('show');
    }, 2500);
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  const app = new KoreanApp();
  app.init().then(() => {
    // Render alphabet after init
    app._renderAlphabet();
    console.log('Korean Learning App initialized');
  }).catch((err) => {
    console.error('Failed to initialize app:', err);
  });
});

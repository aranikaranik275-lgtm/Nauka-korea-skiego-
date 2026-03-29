'use strict';

const QuizModule = (() => {
  const TOTAL_QUESTIONS = 10;
  let questions = [];
  let currentQ = 0;
  let correct = 0;
  let answered = false;
  let totalPlayed = 0;
  let totalCorrect = 0;
  let bestScore = 0;

  const ALL_CHARS = () => [
    ...HANGUL_DATA.consonants,
    ...HANGUL_DATA.doubleConsonants,
    ...HANGUL_DATA.vowels
  ];

  function loadProgress() {
    const stored = localStorage.getItem('quiz-progress');
    if (stored) {
      const data = JSON.parse(stored);
      totalPlayed = data.totalPlayed || 0;
      totalCorrect = data.totalCorrect || 0;
      bestScore = data.bestScore || 0;
    }
  }

  function saveProgress() {
    localStorage.setItem('quiz-progress', JSON.stringify({
      totalPlayed,
      totalCorrect,
      bestScore
    }));
    App.updateProgressBars();
  }

  function getScore() {
    return totalPlayed > 0 ? Math.round((bestScore / TOTAL_QUESTIONS) * 100) : 0;
  }

  function init() {
    loadProgress();
    showStartScreen();
  }

  function showStartScreen() {
    document.getElementById('quiz-start').classList.remove('hide');
    document.getElementById('quiz-start').style.display = '';
    hideGameScreen();
    hideResults();
  }

  function hideGameScreen() {
    const game = document.getElementById('quiz-game');
    game.classList.add('hidden');
    game.style.display = 'none';
  }

  function showGameScreen() {
    const game = document.getElementById('quiz-game');
    game.classList.remove('hidden');
    game.style.display = 'flex';
  }

  function hideResults() {
    document.getElementById('quiz-results').classList.remove('show');
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function getSourceChars() {
    const val = document.getElementById('quiz-source-select').value;
    if (val === 'consonants') return HANGUL_DATA.consonants;
    if (val === 'doubles') return HANGUL_DATA.doubleConsonants;
    if (val === 'vowels') return HANGUL_DATA.vowels;
    if (val === 'all') return ALL_CHARS();
    return [...HANGUL_DATA.consonants, ...HANGUL_DATA.vowels];
  }

  function generateQuestions() {
    const chars = getSourceChars();
    if (chars.length < 4) {
      App.showToast('Za mało znaków do quizu!', 'error');
      return [];
    }

    const shuffled = shuffle(chars).slice(0, TOTAL_QUESTIONS);
    return shuffled.map(correct => {
      // Randomly pick question type
      const type = Math.random() < 0.5 ? 'char2roman' : 'roman2char';

      // Pick 3 distractors from remaining chars
      const others = chars.filter(c => c.char !== correct.char);
      const distractors = shuffle(others).slice(0, 3);
      const allOptions = shuffle([correct, ...distractors]);
      const correctIndex = allOptions.findIndex(o => o.char === correct.char);

      return { type, correct, options: allOptions, correctIndex };
    });
  }

  function start() {
    questions = generateQuestions();
    if (questions.length === 0) return;

    currentQ = 0;
    correct = 0;
    answered = false;

    document.getElementById('quiz-start').style.display = 'none';
    hideResults();
    showGameScreen();
    renderQuestion();
  }

  function renderQuestion() {
    const q = questions[currentQ];
    answered = false;

    // Progress
    document.getElementById('quiz-q-counter').textContent =
      `Pytanie ${currentQ + 1} / ${TOTAL_QUESTIONS}`;
    document.getElementById('quiz-score-badge').textContent =
      `${correct} / ${currentQ}`;
    const pct = (currentQ / TOTAL_QUESTIONS) * 100;
    document.getElementById('quiz-progress-fill').style.width = pct + '%';

    // Question display
    const charDisplay = document.getElementById('quiz-char-display');
    const typeLabel = document.getElementById('quiz-type-label');

    if (q.type === 'char2roman') {
      typeLabel.textContent = 'Jak wymawia się tę literę?';
      charDisplay.className = 'quiz-char-display';
      charDisplay.textContent = q.correct.char;
    } else {
      typeLabel.textContent = 'Który znak odpowiada tej wymowie?';
      charDisplay.className = 'quiz-char-display romanization';
      charDisplay.textContent = q.correct.romanization;
    }

    // Options
    const optBtns = document.querySelectorAll('.quiz-option');
    q.options.forEach((opt, i) => {
      optBtns[i].textContent = q.type === 'char2roman' ? opt.romanization : opt.char;
      optBtns[i].className = 'quiz-option';
      optBtns[i].disabled = false;
      optBtns[i].style.fontFamily = q.type === 'roman2char' ? '"Noto Sans KR", serif' : 'inherit';
    });

    // Clear feedback
    const feedback = document.getElementById('quiz-feedback');
    feedback.textContent = '';
    feedback.className = 'quiz-feedback';
  }

  function answer(idx) {
    if (answered) return;
    answered = true;

    const q = questions[currentQ];
    const optBtns = document.querySelectorAll('.quiz-option');
    const feedback = document.getElementById('quiz-feedback');

    // Disable all
    optBtns.forEach(b => b.disabled = true);

    if (idx === q.correctIndex) {
      optBtns[idx].classList.add('correct');
      feedback.textContent = '✓ Poprawnie!';
      feedback.className = 'quiz-feedback correct';
      correct++;
    } else {
      optBtns[idx].classList.add('wrong');
      optBtns[q.correctIndex].classList.add('correct');
      feedback.textContent = `✗ Błędnie. Poprawna odpowiedź: ${
        q.type === 'char2roman' ? q.correct.romanization : q.correct.char
      }`;
      feedback.className = 'quiz-feedback wrong';
    }

    // Auto-advance after 1.2s
    setTimeout(() => {
      currentQ++;
      if (currentQ >= TOTAL_QUESTIONS) {
        showResults();
      } else {
        renderQuestion();
      }
    }, 1200);
  }

  function showResults() {
    hideGameScreen();
    hideResults();

    totalPlayed++;
    totalCorrect += correct;
    if (correct > bestScore) bestScore = correct;
    saveProgress();

    const resultsEl = document.getElementById('quiz-results');
    resultsEl.classList.add('show');

    document.getElementById('results-score-big').textContent =
      `${correct} / ${TOTAL_QUESTIONS}`;

    const pct = Math.round((correct / TOTAL_QUESTIONS) * 100);
    let emoji = '😔';
    let label = 'Wynik';
    let msg = '';

    if (pct === 100) {
      emoji = '🏆';
      label = 'Perfekcja!';
      msg = 'Rewelacyjny wynik! Jesteś mistrzem Hangul!';
    } else if (pct >= 80) {
      emoji = '🎉';
      label = 'Świetnie!';
      msg = 'Bardzo dobry wynik! Jeszcze trochę ćwiczeń i będzie idealnie.';
    } else if (pct >= 60) {
      emoji = '😊';
      label = 'Nieźle!';
      msg = 'Dobra robota! Wróć do modułu Alfabet, aby utrwalić wiedzę.';
    } else if (pct >= 40) {
      emoji = '😐';
      label = 'W porządku';
      msg = 'Nie poddawaj się! Poćwicz alfabet i spróbuj ponownie.';
    } else {
      emoji = '😔';
      label = 'Próbuj dalej';
      msg = 'Zacznij od nauki alfabetu w module Alfabet i wróć tu później.';
    }

    document.getElementById('results-emoji').textContent = emoji;
    document.getElementById('results-label').textContent = `${label} (${pct}%)`;
    document.getElementById('results-msg').textContent = msg;
  }

  function restart() {
    start();
  }

  return {
    init,
    start,
    answer,
    restart,
    getScore
  };
})();

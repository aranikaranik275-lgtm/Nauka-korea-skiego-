'use strict';

const FlashcardsModule = (() => {
  let allCards = [];
  let deck = [];
  let currentIdx = 0;
  let knownSet = new Set();
  let unknownSet = new Set();
  let currentCategory = 'Wszystkie';
  let isFlipped = false;

  // Touch/swipe state
  let touchStartX = 0;
  let touchStartY = 0;
  let isDragging = false;

  function init() {
    allCards = VOCABULARY;
    loadProgress();
    buildFilterChips();
    buildDeck();
    renderCard();
    setupSwipe();
  }

  function loadProgress() {
    const stored = localStorage.getItem('flashcards-progress');
    if (stored) {
      const data = JSON.parse(stored);
      knownSet = new Set(data.known || []);
    }
  }

  function saveProgress() {
    localStorage.setItem('flashcards-progress', JSON.stringify({
      known: [...knownSet]
    }));
    App.updateProgressBars();
  }

  function getScore() {
    return allCards.length > 0
      ? Math.round((knownSet.size / allCards.length) * 100)
      : 0;
  }

  function buildFilterChips() {
    const scroll = document.getElementById('flashcards-filter-scroll');
    scroll.innerHTML = '';
    CATEGORIES.forEach(cat => {
      const chip = document.createElement('button');
      chip.className = 'filter-chip' + (cat === currentCategory ? ' active' : '');
      chip.textContent = cat;
      chip.addEventListener('click', () => {
        currentCategory = cat;
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        buildDeck();
        renderCard();
      });
      scroll.appendChild(chip);
    });
  }

  function buildDeck(useUnknownOnly = false) {
    let cards = currentCategory === 'Wszystkie'
      ? allCards
      : allCards.filter(c => c.category === currentCategory);

    if (useUnknownOnly) {
      cards = cards.filter(c => !knownSet.has(c.korean));
    }

    // Shuffle
    deck = shuffle(cards);
    currentIdx = 0;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function renderCard() {
    const deckEl = document.getElementById('flashcard-deck');
    const card = document.getElementById('flashcard');
    const emptyEl = document.getElementById('flashcards-empty');
    const doneEl = document.getElementById('flashcards-done');
    const actionsEl = document.getElementById('fc-actions');

    // Reset flip
    isFlipped = false;
    card.classList.remove('flipped');

    if (deck.length === 0) {
      deckEl.style.display = 'none';
      emptyEl.classList.add('show');
      doneEl.classList.remove('show');
      actionsEl.style.display = 'none';
      updateProgressRow();
      return;
    }

    if (currentIdx >= deck.length) {
      // Done
      deckEl.style.display = 'none';
      emptyEl.classList.remove('show');
      actionsEl.style.display = 'none';

      const knownInDeck = deck.filter(c => knownSet.has(c.korean)).length;
      document.getElementById('fc-done-stats').textContent =
        `Znane: ${knownInDeck} / ${deck.length}`;
      doneEl.classList.add('show');
      updateProgressRow();
      return;
    }

    // Show card
    deckEl.style.display = '';
    deckEl.style.transform = '';
    deckEl.style.opacity = '';
    emptyEl.classList.remove('show');
    doneEl.classList.remove('show');
    actionsEl.style.display = '';

    const word = deck[currentIdx];
    document.getElementById('fc-category').textContent = word.category;
    document.getElementById('fc-korean').textContent = word.korean;
    document.getElementById('fc-romanization').textContent = word.romanization;
    document.getElementById('fc-polish').textContent = word.polish;

    updateProgressRow();
  }

  function updateProgressRow() {
    const filtered = currentCategory === 'Wszystkie'
      ? allCards
      : allCards.filter(c => c.category === currentCategory);
    const knownCount = filtered.filter(c => knownSet.has(c.korean)).length;

    document.getElementById('fc-progress-text').textContent =
      `${knownCount} znanych`;
    const remaining = Math.max(0, deck.length - currentIdx);
    document.getElementById('fc-deck-text').textContent =
      `${remaining} pozostało`;
  }

  function flip() {
    const card = document.getElementById('flashcard');
    isFlipped = !isFlipped;
    card.classList.toggle('flipped', isFlipped);
  }

  function know() {
    if (currentIdx >= deck.length) return;
    const word = deck[currentIdx];
    knownSet.add(word.korean);
    saveProgress();
    animateCard('right', () => {
      currentIdx++;
      renderCard();
    });
  }

  function dontKnow() {
    if (currentIdx >= deck.length) return;
    const word = deck[currentIdx];
    knownSet.delete(word.korean);
    saveProgress();
    animateCard('left', () => {
      currentIdx++;
      renderCard();
    });
  }

  function animateCard(direction, callback) {
    const deckEl = document.getElementById('flashcard-deck');
    deckEl.classList.add(direction === 'right' ? 'swipe-right' : 'swipe-left');
    setTimeout(() => {
      deckEl.classList.remove('swipe-right', 'swipe-left');
      callback();
    }, 300);
  }

  function speak() {
    if (currentIdx >= deck.length) return;
    const word = deck[currentIdx];
    PronunciationModule.speakText(word.korean);
  }

  function restart() {
    buildDeck(false);
    renderCard();
  }

  function restartUnknown() {
    buildDeck(true);
    if (deck.length === 0) {
      App.showToast('Wszystkie fiszki w tej kategorii są znane! 🎉', 'success');
      buildDeck(false);
    }
    renderCard();
  }

  function resetProgress() {
    if (confirm('Czy na pewno chcesz zresetować postęp fiszek?')) {
      knownSet.clear();
      saveProgress();
      buildDeck();
      renderCard();
      App.showToast('Postęp fiszek zresetowany', 'warning');
    }
  }

  function setupSwipe() {
    const deckEl = document.getElementById('flashcard-deck');

    deckEl.addEventListener('pointerdown', (e) => {
      touchStartX = e.clientX;
      touchStartY = e.clientY;
      isDragging = false;
    });

    deckEl.addEventListener('pointermove', (e) => {
      const dx = e.clientX - touchStartX;
      const dy = e.clientY - touchStartY;
      if (Math.abs(dx) > 10) {
        isDragging = true;
        // Visual feedback during drag
        const deckEl2 = document.getElementById('flashcard-deck');
        const rotate = dx * 0.05;
        deckEl2.style.transform = `translateX(${dx * 0.3}px) rotate(${rotate}deg)`;
        deckEl2.style.opacity = String(1 - Math.abs(dx) / 400);
      }
    });

    deckEl.addEventListener('pointerup', (e) => {
      const dx = e.clientX - touchStartX;
      const deckEl2 = document.getElementById('flashcard-deck');
      deckEl2.style.transform = '';
      deckEl2.style.opacity = '';

      if (isDragging) {
        if (dx > 60) {
          know();
        } else if (dx < -60) {
          dontKnow();
        }
        isDragging = false;
      }
    });

    deckEl.addEventListener('pointercancel', () => {
      const deckEl2 = document.getElementById('flashcard-deck');
      deckEl2.style.transform = '';
      deckEl2.style.opacity = '';
      isDragging = false;
    });
  }

  return {
    init,
    flip,
    know,
    dontKnow,
    speak,
    restart,
    restartUnknown,
    resetProgress,
    getScore
  };
})();

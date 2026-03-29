'use strict';

const AlphabetModule = (() => {
  let currentTab = 'consonants';
  let currentChar = null;
  let currentStrokeIndex = 0;
  let animationId = null;
  let canvas = null;
  let ctx = null;
  let progress = {};

  function init() {
    canvas = document.getElementById('stroke-canvas');
    ctx = canvas.getContext('2d');
    loadProgress();
    renderGrid();
  }

  function loadProgress() {
    const stored = localStorage.getItem('alphabet-progress');
    progress = stored ? JSON.parse(stored) : {};
  }

  function saveProgress() {
    localStorage.setItem('alphabet-progress', JSON.stringify(progress));
    App.updateProgressBars();
  }

  function getLearnedCount() {
    return Object.keys(progress).filter(k => progress[k]).length;
  }

  function getTotalCount() {
    return HANGUL_DATA.consonants.length + HANGUL_DATA.doubleConsonants.length + HANGUL_DATA.vowels.length;
  }

  function showTab(tab) {
    currentTab = tab;
    document.getElementById('tab-consonants').classList.toggle('active', tab === 'consonants');
    document.getElementById('tab-doubles').classList.toggle('active', tab === 'doubles');
    document.getElementById('tab-vowels').classList.toggle('active', tab === 'vowels');
    showGrid();
    renderGrid();
  }

  function renderGrid() {
    const grid = document.getElementById('alphabet-grid');
    let items;
    if (currentTab === 'consonants') items = HANGUL_DATA.consonants;
    else if (currentTab === 'doubles') items = HANGUL_DATA.doubleConsonants;
    else items = HANGUL_DATA.vowels;
    grid.innerHTML = '';
    items.forEach((item, idx) => {
      const isLearned = !!progress[item.char];
      const card = document.createElement('div');
      card.className = 'char-card' + (isLearned ? ' learned' : '');
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `${item.char} - ${item.romanization}`);
      card.innerHTML = `
        <span class="char korean-text">${item.char}</span>
        <span class="romanization">${item.romanization}</span>
        <div class="learned-badge"></div>
      `;
      card.addEventListener('click', () => openDetail(item));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') openDetail(item);
      });
      grid.appendChild(card);
    });
  }

  function showGrid() {
    document.getElementById('alphabet-grid-view').classList.remove('hidden');
    document.getElementById('alphabet-detail-view').classList.add('hidden');
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  function openDetail(item) {
    currentChar = item;
    currentStrokeIndex = 0;

    document.getElementById('alphabet-grid-view').classList.add('hidden');
    document.getElementById('alphabet-detail-view').classList.remove('hidden');

    document.getElementById('detail-char').textContent = item.char;
    document.getElementById('detail-name').textContent = item.name;
    document.getElementById('detail-roman').textContent = item.romanization;
    document.getElementById('detail-desc').textContent = item.description;

    const isLearned = !!progress[item.char];
    const btn = document.getElementById('mark-learned-btn');
    btn.textContent = isLearned ? '✓ Nauczone!' : '✓ Oznacz jako nauczone';
    btn.classList.toggle('learned', isLearned);

    drawStroke(0);
    updateStrokeIndicator();
  }

  function drawAllStrokes(upToIndex, highlightLast) {
    if (!currentChar || !ctx) return;
    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);

    // Background
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#f5f5f5';
    ctx.fillRect(0, 0, size, size);

    // Grid lines (subtle)
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(size / 2, 0); ctx.lineTo(size / 2, size);
    ctx.moveTo(0, size / 2); ctx.lineTo(size, size / 2);
    ctx.stroke();

    const strokes = currentChar.strokes;
    for (let i = 0; i <= upToIndex && i < strokes.length; i++) {
      const isActive = (i === upToIndex && highlightLast);
      drawSingleStroke(strokes[i], isActive, size);
    }
  }

  function scalePoint(pt, size) {
    return [pt[0] * size / 100, pt[1] * size / 100];
  }

  function drawSingleStroke(stroke, isActive, size) {
    const pts = stroke.points;
    if (!pts || pts.length < 2) return;

    ctx.beginPath();
    const [sx, sy] = scalePoint(pts[0], size);
    ctx.moveTo(sx, sy);
    for (let j = 1; j < pts.length; j++) {
      const [x, y] = scalePoint(pts[j], size);
      ctx.lineTo(x, y);
    }

    ctx.strokeStyle = isActive ? '#e53935' : '#1a237e';
    ctx.lineWidth = isActive ? 5 : 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Draw start circle for active stroke
    if (isActive) {
      const [fx, fy] = scalePoint(pts[0], size);
      ctx.beginPath();
      ctx.arc(fx, fy, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#e53935';
      ctx.fill();
    }
  }

  function drawStroke(index) {
    if (!currentChar) return;
    const strokes = currentChar.strokes;
    if (index >= strokes.length) index = strokes.length - 1;
    drawAllStrokes(index, true);
    currentStrokeIndex = index;
    updateStrokeIndicator();
  }

  function updateStrokeIndicator() {
    if (!currentChar) return;
    const total = currentChar.strokes.length;
    document.getElementById('stroke-indicator').textContent =
      `Kreska ${currentStrokeIndex + 1} z ${total}`;
    document.getElementById('stroke-prev').disabled = currentStrokeIndex === 0;
    document.getElementById('stroke-next').disabled = currentStrokeIndex >= total - 1;
  }

  function prevStroke() {
    if (!currentChar) return;
    if (currentStrokeIndex > 0) {
      drawStroke(currentStrokeIndex - 1);
    }
  }

  function nextStroke() {
    if (!currentChar) return;
    if (currentStrokeIndex < currentChar.strokes.length - 1) {
      drawStroke(currentStrokeIndex + 1);
    }
  }

  function playAnimation() {
    if (!currentChar) return;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    const strokes = currentChar.strokes;
    const size = canvas.width;
    let strokeIdx = 0;
    let progress = 0; // 0..1 for current stroke
    const STROKE_DURATION = 400; // ms per stroke
    const PAUSE_BETWEEN = 200; // ms
    let lastTime = null;
    let pausing = false;
    let pauseElapsed = 0;

    function animate(timestamp) {
      if (!lastTime) lastTime = timestamp;
      const delta = timestamp - lastTime;
      lastTime = timestamp;

      if (pausing) {
        pauseElapsed += delta;
        if (pauseElapsed >= PAUSE_BETWEEN) {
          pausing = false;
          pauseElapsed = 0;
          strokeIdx++;
          if (strokeIdx >= strokes.length) {
            // Animation complete - show all
            drawAllStrokes(strokes.length - 1, false);
            currentStrokeIndex = strokes.length - 1;
            updateStrokeIndicator();
            animationId = null;
            return;
          }
          progress = 0;
        }
        animationId = requestAnimationFrame(animate);
        return;
      }

      progress += delta / STROKE_DURATION;
      if (progress >= 1) {
        progress = 1;
        pausing = true;
        pauseElapsed = 0;
      }

      // Draw partial stroke
      const stroke = strokes[strokeIdx];
      const pts = stroke.points;
      const ctx2 = ctx;
      const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#f5f5f5';

      ctx2.clearRect(0, 0, size, size);
      ctx2.fillStyle = bgColor;
      ctx2.fillRect(0, 0, size, size);

      // Grid
      ctx2.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx2.lineWidth = 1;
      ctx2.beginPath();
      ctx2.moveTo(size / 2, 0); ctx2.lineTo(size / 2, size);
      ctx2.moveTo(0, size / 2); ctx2.lineTo(size, size / 2);
      ctx2.stroke();

      // Completed strokes
      for (let i = 0; i < strokeIdx; i++) {
        drawSingleStroke(strokes[i], false, size);
      }

      // Partial active stroke
      const totalPts = pts.length;
      const endIdx = Math.max(1, Math.floor(progress * (totalPts - 1)));
      const partPts = pts.slice(0, endIdx + 1);
      const partStroke = { points: partPts };
      drawSingleStroke(partStroke, true, size);

      animationId = requestAnimationFrame(animate);
    }

    // Reset and start
    drawAllStrokes(-1, false);
    strokeIdx = 0;
    progress = 0;
    animationId = requestAnimationFrame(animate);
  }

  function toggleLearned() {
    if (!currentChar) return;
    const wasLearned = !!progress[currentChar.char];
    progress[currentChar.char] = !wasLearned;
    saveProgress();

    const btn = document.getElementById('mark-learned-btn');
    btn.textContent = progress[currentChar.char] ? '✓ Nauczone!' : '✓ Oznacz jako nauczone';
    btn.classList.toggle('learned', !!progress[currentChar.char]);

    // Update grid card
    renderGrid();

    App.showToast(
      progress[currentChar.char]
        ? `${currentChar.char} oznaczone jako nauczone! 🎉`
        : `${currentChar.char} oznaczone jako nienauczone`,
      progress[currentChar.char] ? 'success' : 'warning'
    );
  }

  function resetAll() {
    if (confirm('Czy na pewno chcesz zresetować postęp alfabetu?')) {
      progress = {};
      saveProgress();
      renderGrid();
      showGrid();
      App.showToast('Postęp alfabetu zresetowany', 'warning');
    }
  }

  return {
    init,
    showTab,
    showGrid,
    prevStroke,
    nextStroke,
    playAnimation,
    toggleLearned,
    resetAll,
    getLearnedCount,
    getTotalCount
  };
})();

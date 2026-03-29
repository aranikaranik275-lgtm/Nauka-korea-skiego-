'use strict';

const DrawingModule = (() => {
  let canvas = null;
  let ctx = null;
  let mode = 'trace'; // 'trace' or 'scratch'
  let currentChar = null;
  let isDrawing = false;
  let strokes = []; // Array of arrays of {x, y}
  let currentStroke = [];
  let lastPoint = null;
  let practiceCount = 0;
  let passCount = 0;

  const ALL_CHARS = () => [
    ...HANGUL_DATA.consonants,
    ...HANGUL_DATA.vowels
  ];

  function init() {
    canvas = document.getElementById('drawing-canvas');
    ctx = canvas.getContext('2d');

    // Resize canvas to fit container
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Pointer events for mouse + touch
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    // Build char selector
    buildCharSelector();

    // Select first char
    const chars = ALL_CHARS();
    if (chars.length > 0) {
      selectChar(chars[0]);
    }

    loadProgress();
  }

  function resizeCanvas() {
    const area = document.querySelector('.drawing-canvas-area');
    if (!area) return;
    const maxSize = Math.min(area.clientWidth - 32, 320);
    const size = Math.max(200, maxSize);
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    canvas.width = size * window.devicePixelRatio;
    canvas.height = size * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    redrawCanvas();
  }

  function getCanvasSize() {
    return canvas.width / window.devicePixelRatio;
  }

  function buildCharSelector() {
    const scroll = document.getElementById('drawing-char-scroll');
    scroll.innerHTML = '';
    ALL_CHARS().forEach((item, idx) => {
      const pill = document.createElement('button');
      pill.className = 'char-pill' + (idx === 0 ? ' active' : '');
      pill.textContent = item.char;
      pill.setAttribute('aria-label', `${item.char} - ${item.romanization}`);
      pill.addEventListener('click', () => {
        document.querySelectorAll('.char-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        selectChar(item);
      });
      scroll.appendChild(pill);
    });
  }

  function selectChar(item) {
    currentChar = item;
    strokes = [];
    currentStroke = [];
    hideScore();
    redrawCanvas();
  }

  function loadProgress() {
    const stored = localStorage.getItem('drawing-progress');
    if (stored) {
      const data = JSON.parse(stored);
      practiceCount = data.practiceCount || 0;
      passCount = data.passCount || 0;
    }
  }

  function saveProgress() {
    localStorage.setItem('drawing-progress', JSON.stringify({ practiceCount, passCount }));
    App.updateProgressBars();
  }

  function getScore() {
    return practiceCount > 0 ? Math.round((passCount / practiceCount) * 100) : 0;
  }

  function setMode(newMode) {
    mode = newMode;
    document.getElementById('draw-opt-a').classList.toggle('active', mode === 'trace');
    document.getElementById('draw-opt-b').classList.toggle('active', mode === 'scratch');
    strokes = [];
    currentStroke = [];
    hideScore();
    redrawCanvas();
  }

  function redrawCanvas() {
    if (!canvas || !ctx) return;
    const size = getCanvasSize();
    ctx.clearRect(0, 0, size, size);

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Grid lines
    ctx.strokeStyle = 'rgba(0,0,0,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(size / 2, 0); ctx.lineTo(size / 2, size);
    ctx.moveTo(0, size / 2); ctx.lineTo(size, size / 2);
    ctx.stroke();

    // Diagonal guides (faint)
    ctx.strokeStyle = 'rgba(0,0,0,0.04)';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(size, size);
    ctx.moveTo(size, 0); ctx.lineTo(0, size);
    ctx.stroke();

    // Draw reference in trace mode
    if (mode === 'trace' && currentChar) {
      drawReferenceChar(0.1);
    }

    // Draw user strokes
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 8 / window.devicePixelRatio * window.devicePixelRatio;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    [...strokes, currentStroke].forEach(stroke => {
      if (stroke.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 8;
      ctx.stroke();
    });
  }

  function drawReferenceChar(alpha) {
    if (!currentChar) return;
    const size = getCanvasSize();
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${size * 0.82}px "Noto Sans KR", serif`;
    ctx.fillStyle = '#1a237e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(currentChar.char, size / 2, size / 2);
    ctx.restore();
  }

  function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = getCanvasSize() / rect.width;
    const scaleY = getCanvasSize() / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  function onPointerDown(e) {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    isDrawing = true;
    const pos = getPointerPos(e);
    currentStroke = [pos];
    lastPoint = pos;
    hideScore();
  }

  function onPointerMove(e) {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getPointerPos(e);
    // Smooth: only add point if moved enough
    if (lastPoint) {
      const dx = pos.x - lastPoint.x;
      const dy = pos.y - lastPoint.y;
      if (dx * dx + dy * dy < 4) return;
    }
    currentStroke.push(pos);
    lastPoint = pos;
    redrawCanvas();
  }

  function onPointerUp(e) {
    e.preventDefault();
    if (!isDrawing) return;
    isDrawing = false;
    if (currentStroke.length > 1) {
      strokes.push([...currentStroke]);
    }
    currentStroke = [];
    lastPoint = null;
    redrawCanvas();
  }

  function undo() {
    if (strokes.length > 0) {
      strokes.pop();
      hideScore();
      redrawCanvas();
    }
  }

  function clear() {
    strokes = [];
    currentStroke = [];
    hideScore();
    redrawCanvas();
  }

  function hideScore() {
    const scoreEl = document.getElementById('drawing-score');
    scoreEl.classList.remove('show');
  }

  function check() {
    if (!currentChar) return;
    if (strokes.length === 0) {
      App.showToast('Najpierw narysuj znak!', 'warning');
      return;
    }

    const score = computeScore();
    showScore(score);

    practiceCount++;
    if (score >= 60) passCount++;
    saveProgress();
  }

  function computeScore() {
    const size = getCanvasSize();
    // Create offscreen canvas for reference
    const refCanvas = document.createElement('canvas');
    refCanvas.width = size;
    refCanvas.height = size;
    const refCtx = refCanvas.getContext('2d');

    // Draw reference char large
    refCtx.fillStyle = '#000000';
    refCtx.fillRect(0, 0, size, size);
    refCtx.font = `bold ${size * 0.8}px "Noto Sans KR", serif`;
    refCtx.fillStyle = '#ffffff';
    refCtx.textAlign = 'center';
    refCtx.textBaseline = 'middle';
    refCtx.fillText(currentChar.char, size / 2, size / 2);

    // Create offscreen canvas for user drawing
    const userCanvas = document.createElement('canvas');
    userCanvas.width = size;
    userCanvas.height = size;
    const userCtx = userCanvas.getContext('2d');

    userCtx.fillStyle = '#000000';
    userCtx.fillRect(0, 0, size, size);
    userCtx.strokeStyle = '#ffffff';
    userCtx.lineWidth = 12;
    userCtx.lineCap = 'round';
    userCtx.lineJoin = 'round';

    [...strokes].forEach(stroke => {
      if (stroke.length < 2) return;
      userCtx.beginPath();
      userCtx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        userCtx.lineTo(stroke[i].x, stroke[i].y);
      }
      userCtx.stroke();
    });

    // Compare pixels (sample grid for performance)
    const refData = refCtx.getImageData(0, 0, size, size).data;
    const userData = userCtx.getImageData(0, 0, size, size).data;

    let refWhite = 0;
    let overlap = 0;
    const step = 2; // sample every 2px for performance

    for (let y = 0; y < size; y += step) {
      for (let x = 0; x < size; x += step) {
        const idx = (y * size + x) * 4;
        const refBright = refData[idx] > 128;
        const userBright = userData[idx] > 128;
        if (refBright) {
          refWhite++;
          if (userBright) overlap++;
        }
      }
    }

    if (refWhite === 0) return 0;
    return Math.min(100, Math.round((overlap / refWhite) * 150)); // multiplier to be generous
  }

  function showScore(score) {
    const scoreEl = document.getElementById('drawing-score');
    const pctText = document.getElementById('score-pct-text');
    const msg = document.getElementById('score-msg');
    const detail = document.getElementById('score-detail');
    const circle = document.getElementById('score-circle');

    const pct = Math.min(100, score);
    pctText.textContent = pct + '%';

    const color = pct >= 60 ? '#2e7d32' : '#c62828';
    circle.style.background = `conic-gradient(${color} ${pct * 3.6}deg, #e0e0e0 0deg)`;

    if (pct >= 80) {
      msg.textContent = '🎉 Doskonale!';
      msg.className = 'score-msg good';
      detail.textContent = 'Znakomita robota! Twój rysunek jest bardzo podobny do oryginału.';
      scoreEl.classList.add('celebration');
      setTimeout(() => scoreEl.classList.remove('celebration'), 600);
    } else if (pct >= 60) {
      msg.textContent = '✓ Dobrze!';
      msg.className = 'score-msg good';
      detail.textContent = 'Niezły wynik! Ćwicz dalej, aby poprawić precyzję.';
    } else if (pct >= 40) {
      msg.textContent = '⚠ Prawie!';
      msg.className = 'score-msg bad';
      detail.textContent = 'Dobra próba! Zwróć uwagę na proporcje i kolejność kresek.';
    } else {
      msg.textContent = '✗ Spróbuj ponownie';
      msg.className = 'score-msg bad';
      detail.textContent = 'Nie poddawaj się! Obejrzyj animację kresek w module Alfabet.';
    }

    scoreEl.classList.add('show');
  }

  return {
    init,
    setMode,
    undo,
    clear,
    check,
    getScore
  };
})();

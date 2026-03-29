'use strict';

const audio = document.getElementById('audio');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const repeatBtn = document.getElementById('repeat-btn');
const progress = document.getElementById('progress');
const volumeSlider = document.getElementById('volume');
const volumeVal = document.getElementById('volume-val');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const trackTitle = document.getElementById('track-title');
const trackArtist = document.getElementById('track-artist');
const albumArt = document.getElementById('album-art');
const playlistEl = document.getElementById('playlist');
const emptyMsg = document.getElementById('empty-msg');
const fileInput = document.getElementById('file-input');
const installBtn = document.getElementById('install-btn');
const likeBtn = document.getElementById('like-btn');
const rejectBtn = document.getElementById('reject-btn');
const verdictLabel = document.getElementById('verdict-label');

let tracks = [];
let currentIndex = -1;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let deferredPrompt = null;
let rejectedTracks = new Set(); // track names never to play again
let likedTracks = new Set();

// ── localStorage persistence ──────────────────────────────────
const STORAGE_KEY = 'muzyka_state';

function saveState() {
  const state = {
    volume: volumeSlider.value,
    shuffle: isShuffle,
    repeat: isRepeat,
    currentIndex,
    tracks: tracks.map(t => ({ name: t.name, duration: t.duration })),
    rejected: [...rejectedTracks],
    liked: [...likedTracks]
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);

    if (s.volume != null) {
      volumeSlider.value = s.volume;
      audio.volume = s.volume / 100;
      volumeVal.textContent = s.volume + '%';
    }
    if (s.shuffle) { isShuffle = true; shuffleBtn.classList.add('active'); }
    if (s.repeat)  { isRepeat  = true; repeatBtn.classList.add('active'); }
    if (Array.isArray(s.rejected)) rejectedTracks = new Set(s.rejected);
    if (Array.isArray(s.liked))    likedTracks    = new Set(s.liked);

    if (Array.isArray(s.tracks) && s.tracks.length) {
      tracks = s.tracks.map(t => ({ name: t.name, duration: t.duration || '', url: null }));
      currentIndex = s.currentIndex >= 0 && s.currentIndex < tracks.length ? s.currentIndex : 0;
      showRestoredState();
      renderPlaylist();
    }
  } catch (_) {}
}

function showRestoredState() {
  const t = tracks[currentIndex];
  if (!t) return;
  trackTitle.textContent = t.name;
  trackArtist.textContent = 'Dodaj pliki, aby wznowić';
  durationEl.textContent = t.duration || '0:00';
}

// ── Format time ──────────────────────────────────────────────
function fmt(s) {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

// ── Playlist rendering ────────────────────────────────────────
function renderPlaylist() {
  playlistEl.innerHTML = '';
  emptyMsg.style.display = tracks.length ? 'none' : 'block';
  tracks.forEach((t, i) => {
    const li = document.createElement('li');
    li.className = 'playlist-item' + (i === currentIndex ? ' active' : '');
    li.dataset.index = i;
    const isLiked = likedTracks.has(t.name);
    const isRejected = rejectedTracks.has(t.name);
    li.innerHTML = `
      <span class="num">${i === currentIndex ? '&#9654;' : i + 1}</span>
      <span class="title" style="${isRejected ? 'opacity:0.4;text-decoration:line-through' : ''}">${t.name}</span>
      ${isLiked ? '<span class="liked-icon">&#10084;</span>' : ''}
      <span class="dur">${t.duration || ''}</span>
      <button class="remove-btn" title="Usuń">&times;</button>
    `;
    li.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-btn')) {
        removeTrack(i);
      } else {
        loadTrack(i);
        playAudio();
      }
    });
    playlistEl.appendChild(li);
  });
}

// ── Track management ──────────────────────────────────────────
function addFiles(files) {
  const newFiles = Array.from(files).filter(f => f.type.startsWith('audio/'));
  newFiles.forEach(file => {
    const name = stripExt(file.name);
    const url = URL.createObjectURL(file);
    // if track name already in list (restored), update its URL
    const existing = tracks.find(t => t.name === name && !t.url);
    if (existing) {
      existing.url = url;
    } else {
      const track = { name, url, duration: '' };
      tracks.push(track);
      const probe = new Audio();
      probe.src = url;
      probe.addEventListener('loadedmetadata', () => {
        track.duration = fmt(probe.duration);
        renderPlaylist();
        saveState();
      });
    }
  });
  if (currentIndex === -1 && tracks.length) loadTrack(0);
  else if (currentIndex >= 0 && tracks[currentIndex] && tracks[currentIndex].url) {
    // auto-resume restored track if its file was just added
    loadTrack(currentIndex);
  }
  renderPlaylist();
  saveState();
}

function removeTrack(i) {
  if (tracks[i].url) URL.revokeObjectURL(tracks[i].url);
  tracks.splice(i, 1);
  if (currentIndex === i) {
    audio.pause();
    isPlaying = false;
    updatePlayBtn();
    if (tracks.length) loadTrack(Math.min(i, tracks.length - 1));
    else {
      currentIndex = -1;
      trackTitle.textContent = 'Wybierz utwór';
      trackArtist.textContent = '---';
      albumArt.innerHTML = '<div class="album-placeholder">&#9835;</div>';
    }
  } else if (currentIndex > i) {
    currentIndex--;
  }
  renderPlaylist();
  saveState();
}

function stripExt(name) {
  return name.replace(/\.[^/.]+$/, '');
}

// ── Playback ──────────────────────────────────────────────────
function loadTrack(i) {
  if (i < 0 || i >= tracks.length) return;
  currentIndex = i;
  const t = tracks[i];
  if (!t.url) { renderPlaylist(); saveState(); return; }
  audio.src = t.url;
  trackTitle.textContent = t.name;
  trackArtist.textContent = 'Plik lokalny';
  albumArt.innerHTML = '<div class="album-placeholder">&#9835;</div>';
  progress.value = 0;
  setProgressStyle(0);
  currentTimeEl.textContent = '0:00';
  durationEl.textContent = t.duration || '0:00';
  renderPlaylist();
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({ title: t.name });
  }
  updateVerdictUI();
  saveState();
}

function playAudio() {
  audio.play().then(() => {
    isPlaying = true;
    updatePlayBtn();
  }).catch(() => {});
}

function pauseAudio() {
  audio.pause();
  isPlaying = false;
  updatePlayBtn();
}

function updatePlayBtn() {
  playBtn.innerHTML = isPlaying ? '&#9646;&#9646;' : '&#9654;';
}

function playNext() {
  if (!tracks.length) return;
  const available = tracks.filter(t => !rejectedTracks.has(t.name));
  if (!available.length) return;
  let next;
  if (isShuffle) {
    const candidate = available[Math.floor(Math.random() * available.length)];
    next = tracks.indexOf(candidate);
  } else {
    // find next non-rejected after currentIndex
    let i = (currentIndex + 1) % tracks.length;
    let tries = 0;
    while (rejectedTracks.has(tracks[i].name) && tries < tracks.length) {
      i = (i + 1) % tracks.length;
      tries++;
    }
    next = i;
  }
  loadTrack(next);
  playAudio();
}

function playPrev() {
  if (!tracks.length) return;
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  const prev = (currentIndex - 1 + tracks.length) % tracks.length;
  loadTrack(prev);
  playAudio();
}

function setProgressStyle(pct) {
  progress.style.setProperty('--progress', pct + '%');
}

// ── Accept / Reject ───────────────────────────────────────────
function updateVerdictUI() {
  if (currentIndex < 0) return;
  const name = tracks[currentIndex]?.name;
  const liked = likedTracks.has(name);
  const rejected = rejectedTracks.has(name);
  likeBtn.classList.toggle('active', liked);
  rejectBtn.classList.toggle('active', rejected);
  verdictLabel.textContent = liked ? 'Lubiane' : rejected ? 'Odrzucone' : '';
}

function acceptTrack() {
  if (currentIndex < 0) return;
  const name = tracks[currentIndex].name;
  likedTracks.add(name);
  rejectedTracks.delete(name);
  animateAlbumArt('right');
  updateVerdictUI();
  renderPlaylist();
  saveState();
}

function rejectTrack() {
  if (currentIndex < 0) return;
  const name = tracks[currentIndex].name;
  rejectedTracks.add(name);
  likedTracks.delete(name);
  animateAlbumArt('left');
  updateVerdictUI();
  renderPlaylist();
  saveState();
  // skip to next non-rejected track
  setTimeout(playNext, 400);
}

function animateAlbumArt(dir) {
  albumArt.classList.remove('swipe-left', 'swipe-right');
  albumArt.classList.add(dir === 'left' ? 'swipe-left' : 'swipe-right');
  setTimeout(() => albumArt.classList.remove('swipe-left', 'swipe-right'), 400);
}

// ── Swipe detection ───────────────────────────────────────────
let swipeStartX = 0;
albumArt.addEventListener('touchstart', e => { swipeStartX = e.touches[0].clientX; }, { passive: true });
albumArt.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - swipeStartX;
  if (Math.abs(dx) < 50) return;
  if (dx < 0) rejectTrack(); else acceptTrack();
});
// mouse swipe (desktop)
albumArt.addEventListener('mousedown', e => { swipeStartX = e.clientX; });
albumArt.addEventListener('mouseup', e => {
  const dx = e.clientX - swipeStartX;
  if (Math.abs(dx) < 50) return;
  if (dx < 0) rejectTrack(); else acceptTrack();
});

// ── Event listeners ───────────────────────────────────────────
playBtn.addEventListener('click', () => {
  if (!tracks.length) return;
  if (currentIndex === -1) { loadTrack(0); playAudio(); return; }
  isPlaying ? pauseAudio() : playAudio();
});

prevBtn.addEventListener('click', playPrev);
nextBtn.addEventListener('click', playNext);

shuffleBtn.addEventListener('click', () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle('active', isShuffle);
  saveState();
});

repeatBtn.addEventListener('click', () => {
  isRepeat = !isRepeat;
  repeatBtn.classList.toggle('active', isRepeat);
  saveState();
});

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  progress.value = pct;
  setProgressStyle(pct);
  currentTimeEl.textContent = fmt(audio.currentTime);
});

audio.addEventListener('loadedmetadata', () => {
  durationEl.textContent = fmt(audio.duration);
  if (currentIndex >= 0) tracks[currentIndex].duration = fmt(audio.duration);
  renderPlaylist();
});

audio.addEventListener('ended', () => {
  if (isRepeat) { audio.currentTime = 0; playAudio(); }
  else playNext();
});

progress.addEventListener('input', () => {
  if (!audio.duration) return;
  audio.currentTime = (progress.value / 100) * audio.duration;
  setProgressStyle(Number(progress.value));
});

volumeSlider.addEventListener('input', () => {
  audio.volume = volumeSlider.value / 100;
  volumeVal.textContent = volumeSlider.value + '%';
  saveState();
});

audio.volume = 0.8;

likeBtn.addEventListener('click', acceptTrack);
rejectBtn.addEventListener('click', rejectTrack);

fileInput.addEventListener('change', () => addFiles(fileInput.files));

// Drag & drop
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => {
  e.preventDefault();
  addFiles(e.dataTransfer.files);
});

// MediaSession
if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', playAudio);
  navigator.mediaSession.setActionHandler('pause', pauseAudio);
  navigator.mediaSession.setActionHandler('previoustrack', playPrev);
  navigator.mediaSession.setActionHandler('nexttrack', playNext);
}

// ── PWA install prompt ────────────────────────────────────────
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') installBtn.hidden = true;
  deferredPrompt = null;
});

window.addEventListener('appinstalled', () => { installBtn.hidden = true; });

// ── Init ──────────────────────────────────────────────────────
loadState();

// ── Service Worker ────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

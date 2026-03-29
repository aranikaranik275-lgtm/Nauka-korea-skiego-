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

let tracks = [];
let currentIndex = -1;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let deferredPrompt = null;

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
    li.innerHTML = `
      <span class="num">${i === currentIndex ? '&#9654;' : i + 1}</span>
      <span class="title">${t.name}</span>
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
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('audio/')) return;
    const url = URL.createObjectURL(file);
    const track = { name: stripExt(file.name), url, duration: '' };
    tracks.push(track);
    // probe duration
    const probe = new Audio();
    probe.src = url;
    probe.addEventListener('loadedmetadata', () => {
      track.duration = fmt(probe.duration);
      renderPlaylist();
    });
  });
  if (currentIndex === -1 && tracks.length) loadTrack(0);
  renderPlaylist();
}

function removeTrack(i) {
  URL.revokeObjectURL(tracks[i].url);
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
}

function stripExt(name) {
  return name.replace(/\.[^/.]+$/, '');
}

// ── Playback ──────────────────────────────────────────────────
function loadTrack(i) {
  if (i < 0 || i >= tracks.length) return;
  currentIndex = i;
  const t = tracks[i];
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
  let next;
  if (isShuffle) {
    next = Math.floor(Math.random() * tracks.length);
  } else {
    next = (currentIndex + 1) % tracks.length;
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
});

repeatBtn.addEventListener('click', () => {
  isRepeat = !isRepeat;
  repeatBtn.classList.toggle('active', isRepeat);
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
});

audio.volume = 0.8;

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

// ── Service Worker ────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

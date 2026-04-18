// ── Sounds ────────────────────────────────────────────────────────────────────
const AC = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, gainVal = 0.3) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.connect(g); g.connect(AC.destination);
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(gainVal, AC.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + duration);
  o.start(); o.stop(AC.currentTime + duration);
}

function soundCorrect() {
  playTone(523, 'sine', 0.12);                          // C5
  setTimeout(() => playTone(659, 'sine', 0.12), 80);    // E5
}

function soundWrong() {
  playTone(180, 'sawtooth', 0.18, 0.2);
}

// ── Finger map: key → finger id ──────────────────────────────────────────────
const FINGER = {
  '`':  'lp', '1': 'lp', 'q': 'lp', 'a': 'lp', 'z': 'lp',
  '2':  'lr', 'w': 'lr', 's': 'lr', 'x': 'lr',
  '3':  'lm', 'e': 'lm', 'd': 'lm', 'c': 'lm',
  '4':  'li', 'r': 'li', 'f': 'li', 'v': 'li',
  '5':  'li', 't': 'li', 'g': 'li', 'b': 'li',
  '6':  'ri', 'y': 'ri', 'h': 'ri', 'n': 'ri',
  '7':  'ri', 'u': 'ri', 'j': 'ri', 'm': 'ri',
  '8':  'rm', 'i': 'rm', 'k': 'rm', ',': 'rm',
  '9':  'rr', 'o': 'rr', 'l': 'rr', '.': 'rr',
  '0':  'rp', 'p': 'rp', ';': 'rp', '/': 'rp',
  '-':  'rp', '[': 'rp', "'": 'rp',
  '=':  'rp', ']': 'rp', '\\': 'rp',
  ' ':  'lt',
};

const FINGER_NAME = {
  lp: 'Left Pinky',  lr: 'Left Ring',   lm: 'Left Middle', li: 'Left Index',
  lt: 'Left Thumb',  rt: 'Right Thumb', ri: 'Right Index', rm: 'Right Middle',
  rr: 'Right Ring',  rp: 'Right Pinky',
};

// ── Keyboard layout ───────────────────────────────────────────────────────────
const ROWS = [
  ['`','1','2','3','4','5','6','7','8','9','0','-','=','Backspace'],
  ['Tab','q','w','e','r','t','y','u','i','o','p','[',']','\\'],
  ['Caps','a','s','d','f','g','h','j','k','l',';',"'",'Enter'],
  ['Shift','z','x','c','v','b','n','m',',','.','/','Shift'],
  ['Ctrl','Alt',' ','Alt','Ctrl'],
];
const WIDE = { 'Backspace':'wide-2','Tab':'wide-15','Caps':'wide-2','Enter':'wide-25','Shift':'wide-25','Ctrl':'wide-2','Alt':'wide-15',' ':'space' };

// ── Levels ────────────────────────────────────────────────────────────────────
const LEVELS = [
  { title: '🏠 Home Row – Left',   keys: 'asdf',       words: ['aaa','sss','ddd','fff','sad','fad','add','dad','ads'] },
  { title: '🏠 Home Row – Right',  keys: 'jkl;',       words: ['jjj','kkk','lll','jkl','lkj','jll','kll','jkk'] },
  { title: '🏠 Full Home Row',     keys: 'asdfghjkl;', words: ['flask','glass','flags','flash','shall','falls','halls','lads'] },
  { title: '⬆️ Top Row – Left',    keys: 'qwert',      words: ['tree','were','rut','true','wet','ewer','wee','tee'] },
  { title: '⬆️ Top Row – Right',   keys: 'yuiop',      words: ['your','pour','tour','pout','you','tip','pit','top'] },
  { title: '⬆️ Full Top Row',      keys: 'qwertyuiop', words: ['pretty','poetry','tower','power','write','quote','quite'] },
  { title: '⬇️ Bottom Row – Left', keys: 'zxcvb',      words: ['cab','cabs','vex','box','verb','cave','brave','vibe'] },
  { title: '⬇️ Bottom Row – Right',keys: 'nm,./',      words: ['man','van','ban','can','nab','vim','bin','inn','min'] },
  { title: '🌟 All Rows',          keys: 'all',        words: ['typing','finger','keyboard','practice','wizard','expert','master','champion'] },
];

// ── State ─────────────────────────────────────────────────────────────────────
let state = { level: 0, score: 0, wordIdx: 0, charIdx: 0, words: [], errors: 0 };

// ── Build keyboard DOM ────────────────────────────────────────────────────────
function buildKeyboard() {
  const kb = document.getElementById('keyboard');
  kb.innerHTML = '';
  ROWS.forEach(row => {
    const rowEl = document.createElement('div');
    rowEl.className = 'key-row';
    row.forEach(k => {
      const el = document.createElement('div');
      const lk = k.toLowerCase();
      el.className = 'key' + (WIDE[k] ? ' ' + WIDE[k] : '') + (FINGER[lk] ? ' finger-' + FINGER[lk] : '');
      el.textContent = k === ' ' ? 'Space' : k;
      el.id = 'key-' + k.replace(/[^a-z0-9]/gi, c => c.charCodeAt(0));
      rowEl.appendChild(el);
    });
    kb.appendChild(rowEl);
  });
}

function getKeyEl(char) {
  const lk = char.toLowerCase();
  return document.querySelector(`.key.finger-${FINGER[lk] || ''}`) ||
         [...document.querySelectorAll('.key')].find(el => el.textContent.toLowerCase() === lk);
}

// ── Screen helpers ────────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
}

// ── Game flow ─────────────────────────────────────────────────────────────────
function buildLevelSelect() {
  const el = document.getElementById('level-select');
  el.innerHTML = '<p>— or jump to a level —</p>' +
    LEVELS.map((lv, i) =>
      `<button class="btn-level" onclick="jumpToLevel(${i})">${i + 1}. ${lv.title}</button>`
    ).join('');
}

function jumpToLevel(idx) {
  buildKeyboard();
  state.score = 0;
  document.getElementById('score').textContent = 0;
  loadLevel(idx);
  showScreen('lesson');
  document.getElementById('type-input').focus();
}

function startLesson() {
  buildKeyboard();
  loadLevel(0);
  showScreen('lesson');
  document.getElementById('type-input').focus();
}

function loadLevel(idx) {
  state.level = idx;
  state.wordIdx = 0;
  state.charIdx = 0;
  state.errors = 0;
  const lv = LEVELS[idx];
  // shuffle words
  state.words = [...lv.words].sort(() => Math.random() - .5);
  document.getElementById('level').textContent = idx + 1;
  document.getElementById('lesson-title').textContent = lv.title;
  document.getElementById('type-input').value = '';
  renderWord();
}

function renderWord() {
  const word = state.words[state.wordIdx];
  const ci = state.charIdx;
  const html = [...word].map((c, i) => {
    const cls = i < ci ? 'done' : i === ci ? 'next' : 'todo';
    return `<span class="${cls}">${c}</span>`;
  }).join('');
  document.getElementById('prompt-text').innerHTML = html;

  // highlight target key & finger
  clearHighlights();
  const targetChar = word[ci];
  if (targetChar) {
    const finger = FINGER[targetChar.toLowerCase()] || FINGER[' '];
    highlightFinger(finger);
    highlightKey(targetChar);
    document.getElementById('finger-hint').textContent =
      `Use your ${FINGER_NAME[finger]} for "${targetChar === ' ' ? 'Space' : targetChar}"`;
  }

  // progress
  const total = state.words.length;
  document.getElementById('progress-bar').style.width = (state.wordIdx / total * 100) + '%';
}

function clearHighlights() {
  document.querySelectorAll('.finger').forEach(f => f.className = f.className.replace(/active-\w+/g, '').trim());
  document.querySelectorAll('.key').forEach(k => k.classList.remove('active', 'target', 'correct', 'wrong'));
}

function highlightFinger(fid) {
  const el = document.getElementById(fid);
  if (el) el.classList.add('active-' + fid);
}

function highlightKey(char) {
  const lk = char === ' ' ? ' ' : char.toLowerCase();
  const finger = FINGER[lk];
  if (!finger) return;
  // find the key element for this specific character
  const keyEl = [...document.querySelectorAll('.key')].find(el => {
    const txt = el.textContent.toLowerCase();
    return txt === (lk === ' ' ? 'space' : lk);
  });
  if (keyEl) { keyEl.classList.add('target'); keyEl.classList.add('active'); }
}

// ── Input handling ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildLevelSelect();
  const input = document.getElementById('type-input');

  input.addEventListener('keydown', e => {
    const word = state.words[state.wordIdx];
    const expected = word[state.charIdx];

    // only handle printable + space
    if (e.key.length !== 1) return;
    e.preventDefault();

    const typed = e.key;
    const keyEl = [...document.querySelectorAll('.key')].find(el => {
      const txt = el.textContent.toLowerCase();
      return txt === (typed === ' ' ? 'space' : typed.toLowerCase());
    });

    if (typed === expected) {
      // correct
      soundCorrect();
      if (keyEl) { keyEl.classList.add('correct'); setTimeout(() => keyEl.classList.remove('correct'), 300); }
      state.charIdx++;
      state.score += 10;
      document.getElementById('score').textContent = state.score;

      if (state.charIdx >= word.length) {
        // word done
        state.wordIdx++;
        state.charIdx = 0;
        if (state.wordIdx >= state.words.length) {
          showLevelUp();
          return;
        }
      }
      renderWord();
    } else {
      // wrong
      soundWrong();
      if (keyEl) { keyEl.classList.add('wrong'); setTimeout(() => keyEl.classList.remove('wrong'), 400); }
      state.errors++;
      state.score = Math.max(0, state.score - 5);
      document.getElementById('score').textContent = state.score;
    }
  });
});

// ── Level up ──────────────────────────────────────────────────────────────────
function showLevelUp() {
  const accuracy = Math.max(0, Math.round(100 - (state.errors / (state.words.join('').length) * 100)));
  const stars = accuracy >= 90 ? '⭐⭐⭐' : accuracy >= 70 ? '⭐⭐' : '⭐';
  document.getElementById('levelup-msg').textContent = `Accuracy: ${accuracy}%  |  Score: ${state.score}`;
  document.getElementById('levelup-stars').textContent = stars;

  if (state.level + 1 >= LEVELS.length) {
    document.getElementById('final-score').textContent = `Final Score: ${state.score} ⭐`;
    showScreen('win');
  } else {
    showScreen('levelup');
  }
}

function nextLevel() {
  loadLevel(state.level + 1);
  showScreen('lesson');
  document.getElementById('type-input').focus();
}

function restartGame() {
  state.score = 0;
  document.getElementById('score').textContent = 0;
  loadLevel(0);
  showScreen('lesson');
  document.getElementById('type-input').focus();
}

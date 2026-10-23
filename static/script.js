// Snake, Water, Gun - Kids Arcade Game Controller

let gameState = {
  scores: [],
  history: [],
  isProcessing: false,
  soundEnabled: true,
  matchOver: false
};

// Web Audio API Synthesizer with bubbly cartoon sound effects
const audioCtx = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext))
  ? new (window.AudioContext || window.webkitAudioContext)()
  : null;

function playSound(type) {
  if (!gameState.soundEnabled || !audioCtx) return;

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;

  if (type === 'bubble-pop') {
    // Bubbly cartoon pop sound
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.08);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
  } else if (type === 'win-round') {
    // Happy cartoon boing / bell
    playNote(523.25, now, 0.15, 'triangle');       // C5
    playNote(659.25, now + 0.09, 0.15, 'triangle'); // E5
    playNote(783.99, now + 0.18, 0.35, 'triangle'); // G5
    playNote(1046.50, now + 0.28, 0.4, 'sine');     // C6 (bright bell)
  } else if (type === 'lose-round') {
    // Playful cartoon wah-wah
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(220, now + 0.18);
    osc.frequency.linearRampToValueAtTime(180, now + 0.35);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc.start(now);
    osc.stop(now + 0.35);
  } else if (type === 'tie-round') {
    // Friendly cartoon boop
    playNote(480, now, 0.1, 'sine');
    playNote(540, now + 0.1, 0.15, 'sine');
  } else if (type === 'victory-fanfare') {
    // Big cheerful victory theme
    playNote(523.25, now, 0.12, 'triangle');
    playNote(659.25, now + 0.12, 0.12, 'triangle');
    playNote(783.99, now + 0.24, 0.15, 'triangle');
    playNote(1046.50, now + 0.40, 0.55, 'sine');
  }
}

function playNote(freq, startTime, duration, type = 'sine') {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(0.25, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

// DOM Elements
const playerAvatar = document.getElementById('player-avatar');
const compAvatar = document.getElementById('comp-avatar');
const playerChoiceLabel = document.getElementById('player-choice-label');
const compChoiceLabel = document.getElementById('comp-choice-label');
const roundResultText = document.getElementById('round-result-text');
const roundReasonText = document.getElementById('round-reason-text');
const roundNumEl = document.getElementById('round-num');
const netScorePill = document.getElementById('net-score-pill');
const choiceBtns = document.querySelectorAll('.choice-btn');

// Modal Elements
const matchModal = document.getElementById('match-modal');
const modalBox = document.getElementById('modal-box');
const modalBadge = document.getElementById('modal-badge');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalRoundList = document.getElementById('modal-round-list');
const modalFinalSum = document.getElementById('modal-final-sum');
const modalPlayAgainBtn = document.getElementById('modal-play-again-btn');

// Rules Modal Elements
const rulesBtn = document.getElementById('rules-btn');
const closeRulesBtn = document.getElementById('close-rules-btn');
const rulesModal = document.getElementById('rules-modal');

// Audio Toggle Button
const soundBtn = document.getElementById('sound-btn');
const soundIcon = document.getElementById('sound-icon');

// Initialize
function init() {
  choiceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const choice = parseInt(btn.getAttribute('data-choice'), 10);
      handleChoice(choice);
    });
  });

  modalPlayAgainBtn.addEventListener('click', resetGame);

  // Keyboard controls
  window.addEventListener('keydown', (e) => {
    if (gameState.matchOver) {
      if (e.key.toLowerCase() === 'y' || e.key === 'Enter') {
        resetGame();
      }
      return;
    }

    if (['0', '1', '2'].includes(e.key) && !gameState.isProcessing) {
      handleChoice(parseInt(e.key, 10));
    }
  });

  // Sound toggle
  soundBtn.addEventListener('click', () => {
    gameState.soundEnabled = !gameState.soundEnabled;
    soundIcon.textContent = gameState.soundEnabled ? '🔊 Sound ON' : '🔇 Sound OFF';
    playSound('bubble-pop');
  });

  // Rules toggle
  rulesBtn.addEventListener('click', () => {
    playSound('bubble-pop');
    openModal(rulesModal);
  });
  closeRulesBtn.addEventListener('click', () => {
    playSound('bubble-pop');
    closeModal(rulesModal);
  });
  rulesModal.addEventListener('click', (e) => {
    if (e.target === rulesModal) closeModal(rulesModal);
  });
}

// Handle User Move
async function handleChoice(userChoice) {
  if (gameState.isProcessing || gameState.matchOver) return;

  gameState.isProcessing = true;
  setButtonsDisabled(true);
  playSound('bubble-pop');

  // Start cartoon suspense shake & emoji cycling
  startShuffleAnimation();

  try {
    const response = await fetch('/api/play-round', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        choice: userChoice,
        previous_scores: gameState.scores
      })
    });

    if (!response.ok) {
      const err = await response.json();
      alert(err.error || 'Oops! Try again.');
      stopShuffleAnimation();
      setButtonsDisabled(false);
      gameState.isProcessing = false;
      return;
    }

    const data = await response.json();

    // 450ms suspense delay for kids excitement
    setTimeout(() => {
      stopShuffleAnimation();
      applyRoundOutcome(data);
    }, 450);

  } catch (error) {
    console.error('API Error:', error);
    stopShuffleAnimation();
    setButtonsDisabled(false);
    gameState.isProcessing = false;
    alert('Oops! Could not talk to the server.');
  }
}

let shuffleInterval = null;
const emojis = ['🐍', '💧', '🔫', '⭐', '🎈'];

function startShuffleAnimation() {
  playerAvatar.classList.add('anim-shake-user');
  compAvatar.classList.add('anim-shake-comp');
  clearAvatarGlows();

  let idx = 0;
  shuffleInterval = setInterval(() => {
    playerAvatar.textContent = emojis[idx % emojis.length];
    compAvatar.textContent = emojis[(idx + 1) % emojis.length];
    idx++;
  }, 80);
}

function stopShuffleAnimation() {
  if (shuffleInterval) {
    clearInterval(shuffleInterval);
    shuffleInterval = null;
  }
  playerAvatar.classList.remove('anim-shake-user');
  compAvatar.classList.remove('anim-shake-comp');
}

function applyRoundOutcome(data) {
  // Update avatars & bounce in
  playerAvatar.textContent = data.user_choice.icon;
  compAvatar.textContent = data.comp_choice.icon;
  playerAvatar.classList.add('anim-pop');
  compAvatar.classList.add('anim-pop');
  setTimeout(() => {
    playerAvatar.classList.remove('anim-pop');
    compAvatar.classList.remove('anim-pop');
  }, 450);

  playerChoiceLabel.textContent = data.user_choice.name;
  compChoiceLabel.textContent = data.comp_choice.name;

  // Banner feedback with colorful encouraging messages
  if (data.round_status === 'win') {
    roundResultText.textContent = '🌟 AWESOME! YOU WON THIS ROUND!';
    roundResultText.className = 'text-base sm:text-lg font-black text-emerald-600 drop-shadow-sm';
    playerAvatar.classList.add('win-glow');
    compAvatar.classList.add('lose-glow');
    playSound('win-round');
  } else if (data.round_status === 'lose') {
    roundResultText.textContent = '🤖 ROBOT BUDDY SCORED!';
    roundResultText.className = 'text-base sm:text-lg font-black text-rose-600 drop-shadow-sm';
    playerAvatar.classList.add('lose-glow');
    compAvatar.classList.add('win-glow');
    playSound('lose-round');
  } else {
    roundResultText.textContent = "🤝 SUPER TIE! GREAT MINDS THINK ALIKE!";
    roundResultText.className = 'text-base sm:text-lg font-black text-amber-600 drop-shadow-sm';
    playerAvatar.classList.add('tie-glow');
    compAvatar.classList.add('tie-glow');
    playSound('tie-round');
  }
  roundReasonText.textContent = data.reason;

  // Record history
  gameState.scores = data.updated_scores;
  gameState.history.push({
    round: data.current_round,
    userIcon: data.user_choice.icon,
    userName: data.user_choice.name,
    compIcon: data.comp_choice.icon,
    compName: data.comp_choice.name,
    status: data.round_status,
    score: data.score_delta
  });

  // Update Round Tracker Badge
  updateRoundBadge(data.current_round, data.round_status, data.score_delta);

  // Update Net Score Pill
  const currentSum = gameState.scores.reduce((a, b) => a + b, 0);
  const sign = currentSum > 0 ? '+' : '';
  netScorePill.textContent = `${sign}${currentSum} pts`;
  if (currentSum > 0) netScorePill.className = 'text-3xl font-black text-emerald-600';
  else if (currentSum < 0) netScorePill.className = 'text-3xl font-black text-rose-600';
  else netScorePill.className = 'text-3xl font-black text-indigo-700';

  // Check if 3 rounds completed
  if (data.match_over) {
    gameState.matchOver = true;
    setTimeout(() => {
      showMatchSummary(data);
    }, 800);
  } else {
    roundNumEl.textContent = data.current_round + 1;
    setButtonsDisabled(false);
    gameState.isProcessing = false;
  }
}

function updateRoundBadge(roundNum, status, score) {
  const badge = document.getElementById(`round-badge-${roundNum}`);
  if (!badge) return;

  const iconEl = badge.querySelector('.indicator-icon');

  if (status === 'win') {
    badge.className = 'candy-badge w-14 h-14 rounded-2xl border-4 flex flex-col items-center justify-center shadow-md transition-all badge-win';
    iconEl.textContent = '⭐ +1';
  } else if (status === 'lose') {
    badge.className = 'candy-badge w-14 h-14 rounded-2xl border-4 flex flex-col items-center justify-center shadow-md transition-all badge-lose';
    iconEl.textContent = '💥 -1';
  } else {
    badge.className = 'candy-badge w-14 h-14 rounded-2xl border-4 flex flex-col items-center justify-center shadow-md transition-all badge-tie';
    iconEl.textContent = '🤝 0';
  }
}

function showMatchSummary(data) {
  const sum = data.total_score;
  const sign = sum > 0 ? '+' : '';
  modalFinalSum.textContent = `${sign}${sum} pts`;

  if (data.match_result === 'win') {
    modalBadge.textContent = '🏆';
    modalTitle.textContent = 'YOU ARE THE CHAMPION!';
    modalTitle.className = 'text-3xl sm:text-4xl font-black font-[\'Chewy\'] tracking-wide text-emerald-600 mb-1';
    modalFinalSum.className = 'text-emerald-600 text-xl font-black';
    playSound('victory-fanfare');

    // Multi-colored kids confetti blast!
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#10b981', '#38bdf8', '#f59e0b', '#ec4899', '#8b5cf6']
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 300);
    }
  } else if (data.match_result === 'lose') {
    modalBadge.textContent = '🤖';
    modalTitle.textContent = 'GOOD TRY, SUPERSTAR!';
    modalTitle.className = 'text-3xl sm:text-4xl font-black font-[\'Chewy\'] tracking-wide text-purple-700 mb-1';
    modalFinalSum.className = 'text-rose-600 text-xl font-black';
    playSound('lose-round');
  } else {
    modalBadge.textContent = '🤝';
    modalTitle.textContent = 'FRIENDLY DRAW!';
    modalTitle.className = 'text-3xl sm:text-4xl font-black font-[\'Chewy\'] tracking-wide text-amber-600 mb-1';
    modalFinalSum.className = 'text-amber-600 text-xl font-black';
    playSound('tie-round');
  }

  modalMessage.textContent = data.match_message;

  // Build colorful round recap
  modalRoundList.innerHTML = gameState.history.map(item => {
    let tag = '';
    if (item.status === 'win') tag = '<span class="text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full text-xs font-black">⭐ Won (+1)</span>';
    else if (item.status === 'lose') tag = '<span class="text-rose-600 bg-rose-100 px-2.5 py-0.5 rounded-full text-xs font-black">💥 Lost (-1)</span>';
    else tag = '<span class="text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full text-xs font-black">🤝 Tie (0)</span>';

    return `
      <div class="flex items-center justify-between py-1.5 border-b border-indigo-100 last:border-0">
        <span class="text-indigo-900 font-bold">Round ${item.round}:</span>
        <div class="flex items-center gap-2">
          <span>You ${item.userIcon} vs ${item.compIcon} Bot</span>
          <span class="ml-1">${tag}</span>
        </div>
      </div>
    `;
  }).join('');

  openModal(matchModal);
}

function resetGame() {
  playSound('bubble-pop');
  gameState.scores = [];
  gameState.history = [];
  gameState.isProcessing = false;
  gameState.matchOver = false;

  // Reset avatars
  playerAvatar.textContent = '❓';
  compAvatar.textContent = '❓';
  playerChoiceLabel.textContent = 'Your Turn!';
  compChoiceLabel.textContent = 'Ready to play!';
  clearAvatarGlows();

  // Reset labels
  roundNumEl.textContent = '1';
  roundResultText.textContent = 'Pick a weapon below!';
  roundResultText.className = 'text-base sm:text-lg font-black text-indigo-900';
  roundReasonText.textContent = '3 fun rounds to win the trophy! 🏆';
  netScorePill.textContent = '0 pts';
  netScorePill.className = 'text-3xl font-black text-indigo-700';

  // Reset round badges
  for (let i = 1; i <= 3; i++) {
    const badge = document.getElementById(`round-badge-${i}`);
    if (badge) {
      badge.className = 'candy-badge w-14 h-14 rounded-2xl bg-slate-100 border-4 border-slate-300 flex flex-col items-center justify-center shadow-md transition-all';
      badge.querySelector('.indicator-icon').textContent = '⏳';
    }
  }

  setButtonsDisabled(false);
  closeModal(matchModal);
}

function clearAvatarGlows() {
  playerAvatar.classList.remove('win-glow', 'lose-glow', 'tie-glow');
  compAvatar.classList.remove('win-glow', 'lose-glow', 'tie-glow');
}

function setButtonsDisabled(disabled) {
  choiceBtns.forEach(btn => {
    btn.disabled = disabled;
  });
}

function openModal(modalEl) {
  modalEl.classList.remove('hidden');
  setTimeout(() => {
    modalEl.classList.remove('opacity-0');
    if (modalEl.querySelector('#modal-box')) {
      modalEl.querySelector('#modal-box').classList.remove('scale-95');
      modalEl.querySelector('#modal-box').classList.add('scale-100');
    }
  }, 10);
}

function closeModal(modalEl) {
  modalEl.classList.add('opacity-0');
  if (modalEl.querySelector('#modal-box')) {
    modalEl.querySelector('#modal-box').classList.remove('scale-100');
    modalEl.querySelector('#modal-box').classList.add('scale-95');
  }
  setTimeout(() => {
    modalEl.classList.add('hidden');
  }, 250);
}

// Start application
document.addEventListener('DOMContentLoaded', init);

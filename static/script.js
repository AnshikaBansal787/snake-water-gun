// Snake, Water, Gun - Kids Arcade Game Controller with 2-Player Friend Mode

let gameState = {
  mode: 'computer', // 'computer' or 'friend'
  scores: [],       // [+1, -1, 0]
  history: [],
  isProcessing: false,
  soundEnabled: true,
  matchOver: false,
  p1ChoiceTemp: null, // Temporary store for Friend mode step 1
  currentTurn: 1      // In Friend mode: 1 = Player 1's turn, 2 = Player 2's turn
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
  } else if (type === 'lock-sound') {
    // Satisfying padlock click sound
    playNote(600, now, 0.06, 'sine');
    playNote(900, now + 0.07, 0.1, 'triangle');
  } else if (type === 'win-round') {
    playNote(523.25, now, 0.15, 'triangle');       // C5
    playNote(659.25, now + 0.09, 0.15, 'triangle'); // E5
    playNote(783.99, now + 0.18, 0.35, 'triangle'); // G5
    playNote(1046.50, now + 0.28, 0.4, 'sine');     // C6
  } else if (type === 'lose-round') {
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
    playNote(480, now, 0.1, 'sine');
    playNote(540, now + 0.1, 0.15, 'sine');
  } else if (type === 'victory-fanfare') {
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
const p1BadgeLabel = document.getElementById('p1-badge-label');
const p1BadgeIcon = document.getElementById('p1-badge-icon');
const p2BadgeLabel = document.getElementById('p2-badge-label');
const p2BadgeIcon = document.getElementById('p2-badge-icon');

const roundResultText = document.getElementById('round-result-text');
const roundReasonText = document.getElementById('round-reason-text');
const roundNumEl = document.getElementById('round-num');
const netScorePill = document.getElementById('net-score-pill');
const scoreMeterLabel = document.getElementById('score-meter-label');
const turnInstructionBanner = document.getElementById('turn-instruction-banner');
const choiceBtns = document.querySelectorAll('.choice-btn');

// Mode Switch Elements
const modeBtnComputer = document.getElementById('mode-btn-computer');
const modeBtnFriend = document.getElementById('mode-btn-friend');
const currentModePill = document.getElementById('current-mode-pill');

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
  // Mode selection listeners
  modeBtnComputer.addEventListener('click', () => switchMode('computer'));
  modeBtnFriend.addEventListener('click', () => switchMode('friend'));

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

  // Apply default mode
  switchMode('computer');
}

// Switch between Computer and Friend mode
function switchMode(newMode) {
  playSound('bubble-pop');
  gameState.mode = newMode;

  if (newMode === 'computer') {
    modeBtnComputer.classList.add('active-mode');
    modeBtnFriend.classList.remove('active-mode');
    currentModePill.textContent = '🤖 vs Computer Mode';
    currentModePill.className = 'text-xs font-extrabold px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border-2 border-emerald-300';

    p1BadgeIcon.textContent = '🧒';
    p1BadgeLabel.textContent = 'YOU (Player)';
    p2BadgeIcon.textContent = '🤖';
    p2BadgeLabel.textContent = 'ROBOT BUDDY';

    scoreMeterLabel.textContent = 'Total Points';
  } else {
    modeBtnFriend.classList.add('active-mode');
    modeBtnComputer.classList.remove('active-mode');
    currentModePill.textContent = '👥 2-Player Friend Mode';
    currentModePill.className = 'text-xs font-extrabold px-3 py-0.5 rounded-full bg-sky-100 text-sky-800 border-2 border-sky-300';

    p1BadgeIcon.textContent = '🧒';
    p1BadgeLabel.textContent = 'PLAYER 1';
    p2BadgeIcon.textContent = '👧';
    p2BadgeLabel.textContent = 'PLAYER 2';

    scoreMeterLabel.textContent = 'P1 vs P2 Score';
  }

  resetGame();
}

// Handle User Input
function handleChoice(userChoice) {
  if (gameState.isProcessing || gameState.matchOver) return;

  if (gameState.mode === 'computer') {
    handleComputerRound(userChoice);
  } else {
    handleFriendRound(userChoice);
  }
}

// ---------------- SINGLE PLAYER (VS COMPUTER) ----------------
async function handleComputerRound(userChoice) {
  gameState.isProcessing = true;
  setButtonsDisabled(true);
  playSound('bubble-pop');

  startShuffleAnimation();

  try {
    const response = await fetch('/api/play-round', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'computer',
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

    setTimeout(() => {
      stopShuffleAnimation();
      applyComputerOutcome(data);
    }, 450);

  } catch (error) {
    console.error('API Error:', error);
    stopShuffleAnimation();
    setButtonsDisabled(false);
    gameState.isProcessing = false;
    alert('Oops! Could not talk to the server.');
  }
}

function applyComputerOutcome(data) {
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

  gameState.scores = data.updated_scores;
  gameState.history.push({
    round: data.current_round,
    p1Icon: data.user_choice.icon,
    p1Name: data.user_choice.name,
    p2Icon: data.comp_choice.icon,
    p2Name: data.comp_choice.name,
    status: data.round_status,
    score: data.score_delta
  });

  updateRoundBadge(data.current_round, data.round_status);

  // Net score
  const currentSum = gameState.scores.reduce((a, b) => a + b, 0);
  const sign = currentSum > 0 ? '+' : '';
  netScorePill.textContent = `${sign}${currentSum} pts`;
  if (currentSum > 0) netScorePill.className = 'text-3xl font-black text-emerald-600';
  else if (currentSum < 0) netScorePill.className = 'text-3xl font-black text-rose-600';
  else netScorePill.className = 'text-3xl font-black text-indigo-700';

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

// ---------------- TWO PLAYER (PLAY WITH FRIEND) ----------------
function handleFriendRound(choice) {
  if (gameState.currentTurn === 1) {
    // Step 1: Player 1 makes secret pick
    gameState.p1ChoiceTemp = choice;
    playSound('lock-sound');

    playerAvatar.textContent = '🔒';
    playerChoiceLabel.textContent = 'Secret Locked!';
    playerAvatar.classList.add('locked-glow');

    // Switch turn to Player 2
    gameState.currentTurn = 2;
    updateTurnIndicator();

  } else {
    // Step 2: Player 2 makes pick -> Showdown & resolve!
    const p1Choice = gameState.p1ChoiceTemp;
    const p2Choice = choice;

    gameState.isProcessing = true;
    setButtonsDisabled(true);
    playSound('bubble-pop');

    // Suspense showdown animation
    startShuffleAnimation();

    fetch('/api/play-round', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'friend',
        p1_choice: p1Choice,
        p2_choice: p2Choice,
        previous_scores: gameState.scores
      })
    })
    .then(res => res.json())
    .then(data => {
      setTimeout(() => {
        stopShuffleAnimation();
        applyFriendOutcome(data);
      }, 450);
    })
    .catch(err => {
      console.error(err);
      stopShuffleAnimation();
      setButtonsDisabled(false);
      gameState.isProcessing = false;
      alert('Could not process round.');
    });
  }
}

function applyFriendOutcome(data) {
  playerAvatar.classList.remove('locked-glow');
  playerAvatar.textContent = data.p1_choice.icon;
  compAvatar.textContent = data.p2_choice.icon;

  playerAvatar.classList.add('anim-pop');
  compAvatar.classList.add('anim-pop');
  setTimeout(() => {
    playerAvatar.classList.remove('anim-pop');
    compAvatar.classList.remove('anim-pop');
  }, 450);

  playerChoiceLabel.textContent = `P1: ${data.p1_choice.name}`;
  compChoiceLabel.textContent = `P2: ${data.p2_choice.name}`;

  if (data.round_status === 'p1_win') {
    roundResultText.textContent = '🎉 PLAYER 1 SCORED!';
    roundResultText.className = 'text-base sm:text-lg font-black text-emerald-600 drop-shadow-sm';
    playerAvatar.classList.add('win-glow');
    compAvatar.classList.add('lose-glow');
    playSound('win-round');
  } else if (data.round_status === 'p2_win') {
    roundResultText.textContent = '🎉 PLAYER 2 SCORED!';
    roundResultText.className = 'text-base sm:text-lg font-black text-sky-600 drop-shadow-sm';
    playerAvatar.classList.add('lose-glow');
    compAvatar.classList.add('win-glow');
    playSound('win-round');
  } else {
    roundResultText.textContent = "🤝 SUPER TIE! BOTH WERE EQUAL!";
    roundResultText.className = 'text-base sm:text-lg font-black text-amber-600 drop-shadow-sm';
    playerAvatar.classList.add('tie-glow');
    compAvatar.classList.add('tie-glow');
    playSound('tie-round');
  }
  roundReasonText.textContent = data.reason;

  gameState.scores = data.updated_scores;
  gameState.history.push({
    round: data.current_round,
    p1Icon: data.p1_choice.icon,
    p1Name: data.p1_choice.name,
    p2Icon: data.p2_choice.icon,
    p2Name: data.p2_choice.name,
    status: data.round_status,
    score: data.score_delta
  });

  updateRoundBadge(data.current_round, data.round_status);

  // Score count: P1 vs P2
  const p1Wins = gameState.scores.filter(s => s === 1).length;
  const p2Wins = gameState.scores.filter(s => s === -1).length;
  netScorePill.textContent = `P1: ${p1Wins} | P2: ${p2Wins}`;
  netScorePill.className = 'text-2xl sm:text-3xl font-black text-indigo-700';

  if (data.match_over) {
    gameState.matchOver = true;
    setTimeout(() => {
      showMatchSummary(data);
    }, 800);
  } else {
    // Prep next round
    roundNumEl.textContent = data.current_round + 1;
    gameState.currentTurn = 1;
    gameState.p1ChoiceTemp = null;

    setTimeout(() => {
      playerAvatar.textContent = '❓';
      compAvatar.textContent = '❓';
      playerChoiceLabel.textContent = 'Pick move!';
      compChoiceLabel.textContent = 'Waiting...';
      clearAvatarGlows();
      updateTurnIndicator();
      setButtonsDisabled(false);
      gameState.isProcessing = false;
    }, 1200);
  }
}

function updateTurnIndicator() {
  if (gameState.mode === 'computer') {
    turnInstructionBanner.textContent = '👇 Tap your weapon to attack! 👇';
    turnInstructionBanner.className = 'inline-block bg-purple-600 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md animate-pulse';
    playerAvatar.classList.remove('turn-pulse-p1', 'turn-pulse-p2');
    compAvatar.classList.remove('turn-pulse-p1', 'turn-pulse-p2');
    return;
  }

  if (gameState.currentTurn === 1) {
    turnInstructionBanner.textContent = '👉 PLAYER 1: Tap your SECRET weapon! 🤫';
    turnInstructionBanner.className = 'inline-block bg-emerald-600 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md animate-bounce';
    playerAvatar.classList.add('turn-pulse-p1');
    compAvatar.classList.remove('turn-pulse-p2');
    playerChoiceLabel.textContent = 'Pick in secret!';
    compChoiceLabel.textContent = 'Waiting for P1...';
  } else {
    turnInstructionBanner.textContent = '👉 PLAYER 2: Tap your weapon for the SHOWDOWN! ⚔️';
    turnInstructionBanner.className = 'inline-block bg-sky-600 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md animate-bounce';
    playerAvatar.classList.remove('turn-pulse-p1');
    compAvatar.classList.add('turn-pulse-p2');
    compChoiceLabel.textContent = 'Your turn, P2!';
  }
}

// ---------------- ROUND BADGES & SUMMARY ----------------
function updateRoundBadge(roundNum, status) {
  const badge = document.getElementById(`round-badge-${roundNum}`);
  if (!badge) return;

  const iconEl = badge.querySelector('.indicator-icon');

  if (status === 'win' || status === 'p1_win') {
    badge.className = 'candy-badge w-14 h-14 rounded-2xl border-4 flex flex-col items-center justify-center shadow-md transition-all badge-win';
    iconEl.textContent = gameState.mode === 'friend' ? 'P1 ⭐' : '⭐ +1';
  } else if (status === 'lose' || status === 'p2_win') {
    badge.className = 'candy-badge w-14 h-14 rounded-2xl border-4 flex flex-col items-center justify-center shadow-md transition-all badge-lose';
    iconEl.textContent = gameState.mode === 'friend' ? 'P2 ⭐' : '💥 -1';
  } else {
    badge.className = 'candy-badge w-14 h-14 rounded-2xl border-4 flex flex-col items-center justify-center shadow-md transition-all badge-tie';
    iconEl.textContent = '🤝 0';
  }
}

function showMatchSummary(data) {
  if (gameState.mode === 'friend') {
    const p1Wins = gameState.scores.filter(s => s === 1).length;
    const p2Wins = gameState.scores.filter(s => s === -1).length;
    modalFinalSum.textContent = `P1: ${p1Wins} Wins | P2: ${p2Wins} Wins`;

    if (data.match_result === 'p1_win') {
      modalBadge.textContent = '🏆';
      modalTitle.textContent = 'PLAYER 1 WINS THE TROPHY!';
      modalTitle.className = 'text-3xl sm:text-4xl font-black font-[\'Chewy\'] tracking-wide text-emerald-600 mb-1';
      modalFinalSum.className = 'text-emerald-600 text-lg font-black';
      playSound('victory-fanfare');
      fireConfetti();
    } else if (data.match_result === 'p2_win') {
      modalBadge.textContent = '🏆';
      modalTitle.textContent = 'PLAYER 2 WINS THE TROPHY!';
      modalTitle.className = 'text-3xl sm:text-4xl font-black font-[\'Chewy\'] tracking-wide text-sky-600 mb-1';
      modalFinalSum.className = 'text-sky-600 text-lg font-black';
      playSound('victory-fanfare');
      fireConfetti();
    } else {
      modalBadge.textContent = '🤝';
      modalTitle.textContent = 'FRIENDLY TIE! BOTH ARE STARS!';
      modalTitle.className = 'text-3xl sm:text-4xl font-black font-[\'Chewy\'] tracking-wide text-amber-600 mb-1';
      modalFinalSum.className = 'text-amber-600 text-lg font-black';
      playSound('tie-round');
    }
  } else {
    const sum = data.total_score;
    const sign = sum > 0 ? '+' : '';
    modalFinalSum.textContent = `${sign}${sum} pts`;

    if (data.match_result === 'win') {
      modalBadge.textContent = '🏆';
      modalTitle.textContent = 'YOU ARE THE CHAMPION!';
      modalTitle.className = 'text-3xl sm:text-4xl font-black font-[\'Chewy\'] tracking-wide text-emerald-600 mb-1';
      modalFinalSum.className = 'text-emerald-600 text-xl font-black';
      playSound('victory-fanfare');
      fireConfetti();
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
  }

  modalMessage.textContent = data.match_message;

  // Build rounds list
  modalRoundList.innerHTML = gameState.history.map(item => {
    let tag = '';
    if (gameState.mode === 'friend') {
      if (item.status === 'p1_win') tag = '<span class="text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full text-xs font-black">P1 Won</span>';
      else if (item.status === 'p2_win') tag = '<span class="text-sky-600 bg-sky-100 px-2 py-0.5 rounded-full text-xs font-black">P2 Won</span>';
      else tag = '<span class="text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-xs font-black">Tie</span>';
    } else {
      if (item.status === 'win') tag = '<span class="text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full text-xs font-black">⭐ Won (+1)</span>';
      else if (item.status === 'lose') tag = '<span class="text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full text-xs font-black">💥 Lost (-1)</span>';
      else tag = '<span class="text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-xs font-black">🤝 Tie (0)</span>';
    }

    const p1Label = gameState.mode === 'friend' ? 'P1' : 'You';
    const p2Label = gameState.mode === 'friend' ? 'P2' : 'Bot';

    return `
      <div class="flex items-center justify-between py-1.5 border-b border-indigo-100 last:border-0">
        <span class="text-indigo-900 font-bold">Round ${item.round}:</span>
        <div class="flex items-center gap-2">
          <span>${p1Label} ${item.p1Icon} vs ${item.p2Icon} ${p2Label}</span>
          <span class="ml-1">${tag}</span>
        </div>
      </div>
    `;
  }).join('');

  openModal(matchModal);
}

function fireConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#10b981', '#38bdf8', '#f59e0b', '#ec4899', '#8b5cf6']
    });
    setTimeout(() => {
      confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1 } });
    }, 300);
  }
}

function resetGame() {
  playSound('bubble-pop');
  gameState.scores = [];
  gameState.history = [];
  gameState.isProcessing = false;
  gameState.matchOver = false;
  gameState.p1ChoiceTemp = null;
  gameState.currentTurn = 1;

  playerAvatar.textContent = '❓';
  compAvatar.textContent = '❓';
  playerChoiceLabel.textContent = gameState.mode === 'friend' ? 'Pick move!' : 'Your Turn!';
  compChoiceLabel.textContent = gameState.mode === 'friend' ? 'Waiting...' : 'Ready to play!';
  clearAvatarGlows();

  roundNumEl.textContent = '1';
  roundResultText.textContent = 'Pick a weapon below!';
  roundResultText.className = 'text-base sm:text-lg font-black text-indigo-900';
  roundReasonText.textContent = '3 fun rounds to win the trophy! 🏆';

  netScorePill.textContent = gameState.mode === 'friend' ? 'P1: 0 | P2: 0' : '0 pts';
  netScorePill.className = 'text-2xl sm:text-3xl font-black text-indigo-700';

  for (let i = 1; i <= 3; i++) {
    const badge = document.getElementById(`round-badge-${i}`);
    if (badge) {
      badge.className = 'candy-badge w-14 h-14 rounded-2xl bg-slate-100 border-4 border-slate-300 flex flex-col items-center justify-center shadow-md transition-all';
      badge.querySelector('.indicator-icon').textContent = '⏳';
    }
  }

  updateTurnIndicator();
  setButtonsDisabled(false);
  closeModal(matchModal);
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

function clearAvatarGlows() {
  playerAvatar.classList.remove('win-glow', 'lose-glow', 'tie-glow', 'locked-glow', 'turn-pulse-p1', 'turn-pulse-p2');
  compAvatar.classList.remove('win-glow', 'lose-glow', 'tie-glow', 'turn-pulse-p2');
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

document.addEventListener('DOMContentLoaded', init);

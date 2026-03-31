"use strict";

const STORAGE_KEY = "date-night-lockout-bingo:v5";
const MAX_POINTS = 25;
const FIXED_ACCENT = "#84cc16";
const STORAGE_AVAILABLE = isStorageAvailable();

const TASKS = [
  { id: "t1", labelLt: "Paragauk kito žaidėjo maisto" },
  { id: "t2", labelLt: "Pasakyk tris nesarkastiškus komplimentus" },
  { id: "t3", labelLt: "Atidaryk automobilio duris kitam žaidėjui" },
  { id: "t4", labelLt: "Pasakyk motyvacinę kalbą kitam žaidėjui prieš jam smūgiuojant" },
  { id: "t5", labelLt: "Pašnabždėk ką nors spicy į ausį" },
  { id: "t6", labelLt: "Pakomentuok savo maistą žemaitiškai" },
  { id: "t7", labelLt: "„Nepasisekė“ x 10" },
  { id: "t8", labelLt: "Rimtu veidu išlaikyk akių kontaktą bent 20 sekundžių" },
  { id: "t9", labelLt: "Laimėk rankų lenkimą" },
  { id: "t10", labelLt: "Išlaikyk planką ilgiau nei kitas žaidėjas" },
  { id: "t11", labelLt: "Ilgiau iškentėk kutenimą nei kitas žaidėjas" },
  { id: "t12", labelLt: "Laimėk 1 „Connect4“ partiją" },
  {
    id: "t13",
    labelLt: "Pateisink prastą mušimą į duobutę su labai lėkšta (ir netiesiogine) priežastimi",
  },
  { id: "t14", labelLt: "Įmušk kamuoliuką pritūpus" },
  { id: "t15", labelLt: "Įmušk kamuoliuką iš medžio pozos" },
  { id: "t16", labelLt: "Įmušk kamuoliuką naudodamas golfo lazdą kaip pool'o lazdą" },
  { id: "t17", labelLt: "Pataikyk kamuoliuką į duobutę mušdamas tarp partnerio kojų" },
  { id: "t18", labelLt: "Įmušk kamuoliuką sau tarp kojų per 3 kartus" },
  { id: "t19", labelLt: "Įmušk kamuoliuką niūniuodamas „Du gaidelius“" },
  {
    id: "t20",
    labelLt: "Įmušk kamuoliuką laikydamas lazdą priešingoje rankoje nei įprastai per 4 kartus",
  },
  { id: "t21", labelLt: "Įmušk kamuoliuką užsimerkęs per 5 kartus" },
  { id: "t22", labelLt: "Hole in 2" },
  { id: "t23", labelLt: "Įmušk kamuoliuką ne mažiau nei per 10 kartų" },
  { id: "t24", labelLt: "Įmušk kamuoliuką užsimerkęs per 3 kartus" },
  { id: "t25", labelLt: "Hole in 1" },
];

const PRIZES = [
  { id: "pr1", labelLt: "Kokteilis", milestonePoints: 3 },
  { id: "pr2", labelLt: "„Teleloto“ bilietą", milestonePoints: 6 },
  { id: "pr3", labelLt: "Kitas žaidėjas įgarsins tavo parinkto 20 sekundžių animacinio filmo klipą", milestonePoints: 9 },
  { id: "pr4", labelLt: "Pasirinkto skonio ledų dėžė", milestonePoints: 12 },
  {
    id: "pr5",
    labelLt: "Nemokamas pavežimas iš bet kur į bet kur bet kada (150 km spinduliu)",
    milestonePoints: 15,
  },
  { id: "pr6", labelLt: "Skrydis oro balionu", milestonePoints: 25 },
];

const MILESTONES = [...new Set(PRIZES.map((prize) => prize.milestonePoints))].sort((a, b) => a - b);

const DEFAULT_THEME = {
  playerColors: {
    p1: "#2d8cff",
    p2: "#ff5e82",
  },
};

/** @typedef {"p1"|"p2"} PlayerId */

/**
 * @typedef {Object} MoveRecord
 * @property {string} taskId
 * @property {PlayerId} playerId
 */

/**
 * @typedef {Object} GameState
 * @property {{id: PlayerId, name: string}[]} players
 * @property {PlayerId} activePlayerId
 * @property {Record<string, PlayerId | null>} claims
 * @property {{playerId: PlayerId | null, count: number}} combo
 * @property {{playerColors: Record<PlayerId, string>}} theme
 * @property {MoveRecord[]} moveHistory
 * @property {boolean} eveningEnded
 * @property {PlayerId | null} winnerId
 * @property {number} updatedAt
 */

const dom = {
  particlesCanvas: document.getElementById("particles-canvas"),
  openSetupBtn: document.getElementById("open-setup-btn"),
  openPrizesBtn: document.getElementById("open-prizes-btn"),
  endEveningBtn: document.getElementById("end-evening-btn"),
  undoBtn: document.getElementById("undo-btn"),
  closeSetupBtn: document.getElementById("close-setup-btn"),
  saveSetupBtn: document.getElementById("save-setup-btn"),
  setupScreen: document.getElementById("setup-screen"),
  setupNameInputs: {
    p1: document.getElementById("setup-name-p1"),
    p2: document.getElementById("setup-name-p2"),
  },
  softResetBtn: document.getElementById("soft-reset-btn"),
  hardResetBtn: document.getElementById("hard-reset-btn"),
  prizesScreen: document.getElementById("prizes-screen"),
  closePrizesBtn: document.getElementById("close-prizes-btn"),
  playerProgressList: document.getElementById("player-progress-list"),
  prizesColumns: document.getElementById("prizes-columns"),
  victoryScreen: document.getElementById("victory-screen"),
  closeVictoryBtn: document.getElementById("close-victory-btn"),
  victoryMessage: document.getElementById("victory-message"),
  victoryActions: document.getElementById("victory-actions"),
  activeButtons: {
    p1: document.querySelector('[data-set-active="p1"]'),
    p2: document.querySelector('[data-set-active="p2"]'),
  },
  tasksGrid: document.getElementById("tasks-grid"),
  claimedCounter: document.getElementById("claimed-counter"),
  progressBar: document.getElementById("global-progress-bar"),
  statusLine: document.getElementById("status-line"),
};

const particleCtx = dom.particlesCanvas ? dom.particlesCanvas.getContext("2d") : null;
const particles = [];
let particleRafId = null;
let fireworksIntervalId = null;
let fireworksStopTimeoutId = null;
let pendingScrollRestoreFrameA = null;
let pendingScrollRestoreFrameB = null;
let lastFocusedElement = null;
const reducedMotionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

/** @type {GameState} */
let state = loadState();
let statusMessage = STORAGE_AVAILABLE
  ? "Pasirink aktyvų žaidėją ir užimk pirmą laukelį"
  : "Pasirink aktyvų žaidėją ir užimk pirmą laukelį, duomenys gali neišsisaugoti šiame naršyklės režime";

bindEvents();
resizeParticlesCanvas();
window.addEventListener("resize", resizeParticlesCanvas);
if (reducedMotionQuery && typeof reducedMotionQuery.addEventListener === "function") {
  reducedMotionQuery.addEventListener("change", () => {
    if (!prefersReducedMotion()) {
      return;
    }
    stopFireworks();
    particles.length = 0;
    if (particleCtx) {
      particleCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  });
} else if (reducedMotionQuery && typeof reducedMotionQuery.addListener === "function") {
  reducedMotionQuery.addListener(() => {
    if (!prefersReducedMotion()) {
      return;
    }
    stopFireworks();
    particles.length = 0;
    if (particleCtx) {
      particleCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  });
}
applyThemeVariables();
render();

function createInitialState() {
  return {
    players: [
      { id: "p1", name: "Žaidėjas 1" },
      { id: "p2", name: "Žaidėjas 2" },
    ],
    activePlayerId: "p1",
    claims: createEmptyClaims(),
    combo: { playerId: null, count: 0 },
    theme: {
      playerColors: {
        p1: DEFAULT_THEME.playerColors.p1,
        p2: DEFAULT_THEME.playerColors.p2,
      },
    },
    moveHistory: [],
    eveningEnded: false,
    winnerId: null,
    updatedAt: Date.now(),
  };
}

function createEmptyClaims() {
  return TASKS.reduce((acc, task) => {
    acc[task.id] = null;
    return acc;
  }, {});
}

function loadState() {
  const fallback = createInitialState();
  if (!STORAGE_AVAILABLE) {
    return fallback;
  }

  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (_error) {
    return fallback;
  }
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch (_error) {
    return fallback;
  }
}

function normalizeState(raw) {
  const normalized = createInitialState();

  if (Array.isArray(raw?.players) && raw.players.length === 2) {
    const p1 = raw.players.find((player) => player?.id === "p1");
    const p2 = raw.players.find((player) => player?.id === "p2");
    if (p1 && p2) {
      normalized.players = [
        { id: "p1", name: normalizeName(p1.name, "Žaidėjas 1") },
        { id: "p2", name: normalizeName(p2.name, "Žaidėjas 2") },
      ];
    }
  }

  if (raw?.activePlayerId === "p1" || raw?.activePlayerId === "p2") {
    normalized.activePlayerId = raw.activePlayerId;
  }

  if (raw?.claims && typeof raw.claims === "object") {
    normalized.claims = createEmptyClaims();
    for (const task of TASKS) {
      const owner = raw.claims[task.id];
      normalized.claims[task.id] = owner === "p1" || owner === "p2" ? owner : null;
    }
  }

  if (raw?.combo && typeof raw.combo === "object") {
    const comboOwner = raw.combo.playerId;
    normalized.combo = {
      playerId: comboOwner === "p1" || comboOwner === "p2" ? comboOwner : null,
      count: Number.isFinite(raw.combo.count) ? clamp(Math.floor(raw.combo.count), 0, 99) : 0,
    };
  }

  normalized.theme = {
    playerColors: {
      p1: normalizeColor(raw?.theme?.playerColors?.p1, DEFAULT_THEME.playerColors.p1),
      p2: normalizeColor(raw?.theme?.playerColors?.p2, DEFAULT_THEME.playerColors.p2),
    },
  };

  if (Array.isArray(raw?.moveHistory)) {
    normalized.moveHistory = raw.moveHistory
      .filter(
        (entry) =>
          entry &&
          typeof entry.taskId === "string" &&
          (entry.playerId === "p1" || entry.playerId === "p2") &&
          TASKS.some((task) => task.id === entry.taskId),
      )
      .map((entry) => ({ taskId: entry.taskId, playerId: entry.playerId }));
  }

  normalized.eveningEnded = Boolean(raw?.eveningEnded);
  normalized.winnerId = raw?.winnerId === "p1" || raw?.winnerId === "p2" ? raw.winnerId : null;

  if (typeof raw?.updatedAt === "number" && Number.isFinite(raw.updatedAt)) {
    normalized.updatedAt = raw.updatedAt;
  }

  return normalized;
}

function bindEvents() {
  Object.entries(dom.activeButtons).forEach(([playerId, button]) => {
    button.addEventListener("click", () => {
      commit(() => {
        state.activePlayerId = /** @type {PlayerId} */ (playerId);
      });
      statusMessage = `${getPlayerName(/** @type {PlayerId} */ (playerId))} yra aktyvus žaidėjas`;
      renderStatus();
    });
  });

  dom.tasksGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-task-id]");
    if (!button) {
      return;
    }
    claimTask(button.dataset.taskId, button);
  });

  dom.undoBtn.addEventListener("click", undoLastMove);

  dom.endEveningBtn.addEventListener("click", () => {
    if (state.eveningEnded) {
      openVictoryScreen();
      return;
    }
    finalizeEvening(false);
  });

  dom.openSetupBtn.addEventListener("click", openSetupScreen);
  dom.closeSetupBtn.addEventListener("click", closeSetupScreen);
  dom.saveSetupBtn.addEventListener("click", saveSetupSettings);

  dom.openPrizesBtn.addEventListener("click", openPrizesScreen);
  dom.closePrizesBtn.addEventListener("click", closePrizesScreen);

  dom.closeVictoryBtn.addEventListener("click", closeVictoryScreen);

  dom.softResetBtn.addEventListener("click", runSoftReset);
  dom.hardResetBtn.addEventListener("click", runHardReset);

  dom.setupScreen.addEventListener("click", (event) => {
    if (event.target === dom.setupScreen) {
      closeSetupScreen();
    }
  });

  dom.prizesScreen.addEventListener("click", (event) => {
    if (event.target === dom.prizesScreen) {
      closePrizesScreen();
    }
  });

  dom.victoryScreen.addEventListener("click", (event) => {
    const winnerBtn = event.target.closest("[data-pick-winner]");
    if (winnerBtn) {
      const winnerId = winnerBtn.dataset.pickWinner;
      if (winnerId === "p1" || winnerId === "p2") {
        commit(() => {
          state.winnerId = winnerId;
        });
        statusMessage = `Laimėtoju pasirinktas ${getPlayerName(winnerId)}`;
        renderStatus();
        renderVictoryContent();
        startFireworks();
      }
      return;
    }

    if (event.target === dom.victoryScreen) {
      closeVictoryScreen();
    }
  });

  window.addEventListener("keydown", (event) => {
    const openScreen = getOpenOverlay();
    if (!openScreen) {
      return;
    }

    if (event.key === "Escape") {
      if (!dom.victoryScreen.classList.contains("is-hidden")) {
        closeVictoryScreen();
        return;
      }
      if (!dom.prizesScreen.classList.contains("is-hidden")) {
        closePrizesScreen();
        return;
      }
      if (!dom.setupScreen.classList.contains("is-hidden")) {
        closeSetupScreen();
      }
      return;
    }

    if (event.key === "Tab") {
      trapFocusInOverlay(event, openScreen);
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopFireworks();
    }
  });
}

function openSetupScreen() {
  dom.setupNameInputs.p1.value = getPlayerName("p1");
  dom.setupNameInputs.p2.value = getPlayerName("p2");

  openOverlay(dom.setupScreen, dom.setupNameInputs.p1);
}

function closeSetupScreen() {
  closeOverlay(dom.setupScreen);
}

function openPrizesScreen() {
  openOverlay(dom.prizesScreen, dom.closePrizesBtn);
  renderPrizesPopup(getScores());
}

function closePrizesScreen() {
  closeOverlay(dom.prizesScreen);
}

function openVictoryScreen() {
  renderVictoryContent();
  openOverlay(dom.victoryScreen, dom.closeVictoryBtn);
}

function closeVictoryScreen() {
  closeOverlay(dom.victoryScreen);
  stopFireworks();
}

function saveSetupSettings() {
  const nextNameP1 = normalizeName(dom.setupNameInputs.p1.value, "Žaidėjas 1");
  const nextNameP2 = normalizeName(dom.setupNameInputs.p2.value, "Žaidėjas 2");

  commit(() => {
    const p1 = state.players.find((player) => player.id === "p1");
    const p2 = state.players.find((player) => player.id === "p2");

    if (p1) {
      p1.name = nextNameP1;
    }
    if (p2) {
      p2.name = nextNameP2;
    }
  });

  closeSetupScreen();
  statusMessage = "Nustatymai išsaugoti";
  renderStatus();
}

function claimTask(taskId, sourceButton) {
  if (!TASKS.some((task) => task.id === taskId)) {
    return;
  }

  if (state.eveningEnded) {
    statusMessage = "Vakaras jau užbaigtas, pradėkite naują raundą nustatymuose";
    renderStatus();
    return;
  }

  if (state.claims[taskId]) {
    statusMessage = "Ši užduotis jau paimta";
    renderStatus();
    return;
  }

  const active = state.activePlayerId;
  const taskLabel = TASKS.find((task) => task.id === taskId)?.labelLt ?? "Užduotis";
  const center = getElementCenter(sourceButton);
  if (sourceButton && typeof sourceButton.blur === "function") {
    sourceButton.blur();
  }

  commit(() => {
    state.claims[taskId] = active;
    state.moveHistory.push({ taskId, playerId: active });

    if (state.combo.playerId === active) {
      state.combo.count += 1;
    } else {
      state.combo.playerId = active;
      state.combo.count = 1;
    }
  });

  if (center) {
    spawnClaimParticles(center.x, center.y, state.theme.playerColors[active]);
  }

  const comboSuffix = state.combo.count > 1 ? ` Combo x${state.combo.count}!` : "";
  statusMessage = `${getPlayerName(active)} paėmė tašką: ${taskLabel}${comboSuffix}`;

  const claimedCount = getClaimedCount();
  if (claimedCount === TASKS.length) {
    finalizeEvening(true);
    return;
  }

  renderStatus();
}

function undoLastMove() {
  if (state.eveningEnded) {
    statusMessage = "Po vakaro užbaigimo atšaukimas nebegalimas";
    renderStatus();
    return;
  }

  const last = state.moveHistory[state.moveHistory.length - 1];
  if (!last) {
    statusMessage = "Nebėra ką atšaukti";
    renderStatus();
    return;
  }

  const taskLabel = TASKS.find((task) => task.id === last.taskId)?.labelLt ?? "užduotį";

  commit(() => {
    const removed = state.moveHistory.pop();
    if (!removed) {
      return;
    }

    state.claims[removed.taskId] = null;
    state.activePlayerId = removed.playerId;
    state.combo = { playerId: null, count: 0 };
  });

  statusMessage = `Atšaukta: ${taskLabel}`;
  renderStatus();
}

function finalizeEvening(autoTriggered) {
  if (state.eveningEnded) {
    openVictoryScreen();
    return;
  }

  const scores = getScores();
  const leader = getLeader(scores);

  commit(() => {
    state.eveningEnded = true;
    state.winnerId = leader;
    state.combo = { playerId: null, count: 0 };
  });

  if (leader) {
    statusMessage = autoTriggered
      ? `Visi iššūkiai užbaigti. Laimėjo ${getPlayerName(leader)}!`
      : `Vakaras užbaigtas. Laimėjo ${getPlayerName(leader)}!`;
  } else {
    statusMessage = "Vakaras užbaigtas lygiosiomis, pasirinkite laimėtoją finale";
  }

  openVictoryScreen();
  startFireworks();
  renderStatus();
}

function renderVictoryContent() {
  const scores = getScores();
  const allDone = getClaimedCount() === TASKS.length;

  if (!state.eveningEnded) {
    dom.victoryMessage.textContent = "";
    dom.victoryActions.replaceChildren();
    return;
  }

  if (state.winnerId) {
    const prefix = allDone ? "Visi iššūkiai užbaigti" : "Vakaras užbaigtas";
    dom.victoryMessage.textContent = `${prefix}, laimėjo ${getPlayerName(state.winnerId)} (${scores[state.winnerId]} tšk)`;
    dom.victoryActions.replaceChildren();
    return;
  }

  dom.victoryMessage.textContent = "Lygiosios, pasirinkite vakaro laimėtoją:";

  const fragment = document.createDocumentFragment();
  ["p1", "p2"].forEach((playerId) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "primary-btn icon-btn";
    button.dataset.pickWinner = playerId;
    button.style.backgroundColor = state.theme.playerColors[playerId];
    button.style.color = "#fff";
    button.textContent = `${getPlayerName(playerId)} (${scores[playerId]} tšk)`;
    fragment.append(button);
  });

  dom.victoryActions.replaceChildren(fragment);
}

function runSoftReset() {
  const shouldReset = window.confirm("Išvalyti lentą, bet palikti vardus?");
  if (!shouldReset) {
    return;
  }

  const playersSnapshot = state.players.map((player) => ({ id: player.id, name: player.name }));
  const themeSnapshot = {
    playerColors: {
      p1: state.theme.playerColors.p1,
      p2: state.theme.playerColors.p2,
    },
  };

  state = createInitialState();
  state.players = playersSnapshot;
  state.theme = themeSnapshot;
  saveState();

  stopFireworks();
  closeVictoryScreen();
  closePrizesScreen();

  statusMessage = "Naujas raundas pradėtas";
  render();
}

function runHardReset() {
  const shouldReset = window.confirm("Pilnas reset išvalys viską. Tęsti?");
  if (!shouldReset) {
    return;
  }

  state = createInitialState();
  saveState();

  stopFireworks();
  closeSetupScreen();
  closePrizesScreen();
  closeVictoryScreen();

  statusMessage = "Pilnas reset atliktas";
  render();
}

function render() {
  applyThemeVariables();

  const scores = getScores();
  const claimedCount = getClaimedCount();

  dom.claimedCounter.textContent = `${claimedCount}/${TASKS.length}`;
  dom.progressBar.style.width = `${(claimedCount / TASKS.length) * 100}%`;
  dom.undoBtn.disabled = state.moveHistory.length === 0 || state.eveningEnded;

  renderActiveSwitch("p1");
  renderActiveSwitch("p2");
  renderTasks();

  if (!dom.prizesScreen.classList.contains("is-hidden")) {
    renderPrizesPopup(scores);
  }

  if (!dom.victoryScreen.classList.contains("is-hidden")) {
    renderVictoryContent();
  }

  renderStatus();
}

function renderActiveSwitch(playerId) {
  const button = dom.activeButtons[playerId];
  const playerColor = state.theme.playerColors[playerId];
  button.style.setProperty("--player-color", playerColor);
  const isSelected = state.activePlayerId === playerId;
  button.classList.toggle("is-selected", isSelected);
  button.setAttribute("aria-pressed", isSelected ? "true" : "false");

  button.replaceChildren();
  const line = document.createElement("span");
  line.className = "line-1 switch-player";

  const name = document.createElement("span");
  name.className = "switch-name";
  name.textContent = getPlayerName(playerId);
  name.title = getPlayerName(playerId);

  line.append(name);
  button.append(line);
}

function renderTasks() {
  const fragment = document.createDocumentFragment();

  TASKS.forEach((task, index) => {
    const owner = state.claims[task.id];

    const card = document.createElement("button");
    card.type = "button";
    card.className = "task-card";
    card.dataset.taskId = task.id;
    card.title = task.labelLt;

    const number = document.createElement("span");
    number.className = "task-number";
    number.textContent = String(index + 1);

    const label = document.createElement("span");
    label.className = "task-label";
    label.textContent = task.labelLt;

    card.append(number, label);

    if (owner) {
      const ownerChip = document.createElement("span");
      ownerChip.className = "owner-chip";
      ownerChip.textContent = getPlayerName(owner);
      ownerChip.style.backgroundColor = state.theme.playerColors[owner];
      card.append(ownerChip);

      card.classList.add("is-unavailable");
      card.style.borderColor = state.theme.playerColors[owner];
      card.style.backgroundColor = hexToRgba(state.theme.playerColors[owner], 0.18);
      card.disabled = true;
    }

    if (state.eveningEnded && !owner) {
      card.disabled = true;
      card.classList.add("is-unavailable");
    }

    fragment.append(card);
  });

  dom.tasksGrid.replaceChildren(fragment);
}

function renderPrizesPopup(scores) {
  dom.playerProgressList.replaceChildren();
  renderPrizeColumns(scores);
}

function renderPlayerProgress(scores) {
  const fragment = document.createDocumentFragment();

  ["p1", "p2"].forEach((playerId) => {
    const card = document.createElement("article");
    card.className = "player-progress-card";

    const points = scores[playerId];
    const percent = (clamp(points, 0, MAX_POINTS) / MAX_POINTS) * 100;
    const name = getPlayerName(playerId);

    const head = document.createElement("div");
    head.className = "player-progress-head";

    const nameEl = document.createElement("span");
    nameEl.textContent = name;

    const statEl = document.createElement("span");
    statEl.textContent = `${points}/${MAX_POINTS} tšk`;

    head.append(nameEl, statEl);

    const bar = document.createElement("div");
    bar.className = "player-progress-bar";

    const fill = document.createElement("div");
    fill.className = "player-progress-fill";
    fill.style.width = `${percent}%`;
    fill.style.setProperty("--bar-color", state.theme.playerColors[playerId]);

    const markers = document.createElement("div");
    markers.className = "player-progress-markers";
    MILESTONES.forEach((milestone) => {
      const marker = document.createElement("span");
      marker.style.left = `${(milestone / MAX_POINTS) * 100}%`;
      markers.append(marker);
    });

    const dot = document.createElement("span");
    dot.className = "player-progress-dot";
    dot.style.left = `${percent}%`;
    dot.style.setProperty("--dot-color", state.theme.playerColors[playerId]);

    bar.append(fill, markers, dot);
    card.append(head, bar);
    fragment.append(card);
  });

  dom.playerProgressList.replaceChildren(fragment);
}

function renderPrizeColumns(scores) {
  const fragment = document.createDocumentFragment();

  ["p1", "p2"].forEach((playerId) => {
    const column = document.createElement("section");
    column.className = "prize-column";
    const playerColor = state.theme.playerColors[playerId];
    const points = scores[playerId];
    const percent = (clamp(points, 0, MAX_POINTS) / MAX_POINTS) * 100;
    const dotPercent = clamp(percent, 4, 96);

    const head = document.createElement("div");
    head.className = "prize-column-head";

    const title = document.createElement("h3");
    title.className = "prize-column-title";
    const dot = document.createElement("span");
    dot.className = "player-color-dot";
    dot.style.setProperty("--dot-color", playerColor);
    const titleText = document.createElement("span");
    titleText.textContent = getPlayerName(playerId);
    title.append(dot, titleText);

    const pointsLabel = document.createElement("span");
    pointsLabel.className = "prize-column-points";
    pointsLabel.textContent = `${points}/${MAX_POINTS} tšk`;

    head.append(title, pointsLabel);

    const body = document.createElement("div");
    body.className = "prize-column-body";

    const rail = document.createElement("div");
    rail.className = "prize-progress-rail";
    rail.style.setProperty("--player-color", playerColor);

    const fill = document.createElement("div");
    fill.className = "prize-progress-fill";
    fill.style.height = `${percent}%`;

    const markers = document.createElement("div");
    markers.className = "prize-progress-markers";
    MILESTONES.forEach((milestone) => {
      const marker = document.createElement("span");
      marker.style.bottom = `${(milestone / MAX_POINTS) * 100}%`;
      markers.append(marker);
    });

    const progressDot = document.createElement("span");
    progressDot.className = "prize-progress-dot";
    progressDot.style.bottom = `${dotPercent}%`;
    progressDot.style.setProperty("--dot-color", playerColor);

    rail.append(fill, markers, progressDot);

    const list = document.createElement("div");
    list.className = "prize-list";

    const orderedPrizes = [...PRIZES].sort((a, b) => b.milestonePoints - a.milestonePoints);
    orderedPrizes.forEach((prize) => {
      const unlocked = scores[playerId] >= prize.milestonePoints;

      const item = document.createElement("article");
      item.className = `prize-item ${unlocked ? "unlocked" : "locked"}`;
      item.style.setProperty("--player-color", playerColor);

      if (unlocked) {
        item.style.backgroundColor = hexToRgba(playerColor, 0.18);
      }

      const badge = document.createElement("span");
      badge.className = "prize-milestone";
      badge.textContent = `${prize.milestonePoints} tšk`;

      const text = document.createElement("p");
      text.className = "prize-title";
      text.textContent = prize.labelLt;

      item.append(badge, text);
      list.append(item);
    });

    body.append(rail, list);
    column.append(head, body);
    fragment.append(column);
  });

  dom.prizesColumns.replaceChildren(fragment);
}

function getScores() {
  return TASKS.reduce(
    (acc, task) => {
      const owner = state.claims[task.id];
      if (owner === "p1") {
        acc.p1 += 1;
      } else if (owner === "p2") {
        acc.p2 += 1;
      }
      return acc;
    },
    { p1: 0, p2: 0 },
  );
}

function getLeader(scores) {
  if (scores.p1 > scores.p2) {
    return "p1";
  }
  if (scores.p2 > scores.p1) {
    return "p2";
  }
  return null;
}

function getClaimedCount() {
  return TASKS.filter((task) => state.claims[task.id] !== null).length;
}

function getPlayerName(playerId) {
  const fallback = playerId === "p1" ? "Žaidėjas 1" : "Žaidėjas 2";
  return state.players.find((player) => player.id === playerId)?.name ?? fallback;
}

function renderStatus() {
  dom.statusLine.textContent = statusMessage;
}

function commit(updater) {
  const previousX = window.scrollX;
  const previousY = window.scrollY;
  updater();
  saveState();
  render();
  restoreScroll(previousX, previousY);
}

function restoreScroll(x, y) {
  if (pendingScrollRestoreFrameA !== null) {
    window.cancelAnimationFrame(pendingScrollRestoreFrameA);
    pendingScrollRestoreFrameA = null;
  }
  if (pendingScrollRestoreFrameB !== null) {
    window.cancelAnimationFrame(pendingScrollRestoreFrameB);
    pendingScrollRestoreFrameB = null;
  }

  const targetX = Number.isFinite(x) ? x : 0;
  const targetY = Number.isFinite(y) ? y : 0;
  window.scrollTo(targetX, targetY);

  pendingScrollRestoreFrameA = window.requestAnimationFrame(() => {
    window.scrollTo(targetX, targetY);
    pendingScrollRestoreFrameA = null;
    pendingScrollRestoreFrameB = window.requestAnimationFrame(() => {
      window.scrollTo(targetX, targetY);
      pendingScrollRestoreFrameB = null;
    });
  });
}

function saveState() {
  if (!STORAGE_AVAILABLE) {
    return;
  }
  state.updatedAt = Date.now();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_error) {
    // Ignore write errors (quota/private mode) and keep in-memory state running.
  }
}

function normalizeName(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }
  const cleaned = value.trim().replace(/\s+/g, " ").slice(0, 24);
  return cleaned.length > 0 ? cleaned : fallback;
}

function normalizeColor(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }
  const candidate = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(candidate) ? candidate.toLowerCase() : fallback;
}

function applyThemeVariables() {
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty("--accent", FIXED_ACCENT);
  rootStyle.setProperty("--accent-rgb", toRgbChannels(FIXED_ACCENT));
  rootStyle.setProperty("--p1", state.theme.playerColors.p1);
  rootStyle.setProperty("--p1-rgb", toRgbChannels(state.theme.playerColors.p1));
  rootStyle.setProperty("--p2", state.theme.playerColors.p2);
  rootStyle.setProperty("--p2-rgb", toRgbChannels(state.theme.playerColors.p2));
}

function toRgbChannels(hex) {
  const safe = normalizeColor(hex, "#000000");
  const r = Number.parseInt(safe.slice(1, 3), 16);
  const g = Number.parseInt(safe.slice(3, 5), 16);
  const b = Number.parseInt(safe.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

function hexToRgba(hex, alpha) {
  const safe = normalizeColor(hex, "#000000");
  const r = Number.parseInt(safe.slice(1, 3), 16);
  const g = Number.parseInt(safe.slice(3, 5), 16);
  const b = Number.parseInt(safe.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getElementCenter(element) {
  if (!element || typeof element.getBoundingClientRect !== "function") {
    return null;
  }
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function resizeParticlesCanvas() {
  if (!dom.particlesCanvas || !particleCtx) {
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  dom.particlesCanvas.width = Math.floor(width * dpr);
  dom.particlesCanvas.height = Math.floor(height * dpr);
  dom.particlesCanvas.style.width = `${width}px`;
  dom.particlesCanvas.style.height = `${height}px`;
  particleCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function spawnClaimParticles(x, y, baseColor) {
  if (!particleCtx || prefersReducedMotion()) {
    return;
  }

  const palette = [baseColor, FIXED_ACCENT, "#ffffff", "#d9ff8f"];
  spawnBurst(x, y, palette, 28, 1.5, 2.5, -1.2);
}

function spawnFireworkBurst(x, y) {
  if (!particleCtx || prefersReducedMotion()) {
    return;
  }

  const palette = ["#84cc16", "#22c55e", "#fde047", "#ffffff", "#60a5fa", "#f472b6"];
  spawnBurst(x, y, palette, 54, 2.8, 4.4, -2.2);
}

function spawnBurst(x, y, palette, count, speedMin, speedMax, lift) {
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.34;
    const speed = speedMin + Math.random() * (speedMax - speedMin);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + lift,
      size: 2 + Math.random() * 4,
      life: 36 + Math.random() * 28,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.28,
      color: palette[Math.floor(Math.random() * palette.length)],
    });
  }

  if (!particleRafId) {
    particleRafId = window.requestAnimationFrame(stepParticles);
  }
}

function startFireworks() {
  if (prefersReducedMotion()) {
    return;
  }

  stopFireworks();

  const burstRandom = () => {
    const x = 40 + Math.random() * Math.max(window.innerWidth - 80, 1);
    const y = 80 + Math.random() * Math.max(window.innerHeight * 0.5, 1);
    spawnFireworkBurst(x, y);
  };

  burstRandom();
  burstRandom();

  fireworksIntervalId = window.setInterval(burstRandom, 240);
  fireworksStopTimeoutId = window.setTimeout(() => {
    stopFireworks();
  }, 5200);
}

function stopFireworks() {
  if (fireworksIntervalId) {
    window.clearInterval(fireworksIntervalId);
    fireworksIntervalId = null;
  }
  if (fireworksStopTimeoutId) {
    window.clearTimeout(fireworksStopTimeoutId);
    fireworksStopTimeoutId = null;
  }
}

function prefersReducedMotion() {
  return Boolean(reducedMotionQuery?.matches);
}

function openOverlay(screen, initialFocusElement) {
  if (!screen) {
    return;
  }

  if (document.activeElement && document.activeElement instanceof HTMLElement) {
    lastFocusedElement = document.activeElement;
  }

  screen.classList.remove("is-hidden");
  screen.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  if (focusElementWithoutScroll(initialFocusElement)) {
    return;
  }

  const firstInteractive = screen.querySelector("button, input, select, textarea, [tabindex]:not([tabindex='-1'])");
  focusElementWithoutScroll(firstInteractive);
}

function closeOverlay(screen) {
  if (!screen) {
    return;
  }

  screen.classList.add("is-hidden");
  screen.setAttribute("aria-hidden", "true");

  const anyOpen =
    !dom.setupScreen.classList.contains("is-hidden") ||
    !dom.prizesScreen.classList.contains("is-hidden") ||
    !dom.victoryScreen.classList.contains("is-hidden");

  if (!anyOpen) {
    document.body.classList.remove("modal-open");
    focusElementWithoutScroll(lastFocusedElement);
    lastFocusedElement = null;
  }
}

function focusElementWithoutScroll(element) {
  if (!(element instanceof HTMLElement) || !document.contains(element)) {
    return false;
  }
  try {
    element.focus({ preventScroll: true });
  } catch (_error) {
    element.focus();
  }
  return true;
}

function getOpenOverlay() {
  if (!dom.victoryScreen.classList.contains("is-hidden")) {
    return dom.victoryScreen;
  }
  if (!dom.prizesScreen.classList.contains("is-hidden")) {
    return dom.prizesScreen;
  }
  if (!dom.setupScreen.classList.contains("is-hidden")) {
    return dom.setupScreen;
  }
  return null;
}

function trapFocusInOverlay(event, overlay) {
  const selectors = [
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[href]",
    "[tabindex]:not([tabindex='-1'])",
  ];
  const focusable = Array.from(overlay.querySelectorAll(selectors.join(","))).filter((element) => {
    if (!(element instanceof HTMLElement)) {
      return false;
    }
    return element.offsetParent !== null;
  });

  if (focusable.length === 0) {
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const current = document.activeElement;

  if (event.shiftKey && current === first) {
    event.preventDefault();
    focusElementWithoutScroll(last);
    return;
  }

  if (!event.shiftKey && current === last) {
    event.preventDefault();
    focusElementWithoutScroll(first);
  }
}

function isStorageAvailable() {
  try {
    const storage = window.localStorage;
    if (!storage) {
      return false;
    }
    const testKey = "__storage_test__";
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch (_error) {
    return false;
  }
}

function stepParticles() {
  if (!particleCtx || !dom.particlesCanvas) {
    particleRafId = null;
    return;
  }

  particleCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const particle = particles[i];
    particle.vx *= 0.98;
    particle.vy += 0.11;
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.rotation += particle.spin;
    particle.life -= 1;

    if (particle.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    const alpha = particle.life / 60;
    particleCtx.save();
    particleCtx.translate(particle.x, particle.y);
    particleCtx.rotate(particle.rotation);
    particleCtx.globalAlpha = clamp(alpha, 0, 1);
    particleCtx.fillStyle = particle.color;
    particleCtx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
    particleCtx.restore();
  }

  if (particles.length > 0 || fireworksIntervalId) {
    particleRafId = window.requestAnimationFrame(stepParticles);
  } else {
    particleRafId = null;
  }
}

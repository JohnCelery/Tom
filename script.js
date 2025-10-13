const STORAGE_KEY = "tomagotchi-save";
const NEEDS = [
  "nourishment",
  "energy",
  "cleanliness",
  "happiness",
  "health",
  "social",
];
const DEFAULT_DECAY = {
  nourishment: 0.09,
  energy: 0.07,
  cleanliness: 0.05,
  happiness: 0.04,
  health: 0.03,
  social: 0.05,
};
const MOOD_THRESHOLDS = [
  { mood: "ecstatic", threshold: 85 },
  { mood: "content", threshold: 65 },
  { mood: "concerned", threshold: 45 },
  { mood: "upset", threshold: 25 },
];
const STAGE_SEQUENCE = ["egg", "hatchling", "child", "teen", "adult"];
const STAGE_THRESHOLDS = {
  egg: 10,
  hatchling: 120,
  child: 360,
  teen: 720,
  adult: Number.POSITIVE_INFINITY,
};
const ACTIONS = {
  meal: {
    label: "Meal",
    description: "Share a nourishing meal together.",
    deltas: { nourishment: 22, happiness: 6, social: 4 },
    minutes: 6,
  },
  snack: {
    label: "Snack",
    description: "Offer a quick tasty bite.",
    deltas: { nourishment: 12, happiness: 4 },
    minutes: 3,
  },
  play: {
    label: "Play",
    description: "Get active with toys and imagination.",
    deltas: { happiness: 14, social: 10, energy: -8, cleanliness: -6 },
    minutes: 12,
  },
  clean: {
    label: "Clean",
    description: "Tidy up and freshen the habitat.",
    deltas: { cleanliness: 18, health: 5 },
    minutes: 8,
  },
  rest: {
    label: "Rest",
    description: "Take a restorative nap.",
    deltas: { energy: 20, health: 8, social: -4 },
    minutes: 30,
  },
  talk: {
    label: "Talk",
    description: "Share a heartfelt conversation.",
    deltas: { social: 16, happiness: 8 },
    minutes: 10,
  },
  medicine: {
    label: "Medicine",
    description: "Soothe aches with gentle care.",
    deltas: { health: 26, happiness: -6, cleanliness: -4 },
    minutes: 5,
  },
  discipline: {
    label: "Discipline",
    description: "Set calm, consistent boundaries.",
    deltas: { social: -10, happiness: -6, health: 4 },
    minutes: 4,
  },
  wait: {
    label: "Wait",
    description: "Observe quietly and let time pass.",
    deltas: {},
    minutes: 12,
  },
};
const TICK_INTERVAL_MS = 5000; // 1 in-game minute every 5 real seconds
const SAVE_INTERVAL_MS = 20000;
const HISTORY_LIMIT = 24;

function createDefaultState() {
  return {
    name: "Nova",
    stage: "egg",
    ageMinutes: 0,
    stats: Object.fromEntries(NEEDS.map((need) => [need, 85])),
    traits: ["gentle", "curious"],
    mood: "content",
    history: [],
    lastTick: Date.now(),
    lastSaved: Date.now(),
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatMinutes(totalMinutes) {
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(" ");
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultState();
    }
    const parsed = JSON.parse(raw);
    parsed.lastTick = Date.now();
    parsed.lastSaved = Date.now();
    parsed.stats = {
      ...Object.fromEntries(NEEDS.map((need) => [need, 85])),
      ...parsed.stats,
    };
    parsed.history = Array.isArray(parsed.history) ? parsed.history.slice(-HISTORY_LIMIT) : [];
    parsed.traits = Array.isArray(parsed.traits) && parsed.traits.length ? parsed.traits : ["gentle", "curious"];
    return parsed;
  } catch (error) {
    console.warn("Failed to load saved state, starting fresh.", error);
    return createDefaultState();
  }
}

function saveState(state) {
  try {
    const toPersist = { ...state, lastTick: Date.now(), lastSaved: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
  } catch (error) {
    console.warn("Unable to save state", error);
  }
}

const state = loadState();

const elements = {
  nameInput: document.querySelector("#name-input"),
  stage: document.querySelector("#pet-stage"),
  mood: document.querySelector("#pet-mood"),
  age: document.querySelector("#pet-age"),
  traits: document.querySelector("#pet-traits"),
  statList: document.querySelector("#stat-list"),
  history: document.querySelector("#history-list"),
  actionGrid: document.querySelector("#action-grid"),
  sprite: document.querySelector("#pet-sprite"),
};

elements.nameInput.value = state.name;

function createStatRow(name) {
  const li = document.createElement("li");
  li.className = "stat";
  li.innerHTML = `
    <div class="stat-label">
      <span>${name.charAt(0).toUpperCase() + name.slice(1)}</span>
      <span class="stat-value" data-need="${name}"></span>
    </div>
    <div class="progress">
      <div class="progress-bar" data-need="${name}"></div>
    </div>
  `;
  return li;
}

NEEDS.forEach((need) => {
  elements.statList.appendChild(createStatRow(need));
});

function addHistory(entry) {
  state.history.push(entry);
  if (state.history.length > HISTORY_LIMIT) {
    state.history.splice(0, state.history.length - HISTORY_LIMIT);
  }
}

function updateMood() {
  const average = NEEDS.reduce((sum, need) => sum + state.stats[need], 0) / NEEDS.length;
  for (const { mood, threshold } of MOOD_THRESHOLDS) {
    if (average >= threshold) {
      state.mood = mood;
      return;
    }
  }
  state.mood = "distressed";
}

function applyDecay(minutes) {
  NEEDS.forEach((need) => {
    const next = state.stats[need] - DEFAULT_DECAY[need] * minutes;
    state.stats[need] = clamp(next, 0, 100);
  });
}

function advanceStageIfReady() {
  const threshold = STAGE_THRESHOLDS[state.stage];
  if (state.ageMinutes < threshold) return;
  const highNeeds = NEEDS.reduce((count, need) => (state.stats[need] >= 70 ? count + 1 : count), 0);
  const currentIndex = STAGE_SEQUENCE.indexOf(state.stage);
  const nextStage = STAGE_SEQUENCE[currentIndex + 1];
  if (nextStage && highNeeds >= 4) {
    state.stage = nextStage;
    addHistory(`${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – Grew into a ${nextStage}!`);
  }
}

function advanceTime(minutes) {
  if (!minutes) return;
  state.ageMinutes += minutes;
  applyDecay(minutes);
  updateMood();
  advanceStageIfReady();
}

function applyAction(key) {
  const action = ACTIONS[key];
  if (!action) return;
  advanceTime(action.minutes || 0);
  Object.entries(action.deltas || {}).forEach(([need, delta]) => {
    if (!NEEDS.includes(need)) return;
    state.stats[need] = clamp(state.stats[need] + delta, 0, 100);
  });
  updateMood();
  const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  addHistory(`${stamp} – ${action.label}`);
  render();
  maybeSave();
}

function renderStats() {
  NEEDS.forEach((need) => {
    const value = Math.round(state.stats[need]);
    const valueElement = elements.statList.querySelector(`.stat-value[data-need="${need}"]`);
    const barElement = elements.statList.querySelector(`.progress-bar[data-need="${need}"]`);
    if (!valueElement || !barElement) return;
    valueElement.textContent = `${value}`;
    barElement.style.width = `${value}%`;
    barElement.classList.toggle("low", value < 35);
  });
}

function renderHistory() {
  elements.history.innerHTML = "";
  state.history
    .slice()
    .reverse()
    .forEach((entry) => {
      const li = document.createElement("li");
      li.textContent = entry;
      elements.history.appendChild(li);
    });
}

function renderDetails() {
  elements.stage.textContent = state.stage;
  elements.mood.textContent = state.mood;
  elements.age.textContent = formatMinutes(state.ageMinutes);
  elements.traits.textContent = state.traits.join(", ");
  elements.sprite.className = `pet-sprite mood-${state.mood}`;
  if (!elements.sprite.querySelector(".mouth")) {
    const mouth = document.createElement("div");
    mouth.className = "mouth";
    elements.sprite.appendChild(mouth);
  }
}

function render() {
  renderStats();
  renderHistory();
  renderDetails();
}

function maybeSave(force = false) {
  const now = Date.now();
  if (force || now - state.lastSaved >= SAVE_INTERVAL_MS) {
    state.lastSaved = now;
    saveState(state);
  }
}

function gameTick() {
  const now = Date.now();
  const elapsed = now - state.lastTick;
  if (elapsed >= TICK_INTERVAL_MS) {
    const minutes = Math.floor(elapsed / TICK_INTERVAL_MS);
    advanceTime(minutes);
    state.lastTick = now - (elapsed - minutes * TICK_INTERVAL_MS);
    render();
    maybeSave();
  }
  requestAnimationFrame(gameTick);
}

function bindActions() {
  Object.entries(ACTIONS).forEach(([key, action]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "action-button";
    button.innerHTML = `<strong>${action.label}</strong><span>${action.description}</span>`;
    button.addEventListener("click", () => applyAction(key));
    elements.actionGrid.appendChild(button);
  });

  document.querySelector("#rename-button").addEventListener("click", () => {
    const nextName = elements.nameInput.value.trim();
    if (!nextName) return;
    state.name = nextName;
    addHistory(`${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – Chose the name ${nextName}`);
    render();
    maybeSave(true);
  });

  document.querySelector("#reset-button").addEventListener("click", () => {
    if (!confirm("Reset your Tomagotchi and clear saved progress?")) return;
    const fresh = createDefaultState();
    Object.assign(state, fresh);
    elements.nameInput.value = state.name;
    addHistory(`${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – Restarted the journey`);
    render();
    maybeSave(true);
  });
}

bindActions();
render();
requestAnimationFrame(gameTick);

window.addEventListener("beforeunload", () => {
  maybeSave(true);
});

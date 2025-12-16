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
const TRAIT_EFFECTS = {
  energetic: {
    label: "Energetic",
    description: "Loves to move and chase, trading stamina for excitement.",
    adjust(deltas, context) {
      const next = { ...deltas };
      if (context.type === "action" && context.key === "play") {
        next.happiness = (next.happiness || 0) + 4;
        next.energy = (next.energy || 0) - 4;
      }
      if (context.type === "event" && context.tag === "active") {
        next.happiness = (next.happiness || 0) + 3;
        next.energy = (next.energy || 0) - 2;
      }
      return next;
    },
  },
  shy: {
    label: "Shy",
    description: "Warms up slowly and tires after big social moments.",
    adjust(deltas, context) {
      const next = { ...deltas };
      if (context.type === "action" && context.key === "talk") {
        next.social = (next.social || 0) - 2;
        next.energy = (next.energy || 0) - 2;
      }
      if (context.type === "event" && context.tag === "social") {
        next.happiness = (next.happiness || 0) - 2;
      }
      return next;
    },
  },
  gentle: {
    label: "Gentle",
    description: "Responds well to calm care.",
    adjust(deltas, context) {
      const next = { ...deltas };
      if (context.type === "action" && context.key === "rest") {
        next.health = (next.health || 0) + 2;
      }
      return next;
    },
  },
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
const EVENT_COOLDOWN_MIN = 24;
const EVENT_COOLDOWN_JITTER = 12;
const HISTORY_LIMIT = 24;
const CRITICAL_THRESHOLD = 25;
const EVENT_POOL = [
  {
    id: "mysterious-snack",
    title: "Found a mysterious snack",
    description: "A crinkly wrapper hides something that smells tasty.",
    tag: "food",
    choices: [
      {
        label: "Let them nibble",
        deltas: { nourishment: 10, happiness: 4, health: -4 },
        history: "Sampled the strange snack.",
      },
      {
        label: "Swap with a safe treat",
        deltas: { nourishment: 6, happiness: 3, health: 2 },
        history: "Offered a safer bite instead.",
      },
    ],
  },
  {
    id: "shy-day",
    title: "Feeling shy today",
    description: "Your companion keeps peeking from behind their paws.",
    requiresTrait: "shy",
    tag: "social",
    choices: [
      {
        label: "Give space",
        deltas: { happiness: 2, social: -2, energy: 2 },
        history: "Gave them quiet room to breathe.",
      },
      {
        label: "Encourage gently",
        deltas: { social: 6, happiness: 2, energy: -2 },
        history: "Coaxed them into soft conversation.",
      },
    ],
  },
  {
    id: "zoomies",
    title: "Sudden zoomies",
    description: "Energy bubbles up and paws scamper around the room.",
    requiresTrait: "energetic",
    tag: "active",
    choices: [
      {
        label: "Join the chase",
        deltas: { happiness: 6, social: 4, energy: -6, cleanliness: -4 },
        history: "Joined the sprinting frenzy.",
      },
      {
        label: "Guide a cooldown",
        deltas: { energy: -2, health: 2, happiness: 2 },
        history: "Helped them settle with stretches.",
      },
    ],
  },
  {
    id: "sunbeam-nap",
    title: "Sunbeam spotted",
    description: "A warm patch of sunlight invites a cozy pause.",
    tag: "rest",
    choices: [
      {
        label: "Nap together",
        deltas: { energy: 8, health: 4, social: 2 },
        history: "Shared a soft sunbeam nap.",
      },
      {
        label: "Save it for later",
        deltas: { happiness: -2, energy: 2 },
        history: "Missed the moment but stayed alert.",
      },
    ],
  },
  {
    id: "sickness",
    title: "Sudden sickness",
    description: "A feverish chill leaves them groggy and vulnerable.",
    tag: "health",
    triggeredOnly: true,
    resolvesDebuff: "sickness",
    choices: [
      {
        label: "Offer medicine and rest",
        deltas: { health: 22, energy: 6, cleanliness: -4, happiness: -2 },
        clearsDebuff: true,
        history: "Nursed them patiently back to strength.",
      },
      {
        label: "Wait it out",
        deltas: { health: 12, energy: -4, happiness: -4 },
        clearsDebuff: true,
        history: "Weathered the sickness together.",
      },
    ],
  },
  {
    id: "meltdown",
    title: "Emotional meltdown",
    description: "Overwhelmed feelings spill over into tears and stomps.",
    tag: "stress",
    triggeredOnly: true,
    resolvesDebuff: "meltdown",
    choices: [
      {
        label: "Soothe and listen",
        deltas: { happiness: 14, social: 10, energy: -6 },
        clearsDebuff: true,
        history: "Helped them feel heard and safe.",
      },
      {
        label: "Give quiet space",
        deltas: { happiness: 6, social: -4, energy: 4 },
        clearsDebuff: true,
        history: "Let them cool down at their own pace.",
      },
    ],
  },
  {
    id: "exhaustion",
    title: "Bone-deep exhaustion",
    description: "Their eyelids droop and paws drag after pushing too hard.",
    tag: "fatigue",
    triggeredOnly: true,
    resolvesDebuff: "exhaustion",
    choices: [
      {
        label: "Tuck them into bed",
        deltas: { energy: 24, health: 6, social: -4 },
        clearsDebuff: true,
        history: "Guided them into deep, healing rest.",
      },
      {
        label: "Encourage gentle stretching",
        deltas: { energy: 10, health: 4, happiness: 4 },
        clearsDebuff: true,
        history: "Loosened the tired muscles with light stretches.",
      },
    ],
  },
];

function createDefaultState() {
  return {
    name: "Nova",
    stage: "egg",
    ageMinutes: 0,
    stats: Object.fromEntries(NEEDS.map((need) => [need, 85])),
    traits: ["gentle", "energetic"],
    mood: "content",
    history: [],
    events: [],
    eventHistory: [],
    activeDebuffs: [],
    nextEventMinute: EVENT_COOLDOWN_MIN,
    lastTick: Date.now(),
    lastSaved: Date.now(),
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function applyTraitModifiers(deltas, context) {
  return state.traits.reduce((current, trait) => {
    const effect = TRAIT_EFFECTS[trait];
    if (!effect || typeof effect.adjust !== "function") {
      return current;
    }
    return effect.adjust(current, context);
  }, { ...deltas });
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
    parsed.traits = Array.isArray(parsed.traits) && parsed.traits.length ? parsed.traits : ["gentle", "energetic"];
    parsed.events = Array.isArray(parsed.events)
      ? parsed.events.map((event) => ({
          ...event,
          createdAt:
            event.createdAt ||
            new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }))
      : [];
    parsed.eventHistory = Array.isArray(parsed.eventHistory)
      ? parsed.eventHistory.slice(-HISTORY_LIMIT)
      : [];
    parsed.activeDebuffs = Array.isArray(parsed.activeDebuffs) ? parsed.activeDebuffs : [];
    parsed.nextEventMinute = Number.isFinite(parsed.nextEventMinute)
      ? parsed.nextEventMinute
      : parsed.ageMinutes + EVENT_COOLDOWN_MIN;
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
enforceStatCaps();

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
  events: document.querySelector("#event-feed"),
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

function addEventHistory(entry) {
  state.eventHistory.push(entry);
  if (state.eventHistory.length > HISTORY_LIMIT) {
    state.eventHistory.splice(0, state.eventHistory.length - HISTORY_LIMIT);
  }
  addHistory(entry);
}

function getEventDefinition(id) {
  return EVENT_POOL.find((entry) => entry.id === id);
}

function hasPendingEvent(id) {
  return state.events.some((event) => event.id === id);
}

function enqueueEventById(id) {
  if (hasPendingEvent(id)) return;
  const definition = getEventDefinition(id);
  if (!definition) return;
  const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const payload = { ...definition, createdAt: stamp };
  state.events.push(payload);
  addEventHistory(`${stamp} – ${definition.title}`);
}

function enforceStatCaps() {
  const caps = {};
  state.activeDebuffs.forEach((debuff) => {
    Object.entries(debuff.caps || {}).forEach(([need, maxValue]) => {
      const next = caps[need] === undefined ? maxValue : Math.min(caps[need], maxValue);
      caps[need] = next;
    });
  });
  Object.entries(caps).forEach(([need, cap]) => {
    if (!NEEDS.includes(need)) return;
    state.stats[need] = Math.min(state.stats[need], cap);
  });
}

function removeDebuff(id, reason) {
  const existing = state.activeDebuffs.find((entry) => entry.id === id);
  if (!existing) return;
  state.activeDebuffs = state.activeDebuffs.filter((entry) => entry.id !== id);
  if (reason) {
    addHistory(reason);
  }
}

function removeExpiredDebuffs() {
  const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  state.activeDebuffs
    .filter((entry) => entry.expiresAt <= state.ageMinutes)
    .forEach((entry) => {
      addHistory(`${stamp} – Recovered from ${entry.label}`);
    });
  state.activeDebuffs = state.activeDebuffs.filter((entry) => entry.expiresAt > state.ageMinutes);
}

function applyDebuff({ id, label, duration, blockedActions = [], caps = {}, history }) {
  if (state.activeDebuffs.some((entry) => entry.id === id)) {
    return;
  }
  const expiresAt = state.ageMinutes + duration;
  state.activeDebuffs.push({ id, label, expiresAt, blockedActions, caps });
  const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  addHistory(`${stamp} – ${history || label}`);
  enforceStatCaps();
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

function checkCriticalNeeds() {
  const crises = [
    {
      id: "sickness",
      label: "sickness",
      trigger: () => state.stats.health < CRITICAL_THRESHOLD,
      duration: 360,
      blockedActions: ["play"],
      caps: { energy: 85, happiness: 80 },
      history: "Fell sick and needs extra care.",
    },
    {
      id: "meltdown",
      label: "emotional meltdown",
      trigger: () => state.stats.happiness < CRITICAL_THRESHOLD || state.stats.social < CRITICAL_THRESHOLD,
      duration: 240,
      blockedActions: ["discipline", "play"],
      caps: { happiness: 75, social: 75 },
      history: "Feelings spiraled into a meltdown.",
    },
    {
      id: "exhaustion",
      label: "exhaustion",
      trigger: () => state.stats.energy < CRITICAL_THRESHOLD,
      duration: 180,
      blockedActions: ["play", "talk"],
      caps: { energy: 70 },
      history: "Energy crashed and everything feels heavy.",
    },
  ];

  crises.forEach((crisis) => {
    if (!crisis.trigger()) return;
    applyDebuff({
      id: crisis.id,
      label: crisis.label,
      duration: crisis.duration,
      blockedActions: crisis.blockedActions,
      caps: crisis.caps,
      history: crisis.history,
    });
    enqueueEventById(crisis.id);
  });
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

function scheduleNextEvent() {
  const jitter = Math.floor(Math.random() * EVENT_COOLDOWN_JITTER);
  state.nextEventMinute = state.ageMinutes + EVENT_COOLDOWN_MIN + jitter;
}

function enqueueRandomEvent() {
  const candidates = EVENT_POOL.filter((event) => {
    if (event.requiresTrait && !state.traits.includes(event.requiresTrait)) {
      return false;
    }
    if (event.triggeredOnly) {
      return false;
    }
    return true;
  });
  if (!candidates.length) {
    scheduleNextEvent();
    return;
  }
  const selectedEvent = candidates[Math.floor(Math.random() * candidates.length)];
  const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const payload = { ...selectedEvent, createdAt: stamp };
  state.events.push(payload);
  addEventHistory(`${stamp} – ${selectedEvent.title}`);
  scheduleNextEvent();
}

function advanceTime(minutes) {
  if (!minutes) return;
  state.ageMinutes += minutes;
  removeExpiredDebuffs();
  applyDecay(minutes);
  enforceStatCaps();
  checkCriticalNeeds();
  updateMood();
  advanceStageIfReady();
  while (state.ageMinutes >= state.nextEventMinute) {
    enqueueRandomEvent();
  }
}

function applyAction(key) {
  const action = ACTIONS[key];
  if (!action) return;
  const blockingDebuff = state.activeDebuffs.find((debuff) =>
    (debuff.blockedActions || []).includes(key)
  );
  if (blockingDebuff) {
    const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    addHistory(`${stamp} – Too affected by ${blockingDebuff.label} to ${action.label.toLowerCase()}`);
    render();
    maybeSave();
    return;
  }
  advanceTime(action.minutes || 0);
  const deltas = applyTraitModifiers(action.deltas || {}, { type: "action", key });
  Object.entries(deltas).forEach(([need, delta]) => {
    if (!NEEDS.includes(need)) return;
    state.stats[need] = clamp(state.stats[need] + delta, 0, 100);
  });
  enforceStatCaps();
  updateMood();
  const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  addHistory(`${stamp} – ${action.label}`);
  render();
  maybeSave();
}

function resolveEvent(eventId, choiceIndex) {
  const eventIndex = state.events.findIndex((entry) => entry.id === eventId);
  if (eventIndex === -1) return;
  const event = state.events[eventIndex];
  const choice = event.choices?.[choiceIndex];
  if (!choice) return;
  const deltas = applyTraitModifiers(choice.deltas || {}, {
    type: "event",
    key: event.id,
    tag: event.tag,
  });
  Object.entries(deltas).forEach(([need, delta]) => {
    if (!NEEDS.includes(need)) return;
    state.stats[need] = clamp(state.stats[need] + delta, 0, 100);
  });
  enforceStatCaps();
  updateMood();
  const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (choice.clearsDebuff) {
    const recoveredMessage = `${stamp} – Recovered from ${event.resolvesDebuff || event.id}`;
    removeDebuff(event.resolvesDebuff || event.id, recoveredMessage);
  }
  addEventHistory(`${stamp} – ${event.title}: ${choice.history || choice.label}`);
  state.events.splice(eventIndex, 1);
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

function renderEvents() {
  elements.events.innerHTML = "";
  if (!state.events.length) {
    const empty = document.createElement("div");
    empty.className = "event-empty";
    empty.textContent = "No pending surprises right now.";
    elements.events.appendChild(empty);
    return;
  }

  state.events.forEach((event) => {
    const card = document.createElement("article");
    card.className = "event-card";

    const header = document.createElement("div");
    header.className = "event-header";

    const title = document.createElement("h3");
    title.className = "event-title";
    title.textContent = event.title;

    const meta = document.createElement("span");
    meta.className = "event-meta";
    meta.textContent = event.createdAt;

    header.appendChild(title);
    header.appendChild(meta);

    const body = document.createElement("p");
    body.className = "event-body";
    body.textContent = event.description;

    const actions = document.createElement("div");
    actions.className = "event-actions";
    (event.choices || []).forEach((choice, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "event-button";
      button.textContent = choice.label;
      button.addEventListener("click", () => resolveEvent(event.id, index));
      actions.appendChild(button);
    });

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(actions);
    elements.events.appendChild(card);
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
  renderEvents();
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

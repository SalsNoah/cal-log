const STORAGE_KEY = "cal-log-v1";

// 体重60kg想定。METs × 体重 × 時間 × 1.05 から概算（個人差あり）
const EXERCISES = [
  {
    id: "abs",
    name: "腹筋",
    unit: "回",
    kcalPerCount: 0.2,
    hint: "1回あたり 0.2 kcal（体重60kg目安）",
  },
  {
    id: "back",
    name: "背筋",
    unit: "回",
    kcalPerCount: 0.2,
    hint: "1回あたり 0.2 kcal（体重60kg目安）",
  },
  {
    id: "squat",
    name: "スクワット",
    unit: "回",
    kcalPerCount: 0.2,
    hint: "1回あたり 0.2 kcal（自重・普通ペース）",
  },
  {
    id: "tongue",
    name: "舌回し",
    unit: "カウント",
    kcalPerCount: 0.5,
    hint: "1カウント = 20周 / 0.5 kcal（推定）",
  },
  {
    id: "vacuum",
    name: "おなかをへこませる",
    unit: "分",
    kcalPerCount: 2.0,
    hint: "1分あたり 2.0 kcal（ドローイン想定）",
  },
  {
    id: "walk",
    name: "ウォーキング",
    unit: "セット",
    kcalPerCount: 37,
    hint: "1セット = 10分 / 37 kcal（普通歩き）",
  },
  {
    id: "step",
    name: "踏み台昇降",
    unit: "セット",
    kcalPerCount: 50,
    hint: "1セット = 10分 / 50 kcal（台高約15cm）",
  },
];

const els = {
  dayCalories: document.getElementById("day-calories"),
  totalCalories: document.getElementById("total-calories"),
  datePicker: document.getElementById("date-picker"),
  prevDay: document.getElementById("prev-day"),
  nextDay: document.getElementById("next-day"),
  gotoToday: document.getElementById("goto-today"),
  exerciseList: document.getElementById("exercise-list"),
  historyList: document.getElementById("history-list"),
  toggleHistory: document.getElementById("toggle-history"),
};

let state = loadState();
let selectedDate = todayKey();

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftDate(key, delta) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function emptyDay() {
  return Object.fromEntries(EXERCISES.map((ex) => [ex.id, 0]));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { days: {} };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.days) {
      return { days: {} };
    }
    return parsed;
  } catch {
    return { days: {} };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getDay(dateKey) {
  if (!state.days[dateKey]) {
    state.days[dateKey] = emptyDay();
  }
  return state.days[dateKey];
}

function calcDayCalories(day) {
  return EXERCISES.reduce((sum, ex) => {
    const count = Number(day[ex.id] || 0);
    return sum + count * ex.kcalPerCount;
  }, 0);
}

function calcTotalCalories() {
  return Object.values(state.days).reduce(
    (sum, day) => sum + calcDayCalories(day),
    0
  );
}

function formatKcal(value) {
  const n = Math.round(value * 10) / 10;
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function renderExercises() {
  const day = getDay(selectedDate);
  els.exerciseList.innerHTML = EXERCISES.map((ex) => {
    const count = day[ex.id] || 0;
    const kcal = count * ex.kcalPerCount;
    return `
      <article class="exercise-card" data-id="${ex.id}">
        <div class="exercise-top">
          <div>
            <h3 class="exercise-name">${ex.name}</h3>
            <p class="exercise-meta">${ex.hint}</p>
          </div>
          <div class="exercise-kcal">${formatKcal(kcal)} kcal</div>
        </div>
        <div class="counter-row">
          <button type="button" class="counter-btn minus" data-action="dec" aria-label="${ex.name}を減らす">−</button>
          <div class="counter-value">${count}<span style="font-size:0.85rem;font-weight:600;color:var(--muted);margin-left:4px">${ex.unit}</span></div>
          <button type="button" class="counter-btn plus" data-action="inc" aria-label="${ex.name}を増やす">＋</button>
        </div>
        <div class="exercise-actions">
          <button type="button" class="reset-btn" data-action="reset">リセット</button>
        </div>
      </article>
    `;
  }).join("");
}

function renderSummary() {
  const day = getDay(selectedDate);
  els.dayCalories.textContent = formatKcal(calcDayCalories(day));
  els.totalCalories.textContent = formatKcal(calcTotalCalories());
}

function renderHistory() {
  const entries = Object.entries(state.days)
    .map(([date, day]) => ({ date, kcal: calcDayCalories(day) }))
    .filter((e) => e.kcal > 0)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  if (entries.length === 0) {
    els.historyList.innerHTML =
      '<li class="history-empty">まだ記録がありません</li>';
    return;
  }

  els.historyList.innerHTML = entries
    .map(
      (e) => `
      <li class="history-item" data-date="${e.date}">
        <span class="date">${e.date}</span>
        <span class="kcal">${formatKcal(e.kcal)} kcal</span>
      </li>
    `
    )
    .join("");
}

function renderAll() {
  els.datePicker.value = selectedDate;
  renderExercises();
  renderSummary();
  renderHistory();
  pruneEmptyDays();
}

function pruneEmptyDays() {
  for (const [date, day] of Object.entries(state.days)) {
    if (date === selectedDate) continue;
    const allZero = EXERCISES.every((ex) => !day[ex.id]);
    if (allZero) delete state.days[date];
  }
  saveState();
}

function changeCount(exerciseId, delta) {
  const day = getDay(selectedDate);
  const next = Math.max(0, (day[exerciseId] || 0) + delta);
  day[exerciseId] = next;
  saveState();
  renderAll();
}

function resetCount(exerciseId) {
  const day = getDay(selectedDate);
  day[exerciseId] = 0;
  saveState();
  renderAll();
}

els.exerciseList.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-action]");
  if (!btn) return;
  const card = btn.closest(".exercise-card");
  if (!card) return;
  const id = card.dataset.id;
  const action = btn.dataset.action;
  if (action === "inc") changeCount(id, 1);
  if (action === "dec") changeCount(id, -1);
  if (action === "reset") resetCount(id);
});

els.datePicker.addEventListener("change", () => {
  if (!els.datePicker.value) return;
  selectedDate = els.datePicker.value;
  renderAll();
});

els.prevDay.addEventListener("click", () => {
  selectedDate = shiftDate(selectedDate, -1);
  renderAll();
});

els.nextDay.addEventListener("click", () => {
  selectedDate = shiftDate(selectedDate, 1);
  renderAll();
});

els.gotoToday.addEventListener("click", () => {
  selectedDate = todayKey();
  renderAll();
});

els.toggleHistory.addEventListener("click", () => {
  const hidden = els.historyList.classList.toggle("hidden");
  els.toggleHistory.textContent = hidden ? "表示" : "隠す";
});

els.historyList.addEventListener("click", (event) => {
  const item = event.target.closest(".history-item");
  if (!item) return;
  selectedDate = item.dataset.date;
  renderAll();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

renderAll();

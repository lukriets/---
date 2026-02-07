const diceCount = document.getElementById("dice-count");
const diceType = document.getElementById("dice-type");
const modifier = document.getElementById("modifier");
const rollMode = document.getElementById("roll-mode");
const explode = document.getElementById("explode");
const dropLow = document.getElementById("drop-low");
const dropHigh = document.getElementById("drop-high");
const rollNow = document.getElementById("roll-now");
const clearHistory = document.getElementById("clear-history");
const resultTotal = document.getElementById("result-total");
const resultDetails = document.getElementById("result-details");
const diceShowcase = document.getElementById("dice-showcase");
const history = document.getElementById("history");
const chips = document.querySelectorAll(".chip");

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const rollSingle = (sides, allowExplode) => {
  const results = [];
  let roll = Math.floor(Math.random() * sides) + 1;
  results.push(roll);
  if (allowExplode) {
    while (roll === sides && results.length < 10) {
      roll = Math.floor(Math.random() * sides) + 1;
      results.push(roll);
    }
  }
  return results;
};

const rollDicePool = (count, sides, allowExplode) => {
  const pool = [];
  for (let i = 0; i < count; i += 1) {
    pool.push(...rollSingle(sides, allowExplode));
  }
  return pool;
};

const applyDropRules = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  let dropped = [];
  let kept = [...values];

  if (dropLow.checked && sorted.length > 1) {
    const min = sorted[0];
    const index = kept.indexOf(min);
    dropped.push(kept.splice(index, 1)[0]);
  }
  if (dropHigh.checked && kept.length > 1) {
    const max = Math.max(...kept);
    const index = kept.indexOf(max);
    dropped.push(kept.splice(index, 1)[0]);
  }

  return { kept, dropped };
};

const summarizeRoll = (values, dropped, modValue, modeLabel) => {
  const sum = values.reduce((acc, val) => acc + val, 0) + modValue;
  const droppedText = dropped.length ? ` | сброшены: ${dropped.join(", ")}` : "";
  const modText = modValue ? ` | мод: ${modValue > 0 ? "+" : ""}${modValue}` : "";
  return { sum, detail: `${modeLabel}: [${values.join(", ")}]${droppedText}${modText}` };
};

const renderDice = (values, dropped) => {
  diceShowcase.innerHTML = "";
  values.forEach((value) => {
    const die = document.createElement("div");
    die.className = "die";
    die.textContent = value;
    diceShowcase.appendChild(die);
  });
  dropped.forEach((value) => {
    const die = document.createElement("div");
    die.className = "die";
    die.textContent = `${value}×`;
    die.style.opacity = "0.4";
    diceShowcase.appendChild(die);
  });
};

const pushHistory = (summary, total) => {
  const item = document.createElement("li");
  item.innerHTML = `<strong>${total}</strong> ${summary}<span>${new Date().toLocaleTimeString("ru-RU")}</span>`;
  history.prepend(item);
  if (history.children.length > 12) {
    history.removeChild(history.lastChild);
  }
};

const rollDice = () => {
  const count = clamp(parseInt(diceCount.value, 10) || 1, 1, 50);
  const sides = parseInt(diceType.value, 10);
  const modValue = clamp(parseInt(modifier.value, 10) || 0, -50, 50);

  let values = [];
  let modeLabel = `${count}d${sides}`;

  if (rollMode.value === "advantage" || rollMode.value === "disadvantage") {
    const first = rollDicePool(1, 20, false)[0];
    const second = rollDicePool(1, 20, false)[0];
    values = [first, second];
    const chosen = rollMode.value === "advantage" ? Math.max(first, second) : Math.min(first, second);
    const summary = `${rollMode.value === "advantage" ? "Преимущество" : "Помеха"}: [${first}, ${second}] → ${chosen}`;
    resultTotal.textContent = chosen + modValue;
    resultDetails.textContent = `${summary}${modValue ? ` | мод: ${modValue}` : ""}`;
    renderDice([chosen], []);
    pushHistory(summary, chosen + modValue);
    return;
  }

  values = rollDicePool(count, sides, explode.checked);
  const { kept, dropped } = applyDropRules(values);
  const summary = summarizeRoll(kept, dropped, modValue, modeLabel);

  resultTotal.textContent = summary.sum;
  resultDetails.textContent = summary.detail;
  renderDice(kept, dropped);
  pushHistory(summary.detail, summary.sum);
};

const applyPreset = (preset) => {
  const match = preset.match(/(\d+)d(\d+)(k\d+)?([+-]\d+)?/i);
  if (!match) return;
  const [, count, sides, keep, mod] = match;

  diceCount.value = count;
  diceType.value = sides;
  modifier.value = mod ? parseInt(mod, 10) : 0;
  dropLow.checked = false;
  dropHigh.checked = false;
  rollMode.value = "normal";

  if (keep && keep.toLowerCase() === "k3") {
    dropLow.checked = true;
  }
};

rollNow.addEventListener("click", rollDice);
clearHistory.addEventListener("click", () => {
  history.innerHTML = "";
});

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    applyPreset(chip.dataset.preset);
    rollDice();
  });
});

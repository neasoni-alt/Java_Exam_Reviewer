const LETTERS = ["A", "B", "C", "D"];
const userState = {}; // id -> { selected: number | null, pinned: boolean }

const container = document.getElementById("questions-container");
const searchInput = document.getElementById("search-input");
const domainSelect = document.getElementById("domain-select");
const hoverToggle = document.getElementById("hover-toggle");
const toggleAllBtn = document.getElementById("toggle-all-btn");
const resetBtn = document.getElementById("reset-btn");
const scoreVal = document.getElementById("score-val");
const answeredVal = document.getElementById("answered-val");
const countVal = document.getElementById("count-val");

let allRevealed = false;

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function updateStats(visibleCount) {
  let score = 0;
  let answered = 0;

  for (const qData of QUESTIONS) {
    const id = qData[0];
    const correctIdx = qData[4];
    const st = userState[id];
    if (st && st.selected !== null) {
      answered++;
      if (st.selected === correctIdx) score++;
    }
  }

  scoreVal.textContent = score;
  answeredVal.textContent = answered;
  if (typeof visibleCount === "number") {
    countVal.textContent = visibleCount;
  }
}

function renderQuestions() {
  const query = searchInput.value.trim().toLowerCase();
  const domainFilter = domainSelect.value;

  container.innerHTML = "";
  let currentDomain = null;
  let visibleCount = 0;

  QUESTIONS.forEach(([id, qText, code, options, ansIdx, explanation]) => {
    const domain = id.split(".")[0];
    if (domainFilter !== "ALL" && domain !== domainFilter) return;

    const searchable =
      `${id} ${qText} ${code} ${options.join(" ")} ${explanation}`.toLowerCase();
    if (query && !searchable.includes(query)) return;

    visibleCount++;

    if (domain !== currentDomain) {
      currentDomain = domain;
      const banner = document.createElement("div");
      banner.className = "domain-banner";
      banner.textContent = DOMAIN_NAMES[domain] || `Domain ${domain}`;
      container.appendChild(banner);
    }

    if (!userState[id]) {
      userState[id] = { selected: null, pinned: allRevealed };
    }

    const st = userState[id];
    const card = document.createElement("div");
    card.className = "q-card";

    let html = `
      <div class="q-header">
        <span class="q-id">Question ${id}</span>
      </div>
      <div class="q-text">${escapeHtml(qText)}</div>
    `;

    if (code) {
      html += `<pre><code>${escapeHtml(code)}</code></pre>`;
    }

    html += `<div class="options-grid">`;
    options.forEach((optText, idx) => {
      let cls = "option-btn";
      if (st.selected !== null) {
        if (idx === ansIdx) cls += " correct";
        else if (idx === st.selected) cls += " wrong";
      }
      html += `
        <button class="${cls}" data-id="${id}" data-idx="${idx}">
          <span class="option-letter">${LETTERS[idx]}.</span>
          <span>${escapeHtml(optText)}</span>
        </button>
      `;
    });
    html += `</div>`;

    const pinnedClass = st.pinned ? "pinned" : "";
    html += `
      <div class="reveal-box ${pinnedClass}" data-reveal-id="${id}">
        <div class="reveal-prompt">
          🖱️ Move mouse pointer here or Click to reveal Answer &amp; Explanation
        </div>
        <div class="reveal-content">
          <div class="ans-badge">Answer: ${LETTERS[ansIdx]}</div>
          <div class="exp-text"><strong>Explanation:</strong> ${escapeHtml(explanation)}</div>
        </div>
      </div>
    `;

    card.innerHTML = html;
    container.appendChild(card);
  });

  updateStats(visibleCount);
}

// Event Delegation for Options & Reveal Boxes
container.addEventListener("click", (e) => {
  const optBtn = e.target.closest(".option-btn");
  if (optBtn) {
    const id = optBtn.getAttribute("data-id");
    const idx = parseInt(optBtn.getAttribute("data-idx"), 10);
    userState[id].selected = idx;
    userState[id].pinned = true;
    renderQuestions();
    return;
  }

  const revealBox = e.target.closest(".reveal-box");
  if (revealBox) {
    const id = revealBox.getAttribute("data-reveal-id");
    userState[id].pinned = !userState[id].pinned;
    revealBox.classList.toggle("pinned", userState[id].pinned);
  }
});

searchInput.addEventListener("input", renderQuestions);
domainSelect.addEventListener("change", renderQuestions);

hoverToggle.addEventListener("change", () => {
  document.body.classList.toggle("hover-enabled", hoverToggle.checked);
});

toggleAllBtn.addEventListener("click", () => {
  allRevealed = !allRevealed;
  QUESTIONS.forEach(([id]) => {
    if (!userState[id]) userState[id] = { selected: null, pinned: allRevealed };
    else userState[id].pinned = allRevealed;
  });
  toggleAllBtn.textContent = allRevealed ? "Hide All" : "Reveal All";
  renderQuestions();
});

resetBtn.addEventListener("click", () => {
  allRevealed = false;
  toggleAllBtn.textContent = "Reveal All";
  Object.keys(userState).forEach((k) => delete userState[k]);
  renderQuestions();
});

// Initial render
renderQuestions();

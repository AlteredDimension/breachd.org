// breachd.org — layered easter eggs
// 1) console quotes (Alter / Arrival)  2) Konami reveal  3) subtle hover surprise on the wordmark

const ALTER = [
  "The void is patient. So am I.",
  "There's always another way. I made sure of it.",
  "Don't fear the breach — fear what already came through.",
  "Every door I open, I've already walked through once.",
  "I am not from your world. Not anymore.",
];

const ARRIVAL = [
  "If you could see your whole life from start to finish, would you change things?",
  "Memory is a strange thing. It doesn't work like I thought it did.",
  "Despite knowing the journey and where it leads… I embrace it.",
  "Language is the first weapon drawn in a conflict.",
];

function pick(list) {
  // deterministic-ish without Math.random spam: rotate by minute
  const i = (new Date().getMinutes() + list.length) % list.length;
  return list[i];
}

export function initEasterEggs() {
  if (typeof window === "undefined") return;

  // 1) console quotes
  const style =
    "color:#63cfb7;font-family:monospace;font-size:13px;text-shadow:0 0 8px rgba(99,207,183,.6)";
  const styleDim = "color:#7d769a;font-family:monospace;font-size:11px";
  console.log("%c// breach:d", "color:#c89cfb;font-weight:700;font-size:22px;font-family:monospace");
  console.log(`%c"${pick(ALTER)}"  — Alter`, style);
  console.log(`%c"${pick(ARRIVAL)}"  — Arrival`, styleDim);
  console.log("%cTry the old code. ↑ ↑ ↓ ↓ ← → ← → B A", styleDim);

  // 2) Konami code → reveal
  const seq = [
    "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
    "b", "a",
  ];
  let pos = 0;
  window.addEventListener("keydown", (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = key === seq[pos] ? pos + 1 : key === seq[0] ? 1 : 0;
    if (pos === seq.length) {
      pos = 0;
      revealEasterEgg();
    }
  });

  // 3) hidden konami trigger by tapping the wordmark 5 times (mobile-friendly)
  const mark = document.querySelector("[data-wordmark]");
  if (mark) {
    let taps = 0;
    let t;
    mark.addEventListener("click", () => {
      taps++;
      clearTimeout(t);
      t = setTimeout(() => (taps = 0), 900);
      if (taps >= 5) {
        taps = 0;
        revealEasterEgg();
      }
    });
  }
}

let revealed = false;
function revealEasterEgg() {
  if (revealed) {
    document.getElementById("egg-overlay")?.classList.add("egg-open");
    return;
  }
  revealed = true;
  const eggs = ["/img/easter-egg-1.jpg", "/img/easter-egg-2.jpg"];
  const src = eggs[(new Date().getSeconds() % eggs.length)];

  const el = document.createElement("div");
  el.id = "egg-overlay";
  el.className = "egg-open";
  el.innerHTML = `
    <div class="egg-inner">
      <span class="egg-tag">easter_egg.exe</span>
      <img src="${src}" alt="" />
      <p class="egg-quote">"${pick(ALTER)}"</p>
      <button class="egg-close" aria-label="close">close ✕</button>
    </div>`;
  document.body.appendChild(el);

  const close = () => el.classList.remove("egg-open");
  el.querySelector(".egg-close")?.addEventListener("click", close);
  el.addEventListener("click", (e) => {
    if (e.target === el) close();
  });
  window.addEventListener("keydown", (e) => e.key === "Escape" && close());

  if (!document.getElementById("egg-style")) {
    const s = document.createElement("style");
    s.id = "egg-style";
    s.textContent = `
      #egg-overlay{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;
        background:rgba(13,9,21,.82);backdrop-filter:blur(14px);opacity:0;pointer-events:none;
        transition:opacity .4s ease}
      #egg-overlay.egg-open{opacity:1;pointer-events:auto}
      .egg-inner{position:relative;max-width:min(520px,86vw);text-align:center;transform:translateY(14px) scale(.98);
        transition:transform .5s cubic-bezier(.22,1,.36,1)}
      #egg-overlay.egg-open .egg-inner{transform:none}
      .egg-inner img{width:100%;border-radius:16px;border:1px solid rgba(99,207,183,.4);
        box-shadow:0 0 60px rgba(190,109,230,.45)}
      .egg-tag{font-family:monospace;letter-spacing:.3em;text-transform:uppercase;font-size:.7rem;
        color:#63cfb7;display:block;margin-bottom:.9rem}
      .egg-quote{font-family:monospace;color:#c89cfb;font-size:.85rem;margin:1rem 0 0}
      .egg-close{margin-top:1.2rem;background:transparent;border:1px solid rgba(196,156,251,.4);
        color:#ece9f5;font-family:monospace;padding:.5rem 1.1rem;border-radius:999px;cursor:pointer;
        transition:all .2s ease}
      .egg-close:hover{border-color:#63cfb7;color:#63cfb7}`;
    document.head.appendChild(s);
  }
}

// Utilities
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const byId = (id) => document.getElementById(id);
const behaviorTo10 = (b) => {
  switch(b){
    case "Outstanding": return 10;
    case "Excellent": return 9.5;
    case "Very Good": return 8.5;
    case "Good": return 7;
    default: return NaN;
  }
};

// History (localStorage)
const KEY = "spp_records_v1";
const getHistory = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
};
const setHistory = (arr) => localStorage.setItem(KEY, JSON.stringify(arr.slice(0, 100))); // cap at 100

const historyBody = byId("historyBody");
const renderHistory = () => {
  const rows = getHistory().map(r => {
    const tr = document.createElement("tr");
    const cells = [
      new Date(r.ts).toLocaleString(),
      r.attendance + "%",
      r.marks + "%",
      r.overall + "%",
      r.behavior,
      r.timeUse + "%",
      r.score.toFixed(2)
    ];
    cells.forEach(c=>{
      const td = document.createElement("td");
      td.textContent = String(c);
      tr.appendChild(td);
    });
    return tr;
  });
  historyBody.innerHTML = "";
  rows.forEach(row => historyBody.appendChild(row));
};

// Result
const resultBox = byId("result");
const showResult = (score, tips, chips=[]) => {
  const container = document.createElement("div");
  const scoreEl = document.createElement("div");
  scoreEl.className = "score";
  scoreEl.textContent = score.toFixed(2) + " / 10";

  const level = document.createElement("div");
  level.className = "badge";
  level.style.borderColor = score >= 9 ? "rgba(158,240,192,.5)" : score >= 7 ? "rgba(255,210,122,.5)" : "rgba(255,140,140,.5)";
  level.textContent = score >= 9 ? "Excellent" : score >= 7 ? "On Track" : "Needs Improvement";

  const tipEl = document.createElement("div");
  tipEl.className = "muted";
  tipEl.style.marginTop = "8px";
  tipEl.textContent = tips;

  const chipWrap = document.createElement("div");
  chipWrap.className = "chips";
  chipWrap.style.marginTop = "10px";
  chips.forEach(c=>{
    const s = document.createElement("span");
    s.className = "chip";
    s.textContent = c;
    chipWrap.appendChild(s);
  });

  container.append(scoreEl, level, tipEl, chipWrap);
  resultBox.innerHTML = "";
  resultBox.appendChild(container);
};

// Validation and scoring
const form = byId("predictForm");
const formError = byId("formError");
form.addEventListener("submit", (e)=>{
  e.preventDefault();
  formError.textContent = "";

  const attendance = Number((byId("attendance").value || "").trim());
  const marks = Number((byId("marks").value || "").trim());
  const overall = Number((byId("overall").value || "").trim());
  const behavior = (byId("behavior").value || "").trim();
  const timeUse = Number((byId("timeUse").value || "").trim());

  // Client-side validation
  const inRange = (n)=> Number.isFinite(n) && n>=0 && n<=100;
  if(!inRange(attendance) || !inRange(marks) || !inRange(overall) || !inRange(timeUse) || !behavior){
    formError.textContent = "Please enter valid values (0–100) and select behavior.";
    return;
  }

  const bh = behaviorTo10(behavior);
  if(!Number.isFinite(bh)){
    formError.textContent = "Behavior is required.";
    return;
  }

  // Convert to 10-point scale and average
  const factors = [
    attendance/10, marks/10, overall/10, bh, timeUse/10
  ];
  const score = factors.reduce((a,b)=>a+b,0)/factors.length;

  // Find weakest factor for guidance
  const labeled = [
    {k:"Attendance", v:attendance/10},
    {k:"Marks", v:marks/10},
    {k:"Overall", v:overall/10},
    {k:"Behavior", v:bh},
    {k:"Time Use", v:timeUse/10},
  ].sort((a,b)=>a.v-b.v);
  const weakest = labeled[0].k;

  const tips =
    score>=9
      ? "Fantastic work! Maintain consistency. Explore stretch goals, research internships, and advanced coursework."
      : score>=7
        ? `You're on track. Focus on ${weakest.toLowerCase()} with weekly targets and review cycles to lift your score.`
        : `You need a reset plan. Prioritize ${weakest.toLowerCase()}, create a daily routine, and review basics with active recall.`;

  const chips = [
    attendance<85 ? "Improve Attendance" : "Keep Attendance",
    marks<75 ? "Practice Weak Topics" : "Advanced Practice",
    overall<75 ? "Weekly Progress Review" : "Maintain Consistency",
    timeUse<70 ? "Time Blocking" : "Sustain Time Plan",
    bh<8.5 ? "Class Engagement" : "Peer Mentoring"
  ];

  // Save to history
  const record = { ts: Date.now(), attendance, marks, overall, behavior, timeUse, score };
  const hist = getHistory(); hist.unshift(record); setHistory(hist);
  renderHistory();
  showResult(score, tips, chips);
});

byId("clearHistory").addEventListener("click", ()=>{
  if(confirm("Clear all local history?")){
    setHistory([]); renderHistory(); resultBox.innerHTML = '<div class="muted">History cleared.</div>';
  }
});

// Guidance assistant (rule-based, no AI)
const chatBox = byId("chatBox");
const chatInput = byId("chatInput");
const chatError = byId("chatError");
const appendMsg = (text, who="bot")=>{
  const d = document.createElement("div");
  d.className = "msg " + (who==="me" ? "me":"bot");
  d.textContent = text; // safe: no HTML injection
  chatBox.appendChild(d);
  chatBox.scrollTop = chatBox.scrollHeight;
};
const latestScore = ()=> {
  const h = getHistory();
  return h.length ? h[0].score : null;
};
const reply = (q)=>{
  const ql = q.toLowerCase();
  const s = latestScore();

  if(ql.includes("company") || ql.includes("apply")){
    if(s!==null && s>=8.5) return "Target top/product companies and research roles: Google, Microsoft, Adobe, Atlassian. Build 2 strong projects and practice DSA + system design basics.";
    return "Start with solid foundations and consistent projects. Consider TCS, Infosys, Wipro, Accenture. Build resume + practice aptitude and coding rounds.";
  }
  if(ql.includes("attendance")) return "Aim for 90%+. Use time-blocking, morning classes, and accountability with a study buddy.";
  if(ql.includes("marks") || ql.includes("improve")) return "Use active recall, spaced repetition, and weekly mock tests. Review errors and create a 'why I failed' log.";
  if(ql.includes("sports")) return "Balance 45–60 mins training with study sprints. Prioritize sleep (7–8h), hydration, and post-training protein + carbs.";
  if(ql.includes("diet") || ql.includes("food") || ql.includes("nutrition")) return "Balanced plates: protein (eggs, legumes), complex carbs (rice, oats), healthy fats (nuts). Hydrate 2–3L/day. Reduce sugar.";
  if(ql.includes("time") || ql.includes("routine")) return "Use 50/10 focus cycles, weekly planning on Sunday, daily top-3 priorities, and phone-free study blocks.";
  return "Great question! Share specifics (subject, target company, timeline) and I'll give you a focused plan.";
};
byId("sendChat").addEventListener("click", ()=>{
  chatError.textContent = "";
  const v = (chatInput.value || "").trim();
  if(!v){ chatError.textContent = "Type a message."; return; }
  if(v.length>500){ chatError.textContent = "Message too long (max 500)."; return; }
  appendMsg(v, "me");
  setTimeout(()=> appendMsg(reply(v), "bot"), 200);
  chatInput.value = "";
});

// Documents (local preview only)
const fileInput = byId("fileInput");
const fileList = byId("fileList");
fileInput.addEventListener("change", ()=>{
  fileList.innerHTML = "";
  const files = Array.from(fileInput.files || []);
  files.slice(0,10).forEach(f=>{
    const row = document.createElement("div"); row.className="file";
    const info = document.createElement("div");
    const name = document.createElement("div"); name.textContent = f.name;
    const meta = document.createElement("div"); meta.className="muted"; meta.textContent = `${(f.size/1024).toFixed(1)} KB • ${f.type || "file"}`;
    info.append(name, meta);
    row.appendChild(info);

    if(f.type.startsWith("image/")){
      const img = document.createElement("img");
      img.className = "preview";
      img.alt = "Selected image preview";
      img.src = URL.createObjectURL(f);
      row.appendChild(img);
      img.onload = ()=> URL.revokeObjectURL(img.src);
    }
    fileList.appendChild(row);
  });
});

// Init
renderHistory();

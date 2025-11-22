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
// ==========================================
// GUIDANCE ASSISTANT 🤖 (FIXED & IMPROVED)
// ==========================================

const chatBox = byId("chatBox");
const chatInput = byId("chatInput");
const sendBtn = byId("sendChat");
const chatError = byId("chatError");

// 1. Message Appender (UI Update)
const appendMsg = (text, who = "bot") => {
  const d = document.createElement("div");
  d.className = "msg " + (who === "me" ? "me" : "bot");
  d.textContent = text; 
  chatBox.appendChild(d);
  chatBox.scrollTop = chatBox.scrollHeight;
};

// 2. Smart Reply Logic (Brain)
const getBotReply = (q) => {
  const ql = q.toLowerCase();
  const s = latestScore(); // Uses the score from your history function

  // Keywords matching
  if (ql.includes("company") || ql.includes("job") || ql.includes("placement")) {
    if (s !== null && s >= 8.5) return "Based on your high score: Target Product-based companies (Google, Microsoft, Atlassian). Focus on DSA, System Design, and 2 major projects.";
    return "Based on current performance: Start with Service-based companies (TCS, Infosys, Wipro). Focus on Aptitude, basic coding, and building a strong resume.";
  }
  
  if (ql.includes("attendance")) return "Target 90% attendance. Use the 'Time Blocking' technique and find a study partner to stay accountable.";
  
  if (ql.includes("marks") || ql.includes("study") || ql.includes("exam")) return "To improve marks: Use 'Active Recall' and 'Spaced Repetition'. Solve previous year papers and analyze your weak topics.";
  
  if (ql.includes("diet") || ql.includes("food")) return "Brain food: Walnuts, eggs, plenty of water (3L/day), and avoid heavy sugary meals before study sessions.";
  
  if (ql.includes("sports") || ql.includes("gym")) return "Physical activity boosts focus! 45 mins of daily exercise is enough. Don't sacrifice sleep for gym.";

  if (ql.includes("hello") || ql.includes("hi")) return "Hello! I am your academic guide. Ask me about Marks, Career, or Diet.";

  return "I didn't understand that. Try asking about: 'Improve Marks', 'Placement Strategy', or 'Attendance Tips'.";
};

// 3. Quick Reply Buttons (New Feature)
const showOptions = () => {
  const options = ["Improve Marks", "Placement Strategy", "Diet Plan", "Low Attendance"];
  const div = document.createElement("div");
  div.className = "options-container";
  
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "quick-btn";
    btn.innerText = opt;
    btn.onclick = () => handleUserAction(opt);
    div.appendChild(btn);
  });
  
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
};

// 4. Main Handler
const handleUserAction = (text) => {
  chatError.textContent = "";
  if (!text) return;
  
  // Remove old buttons if any
  const oldBtns = document.querySelectorAll(".options-container");
  oldBtns.forEach(el => el.remove());

  appendMsg(text, "me");
  
  // Simulate thinking delay
  setTimeout(() => {
    const reply = getBotReply(text);
    appendMsg(reply, "bot");
    
    // Show buttons again after bot replies
    setTimeout(showOptions, 500); 
  }, 600);
};

// 5. Event Listeners
sendBtn.addEventListener("click", () => {
  const txt = chatInput.value.trim();
  if (!txt) {
    chatError.textContent = "Please type a message.";
    return;
  }
  handleUserAction(txt);
  chatInput.value = "";
});

chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendBtn.click();
  }
});

// Helper: Get latest score from history for personalized advice
const latestScore = () => {
  const h = getHistory();
  return h.length ? h[0].score : null;
};

// Initial Greeting with buttons
setTimeout(showOptions, 1000);

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

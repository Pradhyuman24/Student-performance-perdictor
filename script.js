// Utilities
const byId = (id) => document.getElementById(id);
const behaviorTo10 = (b) => {
  switch(b){
    case "Outstanding": return 10;
    case "Excellent": return 9;
    case "Very Good": return 8;
    case "Good": return 7;
    default: return NaN;
  }
};

// History Management
const KEY = "spp_records_v1";
const getHistory = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
};
const setHistory = (arr) => localStorage.setItem(KEY, JSON.stringify(arr.slice(0, 50)));

const historyBody = byId("historyBody");
const renderHistory = () => {
  const rows = getHistory().map(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${new Date(r.ts).toLocaleDateString()}</td>
      <td>${r.attendance}%</td>
      <td>${r.marks}%</td>
      <td><strong>${r.score.toFixed(2)}</strong></td>
    `;
    return tr;
  });
  historyBody.innerHTML = "";
  rows.forEach(row => historyBody.appendChild(row));
};

// Result Rendering
const resultBox = byId("result");
const showResult = (score, tips, chips=[]) => {
  const container = document.createElement("div");
  
  // Score Display
  const scoreEl = document.createElement("div");
  scoreEl.className = "score";
  scoreEl.textContent = score.toFixed(2) + " / 10";

  // Badge
  const level = document.createElement("div");
  level.className = "badge";
  let color = score >= 8.5 ? "#9ef0c0" : score >= 6 ? "#ffd27a" : "#ff8c8c";
  level.style.borderColor = color;
  level.style.color = color;
  level.textContent = score >= 8.5 ? "Excellent Performance" : score >= 6 ? "Good / On Track" : "Needs Improvement";

  // Tips
  const tipEl = document.createElement("div");
  tipEl.className = "muted";
  tipEl.style.marginTop = "12px";
  tipEl.textContent = tips;

  // Action Chips
  const chipWrap = document.createElement("div");
  chipWrap.className = "chips";
  chipWrap.style.marginTop = "15px";
  chips.forEach(c => {
    const s = document.createElement("span");
    s.className = "chip";
    s.textContent = c;
    chipWrap.appendChild(s);
  });

  container.append(scoreEl, level, tipEl, chipWrap);
  resultBox.innerHTML = "";
  resultBox.appendChild(container);
};

// Core Logic & Form Handling
const form = byId("predictForm");
const formError = byId("formError");

form.addEventListener("submit", (e)=>{
  e.preventDefault();
  formError.textContent = "";

  const attendance = Number(byId("attendance").value);
  const marks = Number(byId("marks").value);
  const overall = Number(byId("overall").value); // Consistency
  const behaviorStr = byId("behavior").value;
  const timeUse = Number(byId("timeUse").value);

  // Validation
  if(attendance < 0 || attendance > 100 || marks < 0 || marks > 100) {
    formError.textContent = "Percentages must be between 0 and 100.";
    return;
  }
  if(!behaviorStr) {
    formError.textContent = "Please select a behavior rating.";
    return;
  }

  const behaviorScore = behaviorTo10(behaviorStr);

  // WEIGHTED ALGORITHM (Matches README)
  // Weights: Attendance(3), Marks(3), Behavior(3), Consistency(2), Time(2) -> Total 13
  const wAtt = 3, wMarks = 3, wBeh = 3, wCons = 2, wTime = 2;
  const totalWeight = wAtt + wMarks + wBeh + wCons + wTime;

  const weightedSum = 
    ((attendance/10) * wAtt) + 
    ((marks/10) * wMarks) + 
    (behaviorScore * wBeh) + 
    ((overall/10) * wCons) + 
    ((timeUse/10) * wTime);

  const finalScore = weightedSum / totalWeight;

  // Generate Advice
  const tips = finalScore >= 8.5 
    ? "Outstanding! Focus on advanced projects and research papers to stand out." 
    : finalScore >= 6 
      ? "You are doing okay, but consistency is key. Focus on increasing your attendance and submitting assignments on time." 
      : "Critical: You need a recovery plan. Meet your mentor immediately and focus on passing upcoming internals.";

  const chips = [];
  if(attendance < 75) chips.push("⚠️ Low Attendance");
  if(marks < 60) chips.push("📚 Remedial Classes");
  if(timeUse < 50) chips.push("⏰ Fix Schedule");
  if(finalScore > 9) chips.push("🏆 Gold Medal Track");

  // Save & Render
  const record = { ts: Date.now(), attendance, marks, score: finalScore };
  const hist = getHistory(); 
  hist.unshift(record); 
  setHistory(hist);
  
  renderHistory();
  showResult(finalScore, tips, chips);
});

byId("clearHistory").addEventListener("click", ()=>{
  if(confirm("Clear local history?")){
    setHistory([]); renderHistory(); 
    resultBox.innerHTML = '<div class="muted">History cleared.</div>';
  }
});

// Chatbot Logic
const chatBox = byId("chatBox");
const chatInput = byId("chatInput");
const sendBtn = byId("sendChat");

const appendMsg = (text, type) => {
  const d = document.createElement("div");
  d.className = `msg ${type}`;
  d.textContent = text;
  chatBox.appendChild(d);
  chatBox.scrollTop = chatBox.scrollHeight;
};

const getBotReply = (msg) => {
  const m = msg.toLowerCase();
  const hist = getHistory();
  const lastScore = hist.length ? hist[0].score : 0;

  if(m.includes("job") || m.includes("placement") || m.includes("company")) {
    if(lastScore > 8) return "With your high score, aim for Product-based companies (Google, Amazon, Adobe). Focus on DSA and System Design.";
    return "Start with Service-based companies (TCS, Infosys). Build a strong resume and focus on Aptitude tests.";
  }
  if(m.includes("diet") || m.includes("food")) return "Eat brain foods: Walnuts, berries, and stay hydrated. Avoid heavy meals before study hours.";
  if(m.includes("attendance")) return "If attendance is low, talk to your HOD immediately. Ensure you don't miss any labs moving forward.";
  if(m.includes("hello") || m.includes("hi")) return "Hello! Ask me about: Placements, Diet, or Attendance tips.";
  
  return "I'm a simple bot. Try asking about 'Placements', 'Diet', or 'Attendance'.";
};

// Chat Interaction
const handleChat = () => {
  const txt = chatInput.value.trim();
  if(!txt) return;
  
  appendMsg(txt, "me");
  chatInput.value = "";
  
  // Simulate delay
  setTimeout(() => {
    appendMsg(getBotReply(txt), "bot");
    showQuickOptions();
  }, 600);
};

// Quick Options
const showQuickOptions = () => {
  // Remove existing options if any
  const existing = document.querySelectorAll('.options-container');
  existing.forEach(e => e.remove());

  const div = document.createElement("div");
  div.className = "options-container";
  ["Improve Marks", "Placement Strategy", "Healthy Diet"].forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "quick-btn";
    btn.textContent = opt;
    btn.onclick = () => { chatInput.value = opt; handleChat(); };
    div.appendChild(btn);
  });
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
};

sendBtn.addEventListener("click", handleChat);
chatInput.addEventListener("keypress", (e) => { if(e.key === "Enter") handleChat(); });
setTimeout(showQuickOptions, 1000);

// File Preview
const fileInput = byId("fileInput");
const fileList = byId("fileList");

fileInput.addEventListener("change", () => {
  fileList.innerHTML = "";
  Array.from(fileInput.files).slice(0,5).forEach(f => {
    const row = document.createElement("div");
    row.className = "file";
    
    const info = document.createElement("div");
    info.innerHTML = `<div>${f.name}</div><div class="muted" style="font-size:11px">${(f.size/1024).toFixed(1)} KB</div>`;
    
    row.appendChild(info);

    if(f.type.startsWith("image/")){
      const img = document.createElement("img");
      img.className = "preview";
      img.src = URL.createObjectURL(f);
      row.appendChild(img);
    }
    fileList.appendChild(row);
  });
});

// Init
renderHistory();
showQuickOptions();

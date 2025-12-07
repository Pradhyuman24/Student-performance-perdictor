// --- Utilities ---
const byId = (id) => document.getElementById(id);

// Convert text behavior to a numeric score
const behaviorTo10 = (b) => {
  switch(b){
    case "Outstanding": return 10;
    case "Excellent": return 9;
    case "Very Good": return 8;
    case "Good": return 7;
    default: return 0;
  }
};

// --- History Management (LocalStorage) ---
const KEY = "spp_records_v1";

const getHistory = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
};

const setHistory = (arr) => {
  localStorage.setItem(KEY, JSON.stringify(arr.slice(0, 50))); // Keep last 50 records
};

// Render History Table
const historyBody = byId("historyBody");

const renderHistory = () => {
  const rows = getHistory().map(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="color: var(--text-sub)">${new Date(r.ts).toLocaleDateString()}</td>
      <td>${r.attendance}%</td>
      <td>${r.marks}%</td>
      <td style="color: var(--primary); font-weight:700">${r.score.toFixed(2)}</td>
    `;
    return tr;
  });
  historyBody.innerHTML = "";
  if(rows.length === 0) {
    historyBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px; color: var(--text-sub)">No records yet</td></tr>`;
  } else {
    rows.forEach(row => historyBody.appendChild(row));
  }
};

// --- Result Rendering ---
const resultBox = byId("result");

const showResult = (score, tips, chips=[]) => {
  const container = document.createElement("div");
  container.style.textAlign = "center";
  container.style.animation = "popIn 0.4s ease-out";
  
  // 1. Score Display
  const scoreEl = document.createElement("div");
  scoreEl.className = "score";
  scoreEl.textContent = score.toFixed(1) + " / 10";
  // Color code the score based on CSS variables
  if(score >= 8.5) scoreEl.style.color = "var(--success)"; // Emerald
  else if(score >= 6) scoreEl.style.color = "var(--primary)"; // Blue
  else scoreEl.style.color = "var(--danger)"; // Rose

  // 2. Badge (Status)
  const level = document.createElement("div");
  level.className = "badge";
  
  if (score >= 8.5) {
    level.textContent = "Excellent Performance 🏆";
    level.style.color = "var(--success)";
    level.style.borderColor = "var(--success)";
    level.style.backgroundColor = "rgba(52, 211, 153, 0.1)";
  } else if (score >= 6) {
    level.textContent = "Good / On Track ✅";
    level.style.color = "var(--primary)";
    level.style.borderColor = "var(--primary)";
    level.style.backgroundColor = "rgba(56, 189, 248, 0.1)";
  } else {
    level.textContent = "Needs Improvement ⚠️";
    level.style.color = "var(--danger)";
    level.style.borderColor = "var(--danger)";
    level.style.backgroundColor = "rgba(251, 113, 133, 0.1)";
  }

  // 3. Tips
  const tipEl = document.createElement("div");
  tipEl.className = "sub";
  tipEl.style.marginTop = "12px";
  tipEl.style.fontSize = "14px";
  tipEl.textContent = tips;

  // 4. Action Chips
  const chipWrap = document.createElement("div");
  chipWrap.style.display = "flex";
  chipWrap.style.justifyContent = "center";
  chipWrap.style.flexWrap = "wrap";
  chipWrap.style.gap = "8px";
  chipWrap.style.marginTop = "16px";

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

// --- Form Handling ---
const form = byId("predictForm");
const formError = byId("formError");

if(form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    formError.textContent = "";

    const attendance = Number(byId("attendance").value);
    const marks = Number(byId("marks").value);
    const overall = Number(byId("overall").value); 
    const behaviorStr = byId("behavior").value;
    const timeUse = Number(byId("timeUse").value);

    // Validation
    if(attendance < 0 || attendance > 100 || marks < 0 || marks > 100) {
      formError.textContent = "Error: Percentages must be between 0 and 100.";
      return;
    }
    if(!behaviorStr) {
      formError.textContent = "Error: Please select a behavior rating.";
      return;
    }

    const behaviorScore = behaviorTo10(behaviorStr);

    // Weights: Attendance(3), Marks(3), Behavior(3), Consistency(2), Time(2)
    const wAtt = 3, wMarks = 3, wBeh = 3, wCons = 2, wTime = 2;
    const totalWeight = 13;

    const weightedSum = 
      ((attendance/10) * wAtt) + 
      ((marks/10) * wMarks) + 
      (behaviorScore * wBeh) + 
      ((overall/10) * wCons) + 
      ((timeUse/10) * wTime);

    const finalScore = weightedSum / totalWeight;

    // Generate Personalized Advice
    let advice = "";
    if (finalScore >= 8.5) advice = "Outstanding! Focus on advanced projects and research papers to maintain this lead.";
    else if (finalScore >= 6) advice = "Good progress. Consistency in attendance and timely assignments will push you to the next level.";
    else advice = "Critical: You need a recovery plan. Meet your mentor immediately and focus on passing upcoming internals.";

    // Generate Chips
    const chips = [];
    if(attendance < 75) chips.push("Low Attendance 📉");
    if(marks < 60) chips.push("Academic Alert 📚");
    if(timeUse < 50) chips.push("Fix Schedule ⏰");
    if(finalScore > 9) chips.push("Gold Medal Track 🥇");

    // Save & Render
    const record = { ts: Date.now(), attendance, marks, score: finalScore };
    const hist = getHistory(); 
    hist.unshift(record); // Add to top
    setHistory(hist);
    
    renderHistory();
    showResult(finalScore, advice, chips);
  });
}

// Clear History
const clearBtn = byId("clearHistory");
if(clearBtn) {
  clearBtn.addEventListener("click", () => {
    if(confirm("Are you sure you want to clear your local history?")){
      setHistory([]); 
      renderHistory(); 
      resultBox.innerHTML = '<div class="sub">History cleared.</div>';
    }
  });
}

// --- Chatbot Logic ---
const chatBox = byId("chatBox");
const chatInput = byId("chatInput");
const sendBtn = byId("sendChat");

const appendMsg = (text, type) => {
  const d = document.createElement("div");
  d.className = `msg ${type}`;
  d.textContent = text;
  chatBox.appendChild(d);
  chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
};

const getBotReply = (msg) => {
  const m = msg.toLowerCase();
  const hist = getHistory();
  const lastScore = hist.length ? hist[0].score : 0;

  if(m.includes("job") || m.includes("placement") || m.includes("company")) {
    if(lastScore > 8) return "With your score (>8), target Product-based companies (Google, Amazon). Focus on DSA.";
    return "Start with Service-based companies (TCS, Infosys). Build a strong resume and work on Aptitude.";
  }
  if(m.includes("diet") || m.includes("food")) return "Eat brain foods: Walnuts, berries, and stay hydrated. Avoid heavy meals before studying.";
  if(m.includes("attendance")) return "If attendance is low (<75%), talk to your HOD immediately. Don't miss labs.";
  if(m.includes("hello") || m.includes("hi")) return "Hello! I can help with Placements, Diet, or Study Tips.";
  
  return "I didn't catch that. Try asking about 'Placements', 'Diet', or 'Attendance'.";
};

const handleChat = () => {
  const txt = chatInput.value.trim();
  if(!txt) return;
  
  appendMsg(txt, "me");
  chatInput.value = "";
  
  // Simulate bot thinking delay
  setTimeout(() => {
    appendMsg(getBotReply(txt), "bot");
  }, 600);
};

// Add Quick Option Buttons
const showQuickOptions = () => {
  // Check if options already exist to avoid duplicates
  if(document.querySelector('.options-row')) return;

  const div = document.createElement("div");
  div.className = "options-row";
  // Styling to match CSS theme
  div.style.display = "flex";
  div.style.flexWrap = "wrap";
  div.style.marginTop = "10px";
  div.style.gap = "8px";

  ["Improve Marks", "Placement Strategy", "Healthy Diet"].forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "quick-btn";
    btn.textContent = opt;
    btn.onclick = () => { 
      chatInput.value = opt; 
      handleChat(); 
    };
    div.appendChild(btn);
  });
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
};

if(sendBtn) sendBtn.addEventListener("click", handleChat);
if(chatInput) chatInput.addEventListener("keypress", (e) => { if(e.key === "Enter") handleChat(); });

// --- File Preview Logic ---
const fileInput = byId("fileInput");
const fileList = byId("fileList");

if(fileInput) {
  fileInput.addEventListener("change", () => {
    fileList.innerHTML = "";
    Array.from(fileInput.files).slice(0,5).forEach(f => {
      const row = document.createElement("div");
      // Use inline styles to match the glassmorphism look
      row.style.background = "rgba(255, 255, 255, 0.05)";
      row.style.borderRadius = "8px";
      row.style.padding = "8px";
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "10px";
      row.style.marginBottom = "8px";
      
      // File Icon / Image Preview
      let icon = `<div style="font-size:20px;">📄</div>`;
      if(f.type.startsWith("image/")){
        const imgUrl = URL.createObjectURL(f);
        icon = `<img src="${imgUrl}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;">`;
      }

      const info = `
        <div style="flex:1; overflow:hidden;">
           <div style="font-size:13px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${f.name}</div>
           <div style="font-size:11px; color:var(--text-sub)">${(f.size/1024).toFixed(1)} KB</div>
        </div>
      `;
      
      row.innerHTML = icon + info;
      fileList.appendChild(row);
    });
  });
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  renderHistory();
  setTimeout(showQuickOptions, 800); // Show chips after a slight delay
});

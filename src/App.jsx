import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import Onboarding from "./Onboarding";

// ---------- helpers ----------
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const fmt = (n) => Math.round(n).toLocaleString();
const uid = () => Math.random().toString(36).slice(2, 9);

const resizeToBase64 = (file, maxDim = 1024) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.82).split(",")[1]);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Couldn't read that image")); };
    img.src = url;
  });

const JSON_SHAPE = '{"items":[{"name":"short food name","calories":number,"protein_g":number}],"confidence":"low"|"medium"|"high","note":"one short sentence on what drives uncertainty"}';

const callClaude = async (content, token) => {
  const res = await fetch("/.netlify/functions/estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ messages: [{ role: "user", content }] }),
  });
  const data = await res.json();
  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
  return JSON.parse(text.replace(/```json|```/g, "").trim());
};

const DEFAULT_PRESETS = [
  { id: "p1", name: "Huel breakfast", cal: 200, pro: 20 },
  { id: "p2", name: "Lunch sandwich", cal: 400, pro: 18 },
  { id: "p3", name: "Huel Hot & Savoury", cal: 387, pro: 24 },
  { id: "p4", name: "Coffee, dash of milk", cal: 25, pro: 1 },
  { id: "p5", name: "Latte / flat white", cal: 140, pro: 7 },
];

// ---------- design tokens: night telemetry ----------
const T = {
  text: "#EDF1F7",
  sub: "#8B95A7",
  faint: "#5E6878",
  glass: "rgba(255,255,255,0.045)",
  glassBorder: "rgba(255,255,255,0.09)",
  fuel: "#4DA3FF",
  burn: "#FF6B35",
  good: "#3DDC84",
  bad: "#FF5C5C",
  amber: "#FFB454",
};
const numFont = { fontFamily: "'Barlow Condensed','Arial Narrow',ui-sans-serif,sans-serif", fontVariantNumeric: "tabular-nums" };
const labelStyle = { fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700 };
const cardStyle = {
  background: T.glass, border: `1px solid ${T.glassBorder}`, borderRadius: 22,
  padding: 20, marginBottom: 14, backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
};
const inputStyle = {
  width: "100%", padding: "13px 14px", borderRadius: 13, border: `1px solid rgba(255,255,255,0.12)`,
  background: "rgba(255,255,255,0.06)", fontSize: 16, color: T.text, outline: "none", boxSizing: "border-box",
};
const btn = (bg, color = "#fff") => ({
  padding: "13px 18px", borderRadius: 13, border: "none", background: bg, color,
  fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: "0.02em",
});
const GRAD_FUEL = "linear-gradient(135deg,#2E7CF6,#4DA3FF)";
const GRAD_BURN = "linear-gradient(135deg,#E8431F,#FF7B42)";
const GRAD_INK = "linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.07))";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
  button { font-family: inherit; transition: transform .12s ease, opacity .12s ease, box-shadow .2s ease; }
  button:active { transform: scale(0.96); }
  button:focus-visible, input:focus-visible { outline: 2px solid ${T.fuel}; outline-offset: 2px; }
  input { font-family: inherit; transition: border-color .15s ease, background .15s ease; }
  input::placeholder { color: ${T.faint}; }
  input:focus { border-color: rgba(77,163,255,0.55) !important; background: rgba(255,255,255,0.08) !important; }
  @keyframes cardIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  @keyframes sheetUp { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }
  .card-in { animation: cardIn .55s cubic-bezier(.2,.7,.2,1) both; }
  .sheet-in { animation: sheetUp .35s cubic-bezier(.2,.7,.2,1) both; }
  @media (prefers-reduced-motion: reduce) { .card-in, .sheet-in, .anim { animation: none !important; opacity: 1 !important; } button { transition: none; } }
  @media (min-width: 1024px) {
    .today-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start; }
  }
  .navitem:hover { background: rgba(255,255,255,0.06) !important; }
`;
const BG = "radial-gradient(1200px 800px at 50% -10%, #1A2740 0%, #0E1626 45%, #090E18 100%)";

// ---------- splash ----------
function Splash() {
  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',ui-sans-serif,system-ui,sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Inter:wght@400;500&display=swap');
        @keyframes rise { from { opacity: 0; transform: translateY(22px) scale(.97); } to { opacity: 1; transform: none; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes sweep { from { transform: translateX(-110%); } to { transform: translateX(310%); } }
        @keyframes ringSpin { from { stroke-dashoffset: 188; } to { stroke-dashoffset: 0; } }
        @media (prefers-reduced-motion: reduce) { .anim { animation: none !important; opacity: 1 !important; } }
      `}</style>
      <svg className="anim" width="74" height="74" viewBox="0 0 74 74" style={{ marginBottom: 26, animation: "fadeIn .6s both" }}>
        <defs>
          <linearGradient id="splashGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF6B35" /><stop offset="100%" stopColor="#FFB454" />
          </linearGradient>
        </defs>
        <circle cx="37" cy="37" r="30" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle className="anim" cx="37" cy="37" r="30" fill="none" stroke="url(#splashGrad)" strokeWidth="6" strokeLinecap="round"
          strokeDasharray="188" strokeDashoffset="188" transform="rotate(-90 37 37)"
          style={{ animation: "ringSpin 1.6s .3s cubic-bezier(.4,0,.2,1) forwards", filter: "drop-shadow(0 0 8px rgba(255,107,53,0.6))" }} />
      </svg>
      <div className="anim" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 58, fontWeight: 700, letterSpacing: "0.06em", color: "#fff", textTransform: "uppercase", lineHeight: 1, animation: "rise .8s .15s cubic-bezier(.2,.7,.2,1) both" }}>
        Deficit<span style={{ color: "#FF6B35" }}>.</span>
      </div>
      <div className="anim" style={{ fontSize: 11, letterSpacing: "0.38em", color: "#67748B", textTransform: "uppercase", marginTop: 14, animation: "fadeIn 1s .7s both" }}>
        Fuel in · Training out
      </div>
      <div className="anim" style={{ width: 160, height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden", marginTop: 40, animation: "fadeIn .8s .5s both" }}>
        <div className="anim" style={{ width: "38%", height: "100%", background: "linear-gradient(90deg,#FF6B35,#FFB454)", borderRadius: 2, animation: "sweep 1.2s .5s ease-in-out infinite", boxShadow: "0 0 10px rgba(255,107,53,0.7)" }} />
      </div>
    </div>
  );
}

// ---------- target ring ----------
function Ring({ net, target }) {
  const p = target > 0 ? Math.max(0, Math.min(net / target, 1)) : 0;
  const C = 2 * Math.PI * 34;
  const hit = net >= target && target > 0;
  return (
    <svg width="98" height="98" viewBox="0 0 98 98" aria-label={`${Math.round(p * 100)}% of deficit target`}>
      <defs>
        <linearGradient id="ringGood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3DDC84" /><stop offset="100%" stopColor="#4DD7C8" />
        </linearGradient>
        <linearGradient id="ringMid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2E7CF6" /><stop offset="100%" stopColor="#4DA3FF" />
        </linearGradient>
      </defs>
      <circle cx="49" cy="49" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
      <circle cx="49" cy="49" r="34" fill="none"
        stroke={net < 0 ? "#FF5C5C" : hit ? "url(#ringGood)" : "url(#ringMid)"}
        strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${p * C} ${C}`} transform="rotate(-90 49 49)"
        style={{ transition: "stroke-dasharray .6s cubic-bezier(.2,.7,.2,1)", filter: hit ? "drop-shadow(0 0 7px rgba(61,220,132,0.55))" : "none" }} />
      <text x="49" y="48" textAnchor="middle" fill="#fff" fontSize="19" fontWeight="700" fontFamily="'Barlow Condensed',sans-serif">{Math.round(p * 100)}%</text>
      <text x="49" y="63" textAnchor="middle" fill="#8B95A7" fontSize="9.5">of −{target}</text>
    </svg>
  );
}

// ---------- responsive ----------
function useIsDesktop() {
  const q = "(min-width: 1024px)";
  const [d, setD] = useState(typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const h = (e) => setD(e.matches);
    mq.addEventListener("change", h);
    setD(mq.matches);
    return () => mq.removeEventListener("change", h);
  }, []);
  return d;
}

export default function DeficitTracker({ session }) {  const userId = session.user.id;
  const token = session.access_token;
  const isDesktop = useIsDesktop();

  const [tab, setTab] = useState("today");
  const [settings, setSettings] = useState({ maintenance: 2500, target: 500, goalWeight: null, presets: DEFAULT_PRESETS, onboarded: false });
  const [showTour, setShowTour] = useState(false);
  const [day, setDay] = useState({ food: [], exercise: [] });
  const [summaries, setSummaries] = useState({});
  const [weights, setWeights] = useState({});
  const [ready, setReady] = useState(false);
  const [splash, setSplash] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [pending, setPending] = useState(null);
  const [error, setError] = useState("");
  const [foodDraft, setFoodDraft] = useState({ name: "", cal: "", pro: "" });
  const [exDraft, setExDraft] = useState({ name: "", cal: "" });
  const [descDraft, setDescDraft] = useState("");
  const [weightDraft, setWeightDraft] = useState("");
  const [maintDraft, setMaintDraft] = useState("2500");
  const [targetDraft, setTargetDraft] = useState("500");
  const [goalDraft, setGoalDraft] = useState("");
  const fileRef = useRef(null);
  const date = todayKey();

  // ---------- load from Supabase ----------
  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 2600);
    (async () => {
      try {
        const [stRes, daysRes, wRes, todayRes] = await Promise.all([
          supabase.from("settings").select("*").eq("user_id", userId).maybeSingle(),
          supabase.from("days").select("date,intake,protein,training,maintenance").eq("user_id", userId),
          supabase.from("weights").select("date,kg").eq("user_id", userId),
          supabase.from("days").select("entries").eq("user_id", userId).eq("date", date).maybeSingle(),
        ]);
        const seenLocally = (() => { try { return window.localStorage.getItem(`deficit.onboarded.${userId}`) === "1"; } catch { return false; } })();
        if (stRes.data) {
          const s = {
            maintenance: stRes.data.maintenance,
            target: stRes.data.target,
            goalWeight: stRes.data.goal_weight ? Number(stRes.data.goal_weight) : null,
            presets: Array.isArray(stRes.data.presets) && stRes.data.presets.length ? stRes.data.presets : DEFAULT_PRESETS,
            onboarded: !!stRes.data.onboarded,
          };
          setSettings(s); setMaintDraft(String(s.maintenance)); setTargetDraft(String(s.target)); setGoalDraft(s.goalWeight ? String(s.goalWeight) : "");
          if (!s.onboarded && !seenLocally) setShowTour(true);
        } else if (!seenLocally) {
          // brand-new user: no settings row yet → show the tour
          setShowTour(true);
        }
        if (daysRes.data) {
          const sums = {};
          daysRes.data.forEach(r => { sums[r.date] = { in: r.intake, ex: r.training, maint: r.maintenance, pro: r.protein }; });
          setSummaries(sums);
        }
        if (wRes.data) {
          const ws = {};
          wRes.data.forEach(r => { ws[r.date] = Number(r.kg); });
          setWeights(ws);
        }
        if (todayRes.data && todayRes.data.entries) setDay(todayRes.data.entries);
      } catch {
        setError("Couldn't load your data — check your connection and refresh.");
      }
      setReady(true);
    })();
    return () => clearTimeout(t);
  }, [userId]);

  // ---------- persistence ----------
  const persistDay = async (newDay) => {
    setDay(newDay);
    const intake = newDay.food.reduce((s, f) => s + f.cal, 0);
    const pro = newDay.food.reduce((s, f) => s + (f.pro || 0), 0);
    const exTotal = newDay.exercise.reduce((s, e) => s + e.cal, 0);
    setSummaries({ ...summaries, [date]: { in: intake, ex: exTotal, maint: settings.maintenance, pro } });
    const { error: err } = await supabase.from("days").upsert({
      user_id: userId, date, intake, protein: pro, training: exTotal, maintenance: settings.maintenance, entries: newDay, updated_at: new Date().toISOString(),
    });
    if (err) setError("Saving failed — your entry is shown but may not have synced.");
  };

  const persistSettings = async (s) => {
    setSettings(s);
    const { error: err } = await supabase.from("settings").upsert({
      user_id: userId, maintenance: s.maintenance, target: s.target, goal_weight: s.goalWeight, presets: s.presets, onboarded: s.onboarded ?? false, updated_at: new Date().toISOString(),
    });
    if (err) setError("Saving failed — settings may not have synced.");
  };

  const saveSettings = async () => {
    const m = parseInt(maintDraft, 10);
    const tg = parseInt(targetDraft, 10) || 0;
    const gw = goalDraft ? parseFloat(goalDraft.replace(",", ".")) : null;
    if (!m || m < 800 || m > 6000) { setError("Enter a daily burn between 800 and 6000 kcal."); return; }
    if (tg < 0 || tg > 2000) { setError("Deficit target should be between 0 and 2000 kcal."); return; }
    if (gw !== null && (isNaN(gw) || gw < 30 || gw > 250)) { setError("Goal weight should be between 30 and 250 kg."); return; }
    setError("");
    await persistSettings({ ...settings, maintenance: m, target: tg, goalWeight: gw, presets: (settings.presets || []).filter(p => p.name.trim() && p.cal > 0) });
    setTab("today");
  };

  const exportCSV = () => {
    const rows = [["date", "intake_kcal", "protein_g", "training_kcal", "baseline_kcal", "net_kcal", "weight_kg"]];
    const keys = [...new Set([...Object.keys(summaries), ...Object.keys(weights)])].sort();
    keys.forEach(k => {
      const s = summaries[k];
      const base = s ? (s.maint || settings.maintenance) : "";
      rows.push([k, s ? s.in : "", s ? (s.pro || 0) : "", s ? s.ex : "", base, s ? base + s.ex - s.in : "", weights[k] !== undefined ? weights[k] : ""]);
    });
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `deficit-export-${todayKey()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const finishTour = () => {
    setShowTour(false);
    try { window.localStorage.setItem(`deficit.onboarded.${userId}`, "1"); } catch {}
    if (!settings.onboarded) persistSettings({ ...settings, onboarded: true });
  };

  const applyBaseline = async (m) => {
    setMaintDraft(String(m));
    await persistSettings({ ...settings, maintenance: m });
  };

  const fetchDay = async (key) => {
    const { data } = await supabase.from("days").select("entries").eq("user_id", userId).eq("date", key).maybeSingle();
    return data ? data.entries : null;
  };

  const updatePreset = (id, patch) => setSettings({ ...settings, presets: settings.presets.map(p => p.id === id ? { ...p, ...patch } : p) });
  const removePreset = (id) => setSettings({ ...settings, presets: settings.presets.filter(p => p.id !== id) });
  const addPreset = () => setSettings({ ...settings, presets: [...(settings.presets || []), { id: uid(), name: "", cal: 0, pro: 0 }] });

  // ---------- logging ----------
  const nowTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const logPreset = (p) => persistDay({ ...day, food: [...day.food, { id: uid(), name: p.name, cal: p.cal, pro: p.pro || 0, time: nowTime(), src: "preset" }] });

  const addFood = () => {
    const cal = parseInt(foodDraft.cal, 10);
    if (!foodDraft.name.trim() || !cal) return;
    persistDay({ ...day, food: [...day.food, { id: uid(), name: foodDraft.name.trim(), cal, pro: parseInt(foodDraft.pro, 10) || 0, time: nowTime(), src: "manual" }] });
    setFoodDraft({ name: "", cal: "", pro: "" });
  };

  const addExercise = () => {
    const cal = parseInt(exDraft.cal, 10);
    if (!cal) return;
    persistDay({ ...day, exercise: [...day.exercise, { id: uid(), name: exDraft.name.trim() || "Workout", cal, time: nowTime() }] });
    setExDraft({ name: "", cal: "" });
  };

  const removeFood = (id) => persistDay({ ...day, food: day.food.filter(f => f.id !== id) });
  const removeExercise = (id) => persistDay({ ...day, exercise: day.exercise.filter(x => x.id !== id) });

  const logWeight = async () => {
    const w = parseFloat(weightDraft.replace(",", "."));
    if (!w || w < 30 || w > 250) { setError("Enter a weight between 30 and 250 kg."); return; }
    setError("");
    setWeights({ ...weights, [date]: w }); setWeightDraft("");
    const { error: err } = await supabase.from("weights").upsert({ user_id: userId, date, kg: w });
    if (err) setError("Saving failed — weight may not have synced.");
  };

  // ---------- AI estimates ----------
  const receiveEstimate = (parsed) => {
    if (!parsed.items || parsed.items.length === 0) { setError(parsed.note || "No food detected."); return; }
    setPending({
      items: parsed.items.map(i => ({ id: uid(), name: i.name, cal: Math.round(i.calories), pro: Math.round(i.protein_g || 0) })),
      confidence: parsed.confidence, note: parsed.note
    });
  };

  const onPhoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setError(""); setAnalyzing(true);
    try {
      const b64 = await resizeToBase64(file);
      const parsed = await callClaude([
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: b64 } },
        { type: "text", text: `Estimate the calories and protein in this food photo. Judge portion sizes from visual cues (plate size, utensils, packaging). Respond ONLY with raw JSON, no markdown fences, in this exact shape: ${JSON_SHAPE}. If no food is visible, return {"items":[],"confidence":"low","note":"No food detected"}.` }
      ], token);
      receiveEstimate(parsed);
    } catch { setError("Couldn't analyse that photo — try again or add it manually."); }
    setAnalyzing(false);
  };

  const describeFood = async () => {
    if (!descDraft.trim()) return;
    setError(""); setAnalyzing(true);
    try {
      const parsed = await callClaude(`Estimate calories and protein for this food description: "${descDraft.trim()}". Use typical UK portion sizes and brands where named. Respond ONLY with raw JSON, no markdown fences, in this exact shape: ${JSON_SHAPE}.`, token);
      receiveEstimate(parsed);
      setDescDraft("");
    } catch { setError("Couldn't estimate that — try rephrasing or add it manually."); }
    setAnalyzing(false);
  };

  const confirmPending = () => {
    const entries = pending.items.filter(i => i.cal > 0).map(i => ({ id: i.id, name: i.name, cal: i.cal, pro: i.pro || 0, time: nowTime(), src: "ai" }));
    persistDay({ ...day, food: [...day.food, ...entries] });
    setPending(null);
  };

  // ---------- maths ----------
  const intake = day.food.reduce((s, f) => s + f.cal, 0);
  const protein = day.food.reduce((s, f) => s + (f.pro || 0), 0);
  const exercise = day.exercise.reduce((s, e) => s + e.cal, 0);
  const burn = settings.maintenance + exercise;
  const net = burn - intake;
  const pct = burn > 0 ? Math.min(intake / burn, 1.35) : 0;
  const underFuelled = exercise >= 500 && (net > 1000 || intake < burn * 0.5);
  const lastWeights = Object.keys(weights).sort();
  const latestW = lastWeights.length ? weights[lastWeights[lastWeights.length - 1]] : null;

  if (!ready || splash) return <Splash />;

  const rowDivider = { borderTop: "1px solid rgba(255,255,255,0.07)" };  const sectionLabel = (color, text) => (
    <div style={{ ...labelStyle, color, marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: color, boxShadow: `0 0 6px ${color}` }} />{text}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'Inter',ui-sans-serif,system-ui,sans-serif", color: T.text }}>
      <style>{GLOBAL_CSS}</style>
      {showTour && <Onboarding onFinish={finishTour} isDesktop={isDesktop} />}

      {/* desktop sidebar */}
      {isDesktop && (
        <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 230, background: "rgba(255,255,255,0.03)", borderRight: `1px solid ${T.glassBorder}`, backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", padding: "28px 16px 22px", display: "flex", flexDirection: "column", zIndex: 30 }}>
          <div style={{ ...numFont, fontSize: 28, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 32, paddingLeft: 8 }}>Deficit<span style={{ color: T.burn }}>.</span></div>
          {[["today", "Today"], ["fuel", "Fuel"], ["board", "Board"], ["history", "History"], ["setup", "Setup"]].map(([k, lbl]) => (
            <button key={k} className="navitem" onClick={() => setTab(k)}
              style={{
                textAlign: "left", padding: "12px 14px", marginBottom: 4, borderRadius: 12, border: "none", cursor: "pointer",
                fontSize: 15, fontWeight: 700, letterSpacing: "0.03em",
                background: tab === k ? "linear-gradient(135deg,#E8431F,#FF7B42)" : "transparent",
                color: tab === k ? "#fff" : T.sub,
                boxShadow: tab === k ? "0 4px 16px rgba(232,67,31,0.35)" : "none",
              }}>
              {lbl}
            </button>
          ))}
          <div style={{ marginTop: "auto", paddingTop: 18, borderTop: `1px solid ${T.glassBorder}`, paddingLeft: 8 }}>
            {latestW && <div style={{ ...numFont, fontSize: 22, fontWeight: 700, color: "#B7A6FF" }}>{latestW} <span style={{ fontSize: 13, color: T.sub }}>kg</span></div>}
            <div style={{ fontSize: 12, color: T.faint, marginTop: 4, wordBreak: "break-all" }}>{session.user.email}</div>
          </div>
        </div>
      )}

      <div style={{
        maxWidth: isDesktop ? (tab === "board" ? 1180 : 940) : (tab === "board" ? 1100 : 460),
        margin: isDesktop ? "0 auto 0 230px" : "0 auto",
        padding: isDesktop ? "34px 40px 56px" : "22px 16px 110px",
        transition: "max-width .3s",
      }}>

        {/* header — mobile only; desktop uses the sidebar logo */}
        {!isDesktop && (
          <div className="card-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
            <div style={{ ...numFont, fontSize: 27, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Deficit<span style={{ color: T.burn }}>.</span></div>
            <div style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>{latestW ? `${latestW} kg` : ""}</div>
          </div>
        )}

        {error && (
          <div style={{ background: "rgba(255,92,92,0.12)", border: "1px solid rgba(255,92,92,0.3)", color: "#FF9B9B", borderRadius: 14, padding: "11px 14px", fontSize: 14, marginBottom: 12, display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span>{error}</span><button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#FF9B9B", fontWeight: 700, cursor: "pointer" }}>✕</button>
          </div>
        )}

        {tab === "today" && (
          <>
            {/* hero balance board */}
            <div className="card-in" style={{ ...cardStyle, background: "linear-gradient(160deg, rgba(46,124,246,0.10), rgba(255,255,255,0.03) 55%)", padding: "22px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", ...labelStyle, color: T.sub, marginBottom: 8 }}>
                <span>{new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                <span style={{ color: net >= 0 ? T.good : T.bad }}>{net >= 0 ? "In deficit" : "Over budget"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ ...numFont, fontSize: 62, fontWeight: 700, lineHeight: 1, color: net >= 0 ? T.good : T.bad, textShadow: net >= 0 ? "0 0 24px rgba(61,220,132,0.35)" : "0 0 24px rgba(255,92,92,0.3)" }}>
                  {net >= 0 ? "−" : "+"}{fmt(Math.abs(net))}
                  <span style={{ fontSize: 20, color: T.sub, marginLeft: 8, textShadow: "none" }}>kcal</span>
                </div>
                <Ring net={net} target={settings.target} />
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ position: "relative", height: 12, borderRadius: 6, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, width: `${Math.min(pct, 1) * 100}%`, background: GRAD_FUEL, transition: "width .5s cubic-bezier(.2,.7,.2,1)" }} />
                  {pct > 1 && <div style={{ position: "absolute", top: 0, bottom: 0, left: `${(1 / pct) * 100}%`, right: 0, background: T.bad }} />}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 9, fontSize: 13, fontWeight: 500 }}>
                  <span style={{ color: T.fuel }}>IN {fmt(intake)} <span style={{ color: T.sub }}>· {protein}g protein</span></span>
                  <span style={{ color: T.burn }}>OUT {fmt(burn)} <span style={{ color: T.sub }}>({fmt(exercise)} training)</span></span>
                </div>
              </div>
            </div>

            {/* fuelling guard */}
            {underFuelled && (
              <div className="card-in" style={{ background: "rgba(255,180,84,0.10)", border: "1px solid rgba(255,180,84,0.3)", color: "#FFD394", borderRadius: 16, padding: "13px 15px", fontSize: 14, lineHeight: 1.55, marginBottom: 14 }}>
                <strong style={{ color: T.amber }}>Big training day — easy on the deficit.</strong> You've burned {fmt(exercise)} kcal training and you're {fmt(net)} kcal down. Deficits this deep after hard sessions cost recovery and tomorrow's quality; fuel back toward your −{fmt(settings.target)} target, protein first.
              </div>
            )}

            <div className="today-cols">
            <div>
            {/* fuel in */}
            <div className="card-in" style={{ ...cardStyle, animationDelay: ".07s" }}>
              {sectionLabel(T.fuel, "Fuel in")}
              <button onClick={() => fileRef.current && fileRef.current.click()} disabled={analyzing}
                style={{ ...btn(GRAD_FUEL), width: "100%", padding: "16px", fontSize: 16, opacity: analyzing ? 0.55 : 1, boxShadow: "0 6px 20px rgba(46,124,246,0.35)" }}>
                {analyzing ? "Analysing…" : "📷  Photograph your food"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onPhoto} style={{ display: "none" }} />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input style={{ ...inputStyle, flex: 1 }} placeholder='Or describe it — "Pret chicken wrap"' value={descDraft} onChange={e => setDescDraft(e.target.value)} />
                <button onClick={describeFood} disabled={analyzing} style={{ ...btn("rgba(77,163,255,0.15)", T.fuel), border: "1px solid rgba(77,163,255,0.35)", opacity: analyzing ? 0.55 : 1 }}>Estimate</button>
              </div>
              {(settings.presets || []).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                  {settings.presets.map(p => (
                    <button key={p.id} onClick={() => logPreset(p)}
                      style={{ padding: "9px 14px", borderRadius: 999, border: `1px solid ${T.glassBorder}`, background: "rgba(255,255,255,0.06)", fontSize: 14, fontWeight: 600, color: T.text, cursor: "pointer" }}>
                      {p.name} <span style={{ ...numFont, color: T.fuel, fontWeight: 700, fontSize: 15 }}>{p.cal}</span>
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <input style={{ ...inputStyle, flex: 2 }} placeholder="Manual — e.g. Banana" value={foodDraft.name} onChange={e => setFoodDraft({ ...foodDraft, name: e.target.value })} />
                <input style={{ ...inputStyle, flex: 1 }} placeholder="kcal" inputMode="numeric" value={foodDraft.cal} onChange={e => setFoodDraft({ ...foodDraft, cal: e.target.value.replace(/\D/g, "") })} />
                <input style={{ ...inputStyle, flex: 0.9 }} placeholder="g" inputMode="numeric" value={foodDraft.pro} onChange={e => setFoodDraft({ ...foodDraft, pro: e.target.value.replace(/\D/g, "") })} />
                <button onClick={addFood} style={btn(GRAD_INK, T.text)}>Add</button>
              </div>
              {day.food.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  {day.food.map(f => (
                    <div key={f.id} style={{ display: "flex", alignItems: "center", padding: "10px 0", ...rowDivider, fontSize: 15 }}>
                      <span style={{ flex: 1 }}>{f.name} {f.pro > 0 && <span style={{ fontSize: 12, color: T.sub }}>{f.pro}g</span>}</span>
                      <span style={{ ...numFont, fontWeight: 700, fontSize: 17 }}>{fmt(f.cal)}</span>
                      <button onClick={() => removeFood(f.id)} aria-label={`Remove ${f.name}`} style={{ background: "none", border: "none", color: T.faint, cursor: "pointer", marginLeft: 12, fontSize: 14 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            </div>
            <div>
            {/* training out */}
            <div className="card-in" style={{ ...cardStyle, animationDelay: ".14s" }}>
              {sectionLabel(T.burn, "Training out")}
              <div style={{ fontSize: 13, color: T.sub, marginBottom: 12, marginTop: -4 }}>Copy active calories from your Garmin after each session — log as many as you like.</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input style={{ ...inputStyle, flex: 2 }} placeholder="e.g. Turbo session" value={exDraft.name} onChange={e => setExDraft({ ...exDraft, name: e.target.value })} />
                <input style={{ ...inputStyle, flex: 1 }} placeholder="kcal" inputMode="numeric" value={exDraft.cal} onChange={e => setExDraft({ ...exDraft, cal: e.target.value.replace(/\D/g, "") })} />
                <button onClick={addExercise} style={{ ...btn(GRAD_BURN), boxShadow: "0 6px 20px rgba(232,67,31,0.3)" }}>Add</button>
              </div>
              {day.exercise.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  {day.exercise.map(x => (
                    <div key={x.id} style={{ display: "flex", alignItems: "center", padding: "10px 0", ...rowDivider, fontSize: 15 }}>
                      <span style={{ flex: 1 }}>{x.name}</span>
                      <span style={{ ...numFont, fontWeight: 700, fontSize: 17, color: T.burn }}>{fmt(x.cal)}</span>
                      <button onClick={() => removeExercise(x.id)} aria-label={`Remove ${x.name}`} style={{ background: "none", border: "none", color: T.faint, cursor: "pointer", marginLeft: 12, fontSize: 14 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* weight */}
            <div className="card-in" style={{ ...cardStyle, animationDelay: ".21s", marginBottom: 0 }}>
              {sectionLabel("#B7A6FF", "Morning weight")}
              <div style={{ fontSize: 13, color: T.sub, marginBottom: 12, marginTop: -4 }}>A few times a week, same conditions. This calibrates your true daily burn over time.</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input style={{ ...inputStyle, flex: 1, ...numFont, fontWeight: 700, fontSize: 18 }} placeholder={latestW ? `Last: ${latestW} kg` : "kg"} inputMode="decimal" value={weightDraft} onChange={e => setWeightDraft(e.target.value.replace(/[^\d.,]/g, ""))} />
                <button onClick={logWeight} style={btn(GRAD_INK, T.text)}>Log</button>
              </div>
              {weights[date] && <div style={{ fontSize: 13, color: T.good, marginTop: 10 }}>✓ Logged {weights[date]} kg today</div>}
            </div>
            </div>
            </div>
          </>
        )}

        {tab === "history" && <History summaries={summaries} maintenance={settings.maintenance} weights={weights} onApplyBaseline={applyBaseline} fetchDay={fetchDay} />}

        {tab === "board" && <Board summaries={summaries} weights={weights} settings={settings} net={net} protein={protein} exercise={exercise} />}

        {tab === "fuel" && <FuelPlan latestW={latestW} target={settings.target} />}

        {tab === "setup" && (
          <div className="card-in" style={cardStyle}>
            {sectionLabel(T.sub, "Baseline burn")}
            <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.55, marginTop: -4 }}>
              Daily maintenance calories before training. Don't agonise — once you log weight regularly, the app will tell you what it really is.
            </p>
            <input style={{ ...inputStyle, fontSize: 20, ...numFont, fontWeight: 700 }} inputMode="numeric" value={maintDraft} onChange={e => setMaintDraft(e.target.value.replace(/\D/g, ""))} />

            <div style={{ marginTop: 26 }}>{sectionLabel(T.sub, "Daily deficit target")}</div>
            <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.55, marginTop: -4 }}>−500/day ≈ 0.5 kg/week — the sweet spot for losing weight without wrecking training quality.</p>
            <input style={{ ...inputStyle, fontSize: 20, ...numFont, fontWeight: 700 }} inputMode="numeric" value={targetDraft} onChange={e => setTargetDraft(e.target.value.replace(/\D/g, ""))} />

            <div style={{ marginTop: 26 }}>{sectionLabel(T.sub, "Goal weight")}</div>
            <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.55, marginTop: -4 }}>Optional. With weigh-ins logged, the Board projects your arrival date at the current trend.</p>
            <input style={{ ...inputStyle, fontSize: 20, ...numFont, fontWeight: 700 }} placeholder="kg" inputMode="decimal" value={goalDraft} onChange={e => setGoalDraft(e.target.value.replace(/[^\d.,]/g, ""))} />

            <div style={{ marginTop: 26 }}>{sectionLabel(T.sub, "Preset meals")}</div>
            <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.55, marginTop: -4 }}>One-tap logging on the Today screen. Name, kcal, protein (g).</p>
            {(settings.presets || []).map(p => (
              <div key={p.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <input style={{ ...inputStyle, flex: 2 }} placeholder="Meal name" value={p.name} onChange={e => updatePreset(p.id, { name: e.target.value })} />
                <input style={{ ...inputStyle, flex: 1, ...numFont, fontWeight: 700 }} placeholder="kcal" inputMode="numeric" value={p.cal || ""} onChange={e => updatePreset(p.id, { cal: parseInt(e.target.value.replace(/\D/g, ""), 10) || 0 })} />
                <input style={{ ...inputStyle, flex: 0.8 }} placeholder="g" inputMode="numeric" value={p.pro || ""} onChange={e => updatePreset(p.id, { pro: parseInt(e.target.value.replace(/\D/g, ""), 10) || 0 })} />
                <button onClick={() => removePreset(p.id)} aria-label={`Remove ${p.name || "preset"}`} style={{ background: "none", border: "none", color: T.faint, cursor: "pointer", fontSize: 14 }}>✕</button>
              </div>
            ))}
            <button onClick={addPreset} style={{ ...btn("rgba(255,255,255,0.08)", T.text), width: "100%", marginTop: 4, border: `1px solid ${T.glassBorder}` }}>+ Add preset</button>

            <button onClick={saveSettings} style={{ ...btn(GRAD_FUEL), width: "100%", marginTop: 18, boxShadow: "0 6px 20px rgba(46,124,246,0.35)" }}>Save settings</button>
            <button onClick={exportCSV} style={{ ...btn("rgba(255,255,255,0.08)", T.text), width: "100%", marginTop: 10, border: `1px solid ${T.glassBorder}` }}>⬇︎ Export all data (CSV)</button>
            <button onClick={() => { setTab("today"); setShowTour(true); }} style={{ ...btn("rgba(255,255,255,0.08)", T.text), width: "100%", marginTop: 10, border: `1px solid ${T.glassBorder}` }}>↻ Replay the tour</button>

            <div style={{ marginTop: 22, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: T.sub }}>{session.user.email}</span>
              <button onClick={() => supabase.auth.signOut()} style={{ ...btn("rgba(255,92,92,0.12)", "#FF9B9B"), border: "1px solid rgba(255,92,92,0.3)", padding: "10px 16px", fontSize: 14 }}>Sign out</button>
            </div>
          </div>
        )}
      </div>

      {/* estimate confirmation sheet */}
      {pending && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(5,8,14,0.7)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }}>
          <div className="sheet-in" style={{ background: "#141D2E", border: "1px solid rgba(255,255,255,0.1)", borderBottom: "none", borderRadius: "24px 24px 0 0", padding: "22px 20px 30px", width: "100%", maxWidth: 460, boxSizing: "border-box", boxShadow: "0 -12px 50px rgba(0,0,0,0.5)" }}>
            <div style={{ ...labelStyle, color: T.fuel }}>AI estimate · {pending.confidence} confidence</div>
            {pending.note && <div style={{ fontSize: 13, color: T.sub, margin: "7px 0 14px" }}>{pending.note}</div>}
            <div style={{ display: "flex", gap: 8, fontSize: 11, color: T.faint, marginBottom: 5, padding: "0 2px" }}>
              <span style={{ flex: 2 }}>Item</span><span style={{ flex: 1 }}>kcal</span><span style={{ flex: 0.8 }}>protein g</span>
            </div>
            {pending.items.map((i, idx) => (
              <div key={i.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <input style={{ ...inputStyle, flex: 2 }} value={i.name} onChange={e => { const items = [...pending.items]; items[idx] = { ...i, name: e.target.value }; setPending({ ...pending, items }); }} />
                <input style={{ ...inputStyle, flex: 1, ...numFont, fontWeight: 700 }} inputMode="numeric" value={i.cal} onChange={e => { const items = [...pending.items]; items[idx] = { ...i, cal: parseInt(e.target.value.replace(/\D/g, ""), 10) || 0 }; setPending({ ...pending, items }); }} />
                <input style={{ ...inputStyle, flex: 0.8 }} inputMode="numeric" value={i.pro} onChange={e => { const items = [...pending.items]; items[idx] = { ...i, pro: parseInt(e.target.value.replace(/\D/g, ""), 10) || 0 }; setPending({ ...pending, items }); }} />
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, margin: "12px 2px 18px" }}>
              <span>Total</span>
              <span style={numFont}>{fmt(pending.items.reduce((s, i) => s + (i.cal || 0), 0))} kcal · {pending.items.reduce((s, i) => s + (i.pro || 0), 0)}g protein</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setPending(null)} style={{ ...btn("rgba(255,255,255,0.08)", T.text), flex: 1, border: `1px solid ${T.glassBorder}` }}>Discard</button>
              <button onClick={confirmPending} style={{ ...btn(GRAD_FUEL), flex: 2, boxShadow: "0 6px 20px rgba(46,124,246,0.35)" }}>Log it</button>
            </div>
          </div>
        </div>
      )}

      {/* floating dock nav — mobile only; desktop uses the sidebar */}
      {!isDesktop && (
      <div style={{ position: "fixed", bottom: 14, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 40, pointerEvents: "none" }}>
        <div style={{ display: "flex", gap: 4, padding: 5, borderRadius: 999, background: "rgba(20,29,46,0.85)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", boxShadow: "0 10px 40px rgba(0,0,0,0.45)", pointerEvents: "auto" }}>
          {[["today", "Today"], ["fuel", "Fuel"], ["board", "Board"], ["history", "History"], ["setup", "Setup"]].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{
                padding: "11px 12px", borderRadius: 999, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
                background: tab === k ? "linear-gradient(135deg,#E8431F,#FF7B42)" : "transparent",
                color: tab === k ? "#fff" : T.sub,
                boxShadow: tab === k ? "0 4px 16px rgba(232,67,31,0.4)" : "none",
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}

// ---------- fuelling strategy ----------
const RUN_DISTS = [5, 10, 15, 21.1, 25, 30];
const BIKE_DISTS = [20, 30, 40, 50, 60, 80, 100];
const PACES = { run: { easy: 6.25, steady: 5.5, hard: 4.75 }, bike: { easy: 25, steady: 28, hard: 32 } };

function FuelPlan({ latestW, target }) {
  const [sport, setSport] = useState("run");
  const [dist, setDist] = useState(10);
  const [effort, setEffort] = useState("steady");
  const [pace, setPace] = useState(String(PACES.run.steady));

  const setSportAnd = (s) => { setSport(s); setDist(s === "run" ? 10 : 40); setPace(String(PACES[s][effort])); };
  const setEffortAnd = (e) => { setEffort(e); setPace(String(PACES[sport][e])); };

  const kg = latestW || 75;
  const paceNum = parseFloat(pace) || PACES[sport][effort];
  const durationHr = sport === "run" ? (dist * paceNum) / 60 : dist / paceNum;
  const durMin = Math.round(durationHr * 60);
  const burn = Math.round(sport === "run" ? dist * kg * 1.0 : durationHr * (effort === "easy" ? 540 : effort === "steady" ? 660 : 820) * (kg / 75));

  const carbsHr = durationHr < 1 ? 0 : durationHr < 1.5 ? 30 : durationHr < 2.5 ? 55 : 80;
  const duringCarbs = Math.round(carbsHr * durationHr);
  const gels = Math.ceil(duringCarbs / 25);
  const fluids = Math.round(durationHr * 500);
  const preCarbs = durationHr < 1 ? (effort === "hard" ? 25 : 0) : durationHr < 2.5 ? 50 : 90;
  const postCarbs = durationHr < 1 ? 0 : Math.round((durationHr < 2.5 ? 0.6 : 1.0) * kg);
  const long = durationHr >= 1.5;

  const tile = { ...cardStyle };
  const chip = (active, color) => ({
    padding: "10px 15px", borderRadius: 999, border: active ? `1px solid ${color}` : `1px solid ${T.glassBorder}`,
    background: active ? `${color}26` : "rgba(255,255,255,0.05)", color: active ? color : T.sub,
    fontSize: 14, fontWeight: 700, cursor: "pointer",
  });
  const phase = (color, title, lines) => (
    <div style={{ display: "flex", gap: 14, padding: "14px 0", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ width: 10, height: 10, borderRadius: 5, background: color, boxShadow: `0 0 8px ${color}`, marginTop: 5, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{title}</div>
        {lines.map((l, i) => <div key={i} style={{ fontSize: 14, color: "#B9C2D0", lineHeight: 1.6 }}>{l}</div>)}
      </div>
    </div>
  );

  return (
    <>
      <div className="card-in" style={tile}>
        <div style={{ ...labelStyle, color: T.burn, marginBottom: 12 }}>Plan the session</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button onClick={() => setSportAnd("run")} style={{ ...chip(sport === "run", T.burn), flex: 1 }}>🏃 Run</button>
          <button onClick={() => setSportAnd("bike")} style={{ ...chip(sport === "bike", T.fuel), flex: 1 }}>🚴 Bike</button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {(sport === "run" ? RUN_DISTS : BIKE_DISTS).map(d => (
            <button key={d} onClick={() => setDist(d)} style={chip(dist === d, "#fff")}>{d === 21.1 ? "Half" : `${d}k`}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {["easy", "steady", "hard"].map(e => (
            <button key={e} onClick={() => setEffortAnd(e)} style={{ ...chip(effort === e, T.amber), flex: 1, textTransform: "capitalize" }}>{e}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: T.sub, flexShrink: 0 }}>{sport === "run" ? "Pace (min/km)" : "Speed (km/h)"}</span>
          <input style={{ ...inputStyle, width: 90, ...numFont, fontWeight: 700 }} inputMode="decimal" value={pace} onChange={e => setPace(e.target.value.replace(/[^\d.,]/g, "").replace(",", "."))} />
          <span style={{ fontSize: 13, color: T.sub }}>≈ {Math.floor(durMin / 60) > 0 ? `${Math.floor(durMin / 60)}h ` : ""}{durMin % 60}min · ~{fmt(burn)} kcal</span>
        </div>
      </div>

      <div className="card-in" style={{ ...tile, animationDelay: ".07s", marginBottom: 0 }}>
        <div style={{ ...labelStyle, color: T.good, marginBottom: 4 }}>Fuelling plan</div>
        <div style={{ fontSize: 13, color: T.sub, marginBottom: 10 }}>{sport === "run" ? "Run" : "Ride"} · {dist === 21.1 ? "Half marathon" : `${dist} km`} · {effort} · ~{Math.floor(durMin / 60) > 0 ? `${Math.floor(durMin / 60)}h ${durMin % 60}m` : `${durMin} min`}</div>

        {phase(T.fuel, "Before", [
          preCarbs === 0
            ? "Nothing needed — under an hour at this effort is fine on normal meals, even fasted in the morning. Coffee and water and go."
            : durationHr < 2.5
              ? `~${preCarbs}g carbs, 1.5–2h before. E.g. porridge with banana, or toast and honey. Top up with a coffee 30–45 min out.`
              : `~${preCarbs}g carbs, 2–3h before (e.g. a proper porridge/bagel breakfast), plus a carb-forward dinner the night before. Never start a session this long underfuelled.`,
        ])}

        {phase(T.burn, "During", [
          carbsHr === 0
            ? `Water only is fine (${fluids}ml or to thirst). No carbs needed under an hour.`
            : `${carbsHr}g carbs per hour — about ${duringCarbs}g total, e.g. ${gels} gel${gels === 1 ? "" : "s"} (or swap gels for a banana ≈25g / 500ml sports drink ≈30g each).`,
          carbsHr > 0 ? `Start fuelling at 20–30 min in, then every 25–30 min — don't wait until you feel it.` : null,
          `Fluids: ~${fluids}ml total (400–600ml/hr)${durationHr >= 1.25 ? ", with electrolytes" : ""}.`,
        ].filter(Boolean))}

        {phase(T.good, "After", [
          `25–30g protein within an hour — a Huel works perfectly here.`,
          postCarbs > 0 ? `Plus ~${postCarbs}g carbs to restock glycogen — this is part of training, not cheating on the diet.` : `Normal meals cover recovery for a session this size.`,
        ])}

        <div style={{ marginTop: 6, padding: "13px 15px", background: "rgba(255,180,84,0.10)", border: "1px solid rgba(255,180,84,0.3)", borderRadius: 14, fontSize: 13.5, lineHeight: 1.6, color: "#FFD394" }}>
          <strong style={{ color: T.amber }}>Dieting and this session:</strong> the ~{fmt(burn)} kcal burn already creates your deficit — eat the fuel above and take your −{fmt(target)} from the rest of the day, not from the session. {long ? "Skipping intra-session carbs on a session this long doesn't burn more fat — it wrecks the session, the recovery, and usually tomorrow's appetite control." : "Short sessions are where fasted work is fine if you like it."}
        </div>

        <div style={{ fontSize: 12, color: T.faint, marginTop: 12, lineHeight: 1.5 }}>
          Based on standard endurance sports-nutrition guidelines, scaled to your {latestW ? "logged weight" : "an assumed 75 kg (log a weigh-in to personalise)"}. Practise race fuelling in training — guts are trainable too.
        </div>
      </div>
    </>
  );
}

// ---------- board: full-stats dashboard ----------
function Board({ summaries, weights, settings, net, protein, exercise }) {
  const keyFor = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const lastN = (n) => {
    const arr = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = keyFor(d);
      const s = summaries[key];
      arr.push({ key, d, s, net: s ? (s.maint || settings.maintenance) + s.ex - s.in : null });
    }
    return arr;
  };

  const last7 = lastN(7), last30 = lastN(30);
  const logged7 = last7.filter(x => x.s);
  const avg7 = logged7.length ? logged7.reduce((a, x) => a + x.net, 0) / logged7.length : null;
  const pro7 = logged7.length ? Math.round(logged7.reduce((a, x) => a + (x.s.pro || 0), 0) / logged7.length) : null;
  const train7 = last7.reduce((a, x) => a + (x.s ? x.s.ex : 0), 0);
  const trainDays7 = last7.filter(x => x.s && x.s.ex > 0).length;
  const maxAbs30 = Math.max(400, ...last30.filter(x => x.s).map(x => Math.abs(x.net)));

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const s = summaries[keyFor(d)];
    const dayNet = s ? (s.maint || settings.maintenance) + s.ex - s.in : null;
    if (s && dayNet >= settings.target) streak++;
    else if (i === 0) continue;
    else break;
  }

  const wKeys = Object.keys(weights).sort();
  const startW = wKeys.length ? weights[wKeys[0]] : null;
  const latestW = wKeys.length ? weights[wKeys[wKeys.length - 1]] : null;
  const spanDays = wKeys.length >= 2 ? Math.round((new Date(wKeys[wKeys.length - 1]) - new Date(wKeys[0])) / 86400000) : 0;
  let ratePerDay = null;
  if (spanDays >= 7) ratePerDay = (startW - latestW) / spanDays;
  else if (avg7 !== null && avg7 > 0) ratePerDay = avg7 / 7700;
  const goal = settings.goalWeight;
  const toGo = goal && latestW ? +(latestW - goal).toFixed(1) : null;
  const pctDone = goal && startW && latestW && startW > goal ? Math.min(100, Math.max(0, ((startW - latestW) / (startW - goal)) * 100)) : null;
  const eta = toGo !== null && toGo > 0 && ratePerDay && ratePerDay > 0 ? new Date(Date.now() + (toGo / ratePerDay) * 86400000) : null;

  const tile = { ...cardStyle, marginBottom: 0, padding: 18 };
  const tLabel = { ...labelStyle, color: T.sub, marginBottom: 10 };
  const big = (color) => ({ ...numFont, fontSize: 40, fontWeight: 700, lineHeight: 1, color });
  const subLine = { fontSize: 12.5, color: T.sub, marginTop: 8, lineHeight: 1.45 };

  return (
    <>
      <div className="card-in" style={{ ...labelStyle, color: T.sub, marginBottom: 12 }}>The Board · rotate landscape for the full spread</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>

        <div className="card-in" style={tile}>
          <div style={tLabel}>Today</div>
          <div style={big(net >= 0 ? T.good : T.bad)}>{net >= 0 ? "−" : "+"}{fmt(Math.abs(net))}</div>
          <div style={subLine}>{net >= settings.target ? "Target hit ✓" : net >= 0 ? `${fmt(settings.target - net)} kcal to target` : "Over budget"} · {fmt(exercise)} training · {protein}g protein</div>
        </div>

        <div className="card-in" style={{ ...tile, animationDelay: ".05s" }}>
          <div style={tLabel}>7-day average</div>
          <div style={big(avg7 === null ? T.faint : avg7 >= 0 ? T.good : T.bad)}>{avg7 === null ? "—" : `${avg7 >= 0 ? "−" : "+"}${fmt(Math.abs(avg7))}`}</div>
          <div style={subLine}>{avg7 === null ? "No days logged this week" : avg7 >= settings.target ? `Ahead of your −${settings.target} target` : `${fmt(settings.target - avg7)} kcal/day off your −${settings.target} target`}</div>
        </div>

        <div className="card-in" style={{ ...tile, animationDelay: ".1s" }}>
          <div style={tLabel}>Streak</div>
          <div style={big(streak > 0 ? T.amber : T.faint)}>{streak}<span style={{ fontSize: 18, color: T.sub, marginLeft: 6 }}>day{streak === 1 ? "" : "s"}</span></div>
          <div style={subLine}>Consecutive days hitting your deficit target</div>
        </div>

        <div className="card-in" style={{ ...tile, animationDelay: ".15s" }}>
          <div style={tLabel}>Protein</div>
          <div style={big(pro7 === null ? T.faint : T.fuel)}>{pro7 === null ? "—" : pro7}<span style={{ fontSize: 18, color: T.sub, marginLeft: 6 }}>g/day</span></div>
          <div style={subLine}>7-day average. Aim high while cutting to protect muscle.</div>
        </div>

        <div className="card-in" style={{ ...tile, animationDelay: ".2s" }}>
          <div style={tLabel}>Training · 7 days</div>
          <div style={big(T.burn)}>{fmt(train7)}<span style={{ fontSize: 18, color: T.sub, marginLeft: 6 }}>kcal</span></div>
          <div style={subLine}>{trainDays7} active day{trainDays7 === 1 ? "" : "s"} this week</div>
        </div>

        <div className="card-in" style={{ ...tile, animationDelay: ".25s" }}>
          <div style={tLabel}>Weight</div>
          <div style={big(latestW ? "#B7A6FF" : T.faint)}>{latestW ? latestW : "—"}<span style={{ fontSize: 18, color: T.sub, marginLeft: 6 }}>kg</span></div>
          <div style={subLine}>{startW && latestW && wKeys.length > 1 ? `${startW - latestW >= 0 ? "−" : "+"}${Math.abs(startW - latestW).toFixed(1)} kg since ${new Date(wKeys[0] + "T12:00:00").toLocaleDateString([], { day: "numeric", month: "short" })}` : "Log weigh-ins on the Today screen"}</div>
        </div>

        <div className="card-in" style={{ ...tile, gridColumn: "1 / -1", animationDelay: ".3s" }}>
          <div style={tLabel}>Goal projection</div>
          {!goal ? (
            <div style={{ fontSize: 14, color: T.sub }}>Set a goal weight in Setup and the Board will project your arrival date from your actual trend.</div>
          ) : !latestW ? (
            <div style={{ fontSize: 14, color: T.sub }}>Goal set at <strong style={{ color: T.text }}>{goal} kg</strong> — log a weigh-in to start the projection.</div>
          ) : toGo <= 0 ? (
            <div style={{ ...numFont, fontSize: 30, fontWeight: 700, color: T.good }}>Goal reached — {latestW} kg 🏁</div>
          ) : (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "6px 22px" }}>
                <div style={big(T.good)}>{eta ? eta.toLocaleDateString([], { day: "numeric", month: "long" }) : "—"}</div>
                <div style={{ fontSize: 14, color: T.sub }}>
                  {eta ? `projected at your current rate (${(ratePerDay * 7).toFixed(2)} kg/week)` : "no downward trend yet — string some deficit days together"}
                  {" · "}<strong style={{ color: T.text }}>{toGo} kg to go</strong>
                </div>
              </div>
              {pctDone !== null && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ position: "relative", height: 12, borderRadius: 6, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, width: `${pctDone}%`, background: "linear-gradient(90deg,#3DDC84,#4DD7C8)", boxShadow: "0 0 12px rgba(61,220,132,0.5)", transition: "width .6s" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.sub, marginTop: 7 }}>
                    <span>Start {startW} kg</span>
                    <span style={{ color: T.text, fontWeight: 600 }}>{Math.round(pctDone)}% there</span>
                    <span>Goal {goal} kg</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="card-in" style={{ ...tile, gridColumn: "1 / -1", animationDelay: ".35s" }}>
          <div style={tLabel}>30-day balance</div>
          {last30.filter(x => x.s).length === 0 ? (
            <p style={{ fontSize: 14, color: T.sub, margin: 0 }}>Nothing logged in the last 30 days yet.</p>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", height: 130, gap: 2 }}>
                {last30.map(x => (
                  <div key={x.key} style={{ flex: 1, height: "100%", position: "relative" }} title={x.s ? `${x.key}: ${x.net >= 0 ? "−" : "+"}${Math.abs(Math.round(x.net))}` : x.key}>
                    <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.08)" }} />
                    {x.s && (
                      <div style={{
                        position: "absolute", left: "15%", right: "15%", borderRadius: 2,
                        background: x.net >= 0 ? T.good : T.bad,
                        height: `${Math.min(Math.abs(x.net) / maxAbs30, 1) * 47}%`,
                        ...(x.net >= 0 ? { bottom: "50%" } : { top: "50%" })
                      }} />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.faint, marginTop: 6 }}>
                <span>{last30[0].d.toLocaleDateString([], { day: "numeric", month: "short" })}</span>
                <span>Today</span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ---------- history: trend + calibration + calendar ----------
function History({ summaries, maintenance, weights, onApplyBaseline, fetchDay }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [sel, setSel] = useState(null);
  const [applied, setApplied] = useState(false);

  const keyFor = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const todayK = keyFor(new Date());
  const label = { ...labelStyle, color: T.sub };
  const navBtn = { background: "rgba(255,255,255,0.07)", border: `1px solid ${T.glassBorder}`, borderRadius: 10, padding: "6px 13px", fontSize: 16, cursor: "pointer", color: T.text };

  const openDay = async (key) => {
    setSel({ key, loading: true, data: null });
    try {
      const data = await fetchDay(key);
      setSel({ key, loading: false, data });
    } catch { setSel({ key, loading: false, data: null }); }
  };

  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = keyFor(d);
    const s = summaries[key];
    days.push({ key, label: d.toLocaleDateString([], { weekday: "narrow" }), net: s ? (s.maint || maintenance) + s.ex - s.in : null, logged: !!s });
  }
  const logged = days.filter(d => d.logged);
  const maxAbs = Math.max(300, ...logged.map(d => Math.abs(d.net)));
  const avg = logged.length ? logged.reduce((s, d) => s + d.net, 0) / logged.length : 0;

  const wKeys = Object.keys(weights).sort();
  const wEntries = wKeys.map(k => ({ key: k, w: weights[k] }));
  let calib = null;
  if (wKeys.length >= 2) {
    const first = wKeys[0], last = wKeys[wKeys.length - 1];
    const spanDays = Math.round((new Date(last) - new Date(first)) / 86400000);
    if (spanDays >= 7) {
      let predicted = 0, loggedDays = 0;
      const cur = new Date(first + "T12:00:00");
      const end = new Date(last + "T12:00:00");
      while (cur <= end) {
        const k = keyFor(cur);
        const s = summaries[k];
        if (s) { predicted += (s.maint || maintenance) + s.ex - s.in; loggedDays++; }
        cur.setDate(cur.getDate() + 1);
      }
      if (loggedDays >= Math.max(5, spanDays * 0.5)) {
        const predictedKg = predicted / 7700;
        const actualKg = weights[first] - weights[last];
        const driftPerDay = Math.round(((actualKg - predictedKg) * 7700) / spanDays);
        calib = { spanDays, actualKg, predictedKg, driftPerDay, suggested: maintenance + driftPerDay };
      } else {
        calib = { insufficient: true, spanDays };
      }
    }
  }
  const wMin = wEntries.length ? Math.min(...wEntries.map(e => e.w)) : 0;
  const wMax = wEntries.length ? Math.max(...wEntries.map(e => e.w)) : 1;
  const wRange = Math.max(wMax - wMin, 0.5);

  const startOffset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  const selSummary = sel && summaries[sel.key];
  const selNet = selSummary ? (selSummary.maint || maintenance) + selSummary.ex - selSummary.in : null;
  const divider = { borderTop: "1px solid rgba(255,255,255,0.08)" };

  return (
    <>
      <div className="card-in" style={cardStyle}>
        <div style={{ ...label, marginBottom: 16 }}>Last 14 days</div>
        {logged.length === 0 ? (
          <p style={{ fontSize: 14, color: T.sub, margin: 0 }}>Nothing logged yet. Green bars are deficit days.</p>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", height: 120, gap: 4 }}>
              {days.map(d => (
                <div key={d.key} style={{ flex: 1, height: "100%", position: "relative" }}>
                  <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.1)" }} />
                  {d.logged && (
                    <div style={{
                      position: "absolute", left: "12%", right: "12%", borderRadius: 3,
                      background: d.net >= 0 ? T.good : T.bad,
                      boxShadow: d.net >= 0 ? "0 0 8px rgba(61,220,132,0.4)" : "0 0 8px rgba(255,92,92,0.35)",
                      height: `${Math.min(Math.abs(d.net) / maxAbs, 1) * 46}%`,
                      ...(d.net >= 0 ? { bottom: "50%" } : { top: "50%" })
                    }} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
              {days.map(d => <div key={d.key} style={{ flex: 1, textAlign: "center", fontSize: 10, color: T.faint }}>{d.label}</div>)}
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, ...divider, fontSize: 14, lineHeight: 1.6 }}>
              Average: <strong>{avg >= 0 ? "−" : "+"}{Math.round(Math.abs(avg)).toLocaleString()} kcal/day</strong> over {logged.length} day{logged.length === 1 ? "" : "s"}.
              {avg > 0 && <> Roughly <strong style={{ color: T.good }}>{((avg * 7) / 7700).toFixed(1)} kg/week</strong> at this rate.</>}
            </div>
          </>
        )}
      </div>

      <div className="card-in" style={{ ...cardStyle, animationDelay: ".07s" }}>
        <div style={{ ...label, marginBottom: 12 }}>Weight & calibration</div>
        {wEntries.length === 0 ? (
          <p style={{ fontSize: 14, color: T.sub, margin: 0, lineHeight: 1.55 }}>Log your morning weight on the Today screen. With two weeks of weigh-ins, the app compares your actual loss to what your deficits predict and corrects your baseline burn.</p>
        ) : (
          <>
            <svg width="100%" height="92" viewBox="0 0 400 92" preserveAspectRatio="none" aria-label="Weight trend">
              <defs>
                <linearGradient id="wFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(77,163,255,0.3)" /><stop offset="100%" stopColor="rgba(77,163,255,0)" />
                </linearGradient>
              </defs>
              {wEntries.length > 1 && (
                <polygon fill="url(#wFill)" points={`10,84 ${wEntries.map((e, i) => `${10 + (i / (wEntries.length - 1)) * 380},${78 - ((e.w - wMin) / wRange) * 62}`).join(" ")} 390,84`} />
              )}
              <polyline fill="none" stroke={T.fuel} strokeWidth="2.5" style={{ filter: "drop-shadow(0 0 5px rgba(77,163,255,0.5))" }}
                points={wEntries.map((e, i) => `${wEntries.length === 1 ? 200 : 10 + (i / (wEntries.length - 1)) * 380},${78 - ((e.w - wMin) / wRange) * 62}`).join(" ")} />
              {wEntries.map((e, i) => (
                <circle key={e.key} cx={wEntries.length === 1 ? 200 : 10 + (i / (wEntries.length - 1)) * 380} cy={78 - ((e.w - wMin) / wRange) * 62} r="3.5" fill="#fff" />
              ))}
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.sub, marginTop: 4 }}>
              <span>{wEntries[0].w} kg · {new Date(wEntries[0].key + "T12:00:00").toLocaleDateString([], { day: "numeric", month: "short" })}</span>
              <span>{wEntries[wEntries.length - 1].w} kg · {new Date(wEntries[wEntries.length - 1].key + "T12:00:00").toLocaleDateString([], { day: "numeric", month: "short" })}</span>
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, ...divider, fontSize: 14, lineHeight: 1.6 }}>
              {!calib && <span style={{ color: T.sub }}>Keep weighing in — calibration kicks in once your weigh-ins span at least a week.</span>}
              {calib && calib.insufficient && <span style={{ color: T.sub }}>Your weigh-ins span {calib.spanDays} days but too few days have food/training logged in between for a reliable calibration. Keep logging daily.</span>}
              {calib && !calib.insufficient && (
                <>
                  Over {calib.spanDays} days you {calib.actualKg >= 0 ? "lost" : "gained"} <strong>{Math.abs(calib.actualKg).toFixed(1)} kg</strong>; your logged deficits predicted {calib.predictedKg >= 0 ? "a loss of" : "a gain of"} <strong>{Math.abs(calib.predictedKg).toFixed(1)} kg</strong>.{" "}
                  {Math.abs(calib.driftPerDay) < 100 ? (
                    <span style={{ color: T.good, fontWeight: 600 }}>Your baseline looks accurate — no change needed.</span>
                  ) : (
                    <>
                      Your true daily burn looks about <strong>{Math.abs(calib.driftPerDay)} kcal {calib.driftPerDay > 0 ? "higher" : "lower"}</strong> than assumed.
                      {!applied ? (
                        <button onClick={() => { onApplyBaseline(calib.suggested); setApplied(true); }}
                          style={{ display: "block", marginTop: 12, padding: "12px 16px", borderRadius: 12, border: "none", background: GRAD_FUEL, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%", boxShadow: "0 6px 20px rgba(46,124,246,0.35)" }}>
                          Update baseline to {calib.suggested.toLocaleString()} kcal
                        </button>
                      ) : (
                        <span style={{ color: T.good, fontWeight: 600 }}> ✓ Baseline updated.</span>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      <div className="card-in" style={{ ...cardStyle, animationDelay: ".14s", marginBottom: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <button onClick={() => { setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1)); setSel(null); }} aria-label="Previous month" style={navBtn}>‹</button>
          <div style={{ ...label, color: T.text }}>{month.toLocaleDateString([], { month: "long", year: "numeric" })}</div>
          <button onClick={() => { setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1)); setSel(null); }} aria-label="Next month" style={navBtn}>›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 4 }}>
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 11, color: T.faint, fontWeight: 700 }}>{d}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} />;
            const k = keyFor(d);
            const s = summaries[k];
            const net = s ? (s.maint || maintenance) + s.ex - s.in : null;
            const isSel = sel && sel.key === k;
            const isToday = k === todayK;
            return (
              <button key={k} onClick={() => openDay(k)}
                style={{
                  aspectRatio: "1", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: isToday ? 800 : 600,
                  border: isSel ? "1.5px solid #fff" : isToday ? `1.5px solid ${T.sub}` : "1px solid transparent",
                  background: s ? (net >= 0 ? "rgba(61,220,132,0.16)" : "rgba(255,92,92,0.14)") : "rgba(255,255,255,0.04)",
                  color: s ? (net >= 0 ? "#7CE8A8" : "#FF9B9B") : T.faint,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, padding: 0
                }}>
                <span>{d.getDate()}</span>
                {s && <span style={{ fontSize: 9, fontWeight: 700 }}>{net >= 0 ? "−" : "+"}{Math.abs(Math.round(net))}</span>}
              </button>
            );
          })}
        </div>

        {sel && (
          <div style={{ marginTop: 16, paddingTop: 14, ...divider }}>
            <div style={{ ...label, color: T.text, marginBottom: 8 }}>
              {new Date(sel.key + "T12:00:00").toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
            {sel.loading ? (
              <p style={{ fontSize: 14, color: T.sub, margin: 0 }}>Loading…</p>
            ) : !sel.data || (sel.data.food.length === 0 && sel.data.exercise.length === 0) ? (
              <p style={{ fontSize: 14, color: T.sub, margin: 0 }}>Nothing logged this day.{weights[sel.key] ? ` Weight: ${weights[sel.key]} kg.` : ""}</p>
            ) : (
              <>
                {selNet !== null && (
                  <div style={{ fontSize: 15, marginBottom: 10 }}>
                    Net: <strong style={{ color: selNet >= 0 ? T.good : T.bad }}>{selNet >= 0 ? "−" : "+"}{Math.abs(Math.round(selNet)).toLocaleString()} kcal</strong>
                    <span style={{ color: T.sub }}> · in {selSummary.in.toLocaleString()} / out {((selSummary.maint || maintenance) + selSummary.ex).toLocaleString()}{selSummary.pro ? ` · ${selSummary.pro}g protein` : ""}{weights[sel.key] ? ` · ${weights[sel.key]} kg` : ""}</span>
                  </div>
                )}
                {sel.data.food.map(f => (
                  <div key={f.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 14 }}>
                    <span>🍽 {f.name}{f.pro > 0 ? ` · ${f.pro}g` : ""}</span><span style={{ fontWeight: 700 }}>{f.cal}</span>
                  </div>
                ))}
                {sel.data.exercise.map(x => (
                  <div key={x.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 14 }}>
                    <span>🏃 {x.name}</span><span style={{ fontWeight: 700, color: T.burn }}>{x.cal}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

import { useState } from "react";

const T = {
  text: "#EDF1F7", sub: "#8B95A7", fuel: "#4DA3FF", burn: "#FF6B35", good: "#3DDC84", amber: "#FFB454",
};
const GRAD_FUEL = "linear-gradient(135deg,#2E7CF6,#4DA3FF)";

const SLIDES = [
  { icon: "⚖️", color: T.good, title: "Know your balance", body: "Every day is simple: calories in from food, calories out from your baseline burn plus training. The big green number is your deficit — that's what loses weight." },
  { icon: "📷", color: T.fuel, title: "Log food in seconds", body: "Snap a photo or describe a meal and AI estimates the calories and protein. Your Huels, sandwich and coffees are one-tap presets — edit them anytime in Setup." },
  { icon: "🏃", color: T.burn, title: "Training counts", body: "After each session, copy the active calories from your Garmin into Training. Log as many as you like in a day — they add to your burn." },
  { icon: "🎯", color: T.amber, title: "Calibrate with weight", body: "Log your morning weight a few times a week. Over time the app compares real weight loss to what your deficits predict, and corrects your true daily burn — so it gets more accurate, not less." },
  { icon: "🔋", color: T.fuel, title: "Fuel the big sessions", body: "Heading out for a long run or ride? The Fuel tab tells you exactly what to eat before, during and after — so you diet without wrecking your training." },
];

const COACH = [
  { tab: "today", text: "Today is home — log food, training and weight, and watch your live balance." },
  { tab: "fuel", text: "Fuel plans your before/during/after nutrition for any run or ride." },
  { tab: "board", text: "The Board is your dashboard — turn the phone landscape for the full spread of stats and your goal projection." },
  { tab: "history", text: "History holds your calendar, trends and weight calibration." },
  { tab: "setup", text: "Setup is where you set your baseline, target, goal weight and presets — and replay this tour." },
];

// dock geometry mirrors the real nav so coach marks line up
const TABS = ["today", "fuel", "board", "history", "setup"];

export default function Onboarding({ onFinish }) {
  const [phase, setPhase] = useState("slides"); // slides | coach
  const [i, setI] = useState(0);
  const [c, setC] = useState(0);

  const overlay = { position: "fixed", inset: 0, zIndex: 100, fontFamily: "'Inter',ui-sans-serif,system-ui,sans-serif" };

  if (phase === "slides") {
    const s = SLIDES[i];
    return (
      <div style={{ ...overlay, background: "radial-gradient(1200px 800px at 50% -10%, #1A2740 0%, #0E1626 45%, #090E18 100%)", display: "flex", flexDirection: "column", padding: 24 }}>
        <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onFinish} style={{ background: "none", border: "none", color: T.sub, fontSize: 14, cursor: "pointer", padding: 8 }}>Skip</button>
        </div>
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", animation: "slideIn .4s cubic-bezier(.2,.7,.2,1) both" }}>
          <div style={{ fontSize: 64, marginBottom: 24, filter: `drop-shadow(0 0 24px ${s.color}66)` }}>{s.icon}</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 34, fontWeight: 700, letterSpacing: "0.02em", color: s.color, marginBottom: 14, textTransform: "uppercase" }}>{s.title}</div>
          <div style={{ fontSize: 16, lineHeight: 1.6, color: "#B9C2D0", maxWidth: 320 }}>{s.body}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 22 }}>
          {SLIDES.map((_, idx) => (
            <div key={idx} style={{ width: idx === i ? 22 : 8, height: 8, borderRadius: 4, background: idx === i ? T.fuel : "rgba(255,255,255,0.2)", transition: "width .3s" }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {i > 0 && (
            <button onClick={() => setI(i - 1)} style={{ flex: 1, padding: 15, borderRadius: 13, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: T.text, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Back</button>
          )}
          <button onClick={() => { if (i < SLIDES.length - 1) setI(i + 1); else setPhase("coach"); }}
            style={{ flex: 2, padding: 15, borderRadius: 13, border: "none", background: GRAD_FUEL, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 20px rgba(46,124,246,0.35)" }}>
            {i < SLIDES.length - 1 ? "Next" : "Show me around"}
          </button>
        </div>
      </div>
    );
  }

  // coach marks: dim screen, highlight one dock tab, point a bubble at it
  const step = COACH[c];
  const tabIndex = TABS.indexOf(step.tab);
  const leftPct = ((tabIndex + 0.5) / TABS.length) * 100;

  return (
    <div style={{ ...overlay, background: "rgba(5,8,14,0.82)", backdropFilter: "blur(2px)" }}>
      <style>{`@keyframes pop{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}@keyframes glowPulse{0%,100%{box-shadow:0 0 0 2px rgba(255,107,53,0.6),0 0 18px rgba(255,107,53,0.5)}50%{box-shadow:0 0 0 2px rgba(255,107,53,0.9),0 0 28px rgba(255,107,53,0.8)}}`}</style>

      {/* bubble */}
      <div key={c} style={{ position: "fixed", bottom: 92, left: `${leftPct}%`, transform: "translateX(-50%)", width: "min(300px, 82vw)", background: "#141D2E", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: 18, boxShadow: "0 12px 40px rgba(0,0,0,0.5)", animation: "pop .35s cubic-bezier(.2,.7,.2,1) both" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, color: T.burn, marginBottom: 8 }}>{step.tab} · {c + 1} of {COACH.length}</div>
        <div style={{ fontSize: 15, lineHeight: 1.55, color: T.text, marginBottom: 14 }}>{step.text}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={onFinish} style={{ background: "none", border: "none", color: T.sub, fontSize: 14, cursor: "pointer" }}>Skip</button>
          <button onClick={() => { if (c < COACH.length - 1) setC(c + 1); else onFinish(); }}
            style={{ padding: "10px 20px", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#E8431F,#FF7B42)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(232,67,31,0.4)" }}>
            {c < COACH.length - 1 ? "Next" : "Got it"}
          </button>
        </div>
        {/* pointer */}
        <div style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%) rotate(45deg)", width: 16, height: 16, background: "#141D2E", borderRight: "1px solid rgba(255,255,255,0.12)", borderBottom: "1px solid rgba(255,255,255,0.12)" }} />
      </div>

      {/* highlight ring over the live dock tab */}
      <div style={{ position: "fixed", bottom: 14, left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
        <div style={{ display: "flex", gap: 4, padding: 5, maxWidth: 460, width: "100%", justifyContent: "space-around" }}>
          {TABS.map((t, idx) => (
            <div key={t} style={{ flex: 1, height: 40, margin: "0 2px", borderRadius: 999, animation: idx === tabIndex ? "glowPulse 1.4s ease-in-out infinite" : "none" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

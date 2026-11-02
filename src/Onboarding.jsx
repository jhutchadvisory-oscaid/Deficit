import { useState } from "react";

const T = {
  text: "#EDF1F7", sub: "#8B95A7", fuel: "#4DA3FF", burn: "#FF6B35", good: "#3DDC84", amber: "#FFB454",
};
const GRAD_FUEL = "linear-gradient(135deg,#2E7CF6,#4DA3FF)";

const SLIDES = [
  { icon: "⚖️", color: T.good, title: "Know your balance", body: "Every day comes down to calories in from food against calories out from your baseline burn plus training. The big green number is your deficit, and that's what takes weight off." },
  { icon: "🍽", color: T.fuel, title: "Log food in a few taps", body: "Your regular meals and drinks become one-tap presets, which you can set up in Setup. Anything else goes in by hand with its calories and protein, and the bar under your balance shows how much you can still eat and stay on target." },
  { icon: "🏃", color: T.burn, title: "Training counts", body: "After each session, pick the activity, add a note if you like, and type in the active calories from your watch. It all adds to your burn, so a big session earns you more food." },
  { icon: "💧", color: "#38BDF8", title: "Protein and water", body: "Set a daily protein goal to protect muscle while you cut, and tap a glass each time you drink. Both turn green when you hit them." },
  { icon: "📅", color: T.amber, title: "Think in weeks, not days", body: "One heavy day won't undo a good week. The Board shows your Mon to Sun total, your streak counts winning weeks, holiday days assume a sensible surplus so you don't have to log, and you can fix or backfill any day from History." },
  { icon: "🎯", color: T.good, title: "Calibrate with your weight", body: "Weigh in a few mornings a week. Over time the app compares your real weight loss with what your logs predicted and tells you your true daily burn. You can add a past weigh-in from History so your starting weight is right." },
  { icon: "🏆", color: T.amber, title: "Compete and share", body: "Join the optional leaderboard to compete with mates on consistency and training, never on eating less. The Share button on the Board turns your progress into an image you can post." },
];

const COACH = [
  { tab: "today", text: "Today is home. Log food, training, water and your weight, and watch your live balance and what you've got left to eat." },
  { tab: "fuel", text: "Fuel plans what to eat before, during and after a run or ride, so dieting doesn't wreck your training." },
  { tab: "board", text: "The Board has your charts, weekly total, streak and goal projection. Switch to the Leaderboard at the top, or tap Share to make a progress card." },
  { tab: "history", text: "History holds your calendar and weight calibration. Tap any day to edit it, add a missed weigh-in or mark it as a holiday day." },
  { tab: "setup", text: "Setup is where you set your baseline, targets, goals and presets, manage the leaderboard and your privacy, and replay this tour any time." },
];

// dock geometry mirrors the real nav so coach marks line up
const TABS = ["today", "fuel", "board", "history", "setup"];

export default function Onboarding({ onFinish, isDesktop }) {
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

  // coach marks: dim screen, highlight one dock tab, point a bubble at it.
  const step = COACH[c];

  // Desktop: no bottom dock, so show a centered card pointing nowhere.
  if (isDesktop) {
    return (
      <div style={{ ...overlay, background: "rgba(5,8,14,0.78)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <style>{`@keyframes pop{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
        <div key={c} style={{ width: "min(420px, 92vw)", boxSizing: "border-box", background: "#141D2E", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: 26, boxShadow: "0 20px 60px rgba(0,0,0,0.55)", animation: "pop .35s cubic-bezier(.2,.7,.2,1) both" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, color: T.burn, marginBottom: 10 }}>{step.tab} · {c + 1} of {COACH.length}</div>
          <div style={{ fontSize: 17, lineHeight: 1.55, color: T.text, marginBottom: 20 }}>{step.text} <span style={{ color: T.sub }}>Find it in the sidebar on the left.</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={onFinish} style={{ background: "none", border: "none", color: T.sub, fontSize: 14, cursor: "pointer" }}>Skip</button>
            <button onClick={() => { if (c < COACH.length - 1) setC(c + 1); else onFinish(); }}
              style={{ padding: "11px 24px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#E8431F,#FF7B42)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(232,67,31,0.4)" }}>
              {c < COACH.length - 1 ? "Next" : "Got it"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabIndex = TABS.indexOf(step.tab);
  const tabCentrePct = ((tabIndex + 0.5) / TABS.length) * 100; // where the tab is, 0–100 across screen
  // convert that to a position within the centred bubble; clamp so the arrow stays on the bubble
  const arrowLeftPct = Math.min(Math.max(tabCentrePct, 12), 88);

  return (
    <div style={{ ...overlay, background: "rgba(5,8,14,0.82)", backdropFilter: "blur(2px)" }}>
      <style>{`@keyframes pop{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}@keyframes glowPulse{0%,100%{box-shadow:0 0 0 2px rgba(255,107,53,0.6),0 0 18px rgba(255,107,53,0.5)}50%{box-shadow:0 0 0 2px rgba(255,107,53,0.9),0 0 28px rgba(255,107,53,0.8)}}`}</style>

      {/* bubble — always centred */}
      <div key={c} style={{ position: "fixed", bottom: 92, left: "50%", transform: "translateX(-50%)", width: "min(340px, 90vw)", boxSizing: "border-box", background: "#141D2E", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: 18, boxShadow: "0 12px 40px rgba(0,0,0,0.5)", animation: "pop .35s cubic-bezier(.2,.7,.2,1) both" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, color: T.burn, marginBottom: 8 }}>{step.tab} · {c + 1} of {COACH.length}</div>
        <div style={{ fontSize: 15, lineHeight: 1.55, color: T.text, marginBottom: 14 }}>{step.text}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={onFinish} style={{ background: "none", border: "none", color: T.sub, fontSize: 14, cursor: "pointer" }}>Skip</button>
          <button onClick={() => { if (c < COACH.length - 1) setC(c + 1); else onFinish(); }}
            style={{ padding: "10px 20px", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#E8431F,#FF7B42)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(232,67,31,0.4)" }}>
            {c < COACH.length - 1 ? "Next" : "Got it"}
          </button>
        </div>
        {/* pointer — slides to point at the active tab */}
        <div style={{ position: "absolute", bottom: -8, left: `${arrowLeftPct}%`, transform: "translateX(-50%) rotate(45deg)", width: 16, height: 16, background: "#141D2E", borderRight: "1px solid rgba(255,255,255,0.12)", borderBottom: "1px solid rgba(255,255,255,0.12)" }} />
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

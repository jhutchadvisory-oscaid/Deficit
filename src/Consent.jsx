import { useState } from "react";

// Bump this when the privacy notice changes materially: everyone is asked again.
export const CONSENT_VERSION = 1;
export const PRIVACY_UPDATED = "November 2026";
// Who people contact about their data. Change this if you want a different address.
export const CONTACT_EMAIL = "josh.hutch1994@gmail.com";

const T = { text: "#EDF1F7", sub: "#8B95A7", faint: "#5E6878", fuel: "#4DA3FF", burn: "#FF6B35", good: "#3DDC84", amber: "#FFB454", bad: "#FF5C5C", border: "rgba(255,255,255,0.09)" };
const BG = "radial-gradient(1200px 800px at 50% -10%, #1A2740 0%, #0E1626 45%, #090E18 100%)";
const numFont = { fontFamily: "'Barlow Condensed','Arial Narrow',ui-sans-serif,sans-serif" };
const label = { fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700 };

export const SHARED_STATS = [
  "Weekly streak (weeks in a row on target)",
  "How many days you've logged in the last 30",
  "Progress towards your own goal, as a percentage",
  "How often you hit your protein and water goals",
  "Training streak and calories burned in training",
];

const H = ({ children }) => <div style={{ ...label, color: T.fuel, margin: "22px 0 8px" }}>{children}</div>;
const P = ({ children }) => <p style={{ fontSize: 14, lineHeight: 1.65, color: "#B9C2D0", margin: "0 0 10px" }}>{children}</p>;
const LI = ({ children }) => <li style={{ fontSize: 14, lineHeight: 1.6, color: "#B9C2D0", marginBottom: 6 }}>{children}</li>;

export function PrivacyNotice() {
  return (
    <div>
      <P>Version {CONSENT_VERSION}, updated {PRIVACY_UPDATED}. This explains, in plain English, what Deficit. does with your information and the choices you have.</P>

      <H>Who runs Deficit.</H>
      <P>Deficit. is a small app run by Josh Hutchison and shared with friends. Josh is responsible for your data (the "data controller" under UK GDPR). You can contact him about anything in this notice at <span style={{ color: T.text }}>{CONTACT_EMAIL}</span>.</P>

      <H>What we store</H>
      <ul style={{ paddingLeft: 18, margin: 0 }}>
        <LI><b style={{ color: T.text }}>Your account:</b> your email address. Your password is handled by our login provider and is never visible to anyone, including Josh.</LI>
        <LI><b style={{ color: T.text }}>Your logs:</b> food and drink entries with calories and protein, training sessions, water, weigh-ins and holiday days.</LI>
        <LI><b style={{ color: T.text }}>Your settings:</b> baseline burn, targets, goal weight and presets.</LI>
        <LI><b style={{ color: T.text }}>Your choices:</b> when you gave consent, and whether you joined the leaderboard.</LI>
        <LI><b style={{ color: T.text }}>Leaderboard (only if you join):</b> a display name you choose and a small set of summary stats.</LI>
      </ul>

      <H>Why, and on what basis</H>
      <P>We use your information only to run your tracker and, if you choose, the leaderboard. Weight, diet and training information counts as health data, which UK law treats as sensitive, so we only store it with your <b style={{ color: T.text }}>explicit consent</b>. The leaderboard is a separate, optional consent. We never sell your data, show you adverts or use it for anything else.</P>

      <H>Who can see it</H>
      <ul style={{ paddingLeft: 18, margin: 0 }}>
        <LI><b style={{ color: T.text }}>Only you can see your logs.</b> The database itself blocks every other account from reading them.</LI>
        <LI>Josh, as the person running the app, can see the list of email addresses that have signed up and when, because that's needed to run accounts. He cannot see what you've logged.</LI>
        <LI>If you join the leaderboard, other people who have also joined can see your display name and these stats only:
          <ul style={{ paddingLeft: 18, marginTop: 6 }}>{SHARED_STATS.map(s => <LI key={s}>{s}</LI>)}</ul>
          They never see your weight, anything you've eaten, calories eaten or your email. You can only see the leaderboard while you're on it yourself.</LI>
      </ul>

      <H>Where it's kept</H>
      <P>Your data is stored with Supabase (database and login) and the app is hosted by Netlify. These providers may process data outside the UK; where they do, they rely on UK-approved safeguards such as standard contractual clauses. Your login session is saved on your own device so you stay signed in; we use no tracking or advertising cookies.</P>

      <H>How long we keep it</H>
      <P>Until you delete your account. Deleting your account in Setup permanently erases everything immediately: your logs, settings, weigh-ins, consent record and leaderboard entry.</P>

      <H>Your rights</H>
      <ul style={{ paddingLeft: 18, margin: 0 }}>
        <LI><b style={{ color: T.text }}>See and take your data:</b> Setup → Export all data (CSV).</LI>
        <LI><b style={{ color: T.text }}>Correct it:</b> edit any day, weigh-in or setting at any time.</LI>
        <LI><b style={{ color: T.text }}>Leave the leaderboard:</b> Setup → Privacy & leaderboard. Your entry disappears straight away.</LI>
        <LI><b style={{ color: T.text }}>Withdraw consent and erase everything:</b> Setup → Delete my account. As the app can't work without storing your logs, withdrawing your health-data consent means deleting your account.</LI>
        <LI><b style={{ color: T.text }}>Complain:</b> contact Josh first, and you can always complain to the Information Commissioner's Office at ico.org.uk.</LI>
      </ul>

      <H>Not medical advice</H>
      <P>Calorie figures, baselines and fuelling plans are estimates for general guidance only. If you have a medical condition, are pregnant, or have a history of disordered eating, please speak to your GP before using a calorie tracker.</P>

      <H>Age</H>
      <P>Deficit. is for adults only. You must be 18 or over to use it.</P>
    </div>
  );
}

function Check({ on, onClick, children }) {
  return (
    <button onClick={onClick} style={{ display: "flex", gap: 12, alignItems: "flex-start", textAlign: "left", width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${on ? "rgba(61,220,132,0.45)" : T.border}`, borderRadius: 14, padding: "13px 14px", cursor: "pointer", marginBottom: 8, color: T.text }}>
      <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 7, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, background: on ? T.good : "rgba(255,255,255,0.06)", border: on ? "none" : "1px solid rgba(255,255,255,0.2)", color: "#0A0F1A" }}>{on ? "✓" : ""}</span>
      <span style={{ fontSize: 14, lineHeight: 1.5, color: on ? T.text : "#B9C2D0" }}>{children}</span>
    </button>
  );
}

export function validDisplayName(n) {
  const v = (n || "").trim();
  if (v.length < 2 || v.length > 24) return "Display name must be 2 to 24 characters.";
  if (!/^[A-Za-z0-9 ._'-]+$/.test(v)) return "Use letters, numbers, spaces, dots, dashes or underscores only.";
  return null;
}

export default function Consent({ isExisting, initialName = "", onAccept, onDecline }) {
  const [age, setAge] = useState(false);
  const [health, setHealth] = useState(false);
  const [notice, setNotice] = useState(false);
  const [board, setBoard] = useState(null); // null = not chosen yet, true/false once chosen
  const [name, setName] = useState(initialName);
  const [showNotice, setShowNotice] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const nameErr = board ? validDisplayName(name) : null;
  const ready = age && health && notice && board !== null && !nameErr;

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true); setErr("");
    const e = await onAccept({ optIn: board, displayName: board ? name.trim() : null });
    if (e) { setErr(e); setBusy(false); }
  };

  const choice = (val, title, body) => (
    <button onClick={() => setBoard(val)} style={{ flex: 1, textAlign: "left", background: board === val ? (val ? "rgba(255,180,84,0.10)" : "rgba(77,163,255,0.10)") : "rgba(255,255,255,0.04)", border: `1px solid ${board === val ? (val ? "rgba(255,180,84,0.55)" : "rgba(77,163,255,0.55)") : T.border}`, borderRadius: 16, padding: 14, cursor: "pointer", color: T.text }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: T.sub, lineHeight: 1.45 }}>{body}</div>
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: BG, color: T.text, fontFamily: "'Inter',ui-sans-serif,system-ui,sans-serif", padding: "28px 18px 40px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ ...numFont, fontSize: 34, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 18 }}>Deficit<span style={{ color: T.burn }}>.</span></div>
        <div style={{ ...numFont, fontSize: 30, fontWeight: 700, lineHeight: 1.05, marginBottom: 10 }}>{isExisting ? "We've updated how Deficit. handles your data" : "Before you start"}</div>
        <P>{isExisting
          ? "Deficit. now has a leaderboard, so we're asking everyone to confirm how their information is used. Nothing you've logged has changed, and it stays private unless you choose otherwise below."
          : "Deficit. stores health information like your weight, food and training, so we need your clear agreement first. Here's the short version."}</P>

        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, borderRadius: 18, padding: "14px 16px", margin: "16px 0" }}>
          {[
            ["🔒", "Your logs are private to you. Nobody else, including the person who runs the app, can read them."],
            ["🏆", "The leaderboard is optional. If you join, others only see your chosen name and a few consistency stats, never your weight or what you eat."],
            ["⬇︎", "You can export everything, leave the leaderboard or delete your account at any time from Setup."],
            ["🚫", "No adverts, no tracking, and your data is never sold."],
          ].map(([i, t]) => (
            <div key={t} style={{ display: "flex", gap: 12, padding: "7px 0", fontSize: 14, lineHeight: 1.5, color: "#B9C2D0" }}><span style={{ width: 20, flexShrink: 0, textAlign: "center" }}>{i}</span><span>{t}</span></div>
          ))}
          <button onClick={() => setShowNotice(v => !v)} style={{ background: "none", border: "none", color: T.fuel, fontSize: 14, fontWeight: 700, cursor: "pointer", padding: "8px 0 2px" }}>{showNotice ? "Hide the full privacy notice ▴" : "Read the full privacy notice ▾"}</button>
          {showNotice && <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 10, paddingTop: 4 }}><PrivacyNotice /></div>}
        </div>

        <div style={{ ...label, color: T.sub, margin: "20px 0 10px" }}>Required</div>
        <Check on={age} onClick={() => setAge(v => !v)}>I'm 18 or over.</Check>
        <Check on={health} onClick={() => setHealth(v => !v)}>I give my <b>explicit consent</b> for Deficit. to store and use my health information (weight, food, drink and training) to run my tracker.</Check>
        <Check on={notice} onClick={() => setNotice(v => !v)}>I've read the privacy notice, and I understand Deficit. gives estimates, not medical advice.</Check>

        <div style={{ ...label, color: T.sub, margin: "22px 0 10px" }}>Leaderboard: please choose one</div>
        <div style={{ display: "flex", gap: 10 }}>
          {choice(true, "🏆 Join the leaderboard", "Compete with mates on consistency and training.")}
          {choice(false, "🔒 Keep me private", "Skip it. You can join later in Setup.")}
        </div>

        {board === true && (
          <div style={{ background: "rgba(255,180,84,0.06)", border: "1px solid rgba(255,180,84,0.25)", borderRadius: 16, padding: 14, marginTop: 10 }}>
            <div style={{ fontSize: 13, color: T.sub, marginBottom: 8 }}>Choose a display name. Use a nickname if you'd rather not show your real name.</div>
            <input value={name} onChange={e => setName(e.target.value)} maxLength={24} placeholder="e.g. Hutch"
              style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)", color: T.text, fontSize: 16, outline: "none" }} />
            {name && nameErr && <div style={{ fontSize: 12.5, color: T.bad, marginTop: 6 }}>{nameErr}</div>}
            <div style={{ fontSize: 12.5, color: T.sub, marginTop: 12, marginBottom: 4 }}>Other members will see your name and:</div>
            <ul style={{ paddingLeft: 18, margin: 0 }}>{SHARED_STATS.map(s => <li key={s} style={{ fontSize: 12.5, color: "#B9C2D0", lineHeight: 1.55 }}>{s}</li>)}</ul>
            <div style={{ fontSize: 12.5, color: T.amber, marginTop: 8 }}>Never your weight, what you eat, calories eaten or your email.</div>
          </div>
        )}

        {err && <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: "rgba(255,92,92,0.1)", border: "1px solid rgba(255,92,92,0.3)", color: "#FF9B9B", fontSize: 14 }}>{err}</div>}

        <button onClick={submit} disabled={!ready || busy}
          style={{ width: "100%", marginTop: 20, padding: 16, borderRadius: 14, border: "none", fontSize: 16, fontWeight: 700, cursor: ready ? "pointer" : "not-allowed", background: ready ? "linear-gradient(135deg,#2E7CF6,#4DA3FF)" : "rgba(255,255,255,0.07)", color: ready ? "#fff" : T.faint, boxShadow: ready ? "0 6px 20px rgba(46,124,246,0.35)" : "none" }}>
          {busy ? "Saving…" : "Agree and continue"}
        </button>
        {!ready && <div style={{ fontSize: 12.5, color: T.faint, textAlign: "center", marginTop: 8 }}>Tick all three boxes and make a leaderboard choice to continue.</div>}
        <button onClick={onDecline} style={{ display: "block", margin: "18px auto 0", background: "none", border: "none", color: T.sub, fontSize: 14, cursor: "pointer", textDecoration: "underline" }}>I don't agree, sign me out</button>
      </div>
    </div>
  );
}

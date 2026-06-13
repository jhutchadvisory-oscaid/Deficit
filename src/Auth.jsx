import { useState } from "react";
import { supabase, setRememberMe } from "./supabaseClient";

const BG = "radial-gradient(1200px 800px at 50% -10%, #1A2740 0%, #0E1626 45%, #090E18 100%)";
const inputStyle = {
  width: "100%", padding: "14px", borderRadius: 13, border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)", fontSize: 16, color: "#EDF1F7", outline: "none", boxSizing: "border-box",
};
const btnStyle = {
  width: "100%", padding: "15px", borderRadius: 13, border: "none",
  background: "linear-gradient(135deg,#2E7CF6,#4DA3FF)", color: "#fff", fontSize: 15, fontWeight: 700,
  cursor: "pointer", boxShadow: "0 6px 20px rgba(46,124,246,0.35)", letterSpacing: "0.02em",
};
const linkStyle = { background: "none", border: "none", color: "#8B95A7", fontSize: 14, cursor: "pointer", padding: 6 };

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
  button { transition: transform .12s ease, opacity .12s ease; font-family: inherit; }
  button:active { transform: scale(0.97); }
  input::placeholder { color: #5E6878; }
  input:focus { border-color: rgba(77,163,255,0.55) !important; }
`;

function Shell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',ui-sans-serif,system-ui,sans-serif", padding: 16 }}>
      <style>{CSS}</style>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 46, fontWeight: 700, letterSpacing: "0.06em", color: "#fff", textTransform: "uppercase" }}>
            Deficit<span style={{ color: "#FF6B35" }}>.</span>
          </div>
          <div style={{ fontSize: 11, letterSpacing: "0.34em", color: "#67748B", textTransform: "uppercase", marginTop: 6 }}>Fuel in · Training out</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 22, padding: 24, backdropFilter: "blur(18px)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Auth() {
  const [mode, setMode] = useState("signin"); // signin | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [msg, setMsg] = useState(null); // {type:'ok'|'err', text}
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim()) { setMsg({ type: "err", text: "Enter your email." }); return; }
    setBusy(true); setMsg(null);
    try {
      if (mode === "signin") {
        setRememberMe(remember);
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) setMsg({ type: "err", text: error.message });
      } else if (mode === "signup") {
        if (password.length < 8) { setMsg({ type: "err", text: "Password needs at least 8 characters." }); setBusy(false); return; }
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) setMsg({ type: "err", text: error.message });
        else if (data.user && !data.session) setMsg({ type: "ok", text: "Check your email to confirm your account, then sign in." });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
        if (error) setMsg({ type: "err", text: error.message });
        else setMsg({ type: "ok", text: "Reset link sent — check your email." });
      }
    } catch {
      setMsg({ type: "err", text: "Something went wrong — try again." });
    }
    setBusy(false);
  };

  return (
    <Shell>
      <div style={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, color: "#8B95A7", marginBottom: 16 }}>
        {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password"}
      </div>
      {msg && (
        <div style={{
          borderRadius: 12, padding: "11px 14px", fontSize: 14, marginBottom: 14, lineHeight: 1.5,
          background: msg.type === "ok" ? "rgba(61,220,132,0.12)" : "rgba(255,92,92,0.12)",
          border: msg.type === "ok" ? "1px solid rgba(61,220,132,0.3)" : "1px solid rgba(255,92,92,0.3)",
          color: msg.type === "ok" ? "#7CE8A8" : "#FF9B9B",
        }}>{msg.text}</div>
      )}
      <input style={{ ...inputStyle, marginBottom: 10 }} type="email" placeholder="Email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
      {mode !== "forgot" && (
        <input style={{ ...inputStyle, marginBottom: 10 }} type="password" placeholder="Password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
      )}
      {mode === "signin" && (
        <button onClick={() => setRemember(!remember)} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", padding: "4px 2px 2px", cursor: "pointer", marginBottom: 4 }}>
          <span style={{
            width: 20, height: 20, borderRadius: 6, flexShrink: 0,
            border: remember ? "none" : "1.5px solid rgba(255,255,255,0.25)",
            background: remember ? "linear-gradient(135deg,#2E7CF6,#4DA3FF)" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700,
          }}>{remember ? "✓" : ""}</span>
          <span style={{ fontSize: 14, color: "#B9C2D0" }}>Keep me signed in on this device</span>
        </button>
      )}
      <button onClick={submit} disabled={busy} style={{ ...btnStyle, opacity: busy ? 0.6 : 1, marginTop: 4 }}>
        {busy ? "One moment…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
      </button>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
        {mode === "signin" ? (
          <>
            <button style={linkStyle} onClick={() => { setMode("signup"); setMsg(null); }}>Create account</button>
            <button style={linkStyle} onClick={() => { setMode("forgot"); setMsg(null); }}>Forgot password?</button>
          </>
        ) : (
          <button style={linkStyle} onClick={() => { setMode("signin"); setMsg(null); }}>← Back to sign in</button>
        )}
      </div>
    </Shell>
  );
}

export function ResetPassword({ onDone }) {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (password.length < 8) { setMsg({ type: "err", text: "Password needs at least 8 characters." }); return; }
    setBusy(true); setMsg(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setMsg({ type: "err", text: error.message });
    else onDone();
    setBusy(false);
  };

  return (
    <Shell>
      <div style={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, color: "#8B95A7", marginBottom: 16 }}>Set a new password</div>
      {msg && <div style={{ borderRadius: 12, padding: "11px 14px", fontSize: 14, marginBottom: 14, background: "rgba(255,92,92,0.12)", border: "1px solid rgba(255,92,92,0.3)", color: "#FF9B9B" }}>{msg.text}</div>}
      <input style={{ ...inputStyle, marginBottom: 10 }} type="password" placeholder="New password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
      <button onClick={submit} disabled={busy} style={{ ...btnStyle, opacity: busy ? 0.6 : 1 }}>{busy ? "Saving…" : "Save and continue"}</button>
    </Shell>
  );
}

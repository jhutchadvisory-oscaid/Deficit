import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { supabase } from "./supabaseClient";
import DeficitTracker from "./App";
import Auth, { ResetPassword } from "./Auth";

function Root() {
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) return null; // brief blank while checking; App has its own splash
  if (recovery && session) return <ResetPassword onDone={() => setRecovery(false)} />;
  if (!session) return <Auth />;
  return <DeficitTracker key={session.user.id} session={session} />;
}

createRoot(document.getElementById("root")).render(<Root />);

import { createClient } from "@supabase/supabase-js";

// "Remember me" controls where the session lives:
//  - ticked  -> localStorage (survives closing the app)
//  - unticked -> sessionStorage (cleared when the tab/app closes)
// The choice is recorded before sign-in via setRememberMe().
const REMEMBER_KEY = "deficit.remember";

const hybridStorage = {
  getItem: (k) => {
    const v = window.localStorage.getItem(k);
    return v !== null ? v : window.sessionStorage.getItem(k);
  },
  setItem: (k, v) => {
    const remember = window.localStorage.getItem(REMEMBER_KEY) !== "false";
    if (remember) {
      window.localStorage.setItem(k, v);
      window.sessionStorage.removeItem(k);
    } else {
      window.sessionStorage.setItem(k, v);
      window.localStorage.removeItem(k);
    }
  },
  removeItem: (k) => {
    window.localStorage.removeItem(k);
    window.sessionStorage.removeItem(k);
  },
};

export const setRememberMe = (remember) => {
  window.localStorage.setItem(REMEMBER_KEY, remember ? "true" : "false");
};

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { storage: hybridStorage, persistSession: true, autoRefreshToken: true } }
);

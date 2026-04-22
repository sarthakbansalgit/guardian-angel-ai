import { supabase } from "@/integrations/supabase/client";

let pending: Promise<string | null> | null = null;

/**
 * Ensures the user has a Supabase session (anonymous if needed).
 * Returns the user id, or null on failure.
 */
export async function ensureSession(): Promise<string | null> {
  if (pending) return pending;
  pending = (async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) return data.session.user.id;
    const { data: anon, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error("Anonymous sign-in failed:", error);
      return null;
    }
    return anon.user?.id ?? null;
  })();
  try {
    return await pending;
  } finally {
    // allow retry on next call if it failed
    pending = null;
  }
}

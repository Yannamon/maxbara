import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { ivorianPhone } from "./phone";

export const pendingPhoneCookie = "mb-pending-phone";

export function authConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}

export async function authClient() {
  const config = authConfig();
  if (!config) return null;
  const jar = await cookies();
  return createServerClient(config.url, config.key, {
    cookieOptions: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" },
    cookies: {
      getAll: () => jar.getAll(),
      setAll(updates) {
        try {
          for (const { name, value, options } of updates) jar.set(name, value, options);
        } catch {
          // Proxy refreshes cookies before rendering a server component.
        }
      },
    },
  });
}

export async function currentUser() {
  const client = await authClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  const phone = ivorianPhone(data.user?.phone);
  return data.user && phone ? { id: data.user.id, phone } : null;
}

export const documentBucket = "case-documents";

export function privateStorage() {
  const url = authConfig()?.url;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Private Storage is not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    .storage.from(documentBucket);
}

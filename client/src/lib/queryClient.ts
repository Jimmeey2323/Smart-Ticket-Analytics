import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "./supabase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: HeadersInit = {};

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    return headers;
  } catch (err) {
    // On any auth retrieval error, return empty headers quickly to avoid
    // spamming the server with failing auth calls.
    return {};
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(url, {
    method,
    headers: {
      ...authHeaders,
      ...(data ? { "Content-Type": "application/json" } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const buildUrl = (key: readonly unknown[]) => {
      const base = String(key[0] ?? "");
      if (key.length <= 1) return base;

      if (key.length === 2) {
        const second = key[1] as any;
        if (second && typeof second === "object" && !Array.isArray(second)) {
          const params = new URLSearchParams();
          for (const [k, v] of Object.entries(second)) {
            if (v === undefined || v === null || v === "") continue;
            params.set(k, String(v));
          }
          const qs = params.toString();
          return qs ? `${base}?${qs}` : base;
        }

        return `${base}/${encodeURIComponent(String(second))}`;
      }

      // Fallback: treat remaining segments as path parts.
      const parts = key.slice(1).map((v) => encodeURIComponent(String(v)));
      return `${base}/${parts.join("/")}`;
    };

    const authHeaders = await getAuthHeaders();
    const url = buildUrl(queryKey);
    const res = await fetch(url, {
      headers: authHeaders,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // In development, return null for 401 responses so components can
      // handle unauthenticated state without throwing and causing retry
      // storms. Change back to "throw" in production when auth is stable.
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

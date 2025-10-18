import type { AuthProvider } from "@refinedev/core";
import { getApiUrlSync } from "../config/api";

const SERVER_ENDPOINT = "/server";
const USER_STORAGE_KEY = "auth-user";

const buildUrl = (baseUrl: string, path: string) => {
  if (baseUrl.endsWith("/")) {
    return `${baseUrl.slice(0, -1)}${path}`;
  }
  return `${baseUrl}${path}`;
};

const fetchWithSession = async (input: RequestInfo, init: RequestInit = {}) => {
  const method = (init.method || "GET").toUpperCase();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };

  if (method !== "GET" && method !== "HEAD" && init.body !== undefined) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }

  // Usar Basic Auth em vez de cookies
  if (typeof window !== "undefined") {
    const credentials = localStorage.getItem("auth-credentials") || localStorage.getItem("auth-basic");
    if (credentials) {
      headers["Authorization"] = `Basic ${credentials}`;
    }
  }

  const options: RequestInit = {
    ...init,
    headers,
  };

  return fetch(input, options);
};

type SessionResponse = {
  id?: number;
  name?: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
};

const storeUser = (username?: string | null) => {
  if (username) {
    localStorage.setItem(USER_STORAGE_KEY, username);
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
};

const parseUserName = (payload: SessionResponse | null): string | null => {
  if (!payload) return null;
  return (
    (payload.username as string | undefined) ||
    (payload.email as string | undefined) ||
    (payload.name as string | undefined) ||
    null
  );
};

export const createAuthProvider = (): AuthProvider => {
  const baseUrl = getApiUrlSync();
  console.log("🔧 Auth Provider (session) - Base URL:", baseUrl);
  const isDirectDev =
    typeof window !== "undefined" &&
    baseUrl.startsWith("http://") &&
    !baseUrl.startsWith(window.location.origin);

  return {
    login: async ({ username, password }) => {
      try {
        // Salvar credenciais primeiro
        const basic = btoa(`${username}:${password}`);
        localStorage.setItem("auth-credentials", basic);
        localStorage.setItem("auth-basic", basic);
        
        const response = await fetchWithSession(buildUrl(baseUrl, SERVER_ENDPOINT), {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn("Login failed", response.status, errorText);
          return {
            success: false,
            error: {
              name: "Login Error",
              message: "Não foi possível autenticar. Verifique as credenciais.",
            },
          };
        }

        let payload: SessionResponse | null = null;
        try {
          payload = (await response.json()) as SessionResponse;
        } catch {
          payload = null;
        }

        const displayName = parseUserName(payload) || username;
        storeUser(displayName);

        if (typeof window !== "undefined") {
          const basic = btoa(`${username}:${password}`);
          // Salvar em ambos os formatos para compatibilidade
          localStorage.setItem("auth-credentials", basic);
          localStorage.setItem("auth-basic", basic);
          console.log('💾 Credenciais salvas no localStorage:', { username, basic });
        }

        return {
          success: true,
          redirectTo: "/dashboard",
        };
      } catch (error) {
        console.error("Login error:", error);
        return {
          success: false,
          error: {
            name: "Network Error",
            message: "Falha ao conectar ao servidor. Tente novamente em instantes.",
          },
        };
      }
    },
    check: async () => {
      try {
        // Verificar se há usuário armazenado localmente primeiro
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        if (!storedUser) {
          console.log('🔍 Nenhum usuário armazenado, redirecionando para login');
          return {
            authenticated: false,
            logout: true,
            redirectTo: "/login",
          };
        }

        // Só verificar sessão se houver usuário armazenado
        const response = await fetchWithSession(
          buildUrl(baseUrl, SERVER_ENDPOINT),
          { method: "GET" }
        );

        if (!response.ok) {
          console.log('🔍 Sessão inválida, limpando dados locais');
          storeUser(null);
          return {
            authenticated: false,
            logout: true,
            redirectTo: "/login",
          };
        }

        let payload: SessionResponse | null = null;
        try {
          payload = (await response.json()) as SessionResponse;
        } catch {
          payload = null;
        }

        const displayName = parseUserName(payload);
        if (displayName) {
          storeUser(displayName);
        }

        return { authenticated: true };
      } catch (error) {
        console.error("Check auth error:", error);
        return {
          authenticated: false,
          logout: true,
          redirectTo: "/login",
        };
      }
    },
    logout: async () => {
      try {
        // Para Basic Auth, não há logout no servidor, apenas limpar localStorage
        console.log('🔓 Logging out user...');
      } catch (error) {
        // Ignorar erros de logout
        console.log('❌ Logout error (ignored):', error);
      } finally {
        // Sempre limpar dados do localStorage
        storeUser(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth-basic");
          localStorage.removeItem("auth-credentials");
          localStorage.removeItem("auth-user");
          localStorage.removeItem("welcome-completed"); // Limpar também o welcome
        }
        console.log('✅ User data cleared from localStorage');
      }

      return {
        success: true,
        redirectTo: "/login",
      };
    },
    onError: async (error: any) => {
      if (error?.status === 401 || error?.status === 403) {
        storeUser(null);
        return {
          logout: true,
          redirectTo: "/login",
          error,
        };
      }

      return { error };
    },
    getIdentity: async () => {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (!storedUser) {
        try {
          const response = await fetchWithSession(
            buildUrl(baseUrl, SERVER_ENDPOINT),
            { method: "GET" }
          );
          if (response.ok) {
            const payload = (await response.json()) as SessionResponse;
            const displayName = parseUserName(payload);
            if (displayName) {
              storeUser(displayName);
              return {
                id: displayName,
                name: displayName,
                username: displayName,
              };
            }
          }
        } catch (error) {
          console.warn("getIdentity error:", error);
        }
        return null;
      }

      return {
        id: storedUser,
        name: storedUser,
        username: storedUser,
      };
    },
  };
};

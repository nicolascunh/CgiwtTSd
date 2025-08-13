import type { AuthProvider } from "@refinedev/core";

export const createAuthProvider = (apiUrl: string): AuthProvider => {
  return {
    login: async ({ username, password }: { username: string; password: string }) => {
      try {
        // Criar Basic Auth header
        const credentials = btoa(`${username}:${password}`);
        
        const response = await fetch(`${apiUrl}/api/session`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Basic ${credentials}`
          },
        });

        if (response.ok) {
          // Salvar credenciais no localStorage apenas se login for bem-sucedido
          localStorage.setItem("auth-credentials", credentials);
          localStorage.setItem("auth-user", username);
          
          return {
            success: true,
            redirectTo: "/",
          };
        }

        // Tentar obter mensagem de erro do servidor
        let errorMessage = "Invalid credentials";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Se não conseguir ler o JSON, usar status code
          if (response.status === 401) {
            errorMessage = "Invalid username or password";
          } else if (response.status === 403) {
            errorMessage = "Access denied";
          } else if (response.status >= 500) {
            errorMessage = "Server error. Please try again later.";
          }
        }

        return {
          success: false,
          error: {
            name: "Login Error",
            message: errorMessage,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: {
            name: "Network Error",
            message: "Unable to connect to server. Please check your connection.",
          },
        };
      }
    },
    check: async () => {
      try {
        const storedCredentials = localStorage.getItem("auth-credentials");
        
        if (!storedCredentials) {
          return {
            authenticated: false,
            error: {
              name: "Not authenticated",
              message: "Please login to continue",
            },
            logout: true,
            redirectTo: "/login",
          };
        }

        const response = await fetch(`${apiUrl}/api/session`, {
          method: "GET",
          headers: {
            "Authorization": `Basic ${storedCredentials}`
          },
        });

        if (response.ok) {
          return {
            authenticated: true,
          };
        }

        // Limpar credenciais se não estiver autenticado
        localStorage.removeItem("auth-credentials");
        localStorage.removeItem("auth-user");

        return {
          authenticated: false,
          error: {
            name: "Session expired",
            message: "Your session has expired. Please login again.",
          },
          logout: true,
          redirectTo: "/login",
        };
      } catch (error) {
        // Em caso de erro de rede, manter autenticado se tiver credenciais
        const storedCredentials = localStorage.getItem("auth-credentials");
        if (storedCredentials) {
          return {
            authenticated: true,
          };
        }

        return {
          authenticated: false,
          error: {
            name: "Network Error",
            message: "Unable to verify authentication. Please login again.",
          },
          logout: true,
          redirectTo: "/login",
        };
      }
    },
    logout: async () => {
      try {
        const storedCredentials = localStorage.getItem("auth-credentials");
        
        if (storedCredentials) {
          const response = await fetch(`${apiUrl}/api/session`, {
            method: "DELETE",
            headers: {
              "Authorization": `Basic ${storedCredentials}`
            },
          });
        }
      } catch (error) {
        // Ignorar erros de logout
      } finally {
        // Sempre limpar credenciais do localStorage
        localStorage.removeItem("auth-credentials");
        localStorage.removeItem("auth-user");
      }

      return {
        success: true,
        redirectTo: "/login",
      };
    },
    onError: async (error: any) => {
      if (error.status === 401 || error.status === 403) {
        // Limpar credenciais em caso de erro de autenticação
        localStorage.removeItem("auth-credentials");
        localStorage.removeItem("auth-user");
        
        return {
          logout: true,
          redirectTo: "/login",
          error,
        };
      }

      return { error };
    },
    getIdentity: async () => {
      try {
        const storedCredentials = localStorage.getItem("auth-credentials");
        const username = localStorage.getItem("auth-user");
        
        if (!storedCredentials || !username) {
          return null;
        }

        const response = await fetch(`${apiUrl}/api/session`, {
          method: "GET",
          headers: {
            "Authorization": `Basic ${storedCredentials}`
          },
        });

        if (response.ok) {
          try {
            const user = await response.json();
            return user;
          } catch {
            // Se não conseguir ler o JSON, retornar objeto básico
            return {
              id: username,
              name: username,
              username: username,
            };
          }
        }

        return null;
      } catch (error) {
        return null;
      }
    },
  };
};

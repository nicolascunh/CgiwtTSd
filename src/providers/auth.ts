import type { AuthProvider } from "@refinedev/core";

export const createAuthProvider = (apiUrl: string): AuthProvider => {
  return {
    login: async ({ username, password }: { username: string; password: string }) => {
      try {
        // Criar dados no formato que o servidor espera
        const formData = new URLSearchParams();
        formData.append('action', 'login');
        formData.append('email', username);
        formData.append('password', password);
        
        const response = await fetch(`${apiUrl}/api/session`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: formData.toString(),
        });

        if (response.ok) {
          // Salvar credenciais no localStorage apenas se login for bem-sucedido
          const credentials = btoa(`${username}:${password}`);
          localStorage.setItem("auth-credentials", credentials);
          localStorage.setItem("auth-user", username);
          
          console.log('Login successful, redirecting to dashboard...');
          
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
          if (response.status === 400) {
            errorMessage = "Usuário/Senha incorretos";
          } else if (response.status === 401) {
            errorMessage = "Acesso não autorizado";
          } else if (response.status === 403) {
            errorMessage = "Access denied";
          } else if (response.status === 415) {
            errorMessage = "Server configuration error";
          } else if (response.status >= 500) {
            errorMessage = "Server error. Please try again later.";
          }
        }

        console.log('Login failed:', errorMessage);

        return {
          success: false,
          error: {
            name: "Login Error",
            message: errorMessage,
          },
        };
      } catch (error) {
        console.log('Login error:', error);
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
        const storedUser = localStorage.getItem("auth-user");
        
        console.log('Checking auth - credentials:', !!storedCredentials, 'user:', storedUser);
        
        if (!storedCredentials || !storedUser) {
          console.log('No stored credentials, redirecting to login');
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

        // Como o servidor Traccar não suporta verificação de sessão via GET,
        // vamos assumir que se temos credenciais válidas, estamos autenticados
        console.log('Have stored credentials, assuming authenticated');
        return {
          authenticated: true,
        };
      } catch (error) {
        console.log('Check auth error:', error);
        // Em caso de erro, verificar se temos credenciais salvas
        const storedCredentials = localStorage.getItem("auth-credentials");
        const storedUser = localStorage.getItem("auth-user");
        
        if (storedCredentials && storedUser) {
          console.log('Network error but have stored credentials, assuming authenticated');
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
          // Tentar fazer logout no servidor, mas não falhar se não funcionar
          try {
            const response = await fetch(`${apiUrl}/api/session`, {
              method: "DELETE",
              headers: {
                "Authorization": `Basic ${storedCredentials}`
              },
            });
          } catch (error) {
            // Ignorar erros de logout no servidor
            console.log('Logout server error (ignored):', error);
          }
        }
      } catch (error) {
        // Ignorar erros de logout
        console.log('Logout error (ignored):', error);
      } finally {
        // Sempre limpar credenciais do localStorage
        localStorage.removeItem("auth-credentials");
        localStorage.removeItem("auth-user");
        console.log('Credentials cleared from localStorage');
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

        // Retornar informações básicas do usuário sem fazer requisição ao servidor
        return {
          id: username,
          name: username,
          username: username,
        };
      } catch (error) {
        return null;
      }
    },
  };
};

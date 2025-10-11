import type { AuthProvider } from "@refinedev/core";
import { getApiUrl } from '../config/api';

export const createAuthProvider = (apiUrl?: string): AuthProvider => {
  // Sempre usar getApiUrl() para garantir detecção correta do ambiente
  const baseUrl = getApiUrl();
  console.log('🔧 Auth Provider - Base URL:', baseUrl);
  console.log('🔧 Auth Provider - Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'server-side');
  return {
    login: async ({ username, password }: { username: string; password: string }) => {
      try {
        // Traccar usa Basic Auth, não sessões
        const credentials = btoa(`${username}:${password}`);
        
        // Testar credenciais fazendo uma requisição para /api/server
        const response = await fetch(`${baseUrl}/server`, {
          method: "GET",
          headers: { 
            "Authorization": `Basic ${credentials}`
          }
        });

        console.log('Login response status:', response.status);
        console.log('Login response headers:', Object.fromEntries(response.headers.entries()));
        console.log('Login credentials used:', credentials);
        console.log('Login URL:', `${baseUrl}/server`);

        if (response.ok) {
          // Salvar credenciais e usuário no localStorage se login for bem-sucedido
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
          console.log('Error response data:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (jsonError) {
          console.log('Could not parse error response as JSON:', jsonError);
          // Se não conseguir ler o JSON, usar status code
          if (response.status === 400) {
            errorMessage = "Usuário/Senha incorretos";
          } else if (response.status === 401) {
            errorMessage = "Acesso não autorizado - verifique suas credenciais";
          } else if (response.status === 403) {
            errorMessage = "Access denied";
          } else if (response.status === 415) {
            errorMessage = "Server configuration error";
          } else if (response.status >= 500) {
            errorMessage = "Server error. Please try again later.";
          }
        }

        console.log('Login failed:', errorMessage);
        console.log('Response status:', response.status);
        console.log('Response statusText:', response.statusText);

        return {
          success: false,
          error: {
            name: "Login Error",
            message: `${errorMessage} (Status: ${response.status})`,
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
        const storedUser = localStorage.getItem("auth-user");
        const storedCredentials = localStorage.getItem("auth-credentials");
        
        console.log('Checking auth - user:', storedUser, 'credentials:', !!storedCredentials);
        
        if (!storedUser || !storedCredentials) {
          console.log('No stored user or credentials, redirecting to login');
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

        // Verificar se as credenciais ainda são válidas fazendo uma requisição para /api/server
        try {
          const response = await fetch(`${baseUrl}/server`, {
            method: "GET",
            headers: {
              "Authorization": `Basic ${storedCredentials}`
            }
          });

          console.log('Auth check response status:', response.status);

          if (response.ok) {
            console.log('Credentials are valid');
            return {
              authenticated: true,
            };
          } else {
            console.log('Credentials are invalid, redirecting to login');
            localStorage.removeItem("auth-user");
            localStorage.removeItem("auth-credentials");
            return {
              authenticated: false,
              error: {
                name: "Authentication expired",
                message: "Please login again",
              },
              logout: true,
              redirectTo: "/login",
            };
          }
        } catch (authError) {
          console.log('Error checking auth:', authError);
          console.log('Assuming authenticated if credentials exist');
          return {
            authenticated: true,
          };
        }
      } catch (error) {
        console.log('Check auth error:', error);
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
        // Para Basic Auth, não há logout no servidor, apenas limpar localStorage
        console.log('Logging out user...');
      } catch (error) {
        // Ignorar erros de logout
        console.log('Logout error (ignored):', error);
      } finally {
        // Sempre limpar dados do localStorage
        localStorage.removeItem("auth-credentials");
        localStorage.removeItem("auth-user");
        console.log('User data cleared from localStorage');
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

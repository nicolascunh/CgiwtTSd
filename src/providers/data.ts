import simpleRestDataProvider from "@refinedev/simple-rest";

export const createDataProvider = (apiUrl: string) => {
  // Interceptar fetch para adicionar Basic Auth
  const originalFetch = window.fetch;
  
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const storedCredentials = localStorage.getItem("auth-credentials");
    
    if (storedCredentials && typeof input === 'string' && input.startsWith(apiUrl)) {
      const headers = new Headers(init?.headers);
      headers.set('Authorization', `Basic ${storedCredentials}`);
      
      return originalFetch(input, {
        ...init,
        headers,
      });
    }
    
    return originalFetch(input, init);
  };

  return simpleRestDataProvider(apiUrl);
};

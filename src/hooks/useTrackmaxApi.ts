import { useState } from 'react';
import type { Device, Position, User, Group, Notification, Event, ReportTrips, MaintenanceRecord, Driver } from '../types';
import { getApiUrl } from '../config/api';

type FetchEventsParams = {
  deviceIds?: number[];
  types?: string[];
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

type FetchTripsParams = {
  deviceIds?: number[];
  from: string;
  to: string;
};

type FetchMaintenanceParams = {
  deviceIds?: number[];
};

export const useTrackmaxApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache para posições (5 minutos)
  const positionsCache = new Map<string, { data: Position[]; timestamp: number }>();
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  // Função para verificar cache
  const getCachedPositions = (cacheKey: string): Position[] | null => {
    const cached = positionsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('📦 Usando posições do cache:', cached.data.length);
      return cached.data;
    }
    return null;
  };

  const fetchEvents = async (params: FetchEventsParams = {}): Promise<Event[]> => {
    setLoading(true);
    setError(null);

    try {
      // Limitar o número de deviceIds para evitar URLs muito longas
      const MAX_DEVICES_PER_REQUEST = 50;
      const deviceIds = params.deviceIds || [];
      
      if (deviceIds.length === 0) {
        console.log('🚨 Nenhum deviceId fornecido para buscar eventos');
        return [];
      }

      // Se temos muitos dispositivos, fazer requisições em lotes
      if (deviceIds.length > MAX_DEVICES_PER_REQUEST) {
        console.log(`🚨 Muitos dispositivos (${deviceIds.length}), fazendo requisições em lotes de ${MAX_DEVICES_PER_REQUEST}`);
        
        const allEvents: Event[] = [];
        const batches = [];
        
        for (let i = 0; i < deviceIds.length; i += MAX_DEVICES_PER_REQUEST) {
          batches.push(deviceIds.slice(i, i + MAX_DEVICES_PER_REQUEST));
        }

        for (const batch of batches) {
          const batchEvents = await fetchEventsBatch({
            ...params,
            deviceIds: batch
          });
          allEvents.push(...batchEvents);
        }

        console.log('🚨 Total de eventos recebidos de todos os lotes:', allEvents.length);
        return allEvents;
      }

      return await fetchEventsBatch(params);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar eventos';
      console.error('❌ Erro ao buscar eventos:', err);
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchEventsBatch = async (params: FetchEventsParams = {}): Promise<Event[]> => {
    try {
      const query = new URLSearchParams();

      if (params.from) {
        query.append('from', params.from);
      }
      if (params.to) {
        query.append('to', params.to);
      }
      if (params.page) {
        query.append('page', params.page.toString());
      }
      if (params.pageSize) {
        query.append('pageSize', params.pageSize.toString());
      }

      params.deviceIds?.forEach((id) => query.append('deviceId', id.toString()));
      params.types?.forEach((type) => query.append('type', type));

      const url = `${getApiUrl()}/events${query.toString() ? `?${query.toString()}` : ''}`;
      console.log('🚨 Buscando eventos (lote):', url);

      const response = await fetchWithRetry(url, getFetchOptions({
        headers: {
          Accept: 'application/json',
        },
      }));

      if (response.status === 404) {
        console.warn('⚠️ Endpoint de eventos retornou 404, retornando lista vazia.');
        return [];
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      const events: Event[] = Array.isArray(data) ? data : data.events || [];

      console.log('🚨 Eventos recebidos (lote):', events.length);
      return events;
    } catch (err) {
      if (err instanceof TypeError) {
        console.warn('⚠️ Falha ao buscar eventos (possível CORS)', err.message);
        return [];
      }
      throw err;
    }
  };

  const fetchTrips = async ({ deviceIds = [], from, to }: FetchTripsParams): Promise<ReportTrips[]> => {
    setLoading(true);
    setError(null);

    try {
      if (!from || !to) {
        throw new Error('Parâmetros "from" e "to" são obrigatórios para buscar viagens');
      }

      // Limitar o número de deviceIds para evitar URLs muito longas
      const MAX_DEVICES_PER_REQUEST = 50;
      
      if (deviceIds.length === 0) {
        console.log('🛣️ Nenhum deviceId fornecido para buscar viagens');
        return [];
      }

      // Se temos muitos dispositivos, fazer requisições em lotes
      if (deviceIds.length > MAX_DEVICES_PER_REQUEST) {
        console.log(`🛣️ Muitos dispositivos (${deviceIds.length}), fazendo requisições em lotes de ${MAX_DEVICES_PER_REQUEST}`);
        
        const allTrips: ReportTrips[] = [];
        const batches = [];
        
        for (let i = 0; i < deviceIds.length; i += MAX_DEVICES_PER_REQUEST) {
          batches.push(deviceIds.slice(i, i + MAX_DEVICES_PER_REQUEST));
        }

        for (const batch of batches) {
          const batchTrips = await fetchTripsBatch({
            deviceIds: batch,
            from,
            to
          });
          allTrips.push(...batchTrips);
        }

        console.log('🛣️ Total de viagens recebidas de todos os lotes:', allTrips.length);
        return allTrips;
      }

      return await fetchTripsBatch({ deviceIds, from, to });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar viagens';
      console.error('❌ Erro ao buscar viagens:', err);
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchTripsBatch = async ({ deviceIds = [], from, to }: FetchTripsParams): Promise<ReportTrips[]> => {
    try {
      const url = `${getApiUrl()}/reports/trips`;
      const search = new URLSearchParams();
      deviceIds.forEach((id) => search.append('deviceId', id.toString()));
      search.append('from', from);
      search.append('to', to);

      const fullUrl = `${url}?${search.toString()}`;
      console.log('🛣️ Buscando viagens (lote):', fullUrl);

      const response = await fetchWithRetry(
        fullUrl,
        getFetchOptions({
          headers: {
            Accept: 'application/json',
          },
        }),
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      const trips: ReportTrips[] = Array.isArray(data) ? data : data.trips || [];

      console.log('🛣️ Viagens recebidas (lote):', trips.length);
      return trips;
    } catch (err) {
      throw err;
    }
  };

  const fetchMaintenances = async (params: FetchMaintenanceParams = {}): Promise<MaintenanceRecord[]> => {
    setLoading(true);
    setError(null);

    try {
      console.log('ℹ️ Ignorando fetch de manutenções na API (não disponível via CORS).');
      return [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar manutenções';
      console.error('❌ Erro ao buscar manutenções:', err);
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async (): Promise<Driver[]> => {
    setLoading(true);
    setError(null);

    try {
      const url = `${getApiUrl()}/drivers`;
      console.log('🧍‍♂️ Buscando motoristas:', url);

      const response = await fetchWithRetry(url, getFetchOptions());

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      const drivers: Driver[] = Array.isArray(data) ? data : data.drivers || [];

      console.log('🧍‍♂️ Motoristas recebidos:', drivers.length);
      return drivers;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar motoristas';
      console.error('❌ Erro ao buscar motoristas:', err);
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };
  // Função para salvar no cache
  const setCachedPositions = (cacheKey: string, data: Position[]) => {
    positionsCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    console.log('💾 Posições salvas no cache:', data.length);
  };

  const getAuthHeaders = (): Record<string, string> => {
    // Para Traccar, usamos Basic Auth
    const storedCredentials = localStorage.getItem("auth-credentials");
    console.log('🔑 Credenciais recuperadas do localStorage:', storedCredentials ? 'Present' : 'Missing');
    console.log('🔑 API URL sendo usada:', getApiUrl());
    
    return storedCredentials ? {
      "Authorization": `Basic ${storedCredentials}`
    } : {};
  };

  const getFetchOptions = (overrides: RequestInit = {}): RequestInit => {
    const overrideHeaders = overrides.headers as Record<string, string> | undefined;
    const authHeaders = getAuthHeaders();

    console.log('🔑 Headers de autenticação:', authHeaders);
    console.log('🔑 Headers customizados:', overrideHeaders);

    return {
      ...overrides,
      headers: {
        ...authHeaders,
        ...overrideHeaders,
      },
      signal: overrides.signal ?? AbortSignal.timeout(120000), // 2 minutos para frotas grandes
    };
  };

  // Função para retry com backoff exponencial
  const fetchWithRetry = async (
    url: string, 
    options: RequestInit, 
    maxRetries: number = 3
  ): Promise<Response> => {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Tentativa ${attempt}/${maxRetries} para: ${url}`);
        const response = await fetch(url, options);
        
        if (response.ok) {
          return response;
        }
        
        // Se for erro 500, tentar novamente
        if (response.status === 500 && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Backoff exponencial
          console.log(`⏳ Erro 500, aguardando ${delay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        return response;
      } catch (error) {
        lastError = error as Error;
        console.log(`❌ Erro na tentativa ${attempt}:`, error);
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Todas as tentativas falharam');
  };

  const fetchDevices = async (
    page: number = 1, 
    pageSize: number = 50
  ): Promise<{ devices: Device[]; total: number; hasMore: boolean }> => {
    setLoading(true);
    setError(null);
    
    try {
      const url = `${getApiUrl()}/devices?limit=${pageSize}&offset=${(page - 1) * pageSize}`;
      
      console.log('🔍 Buscando dispositivos:', url);
      console.log('🔑 Headers:', getAuthHeaders());
      console.log('🔑 Credenciais salvas:', !!localStorage.getItem("auth-credentials"));

      const response = await fetchWithRetry(url, getFetchOptions());

      console.log('📡 Resposta da API:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📱 Dados recebidos:', data);
      
      const devices = Array.isArray(data) ? data : data.devices || data;
      const total = data.total || devices.length;
      const hasMore = devices.length === pageSize;

      console.log('✅ Dispositivos processados:', devices.length, devices);

      return { devices, total, hasMore };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar dispositivos';
      console.error('❌ Erro ao buscar dispositivos:', err);
      setError(errorMessage);
      return { devices: [], total: 0, hasMore: false };
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async (
    deviceIds?: number[], 
    limit: number = 500
  ): Promise<Position[]> => {
    setLoading(true);
    setError(null);
    
    try {
      // Limitar o número de deviceIds para evitar URLs muito longas
      const MAX_DEVICES_PER_REQUEST = 50;
      const deviceIdsList = deviceIds || [];
      
      // Se temos muitos dispositivos, fazer requisições em lotes
      if (deviceIdsList.length > MAX_DEVICES_PER_REQUEST) {
        console.log(`📍 Muitos dispositivos (${deviceIdsList.length}), fazendo requisições em lotes de ${MAX_DEVICES_PER_REQUEST}`);
        
        const allPositions: Position[] = [];
        const batches = [];
        
        for (let i = 0; i < deviceIdsList.length; i += MAX_DEVICES_PER_REQUEST) {
          batches.push(deviceIdsList.slice(i, i + MAX_DEVICES_PER_REQUEST));
        }

        for (const batch of batches) {
          const batchPositions = await fetchPositionsBatch(batch, limit);
          allPositions.push(...batchPositions);
        }

        console.log('📍 Total de posições recebidas de todos os lotes:', allPositions.length);
        return allPositions;
      }

      return await fetchPositionsBatch(deviceIdsList, limit);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar posições';
      console.error('❌ Erro ao buscar posições:', err);
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchPositionsBatch = async (
    deviceIds: number[], 
    limit: number = 500
  ): Promise<Position[]> => {
    // Criar chave do cache
    const cacheKey = `positions_${limit}_${deviceIds?.join(',') || 'all'}`;
    
    // Verificar cache primeiro
    const cachedPositions = getCachedPositions(cacheKey);
    if (cachedPositions) {
      return cachedPositions;
    }
    
    try {
      // Buscar todas as posições (sem filtro de deviceId na URL)
      const params = new URLSearchParams({ limit: limit.toString() });
      if (deviceIds && deviceIds.length > 0) {
        deviceIds.forEach((id) => params.append('deviceId', id.toString()));
      }

      const url = `${getApiUrl()}/positions?${params.toString()}`;

      console.log('🔍 Buscando posições (lote):', url);

      const response = await fetchWithRetry(url, getFetchOptions({
        headers: {
          Accept: 'application/json',
        },
      }));

      console.log('📡 Resposta da API (posições):', response.status, response.statusText);

      if (response.status === 500) {
        throw new Error('500');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📍 Dados de posições recebidos:', data);
      
      let positions = Array.isArray(data) ? data : [];
      
      const normalizePosition = (raw: Record<string, unknown>): Position => {
        const rawDeviceId = typeof raw.deviceId === 'string' ? Number(raw.deviceId) : raw.deviceId;
        const deviceId = Number.isFinite(rawDeviceId) ? (rawDeviceId as number) : 0;
        const parseCoordinate = (value: unknown): number | undefined => {
          if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
          }
          if (typeof value === 'string' && value.trim().length) {
            const numeric = Number(value.replace(/,/g, '.'));
            return Number.isFinite(numeric) ? numeric : undefined;
          }
          return undefined;
        };
        const latitude = parseCoordinate(raw.latitude);
        const longitude = parseCoordinate(raw.longitude);
        const attributes = (raw.attributes ?? {}) as Record<string, unknown>;
        const addressCandidate =
          (typeof raw.address === 'string' && raw.address.trim()) ||
          (typeof attributes.address === 'string' && attributes.address.trim()) ||
          (typeof attributes.formattedAddress === 'string' && attributes.formattedAddress.trim()) ||
          (typeof attributes.fullAddress === 'string' && attributes.fullAddress.trim()) ||
          '';

        return {
          ...(raw as Position),
          deviceId,
          latitude: latitude ?? 0,
          longitude: longitude ?? 0,
          address: addressCandidate,
          attributes,
        };
      };

      positions = positions.map((pos) => normalizePosition(pos as Record<string, unknown>));
      
      // Filtrar por deviceIds se especificado
      if (deviceIds && deviceIds.length > 0) {
        positions = positions.filter((pos) => deviceIds.includes(Number(pos.deviceId)));
        console.log('🔍 Posições filtradas por deviceIds:', positions.length);

        const existingIds = new Set<number>();
        positions.forEach((pos) => existingIds.add(Number(pos.deviceId)));
        const missingIds = deviceIds.filter((id) => !existingIds.has(id));

        if (missingIds.length > 0) {
          console.warn('⚠️ Nem todas as posições foram retornadas. Buscando individualmente:', missingIds);
          const fallbackResults = await Promise.all(
            missingIds.map(async (id) => {
              try {
                const fallbackParams = new URLSearchParams({ deviceId: id.toString(), limit: '1' });
                const fallbackUrl = `${getApiUrl()}/positions?${fallbackParams.toString()}`;
                const fallbackResponse = await fetchWithRetry(
                  fallbackUrl,
                  getFetchOptions({
                    headers: {
                      Accept: 'application/json',
                    },
                  }),
                );
                if (!fallbackResponse.ok) {
                  console.warn(`⚠️ Falha ao buscar posição individual para device ${id}:`, fallbackResponse.status);
                  return [];
                }
                const fallbackData = await fallbackResponse.json();
                const fallbackArray = Array.isArray(fallbackData) ? fallbackData : [];
                return fallbackArray.map((entry) => normalizePosition(entry as Record<string, unknown>));
              } catch (error) {
                console.error(`❌ Erro ao buscar fallback de posição para device ${id}:`, error);
                return [];
              }
            }),
          );

          const fallbackPositions = fallbackResults.flat();
          if (fallbackPositions.length > 0) {
            console.log('✅ Posições complementares carregadas:', fallbackPositions.length);
            positions = [...positions, ...fallbackPositions];
          }
        }
      }
      
      // Salvar no cache
      setCachedPositions(cacheKey, positions);
      
      console.log('✅ Posições processadas:', positions.length, positions);

      return positions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar posições';
      console.error('❌ Erro ao buscar posições:', err);

      const expiredCache = positionsCache.get(cacheKey);
      if (expiredCache) {
        console.log('🔄 Usando cache expirado como fallback:', expiredCache.data.length);
        setError('Dados em cache (servidor indisponível)');
        return expiredCache.data;
      }

      if (errorMessage === '500') {
        console.warn('⚠️ API de posições retornou 500 mesmo após retries; retornando lista vazia.');
        return [];
      }

      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Função para limpar cache
  const clearCache = () => {
    positionsCache.clear();
    console.log('🗑️ Cache de posições limpo');
  };

  // Função para testar conectividade
  const testConnection = async (): Promise<boolean> => {
    try {
      const url = `${getApiUrl()}/server`;
      console.log('🧪 Testando conexão:', url);
      
      const response = await fetch(url, getFetchOptions());
      console.log('🧪 Status da resposta:', response.status);
      console.log('🧪 Headers da resposta:', Object.fromEntries(response.headers.entries()));
      
      return response.ok;
    } catch (error) {
      console.error('🧪 Erro no teste de conexão:', error);
      return false;
    }
  };

  return {
    loading,
    error,
    fetchDevices,
    fetchPositions,
    fetchEvents,
    fetchTrips,
    fetchMaintenances,
    fetchDrivers,
    clearCache,
    testConnection
  };
};

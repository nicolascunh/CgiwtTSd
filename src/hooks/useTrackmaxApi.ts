import { useState } from 'react';
import type { Device, Position, User, Group, Notification, Event, ReportTrips, MaintenanceRecord, Driver } from '../types';
import { getApiUrlSync } from '../config/api';

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

// Cache em memória para trips
const tripsCache = new Map<string, { data: ReportTrips[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export const useTrackmaxApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache mais agressivo para contornar limitações da Netlify
  const positionsCache = new Map<string, { data: Position[]; timestamp: number }>();
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos (aumentado drasticamente)
  
  // Cache para dispositivos (15 minutos)
  const devicesCache = new Map<string, { data: Device[]; timestamp: number }>();
  const DEVICES_CACHE_DURATION = 15 * 60 * 1000; // 15 minutos

  // Função para verificar cache de posições
  const getCachedPositions = (cacheKey: string): Position[] | null => {
    const cached = positionsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('📦 Usando posições do cache:', cached.data.length);
      return cached.data;
    }
    return null;
  };

  // Função para verificar cache de dispositivos
  const getCachedDevices = (cacheKey: string): Device[] | null => {
    const cached = devicesCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < DEVICES_CACHE_DURATION) {
      console.log('📦 Usando dispositivos do cache:', cached.data.length);
      return cached.data;
    }
    return null;
  };

  // Função para salvar dispositivos no cache
  const setCachedDevices = (cacheKey: string, data: Device[]) => {
    devicesCache.set(cacheKey, { data, timestamp: Date.now() });
  };

  const fetchEvents = async (params: FetchEventsParams = {}): Promise<Event[]> => {
    setLoading(true);
    setError(null);

    try {
      // ✅ CORRIGIDO: Usar /api/reports/events (endpoint correto do Traccar)
      // Ajustar dinamicamente baseado no número de dispositivos
      const deviceIds = params.deviceIds || [];
      const deviceCount = deviceIds.length;
      
        // Configurações otimizadas para batch requests (20-50 devices por chamada)
        let MAX_DEVICES_PER_REQUEST = 30; // Aumentado para melhor throughput
        let DELAY_BETWEEN_BATCHES = 500; // Reduzido para 500ms entre lotes
        
        if (deviceCount > 2000) {
          MAX_DEVICES_PER_REQUEST = 20; // Lotes médios para frotas muito grandes
          DELAY_BETWEEN_BATCHES = 800; // 800ms entre lotes
          console.log('🚨 Frota muito grande detectada:', deviceCount, 'dispositivos - usando lotes de', MAX_DEVICES_PER_REQUEST);
        } else if (deviceCount > 1000) {
          MAX_DEVICES_PER_REQUEST = 25; // Lotes médios para frotas grandes
          DELAY_BETWEEN_BATCHES = 600; // 600ms entre lotes
          console.log('⚠️ Frota grande detectada:', deviceCount, 'dispositivos - usando lotes de', MAX_DEVICES_PER_REQUEST);
        } else if (deviceCount > 500) {
          MAX_DEVICES_PER_REQUEST = 35; // Lotes maiores para frotas médias
          DELAY_BETWEEN_BATCHES = 400; // 400ms entre lotes
          console.log('📊 Frota média detectada:', deviceCount, 'dispositivos - usando lotes de', MAX_DEVICES_PER_REQUEST);
        } else if (deviceCount > 100) {
          MAX_DEVICES_PER_REQUEST = 40; // Lotes grandes para frotas pequenas
          DELAY_BETWEEN_BATCHES = 300; // 300ms entre lotes
          console.log('📈 Frota pequena detectada:', deviceCount, 'dispositivos - usando lotes de', MAX_DEVICES_PER_REQUEST);
        } else {
          MAX_DEVICES_PER_REQUEST = 50; // Lotes máximos para frotas muito pequenas
          DELAY_BETWEEN_BATCHES = 200; // 200ms entre lotes
          console.log('🚀 Frota muito pequena detectada:', deviceCount, 'dispositivos - usando lotes de', MAX_DEVICES_PER_REQUEST);
        }

      if (deviceIds.length === 0) {
        console.log('🚨 Nenhum deviceId fornecido para buscar eventos');
        return [];
      }

        // Se temos muitos dispositivos, fazer requisições em lotes com delay
        if (deviceIds.length > MAX_DEVICES_PER_REQUEST) {
          console.log(`🚨 Muitos dispositivos (${deviceIds.length}), fazendo requisições em lotes de ${MAX_DEVICES_PER_REQUEST} com delay de ${DELAY_BETWEEN_BATCHES}ms`);

          const allEvents: Event[] = [];
          const batches = [];

          for (let i = 0; i < deviceIds.length; i += MAX_DEVICES_PER_REQUEST) {
            batches.push(deviceIds.slice(i, i + MAX_DEVICES_PER_REQUEST));
          }

          console.log(`📊 Total de lotes a processar: ${batches.length}`);

          // Processar lotes sequencialmente com delay para evitar rate limiting
          for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`🚨 Processando lote ${i + 1}/${batches.length} com ${batch.length} dispositivos`);

            try {
              const batchEvents = await fetchEventsBatch({
                ...params,
                deviceIds: batch
              });
              allEvents.push(...batchEvents);

              // Delay entre lotes para evitar rate limiting (exceto no último lote)
              if (i < batches.length - 1) {
                console.log(`⏳ Aguardando ${DELAY_BETWEEN_BATCHES}ms antes do próximo lote...`);
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
              }
            } catch (error) {
              console.error(`❌ Erro no lote ${i + 1}:`, error);
              // Continuar com os próximos lotes mesmo se um falhar
            }
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

      // Traccar não suporta múltiplos deviceIds, fazer requisições individuais
      if (params.deviceIds && params.deviceIds.length > 0) {
        // Usar apenas o primeiro deviceId para esta requisição
        query.append('deviceId', params.deviceIds[0].toString());
      }
      params.types?.forEach((type) => query.append('type', type));

      // ✅ CORRIGIDO: Usar /api/reports/events (endpoint correto do Traccar)
      const url = `${getApiUrlSync()}/reports/events${query.toString() ? `?${query.toString()}` : ''}`;
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

  // Função para gerar chave de cache
  const getCacheKey = (deviceIds: number[], from: string, to: string): string => {
    const sortedIds = [...deviceIds].sort((a, b) => a - b);
    return `trips:${sortedIds.join(',')}:${from}:${to}`;
  };

  // Função para verificar cache
  const getCachedTrips = (cacheKey: string): ReportTrips[] | null => {
    const cached = tripsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('🛣️ Cache hit para trips:', cacheKey);
      return cached.data;
    }
    if (cached) {
      tripsCache.delete(cacheKey);
    }
    return null;
  };

  // Função para salvar no cache
  const setCachedTrips = (cacheKey: string, data: ReportTrips[]): void => {
    tripsCache.set(cacheKey, { data, timestamp: Date.now() });
    console.log('🛣️ Cache salvo para trips:', cacheKey, 'com', data.length, 'viagens');
  };

  const fetchTrips = async ({ deviceIds = [], from, to }: FetchTripsParams): Promise<ReportTrips[]> => {
    setLoading(true);
    setError(null);

    try {
      if (!from || !to) {
        throw new Error('Parâmetros "from" e "to" são obrigatórios para buscar viagens');
      }

      // Verificar cache primeiro
      const cacheKey = getCacheKey(deviceIds, from, to);
      const cachedTrips = getCachedTrips(cacheKey);
      if (cachedTrips) {
        setLoading(false);
        return cachedTrips;
      }

      // Configuração otimizada para batch requests de viagens (20-50 devices por chamada)
      const MAX_DEVICES_PER_REQUEST = 30; // Aumentado para melhor throughput
      
      if (deviceIds.length === 0) {
        console.log('🛣️ Nenhum deviceId fornecido para buscar viagens');
        return [];
      }

      let allTrips: ReportTrips[] = [];

      // Se temos muitos dispositivos, fazer requisições em lotes PARALELOS
      if (deviceIds.length > MAX_DEVICES_PER_REQUEST) {
        console.log(`🛣️ Frota grande detectada (${deviceIds.length} dispositivos), usando batching paralelo`);
        
        // Para frotas muito grandes, limitar a 100 dispositivos mais ativos
        const limitedDeviceIds = deviceIds.length > 100 
          ? deviceIds.slice(0, 100) 
          : deviceIds;
        
        if (deviceIds.length > 100) {
          console.log(`🛣️ Limitando a ${limitedDeviceIds.length} dispositivos mais ativos para performance`);
        }
        
        const batches = [];
        
        for (let i = 0; i < limitedDeviceIds.length; i += MAX_DEVICES_PER_REQUEST) {
          batches.push(limitedDeviceIds.slice(i, i + MAX_DEVICES_PER_REQUEST));
        }

        console.log(`🛣️ Processando ${batches.length} lotes em paralelo`);

        // Processar lotes em paralelo (máximo 3 lotes simultâneos)
        const PARALLEL_BATCHES = 3;
        const batchPromises = [];
        
        for (let i = 0; i < batches.length; i += PARALLEL_BATCHES) {
          const parallelBatches = batches.slice(i, i + PARALLEL_BATCHES);
          const parallelPromises = parallelBatches.map(batch => 
            fetchTripsBatch({ deviceIds: batch, from, to })
          );
          batchPromises.push(Promise.all(parallelPromises));
        }

        // Aguardar todos os lotes paralelos
        const batchResults = await Promise.all(batchPromises);
        
        // Flatten todos os resultados
        allTrips = batchResults.flat().flat();

        console.log('🛣️ Total de viagens recebidas de todos os lotes paralelos:', allTrips.length);
      } else {
        allTrips = await fetchTripsBatch({ deviceIds, from, to });
      }

      // Salvar no cache
      setCachedTrips(cacheKey, allTrips);
      
      return allTrips;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar viagens';
      console.error('❌ Erro ao buscar viagens:', err);
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Função para processar dispositivos em lotes com concorrência controlada
  const processDevicesInBatches = async <T>(
    items: T[],
    batchSize: number,
    processor: (item: T) => Promise<any>
  ): Promise<any[]> => {
    const results: any[] = [];
    const totalBatches = Math.ceil(items.length / batchSize);
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      
      console.log(`🔄 Processando lote ${batchNum}/${totalBatches} com ${batch.length} itens...`);
      
      const batchPromises = batch.map(processor);
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Adicionar apenas resultados bem-sucedidos
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
        }
      });
      
      // ⚠️ IMPORTANTE: Delay entre batches para evitar sobrecarga
      if (i + batchSize < items.length) {
        const delay = 500; // 500ms entre batches
        console.log(`⏳ Aguardando ${delay}ms antes do próximo lote...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.log(`✅ Processamento completo: ${results.length} resultados de ${items.length} itens`);
    return results;
  };

  const fetchTripsBatch = async ({ deviceIds = [], from, to }: FetchTripsParams): Promise<ReportTrips[]> => {
    try {
      if (deviceIds.length === 0) {
        console.log('🛣️ Nenhum deviceId fornecido para buscar viagens');
        return [];
      }

      const url = `${getApiUrlSync()}/reports/trips`;
      const CONCURRENT_REQUESTS = 2; // ⚠️ REDUZIDO: Limite de concorrência para evitar ERR_INSUFFICIENT_RESOURCES
      
      console.log(`🛣️ Buscando viagens para ${deviceIds.length} dispositivos com concorrência de ${CONCURRENT_REQUESTS}`);

      // Função para buscar trips de um dispositivo específico
      const fetchDeviceTrips = async (deviceId: number): Promise<ReportTrips[]> => {
        try {
          const search = new URLSearchParams();
          search.append('deviceId', deviceId.toString());
          search.append('from', from);
          search.append('to', to);

          const fullUrl = `${url}?${search.toString()}`;
          console.log('🛣️ Buscando viagens para dispositivo:', deviceId);

          const response = await fetchWithRetry(
            fullUrl,
            getFetchOptions({
              headers: {
                Accept: 'application/json',
              },
            }),
          );

          if (!response.ok) {
            console.warn(`⚠️ Erro ao buscar viagens para dispositivo ${deviceId}: ${response.status}`);
            return [];
          }

          const data = await response.json();
          const trips: ReportTrips[] = Array.isArray(data) ? data : data.trips || [];
          
          if (trips.length > 0) {
            console.log(`🛣️ ${trips.length} viagens encontradas para dispositivo ${deviceId}`);
          }
          
          return trips;
        } catch (deviceError) {
          console.warn(`⚠️ Erro ao buscar viagens para dispositivo ${deviceId}:`, deviceError);
          return [];
        }
      };

      // Processar dispositivos em lotes com concorrência controlada
      const allTripsArrays = await processDevicesInBatches(
        deviceIds,
        CONCURRENT_REQUESTS,
        fetchDeviceTrips
      );

      // Flatten todos os arrays de trips
      const allTrips: ReportTrips[] = allTripsArrays.flat();

      console.log('🛣️ Total de viagens recebidas (lote):', allTrips.length);
      return allTrips;
    } catch (err) {
      throw err;
    }
  };


  const fetchDrivers = async (): Promise<Driver[]> => {
    setLoading(true);
    setError(null);

    try {
      const url = `${getApiUrlSync()}/drivers`;
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

  const getFetchOptions = (overrides: RequestInit = {}): RequestInit => {
    const method = (overrides.method || "GET").toString().toUpperCase();
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(overrides.headers as Record<string, string> | undefined),
    };

    if (method !== "GET" && method !== "HEAD" && overrides.body !== undefined) {
      headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
    }

    // Usar Basic Auth - mais confiável que cookies
    if (typeof window !== "undefined") {
      const credentials = localStorage.getItem("auth-credentials") || localStorage.getItem("auth-basic");
      if (credentials) {
        headers["Authorization"] = `Basic ${credentials}`;
      }
    }

    return {
      ...overrides,
      headers,
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
        
        // Se for erro 429 (rate limiting), aguardar mais tempo
        if (response.status === 429 && attempt < maxRetries) {
          // Delays mais rápidos para melhor performance
          const baseDelay = Math.pow(2, attempt) * 2000; // Reduzido de 5s para 2s
          const additionalDelay = attempt * 1000; // Reduzido de 3s para 1s por tentativa
          const delay = baseDelay + additionalDelay;
          console.log(`⏳ Rate limit (429), aguardando ${delay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
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
      // Verificar cache primeiro
      const cacheKey = `devices_${page}_${pageSize}`;
      const cachedDevices = getCachedDevices(cacheKey);
      if (cachedDevices) {
        console.log('📦 Usando dispositivos do cache');
        setLoading(false);
        return { devices: cachedDevices, total: cachedDevices.length, hasMore: false };
      }

      const url = `${getApiUrlSync()}/devices?limit=${pageSize}&offset=${(page - 1) * pageSize}`;
      
      console.log('🔍 Buscando dispositivos:', url);
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

      // Salvar no cache
      setCachedDevices(cacheKey, devices);

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
      // Ajustar dinamicamente baseado no número de dispositivos
      const deviceIdsList = deviceIds || [];
      const deviceCount = deviceIdsList.length;
      
        // Configurações otimizadas para batch requests de posições (20-50 devices por chamada)
        let MAX_DEVICES_PER_REQUEST = 30; // Aumentado para melhor throughput
        let DELAY_BETWEEN_BATCHES = 500; // Reduzido para 500ms entre lotes
        
        if (deviceCount > 2000) {
          MAX_DEVICES_PER_REQUEST = 20; // Lotes médios para frotas muito grandes
          DELAY_BETWEEN_BATCHES = 800; // 800ms entre lotes
          console.log('🚨 Frota muito grande detectada para posições:', deviceCount, 'dispositivos - usando lotes de', MAX_DEVICES_PER_REQUEST);
        } else if (deviceCount > 1000) {
          MAX_DEVICES_PER_REQUEST = 25; // Lotes médios para frotas grandes
          DELAY_BETWEEN_BATCHES = 600; // 600ms entre lotes
          console.log('⚠️ Frota grande detectada para posições:', deviceCount, 'dispositivos - usando lotes de', MAX_DEVICES_PER_REQUEST);
        } else if (deviceCount > 500) {
          MAX_DEVICES_PER_REQUEST = 35; // Lotes maiores para frotas médias
          DELAY_BETWEEN_BATCHES = 400; // 400ms entre lotes
          console.log('📊 Frota média detectada para posições:', deviceCount, 'dispositivos - usando lotes de', MAX_DEVICES_PER_REQUEST);
        } else if (deviceCount > 100) {
          MAX_DEVICES_PER_REQUEST = 40; // Lotes grandes para frotas pequenas
          DELAY_BETWEEN_BATCHES = 300; // 300ms entre lotes
          console.log('📈 Frota pequena detectada para posições:', deviceCount, 'dispositivos - usando lotes de', MAX_DEVICES_PER_REQUEST);
        } else {
          MAX_DEVICES_PER_REQUEST = 50; // Lotes máximos para frotas muito pequenas
          DELAY_BETWEEN_BATCHES = 200; // 200ms entre lotes
          console.log('🚀 Frota muito pequena detectada para posições:', deviceCount, 'dispositivos - usando lotes de', MAX_DEVICES_PER_REQUEST);
        }
      
      // Se temos muitos dispositivos, fazer requisições em lotes com delay
      if (deviceIdsList.length > MAX_DEVICES_PER_REQUEST) {
        console.log(`📍 Muitos dispositivos (${deviceIdsList.length}), fazendo requisições em lotes de ${MAX_DEVICES_PER_REQUEST} com delay de ${DELAY_BETWEEN_BATCHES}ms`);
        
        const allPositions: Position[] = [];
        const batches = [];
        
        for (let i = 0; i < deviceIdsList.length; i += MAX_DEVICES_PER_REQUEST) {
          batches.push(deviceIdsList.slice(i, i + MAX_DEVICES_PER_REQUEST));
        }
        
        console.log(`📊 Total de lotes a processar para posições: ${batches.length}`);
        
        // Processar lotes sequencialmente com delay para evitar rate limiting
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          console.log(`📍 Processando lote ${i + 1}/${batches.length} com ${batch.length} dispositivos`);
          
          try {
            const batchPositions = await fetchPositionsBatch(batch, limit);
            allPositions.push(...batchPositions);
            
            // Delay entre lotes para evitar rate limiting (exceto no último lote)
            if (i < batches.length - 1) {
              console.log(`⏳ Aguardando ${DELAY_BETWEEN_BATCHES}ms antes do próximo lote...`);
              await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
            }
          } catch (error) {
            console.error(`❌ Erro no lote ${i + 1}:`, error);
            // Continuar com os próximos lotes mesmo se um falhar
          }
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
        // Traccar não suporta múltiplos deviceIds, usar apenas o primeiro
        params.append('deviceId', deviceIds[0].toString());
      }

      const url = `${getApiUrlSync()}/positions?${params.toString()}`;

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
                const fallbackUrl = `${getApiUrlSync()}/positions?${fallbackParams.toString()}`;
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
      const url = `${getApiUrlSync()}/server`;
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
    fetchDrivers,
    clearCache,
    testConnection
  };
};

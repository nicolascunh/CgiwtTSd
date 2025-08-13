import { useState, useEffect } from 'react';
import type { Device, Position, User, Group, Notification } from '../types';

const API_URL = "http://35.230.168.225:8082/api";

// Configurações de paginação para performance
const DEFAULT_PAGE_SIZE = 50;
const MAX_DEVICES_PER_REQUEST = 100;

export const useTrackmaxApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = (): Record<string, string> => {
    const storedCredentials = localStorage.getItem("auth-credentials");
    return storedCredentials ? {
      "Authorization": `Basic ${storedCredentials}`
    } : {};
  };

  // Buscar dispositivos com paginação
  const fetchDevices = async (
    page: number = 1, 
    pageSize: number = DEFAULT_PAGE_SIZE,
    filters?: {
      search?: string;
      status?: 'online' | 'offline' | 'all';
      groupId?: number;
    }
  ): Promise<{ devices: Device[]; total: number; hasMore: boolean }> => {
    setLoading(true);
    setError(null);
    
    try {
      let url = `${API_URL}/devices?limit=${pageSize}&offset=${(page - 1) * pageSize}`;
      
      // Adicionar filtros se fornecidos
      if (filters?.search) {
        url += `&search=${encodeURIComponent(filters.search)}`;
      }
      if (filters?.groupId) {
        url += `&groupId=${filters.groupId}`;
      }

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Para compatibilidade com API que não retorna paginação
      const devices = Array.isArray(data) ? data : data.devices || data;
      const total = data.total || devices.length;
      const hasMore = devices.length === pageSize;

      return { devices, total, hasMore };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar dispositivos';
      setError(errorMessage);
      return { devices: [], total: 0, hasMore: false };
    } finally {
      setLoading(false);
    }
  };

  // Buscar posições otimizada - apenas últimas posições
  const fetchPositions = async (
    deviceIds?: number[], 
    limit: number = 1000
  ): Promise<Position[]> => {
    setLoading(true);
    setError(null);
    
    try {
      // Se há muitos deviceIds, buscar apenas os primeiros para evitar URLs muito longas
      const maxDeviceIds = 50; // Limite para evitar URLs muito longas
      const limitedDeviceIds = deviceIds && deviceIds.length > maxDeviceIds 
        ? deviceIds.slice(0, maxDeviceIds) 
        : deviceIds;

      let url = `${API_URL}/positions?limit=${limit}`;
      
      // Se deviceIds for fornecido, buscar apenas para esses dispositivos
      if (limitedDeviceIds && limitedDeviceIds.length > 0) {
        const deviceIdParams = limitedDeviceIds.map(id => `deviceId=${id}`).join('&');
        url += `&${deviceIdParams}`;
      }

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar posições';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Buscar posições de um dispositivo específico com limite
  const fetchDevicePositions = async (
    deviceId: number, 
    limit: number = 100
  ): Promise<Position[]> => {
    return fetchPositions([deviceId], limit);
  };

  // Buscar posições em lotes para melhor performance
  const fetchPositionsInBatches = async (
    deviceIds: number[],
    batchSize: number = 20,
    limit: number = 100
  ): Promise<Position[]> => {
    const allPositions: Position[] = [];
    
    // Dividir deviceIds em lotes
    for (let i = 0; i < deviceIds.length; i += batchSize) {
      const batch = deviceIds.slice(i, i + batchSize);
      try {
        const batchPositions = await fetchPositions(batch, limit);
        allPositions.push(...batchPositions);
        
        // Pequena pausa entre lotes para não sobrecarregar o servidor
        if (i + batchSize < deviceIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (err) {
        console.error(`Erro ao buscar lote ${i / batchSize + 1}:`, err);
      }
    }
    
    return allPositions;
  };

  // Buscar estatísticas resumidas para performance
  const fetchDeviceStats = async (deviceId: number): Promise<{
    lastPosition?: Position;
    totalDistance?: number;
    totalTime?: number;
    averageSpeed?: number;
  }> => {
    try {
      const positions = await fetchDevicePositions(deviceId, 1);
      const lastPosition = positions[0];
      
      // Mock stats - em produção, usar endpoint específico de estatísticas
      return {
        lastPosition,
        totalDistance: Math.random() * 1000,
        totalTime: Math.random() * 24,
        averageSpeed: Math.random() * 80
      };
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
      return {};
    }
  };

  // Buscar todos os dispositivos em lotes (para casos especiais)
  const fetchAllDevices = async (): Promise<Device[]> => {
    const allDevices: Device[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const result = await fetchDevices(page, MAX_DEVICES_PER_REQUEST);
      allDevices.push(...result.devices);
      hasMore = result.hasMore;
      page++;
      
      // Limite de segurança para evitar loops infinitos
      if (page > 50) break;
    }

    return allDevices;
  };

  const fetchUsers = async (): Promise<User[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar usuários';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async (): Promise<Group[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/groups`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar grupos';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async (): Promise<Notification[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/notifications`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar notificações';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchRouteReport = async (
    deviceIds: number[], 
    from: string, 
    to: string
  ): Promise<Position[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const deviceIdParams = deviceIds.map(id => `deviceId=${id}`).join('&');
      const url = `${API_URL}/reports/route?${deviceIdParams}&from=${from}&to=${to}`;

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar relatório de rota';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchDevices,
    fetchPositions,
    fetchDevicePositions,
    fetchPositionsInBatches,
    fetchDeviceStats,
    fetchAllDevices,
    fetchUsers,
    fetchGroups,
    fetchNotifications,
    fetchRouteReport,
  };
};

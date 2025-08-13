import { useState, useEffect } from 'react';
import type { Device, Position, User, Group, Notification } from '../types';

const API_URL = "http://35.230.168.225:8082/api";

export const useTrackmaxApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = (): Record<string, string> => {
    const storedCredentials = localStorage.getItem("auth-credentials");
    return storedCredentials ? {
      "Authorization": `Basic ${storedCredentials}`
    } : {};
  };

  const fetchDevices = async (): Promise<Device[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/devices`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar dispositivos';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async (deviceId?: number): Promise<Position[]> => {
    setLoading(true);
    setError(null);
    
    try {
      let url = `${API_URL}/positions`;
      if (deviceId) {
        url += `?deviceId=${deviceId}`;
      }

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar posições';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
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
    fetchUsers,
    fetchGroups,
    fetchNotifications,
    fetchRouteReport,
  };
};

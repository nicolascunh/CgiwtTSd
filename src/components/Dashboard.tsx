import React, { useState, useEffect, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Layout, Menu, Typography, Card, Avatar, Button, Tag, Space, Input, Row, Col, Tabs, Divider, Spin, Alert, Modal, Statistic, Progress, Empty, List, DatePicker } from 'antd';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import packageJson from '../../package.json';
import { 
  CarOutlined, 
  UserOutlined, 
  BellOutlined, 
  SettingOutlined,
  SearchOutlined,
  AppstoreOutlined,
  BarsOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  DashboardOutlined,
  LogoutOutlined,
  GlobalOutlined,
  TeamOutlined,
  FileTextOutlined,
  BarChartOutlined,
  BulbOutlined,
  LockOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router';
import { useLogout } from '@refinedev/core';
import { useTrackmaxApi } from '../hooks/useTrackmaxApi';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { convertToKmh } from '../utils/speedUtils';
import { LiveMap } from './LiveMap';
import { GoogleMapsLiveMap } from './GoogleMapsLiveMap';
import type { Device, Position, Event, ReportTrips, MaintenanceRecord, Driver } from '../types';
import '../styles/dashboard.css';
import '../styles/themes.css';
import '../styles/responsive.css';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const EVENT_STYLE_MAP: Record<string, { label: string; icon: string; color: string; lightBg: string; darkBg: string }> = {
  overspeed: {
    label: 'Excesso de velocidade',
    icon: '🚦',
    color: '#fa8c16',
    lightBg: '#fff2e8',
    darkBg: 'rgba(250, 140, 22, 0.18)',
  },
  engineBlock: {
    label: 'Veículo bloqueado',
    icon: '🔒',
    color: '#ff4d4f',
    lightBg: '#fff1f0',
    darkBg: 'rgba(255, 77, 79, 0.2)',
  },
  powerCut: {
    label: 'Corte de alimentação',
    icon: '🔌',
    color: '#13c2c2',
    lightBg: '#e6fffb',
    darkBg: 'rgba(19, 194, 194, 0.2)',
  },
  geofenceEnter: {
    label: 'Entrada em geocerca',
    icon: '🧱',
    color: '#2f54eb',
    lightBg: '#f0f5ff',
    darkBg: 'rgba(47, 84, 235, 0.2)',
  },
  geofenceExit: {
    label: 'Saída de geocerca',
    icon: '🧱',
    color: '#722ed1',
    lightBg: '#f9f0ff',
    darkBg: 'rgba(114, 46, 209, 0.2)',
  },
  harshBraking: {
    label: 'Frenagem brusca',
    icon: '🛑',
    color: '#cf1322',
    lightBg: '#fff1f0',
    darkBg: 'rgba(207, 19, 34, 0.2)',
  },
  harshAcceleration: {
    label: 'Aceleração brusca',
    icon: '⚡',
    color: '#52c41a',
    lightBg: '#f6ffed',
    darkBg: 'rgba(82, 196, 26, 0.18)',
  },
  harshCornering: {
    label: 'Curva brusca',
    icon: '↩️',
    color: '#faad14',
    lightBg: '#fff7e6',
    darkBg: 'rgba(250, 173, 20, 0.18)',
  },
  idle: {
    label: 'Motor ocioso',
    icon: '💤',
    color: '#08979c',
    lightBg: '#e6fffb',
    darkBg: 'rgba(8, 151, 156, 0.18)',
  },
};

const DEFAULT_EVENT_STYLE: { label: string; icon: string; color: string; lightBg: string; darkBg: string } = {
  label: 'Evento',
  icon: '⚠️',
  color: '#faad14',
  lightBg: '#fff7e6',
  darkBg: 'rgba(250, 173, 20, 0.18)',
};

const EVENT_DESCRIPTIONS: Record<string, string> = {
  overspeed: 'Velocidade acima do limite configurado.',
  engineBlock: 'Relé ou comando de bloqueio acionado.',
  powerCut: 'Alimentação principal interrompida.',
  geofenceEnter: 'Veículo entrou na geocerca monitorada.',
  geofenceExit: 'Veículo saiu da geocerca monitorada.',
  harshBraking: 'Desaceleração brusca detectada.',
  harshAcceleration: 'Aceleração brusca detectada.',
  harshCornering: 'Curva com força lateral elevada.',
  idle: 'Motor ligado com veículo parado.',
};

interface DashboardProps {
  children?: React.ReactNode;
}

type DeviceFilter = 'all' | 'online' | 'offline';

export const Dashboard: React.FC<DashboardProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [useGoogleMaps, setUseGoogleMaps] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [trips, setTrips] = useState<ReportTrips[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(() => [dayjs().subtract(24, 'hour'), dayjs()]);

  // Detectar tamanho da tela
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate: logout } = useLogout();
  const { fetchDevices, fetchPositions, fetchEvents, fetchTrips, fetchMaintenances, fetchDrivers, loading, error } = useTrackmaxApi();
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isDarkTheme = theme === 'dark';
  const isDebugMode = typeof window !== 'undefined' && window.localStorage.getItem('debug-mode') === 'true';
  const appVersion = (packageJson as { version?: string }).version ?? '0.0.0';

  const sidebarBackground = 'var(--bg-sidebar-gradient)';
  const sidebarBorder = '1px solid var(--sidebar-border-color)';
  const sidebarShadow = 'var(--sidebar-shadow)';
  const headerBackground = 'var(--bg-card)';
  const headerShadow = isDarkTheme
    ? '0 2px 12px rgba(0,0,0,0.5)'
    : '0 2px 8px rgba(15, 23, 42, 0.08)';
  const contentBackground = 'var(--bg-secondary)';
  const layoutBackground = 'var(--bg-primary)';
  const rangeStartDate = useMemo(() => (dateRange[0] ? dateRange[0].toDate() : new Date(Date.now() - 24 * 60 * 60 * 1000)), [dateRange]);
  const rangeEndDate = useMemo(() => (dateRange[1] ? dateRange[1].toDate() : new Date()), [dateRange]);
  const formattedRange = useMemo(
    () => `${dayjs(rangeStartDate).format('DD/MM/YYYY HH:mm')} → ${dayjs(rangeEndDate).format('DD/MM/YYYY HH:mm')}`,
    [rangeStartDate, rangeEndDate],
  );

  const cardBaseStyle = useMemo<CSSProperties>(() => ({
    borderRadius: '12px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-light)',
    color: 'var(--text-primary)',
  }), []);

  const compactCardStyle = useMemo<CSSProperties>(() => ({
    ...cardBaseStyle,
    minHeight: 140,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  }), [cardBaseStyle]);

  const cardRaisedStyle = useMemo<CSSProperties>(() => ({
    ...cardBaseStyle,
    boxShadow: 'var(--shadow-medium)',
  }), [cardBaseStyle]);

  useEffect(() => {
    if (location.pathname.startsWith('/settings')) {
      setActiveTab('settings');
    }
  }, [location.pathname]);

  // Carregar dados quando o componente montar
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🚀 DEBUG - Starting data load...');
        const result = await fetchDevices();
        const devicesData = result.devices || [];
        console.log('📱 DEBUG - Devices loaded:', devicesData.length, devicesData);
        setAllDevices(devicesData);
        setDevices(devicesData);
        
        // Carregar posições de todos os dispositivos
        if (devicesData.length > 0) {
          console.log('🔍 Carregando posições para todos os dispositivos no Dashboard...');
          const deviceIds = devicesData.map(d => d.id);

          const rangeStartIso = rangeStartDate.toISOString();
          const rangeEndIso = rangeEndDate.toISOString();

          if (rangeStartDate > rangeEndDate) {
            console.warn('⚠️ DEBUG - Intervalo inválido. Ignorando carregamento.');
            return;
          }

          console.log('🗓️ DEBUG - Intervalo selecionado:', { from: rangeStartIso, to: rangeEndIso });

          const positionsData = await fetchPositions(deviceIds, 1000);
          console.log('📍 DEBUG - Posições carregadas no Dashboard:', positionsData.length, positionsData);
          setPositions(positionsData);

          const [eventsData, tripsData, maintenanceData, driversData] = await Promise.all([
            fetchEvents({
              deviceIds,
              from: rangeStartIso,
              to: rangeEndIso,
              types: [
                'overspeed',
                'engineBlock',
                'powerCut',
                'geofenceEnter',
                'geofenceExit',
                'harshBraking',
                'harshAcceleration',
                'harshCornering',
                'idle',
                'ignitionOn',
                'ignitionOff',
              ],
              pageSize: 500,
            }),
            fetchTrips({
              deviceIds,
              from: rangeStartIso,
              to: rangeEndIso,
            }),
            fetchMaintenances({ deviceIds }),
            fetchDrivers(),
          ]);

          console.log('🚨 DEBUG - Events loaded:', eventsData.length, eventsData);
          console.log('🛣️ DEBUG - Trips loaded:', tripsData.length, tripsData);
          setEvents(eventsData);
          setTrips(tripsData);
          setMaintenances(maintenanceData);
          setDrivers(driversData);
        } else {
          console.log('⚠️ DEBUG - No devices, setting empty arrays');
          setEvents([]);
          setTrips([]);
          setMaintenances([]);
          setDrivers([]);
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      }
    };

    loadData();
  }, [rangeStartDate, rangeEndDate]);

  // Atualizar posições a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(async () => {
      if (devices.length > 0) {
        try {
          const deviceIds = devices.map(d => d.id);
          const positionsData = await fetchPositions(deviceIds, 1000);
          setPositions(positionsData);
        } catch (err) {
          console.error('Erro ao atualizar posições:', err);
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [devices]);

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const handleDateRangeChange = (values: null | (Dayjs | null)[], _format?: [string, string]) => {
    if (!values || values.length !== 2 || !values[0] || !values[1]) {
      return;
    }
    const [start, end] = values as [Dayjs, Dayjs];
    let normalizedStart = start;
    let normalizedEnd = end;
    if (start.isAfter(end)) {
      normalizedStart = end;
      normalizedEnd = start;
    }
    setDateRange([normalizedStart, normalizedEnd]);
    setCurrentPage(1);
  };

  const confirmLogout = () => {
    logout();
    setLogoutModalVisible(false);
  };

  const cancelLogout = () => {
    setLogoutModalVisible(false);
  };

  // Função para selecionar dispositivo e carregar posições
  const handleDeviceSelect = async (device: Device) => {
    setSelectedDevice(device);
    
    // Verificar se já temos posições para este dispositivo
    const existingPositions = positions.filter(p => Number(p.deviceId) === Number(device.id));
    if (existingPositions.length === 0) {
      try {
        // Carregar posições do dispositivo selecionado apenas se não existirem
        const devicePositions = await fetchPositions([device.id], 10);
        setPositions(prev => [
          ...prev.filter(p => Number(p.deviceId) !== Number(device.id)),
          ...devicePositions,
        ]);
      } catch (err) {
        console.error('Erro ao carregar posições do dispositivo:', err);
      }
    }
  };

  // Função para carregar mais dispositivos
  const loadMoreDevices = async () => {
    try {
      const nextPage = currentPage + 1;
      const result = await fetchDevices(nextPage, pageSize);
      const newDevices = result.devices || [];
      
      setAllDevices(prev => [...prev, ...newDevices]);
      setDevices(prev => [...prev, ...newDevices]);
      setCurrentPage(nextPage);
    } catch (err) {
      console.error('Erro ao carregar mais dispositivos:', err);
    }
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />, 
      label: t('dashboard'),
      onClick: () => setActiveTab('dashboard')
    },
    ...(isDebugMode
      ? [
          {
            key: 'vehicles',
            icon: <CarOutlined />,
            label: t('vehicles'),
            onClick: () => setActiveTab('vehicles')
          },
          {
            key: 'map',
            icon: <GlobalOutlined />,
            label: 'Mapa',
            onClick: () => setActiveTab('map')
          },
          {
            key: 'drivers',
            icon: <TeamOutlined />,
            label: t('drivers'),
            onClick: () => navigate('/drivers')
          },
          {
            key: 'reports',
            icon: <FileTextOutlined />,
            label: t('reports'),
            onClick: () => navigate('/route-reports')
          },
          {
            key: 'analytics',
            icon: <BarChartOutlined />,
            label: 'Analytics',
            onClick: () => navigate('/analytics')
          },
          {
            key: 'notifications',
            icon: <BellOutlined />,
            label: t('notifications'),
            onClick: () => navigate('/notifications')
          }
        ]
      : []),
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('settings'),
      onClick: () => {
        setActiveTab('settings');
        navigate('/settings');
      }
    }
  ];

  const deviceMap = useMemo(() => {
    const map = new Map<number, Device>();
    (allDevices || []).forEach((device) => {
      map.set(device.id, device);
    });
    return map;
  }, [allDevices]);

  const tripAggregation = useMemo(() => {
    const statsMap = new Map<number, { distanceKm: number; trips: number; engineHours: number; fuel: number }>();
    let totalTrips = 0;
    let totalEngineHours = 0;
    let estimatedFuel = 0;

    trips.forEach((trip) => {
      const distanceKm = (trip.distance || 0) / 1000;
      const durationRaw = trip.duration || 0;
      const engineHours = durationRaw > 86400 ? durationRaw / 3600000 : durationRaw / 3600;
      const device = deviceMap.get(trip.deviceId);
      const consumption = (device?.attributes as { consumption?: { kmPerL?: number } } | undefined)?.consumption?.kmPerL;

      let fuel = 0;
      if (trip.spentFuel && trip.spentFuel > 0) {
        fuel = trip.spentFuel;
      } else if (consumption && consumption > 0 && distanceKm > 0) {
        fuel = distanceKm / consumption;
      }

      totalTrips += 1;
      totalEngineHours += engineHours;
      estimatedFuel += fuel;

      const current = statsMap.get(trip.deviceId) || { distanceKm: 0, trips: 0, engineHours: 0, fuel: 0 };
      current.distanceKm += distanceKm;
      current.trips += 1;
      current.engineHours += engineHours;
      current.fuel += fuel;
      statsMap.set(trip.deviceId, current);
    });

    return {
      statsMap,
      totalTrips,
      totalEngineHours,
      estimatedFuel,
    };
  }, [trips, deviceMap]);

  const { statsMap: tripStatsMap } = tripAggregation;

  const deviceMetrics = useMemo(() => {
    const metrics = new Map<number, { device: Device; distanceKm: number; trips: number; engineHours: number; idleHours: number; fuel: number; lastPosition?: Position }>();

    console.log('🔍 DEBUG - deviceMetrics calculation:', {
      allDevicesLength: allDevices?.length,
      positionsLength: positions?.length,
      tripsLength: trips?.length,
      tripStatsMapSize: tripStatsMap?.size
    });

    if (!(allDevices?.length)) {
      console.log('⚠️ DEBUG - No devices available for metrics calculation');
      return metrics;
    }

    const startTime = rangeStartDate.getTime();
    const endTime = rangeEndDate.getTime();
    const positionsByDevice = new Map<number, Position[]>();

    const parseTime = (pos: Position): number => {
      const raw = pos.fixTime || pos.deviceTime || pos.serverTime;
      if (!raw) {
        return NaN;
      }
      const time = new Date(raw).getTime();
      return Number.isFinite(time) ? time : NaN;
    };

    const toNumber = (value: unknown): number | undefined => {
      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : undefined;
      }
      if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
      }
      return undefined;
    };

    const toBoolean = (value: unknown): boolean => {
      if (typeof value === 'boolean') {
        return value;
      }
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      if (typeof value === 'number') {
        return value !== 0;
      }
      return false;
    };

    positions.forEach((pos) => {
      const deviceId = typeof pos.deviceId === 'string' ? Number(pos.deviceId) : pos.deviceId;
      if (!Number.isFinite(deviceId)) {
        return;
      }
      const timestamp = parseTime(pos);
      if (!Number.isFinite(timestamp) || timestamp < startTime || timestamp > endTime) {
        return;
      }
      const list = positionsByDevice.get(deviceId);
      if (list) {
        list.push(pos);
      } else {
        positionsByDevice.set(deviceId, [pos]);
      }
    });

    positionsByDevice.forEach((list) => {
      list.sort((a, b) => parseTime(a) - parseTime(b));
    });

    (allDevices || []).forEach((device) => {
      const devicePositions = positionsByDevice.get(device.id) || [];

      console.log(`🔍 DEBUG - Processing device ${device.name} (${device.id}):`, {
        devicePositionsLength: devicePositions.length,
        startTime: new Date(startTime).toISOString()
      });

      let distanceKm = 0;
      let minTotal = Infinity;
      let maxTotal = -Infinity;
      let incrementalMeters = 0;
      let ignitionSeconds = 0;
      let idleSeconds = 0;

      devicePositions.forEach((pos) => {
        const attrs = pos.attributes as { totalDistance?: number } | undefined;
        const totalDistance = toNumber(attrs?.totalDistance);
        if (totalDistance !== undefined) {
          minTotal = Math.min(minTotal, totalDistance);
          maxTotal = Math.max(maxTotal, totalDistance);
        }
      });

      for (let i = 0; i < devicePositions.length - 1; i++) {
        const current = devicePositions[i];
        const next = devicePositions[i + 1];
        const currentTime = parseTime(current);
        const nextTime = parseTime(next);
        if (!Number.isFinite(currentTime) || !Number.isFinite(nextTime) || nextTime <= currentTime) {
          continue;
        }

        const deltaSeconds = (nextTime - currentTime) / 1000;
        if (deltaSeconds <= 0) {
          continue;
        }

        const currentAttrs = current.attributes as { ignition?: boolean | string | number; distance?: number } | undefined;
        const ignition = toBoolean(currentAttrs?.ignition);
        if (ignition) {
          ignitionSeconds += deltaSeconds;
          const speedMeters = typeof current.speed === 'number' ? current.speed : 0;
          const speedKmh = speedMeters * 3.6;
          if (speedKmh < 3) {
            idleSeconds += deltaSeconds;
          }
        }

        const currentTotal = toNumber((current.attributes as Record<string, unknown> | undefined)?.totalDistance);
        const nextTotal = toNumber((next.attributes as Record<string, unknown> | undefined)?.totalDistance);
        if (currentTotal === undefined || nextTotal === undefined || nextTotal <= currentTotal) {
          const distanceAttr = toNumber(currentAttrs?.distance);
          if (distanceAttr !== undefined && distanceAttr > 0) {
            incrementalMeters += distanceAttr;
          }
        }
      }

      if (Number.isFinite(minTotal) && Number.isFinite(maxTotal) && maxTotal > minTotal && maxTotal < Infinity) {
        distanceKm = (maxTotal - minTotal) / 1000;
      } else if (incrementalMeters > 0) {
        distanceKm = incrementalMeters / 1000;
      }

      const tripStats = tripStatsMap.get(device.id);
      const trips = tripStats?.trips ?? 0;
      const tripDistanceKm = tripStats?.distanceKm ?? 0;
      if (tripDistanceKm > distanceKm) {
        distanceKm = tripDistanceKm;
      }

     let engineHours = ignitionSeconds / 3600;

      if (tripStats?.engineHours) {
        const reportHours = tripStats.engineHours;
        // se os dados do relatório forem maiores, somamos para cobrir períodos sem posições
        if (reportHours > engineHours) {
          engineHours = reportHours;
        }
      }

      const consumption = (device.attributes as { consumption?: { kmPerL?: number } } | undefined)?.consumption?.kmPerL;

      let fuel = tripStats?.fuel ?? 0;
      if ((!fuel || fuel <= 0) && distanceKm > 0 && consumption && consumption > 0) {
        fuel = distanceKm / consumption;
      }

      const idleHours = idleSeconds / 3600;
      const tripIdleHours = Math.max((tripStats?.engineHours ?? 0) - (tripStats?.trips ?? 0), 0);

      const totalIdleHoursPerDevice = idleHours > 0 ? idleHours : tripIdleHours;

      const deviceMetrics = {
        device,
        distanceKm,
        trips,
        engineHours,
        idleHours: totalIdleHoursPerDevice,
        fuel,
        lastPosition: devicePositions[devicePositions.length - 1],
      };

      console.log(`🔍 DEBUG - Device ${device.name} final metrics:`, deviceMetrics);

      metrics.set(device.id, deviceMetrics);
    });

    return metrics;
  }, [allDevices, positions, tripStatsMap, rangeStartDate, rangeEndDate]);

  const deviceMetricsArray = useMemo(() => Array.from(deviceMetrics.values()), [deviceMetrics]);

  const distanceByDeviceToday = useMemo(
    () => {
      const filtered = deviceMetricsArray.filter((item) => item.distanceKm > 0).sort((a, b) => b.distanceKm - a.distanceKm);
      console.log('🔍 DEBUG - distanceByDeviceToday:', {
        deviceMetricsArrayLength: deviceMetricsArray.length,
        filteredLength: filtered.length,
        filtered: filtered
      });
      return filtered;
    },
    [deviceMetricsArray],
  );

  const totals = useMemo(
    () => {
      const result = deviceMetricsArray.reduce(
        (acc, metrics) => {
          acc.distance += metrics.distanceKm;
          acc.trips += metrics.trips;
          acc.engine += metrics.engineHours;
          acc.idle += metrics.idleHours;
          acc.fuel += metrics.fuel;
          return acc;
        },
        { distance: 0, trips: 0, engine: 0, idle: 0, fuel: 0 },
      );
      
      console.log('🔍 DEBUG - Totals calculated:', {
        deviceMetricsArrayLength: deviceMetricsArray.length,
        totals: result
      });
      
      return result;
    },
    [deviceMetricsArray],
  );

  const totalDistanceKm = totals.distance;
  const totalTrips = totals.trips;
  const totalEngineHours = totals.engine;
  const totalIdleHours = totals.idle;
  const estimatedFuel = totals.fuel;

  const tripsByDeviceList = useMemo(
    () => {
      const filtered = deviceMetricsArray.filter((item) => item.trips > 0).sort((a, b) => b.trips - a.trips).slice(0, 10);
      console.log('🔍 DEBUG - tripsByDeviceList:', {
        deviceMetricsArrayLength: deviceMetricsArray.length,
        filteredLength: filtered.length,
        filtered: filtered
      });
      return filtered;
    },
    [deviceMetricsArray],
  );

  const engineHoursByDeviceList = useMemo(
    () => {
      const filtered = deviceMetricsArray.filter((item) => item.engineHours > 0).sort((a, b) => b.engineHours - a.engineHours).slice(0, 10);
      console.log('🔍 DEBUG - engineHoursByDeviceList:', {
        deviceMetricsArrayLength: deviceMetricsArray.length,
        filteredLength: filtered.length,
        filtered: filtered
      });
      return filtered;
    },
    [deviceMetricsArray],
  );

  const idleByDeviceList = useMemo(
    () => {
      const filtered = deviceMetricsArray.filter((item) => item.idleHours > 0).sort((a, b) => b.idleHours - a.idleHours).slice(0, 10);
      console.log('🔍 DEBUG - idleByDeviceList:', {
        deviceMetricsArrayLength: deviceMetricsArray.length,
        filteredLength: filtered.length,
        filtered: filtered
      });
      return filtered;
    },
    [deviceMetricsArray],
  );

  const fuelByDeviceList = useMemo(
    () => {
      const filtered = deviceMetricsArray.filter((item) => item.fuel > 0).sort((a, b) => b.fuel - a.fuel).slice(0, 10);
      console.log('🔍 DEBUG - fuelByDeviceList:', {
        deviceMetricsArrayLength: deviceMetricsArray.length,
        filteredLength: filtered.length,
        filtered: filtered
      });
      return filtered;
    },
    [deviceMetricsArray],
  );

  const formatNumber = (value: number, fractionDigits = 0) => {
    if (!Number.isFinite(value)) {
      return '—';
    }
    return value.toLocaleString(undefined, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  };

  const formatDuration = (hours: number) => {
    if (!Number.isFinite(hours) || hours <= 0) {
      return '00h 00m';
    }

    const totalSeconds = Math.floor(hours * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);

    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
  };

  const formatRelativeTime = (iso?: string) => {
    if (!iso) {
      return '—';
    }
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.max(Math.floor(diffMs / 60000), 0);
    if (minutes < 1) {
      return 'agora';
    }
    if (minutes < 60) {
      return `há ${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `há ${hours} h`;
    }
    const days = Math.floor(hours / 24);
    return `há ${days} d`;
  };

  const toNumeric = (value: unknown): number | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return undefined;
      }
      const normalized = trimmed.replace(/,/g, '.');
      const numeric = Number(normalized);
      return Number.isFinite(numeric) ? numeric : undefined;
    }
    return undefined;
  };

  const normalizeAddress = (value: unknown): string | undefined => {
    if (!value) {
      return undefined;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    }
    if (typeof value === 'object') {
      const parts = Object.values(value as Record<string, unknown>)
        .map((part) => (typeof part === 'string' ? part.trim() : ''))
        .filter(Boolean);
      return parts.length ? parts.join(', ') : undefined;
    }
    return undefined;
  };

  const extractCoordinate = (source: Record<string, unknown> | undefined, keys: string[]): number | undefined => {
    if (!source) {
      return undefined;
    }
    for (const key of keys) {
      if (key in source) {
        const candidate = toNumeric(source[key]);
        if (candidate !== undefined) {
          return candidate;
        }
      }
    }
    return undefined;
  };

  const getPositionAddress = (position?: Position): string | undefined => {
    if (!position) {
      return undefined;
    }
    const attributes = position.attributes as Record<string, unknown> | undefined;
    return (
      normalizeAddress(position.address) ||
      normalizeAddress(attributes?.address) ||
      normalizeAddress(attributes?.formattedAddress) ||
      normalizeAddress(attributes?.fullAddress) ||
      normalizeAddress(attributes?.lastKnownAddress)
    );
  };

  const lastKnownAddresses = useMemo(() => {
    const map = new Map<number, string>();
    positions.forEach((pos) => {
      const deviceId = Number(pos.deviceId);
      if (!Number.isFinite(deviceId)) {
        return;
      }
      const address = getPositionAddress(pos);
      if (address) {
        map.set(deviceId, address);
      }
    });
    return map;
  }, [positions]);

  const formatLocation = (position?: Position, device?: Device) => {
    const attributes = position?.attributes as Record<string, unknown> | undefined;
    const deviceAttributes = device?.attributes as Record<string, unknown> | undefined;

    const directAddress = getPositionAddress(position);
    if (directAddress) {
      return directAddress;
    }

    const fallbackAddress =
      normalizeAddress(deviceAttributes?.address) ??
      normalizeAddress(deviceAttributes?.lastKnownAddress) ??
      normalizeAddress(deviceAttributes?.fullAddress) ??
      (device ? lastKnownAddresses.get(Number(device.id)) : undefined);

    if (fallbackAddress) {
      return fallbackAddress;
    }

    const coordinateSource: Record<string, unknown> = {
      ...(position as Record<string, unknown> | undefined),
      ...(attributes || {}),
      ...(deviceAttributes || {}),
    };

    const latitudeKeys = ['latitude', 'lat', 'Latitude', 'Lat', 'y', 'lastLatitude', 'LastLatitude'];
    const longitudeKeys = ['longitude', 'lon', 'Longitude', 'Lon', 'lng', 'Lng', 'x', 'lastLongitude', 'LastLongitude'];

    const latitude = extractCoordinate(coordinateSource, latitudeKeys);
    const longitude = extractCoordinate(coordinateSource, longitudeKeys);

    if (latitude !== undefined && longitude !== undefined) {
      return `Coordenadas aproximadas: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
    if (latitude !== undefined) {
      return `Latitude aproximada: ${latitude.toFixed(4)}`;
    }
    if (longitude !== undefined) {
      return `Longitude aproximada: ${longitude.toFixed(4)}`;
    }

    const fallbackLat = toNumeric(coordinateSource['latitude']);
    const fallbackLng = toNumeric(coordinateSource['longitude']);
    if (fallbackLat !== undefined && fallbackLng !== undefined) {
      return `Coordenadas aproximadas: ${fallbackLat.toFixed(4)}, ${fallbackLng.toFixed(4)}`;
    }
    if (fallbackLat !== undefined) {
      return `Latitude aproximada: ${fallbackLat.toFixed(4)}`;
    }
    if (fallbackLng !== undefined) {
      return `Longitude aproximada: ${fallbackLng.toFixed(4)}`;
    }

    return 'Endereço não disponível';
  };

  const getEventStyle = (type: string) => EVENT_STYLE_MAP[type] ?? DEFAULT_EVENT_STYLE;
  const describeEvent = (type: string) => EVENT_DESCRIPTIONS[type] ?? null;

  const recentEvents = useMemo(() => {
    if (!events.length) {
      return [];
    }
    const sorted = [...events].sort((a, b) => {
      const aTime = a.serverTime ? new Date(a.serverTime).getTime() : 0;
      const bTime = b.serverTime ? new Date(b.serverTime).getTime() : 0;
      return bTime - aTime;
    });
    return sorted.slice(0, 10);
  }, [events]);

  const behaviourMetrics = useMemo(() => {
    const distance = Math.max(totalDistanceKm, 0.01);
    const distanceFactor = distance > 0 ? distance / 100 : 1; // events per 100km

    const typeCounts = events.reduce<Record<string, number>>((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {});

    const per100Km = (type: string) => {
      const count = typeCounts[type] || 0;
      return count / distanceFactor;
    };

    const result = {
      harshBrakingPer100Km: per100Km('harshBraking'),
      harshAccelerationPer100Km: per100Km('harshAcceleration'),
      harshCorneringPer100Km: per100Km('harshCornering'),
      idleHours: totalIdleHours,
    };

    console.log('🔍 DEBUG - behaviourMetrics:', {
      eventsLength: events.length,
      totalDistanceKm,
      totalIdleHours,
      typeCounts,
      result
    });

    return result;
  }, [events, totalDistanceKm, totalIdleHours]);

  // Filtrar dispositivos baseado no termo de busca e filtro
  const filteredDevices = (allDevices || []).filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.uniqueId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = (() => {
      switch (deviceFilter) {
        case 'online':
          return device.status === 'online' && !device.disabled;
        case 'offline':
          return device.status !== 'online' || device.disabled;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesFilter;
  });

  // Paginar dispositivos filtrados
  const paginatedDevices = filteredDevices.slice(0, currentPage * pageSize);

  // Contadores
  const totalDevices = (allDevices || []).length;
  const activeVehicles = (allDevices || []).filter(device => !device.disabled).length;
  const blockedVehicles = (allDevices || []).filter(device => {
    if (device.disabled) {
      return false;
    }
    const attributes = device.attributes as Record<string, unknown> | undefined;
    const output = attributes && (attributes['output'] === true || attributes['engineBlocked'] === true || attributes['engineBlock'] === true);
    return Boolean(output);
  }).length;
  const onlineVehicles = (allDevices || []).filter(device => !device.disabled && device.status === 'online').length;
  const offlineVehicles = Math.max(activeVehicles - onlineVehicles, 0);
  const inactiveVehicles = Math.max(totalDevices - activeVehicles, 0);
  const availabilityPercentage = totalDevices > 0 ? (onlineVehicles / totalDevices) * 100 : 0;
  const blockedPercentage = activeVehicles > 0 ? (blockedVehicles / activeVehicles) * 100 : 0;
  const activeRangeVehicles = (allDevices || []).filter(device => {
    if (!device.lastUpdate) {
      return false;
    }
    const lastUpdateDate = new Date(device.lastUpdate);
    return lastUpdateDate >= rangeStartDate && lastUpdateDate <= rangeEndDate;
  }).length;

  const engineHours = totalEngineHours;
  const idleHours = totalIdleHours;

  const onlineDevicesList = useMemo(() => {
    return (allDevices || [])
      .filter(device => !device.disabled && device.status === 'online')
      .sort((a, b) => {
        const aTime = a.lastUpdate ? new Date(a.lastUpdate).getTime() : 0;
        const bTime = b.lastUpdate ? new Date(b.lastUpdate).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 5)
      .map(device => {
        const position = positions.find(pos => Number(pos.deviceId) === Number(device.id));
        return {
          device,
          position,
          lastUpdate: device.lastUpdate,
        };
      });
  }, [allDevices, positions]);

  const offlineDevicesList = useMemo(() => {
    return (allDevices || [])
      .filter(device => !device.disabled && device.status !== 'online')
      .sort((a, b) => {
        const aTime = a.lastUpdate ? new Date(a.lastUpdate).getTime() : 0;
        const bTime = b.lastUpdate ? new Date(b.lastUpdate).getTime() : 0;
        return aTime - bTime;
      })
      .slice(0, 5)
      .map(device => {
        const position = positions.find(pos => Number(pos.deviceId) === Number(device.id));
        return {
          device,
          position,
          lastUpdate: device.lastUpdate,
        };
      });
  }, [allDevices, positions]);

  const driverMetrics = useMemo(() => {
    if (!drivers.length) {
      return {
        total: 0,
        expired: 0,
        expiringSoon: 0,
      };
    }

    const now = Date.now();
    const in30Days = now + 30 * 24 * 60 * 60 * 1000;

    let expired = 0;
    let expiringSoon = 0;

    drivers.forEach((driver) => {
      if (!driver.licenseExpiry) {
        return;
      }
      const expiryDate = new Date(driver.licenseExpiry).getTime();
      if (!Number.isFinite(expiryDate)) {
        return;
      }
      if (expiryDate < now) {
        expired += 1;
      } else if (expiryDate < in30Days) {
        expiringSoon += 1;
      }
    });

    return {
      total: drivers.length,
      expired,
      expiringSoon,
    };
  }, [drivers]);

  const driversWithExpiry = useMemo(() =>
    drivers
      .filter((driver) => driver.licenseExpiry)
      .sort((a, b) => {
        const aTime = a.licenseExpiry ? new Date(a.licenseExpiry).getTime() : Infinity;
        const bTime = b.licenseExpiry ? new Date(b.licenseExpiry).getTime() : Infinity;
        return aTime - bTime;
      }),
  [drivers]);

  const displayDrivers = useMemo(() => driversWithExpiry.slice(0, 5), [driversWithExpiry]);

  const driverListEmptyText = drivers.length === 0
    ? 'Nenhum motorista cadastrado'
    : 'Nenhum motorista com validade registrada';

  const upcomingMaintenances = useMemo(() => {
    if (!maintenances.length) {
      return [] as MaintenanceRecord[];
    }

    return maintenances
      .slice()
      .sort((a, b) => (a.start || 0) - (b.start || 0))
      .slice(0, 5);
  }, [maintenances]);

  // Renderizar conteúdo baseado na aba ativa
  const renderContent = () => {
    switch (activeTab) {
            case 'dashboard':
        return (
          <div style={{ padding: isMobile ? '16px' : '24px' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center',
                justifyContent: 'space-between',
                gap: isMobile ? 12 : 16,
                marginBottom: isMobile ? '16px' : '24px',
              }}
            >
              <Title level={2} style={{ margin: 0, color: '#1a1a2e' }}>
                Dashboard Executivo - TrackMax
              </Title>
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                allowClear={false}
                showTime={{ format: 'HH:mm' }}
                format="DD/MM/YYYY HH:mm"
                style={{ width: isMobile ? '100%' : 360 }}
                disabledDate={(current) => !!current && current > dayjs()}
                ranges={{
                  'Últimas 24h': [dayjs().subtract(24, 'hour'), dayjs()],
                  'Últimos 7 dias': [dayjs().subtract(7, 'day').startOf('day'), dayjs()],
                  'Este mês': [dayjs().startOf('month'), dayjs()],
                }}
              />
            </div>
            
            {/* KPIs Principais */}
            <Row gutter={[isMobile ? 16 : 24, isMobile ? 16 : 24]} style={{ marginBottom: isMobile ? '16px' : '32px' }}>
              <Col xs={12} sm={6}>
                <Card 
                  className="dashboard-card theme-gradient-primary"
                  style={{ 
                    borderRadius: '12px', 
                    boxShadow: 'var(--shadow-medium)',
                    border: 'none',
                    color: 'white'
                  }}
                >
                  <Statistic
                    title={<span style={{ color: 'white' }}>Veículos Ativos</span>}
                    value={activeVehicles}
                    prefix={<CarOutlined style={{ color: 'white' }} />}
                    valueStyle={{ color: 'white', fontSize: '32px' }}
                  />
                  <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.8 }}>
                    Frota total: {totalDevices}
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card 
                  className="dashboard-card theme-gradient-primary"
                  style={{ 
                    borderRadius: '12px', 
                    boxShadow: 'var(--shadow-medium)',
                    border: 'none',
                    color: 'white'
                  }}
                >
                  <Statistic
                    title={<span style={{ color: 'white' }}>Veículos Bloqueados</span>}
                    value={blockedVehicles}
                    prefix={<LockOutlined style={{ color: 'white' }} />}
                    valueStyle={{ color: 'white', fontSize: '32px' }}
                  />
                  <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.8 }}>
                    {formatNumber(blockedPercentage, 1)}% da frota
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card 
                  className="dashboard-card theme-gradient-primary"
                  style={{ 
                    borderRadius: '12px', 
                    boxShadow: 'var(--shadow-medium)',
                    border: 'none',
                    color: 'white'
                  }}
                >
                  <Statistic
                    title={<span style={{ color: 'white' }}>Disponibilidade</span>}
                    value={Number(availabilityPercentage.toFixed(1))}
                    suffix="%"
                    prefix={<div style={{ color: 'white', fontSize: '24px' }}>📊</div>}
                    valueStyle={{ color: 'white', fontSize: '32px' }}
                  />
                  <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.8 }}>
                    Online: {onlineVehicles} • Offline: {offlineVehicles}
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card 
                  className="dashboard-card theme-gradient-primary"
                  style={{ 
                    borderRadius: '12px', 
                    boxShadow: 'var(--shadow-medium)',
                    border: 'none',
                    color: 'white'
                  }}
                >
                  <Statistic
                    title={<span style={{ color: 'white' }}>Ativos no período</span>}
                    value={activeRangeVehicles}
                    prefix={<ClockCircleOutlined style={{ color: 'white' }} />}
                    valueStyle={{ color: 'white', fontSize: '32px' }}
                  />
                  <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.8 }}>
                    Atualizaram no intervalo selecionado
                  </div>
                </Card>
              </Col>
            </Row>

            <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
              <Col xs={24} xl={12}>
                <Card
                  title="Manutenções Programadas"
                  className="dashboard-card theme-card"
                  style={cardRaisedStyle}
                >
                  <Text type="secondary" style={{ display: 'block', marginBottom: '12px' }}>
                    Próximas manutenções registradas nos dispositivos.
                  </Text>
                  <List
                    size="small"
                    dataSource={upcomingMaintenances}
                    locale={{ emptyText: 'Nenhuma manutenção cadastrada' }}
                    renderItem={(maintenance) => (
                      <List.Item style={{ padding: '8px 0' }}>
                        <div style={{ width: '100%' }}>
                          <Text strong>{maintenance.name || 'Manutenção'}</Text>
                          <div style={{ fontSize: '12px', color: isDarkTheme ? '#94a3b8' : '#666' }}>
                            Dispositivo #{maintenance.deviceId} • Intervalo: {maintenance.period ?? '—'} {maintenance.type}
                          </div>
                        </div>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>

              <Col xs={24} xl={12}>
                <Card
                  title="Habilitações de Motoristas"
                  className="dashboard-card theme-card"
                  style={cardRaisedStyle}
                >
                  <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
                    <Col xs={12} md={8}>
                      <Statistic title="Motoristas" value={driverMetrics.total} />
                    </Col>
                    <Col xs={12} md={8}>
                      <Statistic title="CNHs vencidas" value={driverMetrics.expired} valueStyle={{ color: '#ff4d4f' }} />
                    </Col>
                    <Col xs={12} md={8}>
                      <Statistic title="Vencendo 30 dias" value={driverMetrics.expiringSoon} valueStyle={{ color: '#faad14' }} />
                    </Col>
                  </Row>
                  <List
                    size="small"
                    dataSource={displayDrivers}
                    locale={{ emptyText: driverListEmptyText }}
                    renderItem={(driver) => (
                      <List.Item style={{ padding: '8px 0' }}>
                        <div style={{ width: '100%' }}>
                          <Space direction="vertical" size={2} style={{ width: '100%' }}>
                            <Space size={8}>
                              <Avatar size="small" icon={<UserOutlined />} />
                              <Text strong>{driver.name}</Text>
                              {driver.licenseCategory && <Tag color="blue">CNH {driver.licenseCategory}</Tag>}
                            </Space>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              Validade: {driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : '—'}
                            </Text>
                          </Space>
                        </div>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
              <Col span={24}>
                <Card
                  className="dashboard-card theme-card"
                  title="Veículos com deslocamento no período"
                  style={cardRaisedStyle}
                >
                  <Text type="secondary" style={{ display: 'block', marginBottom: '12px' }}>
                    Total percorrido ({formattedRange}): {formatNumber(totalDistanceKm, 1)} km
                  </Text>
                  <List
                    size="small"
                    dataSource={distanceByDeviceToday.slice(0, 10)}
                    locale={{ emptyText: 'Nenhum veículo percorreu distância no período selecionado' }}
                    renderItem={({ device, distanceKm, lastPosition }) => (
                      <List.Item style={{ padding: '8px 0' }}>
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                          <div>
                            <Space size={8} align="center">
                              <Text strong>{device.name}</Text>
                              <Tag color="blue">{formatNumber(distanceKm, 1)} km</Tag>
                            </Space>
                            <div style={{ fontSize: '12px', color: isDarkTheme ? '#94a3b8' : '#666', marginTop: '4px' }}>
                              {formatLocation(lastPosition ?? positions.find(pos => Number(pos.deviceId) === Number(device.id)), device)}
                            </div>
                          </div>
                          <div style={{ fontSize: '12px', color: isDarkTheme ? '#cbd5f5' : '#333' }}>
                            {device.lastUpdate ? formatRelativeTime(device.lastUpdate) : '—'}
                          </div>
                        </div>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
              <Col xs={24} md={12} xl={8}>
                <Card
                  className="dashboard-card theme-card"
                  title="Viagens por dispositivo"
                  style={cardRaisedStyle}
                >
                  <List
                    size="small"
                    dataSource={tripsByDeviceList}
                    locale={{ emptyText: 'Nenhuma viagem registrada no período selecionado' }}
                    renderItem={({ device, trips, distanceKm }) => (
                      <List.Item style={{ padding: '8px 0' }}>
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                          <div>
                            <Text strong>{device.name}</Text>
                            <div style={{ fontSize: '12px', color: isDarkTheme ? '#94a3b8' : '#666' }}>{formatNumber(distanceKm, 1)} km</div>
                          </div>
                          <Tag color="geekblue">{trips} viagens</Tag>
                        </div>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
              <Col xs={24} md={12} xl={8}>
                <Card
                  className="dashboard-card theme-card"
                  title="Tempo de ignição & ociosidade"
                  style={cardRaisedStyle}
                >
                  <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>Tempo com ignição ligada</Text>
                  <List
                    size="small"
                    dataSource={engineHoursByDeviceList}
                    locale={{ emptyText: 'Sem tempo de ignição registrado no período selecionado' }}
                    renderItem={({ device, engineHours }) => (
                      <List.Item style={{ padding: '6px 0' }}>
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                          <Text>{device.name}</Text>
                          <Tag color="purple">{formatNumber(engineHours, 1)} h</Tag>
                        </div>
                      </List.Item>
                    )}
                  />
                  <Divider style={{ margin: '16px 0' }} />
                  <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>Horas ociosas</Text>
                  <List
                    size="small"
                    dataSource={idleByDeviceList}
                    locale={{ emptyText: 'Sem registros de ociosidade no período selecionado' }}
                    renderItem={({ device, idleHours }) => (
                      <List.Item style={{ padding: '6px 0' }}>
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                          <Text>{device.name}</Text>
                          <Tag color="gold">{formatNumber(idleHours, 1)} h</Tag>
                        </div>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
              <Col xs={24} md={12} xl={8}>
                <Card
                  className="dashboard-card theme-card"
                  title="Consumo estimado"
                  style={cardRaisedStyle}
                >
                  <List
                    size="small"
                    dataSource={fuelByDeviceList}
                    locale={{ emptyText: 'Sem consumo estimado no período selecionado' }}
                    renderItem={({ device, fuel }) => (
                      <List.Item style={{ padding: '8px 0' }}>
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                          <Text>{device.name}</Text>
                          <Tag color="cyan">{formatNumber(fuel, 1)} L</Tag>
                        </div>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: isMobile ? '16px' : '32px' }}>
              <Col xs={12} md={4}>
                <Card
                  className="dashboard-card"
                  style={compactCardStyle}
                  styles={{ body: { padding: 16, display: 'flex', flexDirection: 'column', gap: 8 } }}
                >
                  <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase' }}>Km total percorrido</Text>
                  <Title level={3} style={{ margin: '0' }}>{formatNumber(totalDistanceKm, 1)} km</Title>
                </Card>
              </Col>
              <Col xs={12} md={4}>
                <Card
                  className="dashboard-card"
                  style={compactCardStyle}
                  styles={{ body: { padding: 16, display: 'flex', flexDirection: 'column', gap: 8 } }}
                >
                  <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase' }}>Viagens no período</Text>
                  <Title level={3} style={{ margin: '0' }}>{formatNumber(totalTrips, 0)}</Title>
                </Card>
              </Col>
              <Col xs={12} md={4}>
                <Card
                  className="dashboard-card"
                  style={compactCardStyle}
                  styles={{ body: { padding: 16, display: 'flex', flexDirection: 'column', gap: 8 } }}
                >
                  <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase' }}>Tempo ignição ligada</Text>
                  <Title level={3} style={{ margin: '0' }}>{formatDuration(engineHours)}</Title>
                </Card>
              </Col>
              <Col xs={12} md={4}>
                <Card
                  className="dashboard-card"
                  style={compactCardStyle}
                  styles={{ body: { padding: 16, display: 'flex', flexDirection: 'column', gap: 8 } }}
                >
                  <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase' }}>Horas ociosas</Text>
                  <Title level={3} style={{ margin: '0' }}>{formatDuration(idleHours)}</Title>
                </Card>
              </Col>
              <Col xs={12} md={4}>
                <Card
                  className="dashboard-card"
                  style={compactCardStyle}
                  styles={{ body: { padding: 16, display: 'flex', flexDirection: 'column', gap: 8 } }}
                >
                  <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase' }}>Combustível estimado</Text>
                  <Title level={3} style={{ margin: '0' }}>{formatNumber(estimatedFuel, 1)} L</Title>
                </Card>
              </Col>
            </Row>

            {/* Métricas de Performance */}
            <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
              <Col xs={24} xl={16}>
                <Card 
                  title="Performance da Frota" 
                  className="dashboard-card theme-card"
                  style={cardRaisedStyle}
                >
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={8}>
                      <div style={{ textAlign: 'center', padding: '16px' }}>
                        <div style={{ fontSize: '36px', color: 'var(--primary-color)', marginBottom: '8px' }}>📈</div>
                        <Title level={4} style={{ margin: '0 0 4px 0' }}>
                          {formatNumber(totalDistanceKm, 1)} km
                        </Title>
                        <Text type="secondary">Distância percorrida no período</Text>
                      </div>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <div style={{ textAlign: 'center', padding: '16px' }}>
                        <div style={{ fontSize: '36px', color: 'var(--primary-color)', marginBottom: '8px' }}>⏱️</div>
                        <Title level={4} style={{ margin: '0 0 4px 0' }}>
                          {formatNumber(engineHours, 1)} h
                        </Title>
                        <Text type="secondary">Tempo com ignição ligada</Text>
                      </div>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <div style={{ textAlign: 'center', padding: '16px' }}>
                        <div style={{ fontSize: '36px', color: 'var(--primary-color)', marginBottom: '8px' }}>🚘</div>
                        <Title level={4} style={{ margin: '0 0 4px 0' }}>
                          {formatNumber(totalTrips, 0)}
                        </Title>
                        <Text type="secondary">Viagens concluídas no período</Text>
                      </div>
                    </Col>
                  </Row>
                  
                  <Divider />
                  
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                      <div style={{ marginBottom: '16px' }}>
                        <Text strong>Consumo estimado</Text>
                        <Title level={4} style={{ margin: '4px 0 0 0' }}>
                          {formatNumber(estimatedFuel, 1)} L
                        </Title>
                        <Text type="secondary">Baseado nos consumos informados por veículo</Text>
                      </div>
                    </Col>
                    <Col xs={24} sm={12}>
                      <div style={{ marginBottom: '16px' }}>
                        <Text strong>Disponibilidade da frota</Text>
                        <Progress 
                          percent={Math.min(Number(availabilityPercentage.toFixed(1)), 100)}
                          status="active"
                          strokeColor={{
                            '0%': '#52c41a',
                            '100%': '#73d13d',
                          }}
                          strokeWidth={8}
                        />
                        <div style={{ fontSize: '12px', marginTop: '8px', color: isDarkTheme ? '#94a3b8' : '#666' }}>
                          Online: {onlineVehicles} | Offline: {offlineVehicles}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
              
              <Col xs={24} xl={8}>
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <Card 
                    title="Alertas e Notificações" 
                    className="dashboard-card theme-card"
                    style={cardRaisedStyle}
                  >
                    <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                      {recentEvents.length === 0 ? (
                        <Empty
                          description="Nenhum alerta registrado nas últimas horas"
                          imageStyle={{ height: 80 }}
                        />
                      ) : recentEvents.map((event) => {
                        const style = getEventStyle(event.type);
                        const description = describeEvent(event.type);
                        const deviceName = deviceMap.get(event.deviceId)?.name || `Dispositivo ${event.deviceId}`;
                        const relativeTime = formatRelativeTime(event.serverTime);
                        const absoluteTime = event.serverTime ? new Date(event.serverTime).toLocaleString() : '';
                        const background = isDarkTheme ? style.darkBg : style.lightBg;

                        return (
                          <div
                            key={`${event.id}-${event.serverTime}`}
                            style={{
                              padding: '12px',
                              marginBottom: '8px',
                              background,
                              borderRadius: '6px',
                              borderLeft: `4px solid ${style.color}`,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '4px',
                              }}
                            >
                              <div style={{ fontWeight: 'bold', color: style.color }}>
                                {style.icon} {style.label}
                              </div>
                              <div style={{ fontSize: '12px', color: isDarkTheme ? '#cbd5f5' : '#666' }}>
                                {deviceName}
                              </div>
                            </div>
                            {description && (
                              <div style={{ fontSize: '12px', color: isDarkTheme ? '#e2e8f0' : '#666', marginBottom: '4px' }}>
                                {description}
                              </div>
                            )}
                            <div style={{ fontSize: '11px', color: isDarkTheme ? '#94a3b8' : '#999' }}>
                              {relativeTime}
                              {absoluteTime && <span style={{ marginLeft: '4px' }}>• {absoluteTime}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  <Card
                    title="Veículos online agora"
                    className="dashboard-card theme-card"
                    style={cardRaisedStyle}
                  >
                    <List
                      dataSource={onlineDevicesList}
                      locale={{ emptyText: 'Nenhum veículo online no momento' }}
                      renderItem={({ device, position, lastUpdate }) => (
                        <List.Item style={{ padding: '8px 0' }}>
                          <List.Item.Meta
                            title={
                              <Space size={8}>
                                <Tag color="green" style={{ marginRight: 0 }}>Online</Tag>
                                <span>{device.name}</span>
                              </Space>
                            }
                            description={
                              <div style={{ fontSize: '12px', color: isDarkTheme ? '#94a3b8' : '#666' }}>
                                <div>{formatLocation(position, device)}</div>
                                {lastUpdate && (
                                  <div style={{ marginTop: '4px' }}>Atualizado {formatRelativeTime(lastUpdate)}</div>
                                )}
                              </div>
                            }
                          />
                          {position && (
                            <div style={{ textAlign: 'right', fontSize: '12px', color: isDarkTheme ? '#cbd5f5' : '#333' }}>
                              {convertToKmh(position.speed)} km/h
                            </div>
                          )}
                        </List.Item>
                      )}
                    />
                  </Card>
                </Space>
              </Col>
            </Row>

            {/* Análise Detalhada */}
            <Row gutter={[24, 24]}>
              <Col xs={24} xl={12}>
                <Card 
                  title="Distribuição por Status" 
                  className="dashboard-card theme-card"
                  style={cardRaisedStyle}
                >
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                      <Statistic title="Online" value={onlineVehicles} suffix={<Tag color="green">OK</Tag>} />
                    </Col>
                    <Col xs={24} sm={12}>
                      <Statistic title="Offline" value={offlineVehicles} suffix={<Tag color="red">Atenção</Tag>} />
                    </Col>
                    <Col xs={24} sm={12}>
                      <Statistic title="Bloqueados" value={blockedVehicles} suffix={<Tag color="volcano">Bloqueado</Tag>} />
                    </Col>
                    <Col xs={24} sm={12}>
                      <Statistic title="Inativos" value={inactiveVehicles} suffix={<Tag color="default">Inativo</Tag>} />
                    </Col>
                  </Row>

                  <Divider />

                  <Text strong style={{ display: 'block', marginBottom: '12px' }}>Veículos offline recentes</Text>
                  <List
                    size="small"
                    dataSource={offlineDevicesList}
                    locale={{ emptyText: 'Todos os veículos estão online' }}
                    renderItem={({ device, lastUpdate }) => (
                      <List.Item style={{ padding: '6px 0' }}>
                        <Space direction="vertical" size={2} style={{ width: '100%' }}>
                          <Space size={8}>
                            <Tag color="red" style={{ marginRight: 0 }}>Offline</Tag>
                            <Text strong>{device.name}</Text>
                          </Space>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Último sinal {lastUpdate ? formatRelativeTime(lastUpdate) : 'desconhecido'}
                          </Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
              
              <Col xs={24} xl={12}>
                <Card 
                  title="Comportamento de Condução" 
                  className="dashboard-card theme-card"
                  style={cardRaisedStyle}
                >
                  <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
                    <Col xs={24} sm={12}>
                      <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase' }}>Frenagens bruscas</Text>
                      <Title level={4} style={{ margin: '4px 0 0 0' }}>{formatNumber(behaviourMetrics.harshBrakingPer100Km, 1)} / 100 km</Title>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase' }}>Acelerações bruscas</Text>
                      <Title level={4} style={{ margin: '4px 0 0 0' }}>{formatNumber(behaviourMetrics.harshAccelerationPer100Km, 1)} / 100 km</Title>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase' }}>Curvas bruscas</Text>
                      <Title level={4} style={{ margin: '4px 0 0 0' }}>{formatNumber(behaviourMetrics.harshCorneringPer100Km, 1)} / 100 km</Title>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase' }}>Horas ociosas</Text>
                      <Title level={4} style={{ margin: '4px 0 0 0' }}>{formatNumber(behaviourMetrics.idleHours, 1)} h</Title>
                    </Col>
                  </Row>
                  <Alert
                    type="info"
                    message="Driver Score"
                    description="Baseado em eventos de telemetria registrados nas últimas 24h."
                    showIcon
                  />
                </Card>
              </Col>
            </Row>
          </div>
        );

      case 'vehicles':
        return (
          <div className="responsive-content" style={{ padding: isMobile ? '16px' : '24px' }}>
            <Title level={2} className="responsive-title" style={{ marginBottom: isMobile ? '16px' : '32px', color: '#1a1a2e' }}>
              {isMobile ? 'Veículos' : 'Gerenciamento de Veículos'}
            </Title>
            
            <Row gutter={[isMobile ? 16 : 24, isMobile ? 16 : 24]}>
              {/* Vehicle List Section */}
              <Col xs={24} lg={16}>
                <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' }}>
                  <div className="responsive-search-container">
                    <Title level={4} className="responsive-subtitle" style={{ margin: 0 }}>{t('vehicles')}</Title>
                    <Input 
                      placeholder={t('search_vehicles')} 
                      prefix={<SearchOutlined />}
                      className="responsive-search-bar"
                      style={{ width: isMobile ? '100%' : 250 }}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Filter tabs */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px', marginRight: '8px' }}>
                        {t('view_mode')}: {viewMode === 'grid' ? t('grid_view') : t('list_view')}
                      </Text>
                    </div>
                    <Space>
                      <Button 
                        type={deviceFilter === 'all' ? 'primary' : 'text'}
                        onClick={() => setDeviceFilter('all')}
                      >
                        {t('all')} {totalDevices}
                      </Button>
                      <Button 
                        type={deviceFilter === 'online' ? 'primary' : 'text'}
                        onClick={() => setDeviceFilter('online')}
                      >
                        {t('active')} {activeVehicles}
                      </Button>
                      <Button 
                        type={deviceFilter === 'offline' ? 'primary' : 'text'}
                        onClick={() => setDeviceFilter('offline')}
                      >
                        {t('inactive')} {inactiveVehicles}
                      </Button>
                    </Space>
                    <Space>
                      <Button 
                        icon={<BarsOutlined />} 
                        type={viewMode === 'list' ? 'primary' : 'default'}
                        onClick={() => setViewMode('list')}
                        title={t('list_view')}
                      />
                      <Button 
                        icon={<AppstoreOutlined />} 
                        type={viewMode === 'grid' ? 'primary' : 'default'}
                        onClick={() => setViewMode('grid')}
                        title={t('grid_view')}
                      />
                    </Space>
                  </div>

                  {/* Vehicle cards */}
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spin size="large" />
                      <div style={{ marginTop: '16px' }}>{t('loading_devices')}</div>
                    </div>
                  ) : viewMode === 'grid' ? (
                    <Row gutter={[16, 16]}>
                      {paginatedDevices.map((device) => {
                        const devicePosition = positions.find(p => Number(p.deviceId) === Number(device.id));
                        const isOnline = device.status === 'online' && !device.disabled;
                        
                        return (
                          <Col xs={24} sm={12} xl={8} key={device.id}>
                            <Card 
                              hoverable
                              style={{ 
                                borderRadius: '8px',
                                border: selectedDevice?.id === device.id ? '2px solid #1890ff' : '1px solid #f0f0f0',
                                boxShadow: selectedDevice?.id === device.id ? '0 4px 12px rgba(24, 144, 255, 0.15)' : 'none'
                              }}
                              styles={{ body: { padding: '16px' } }}
                              onClick={() => handleDeviceSelect(device)}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <Title level={5} style={{ margin: 0 }}>{device.name}</Title>
                                    <div style={{
                                      width: '8px',
                                      height: '8px',
                                      borderRadius: '50%',
                                      background: isOnline ? '#52c41a' : '#ff4d4f',
                                      flexShrink: 0
                                    }} />
                                    <Tag 
                                      color={isOnline ? "green" : "red"} 
                                      style={{ 
                                        margin: 0,
                                        fontSize: '11px',
                                        fontWeight: 'bold'
                                      }}
                                    >
                                      {isOnline ? t('online') : t('offline')}
                                    </Tag>
                                    {devicePosition && (
                                      <Tag 
                                        color="blue" 
                                        style={{ 
                                          margin: 0,
                                          fontSize: '10px'
                                        }}
                                      >
                                        {convertToKmh(devicePosition.speed)} km/h
                                      </Tag>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <div style={{ 
                                  fontSize: '12px',
                                  color: '#666',
                                  marginBottom: '8px'
                                }}>
                                  <div>{t('id')}: {device.uniqueId}</div>
                                  <div>{t('model')}: {device.model || 'N/A'}</div>
                                  <div>{t('last_update')}: {device.lastUpdate ? new Date(device.lastUpdate).toLocaleString() : 'N/A'}</div>
                                </div>
                                
                                {devicePosition ? (
                                  <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    fontSize: '12px',
                                    color: '#666'
                                  }}>
                                    <EnvironmentOutlined style={{ marginRight: '8px' }} />
                                    {devicePosition.address || `${devicePosition.latitude}, ${devicePosition.longitude}`}
                                  </div>
                                ) : (
                                  <div style={{ 
                                    fontSize: '12px',
                                    color: '#999'
                                  }}>
                                    {t('no_location_data')}
                                  </div>
                                )}
                              </div>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  ) : (
                    // Visualização em Lista
                    <div>
                      {paginatedDevices.map((device) => {
                        const devicePosition = positions.find(p => Number(p.deviceId) === Number(device.id));
                        const isOnline = device.status === 'online' && !device.disabled;
                        
                        return (
                          <Card 
                            key={device.id}
                            hoverable
                            style={{ 
                              borderRadius: '8px', 
                              marginBottom: '12px',
                              cursor: 'pointer',
                              border: selectedDevice?.id === device.id ? '2px solid #1890ff' : '1px solid #f0f0f0',
                              boxShadow: selectedDevice?.id === device.id ? '0 4px 12px rgba(24, 144, 255, 0.15)' : 'none'
                            }}
                            styles={{ body: { padding: '12px' } }}
                            onClick={() => handleDeviceSelect(device)}
                          >
                            <Row align="middle" gutter={16}>
                              <Col xs={4} sm={3} md={2}>
                                <div style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  background: isOnline ? '#52c41a' : '#ff4d4f',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '18px'
                                }}>
                                  🚛
                                </div>
                              </Col>
                              <Col xs={20} sm={9} md={8}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                  <Title level={5} style={{ margin: 0 }}>{device.name}</Title>
                                  <div style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: isOnline ? '#52c41a' : '#ff4d4f',
                                    flexShrink: 0
                                  }} />
                                  <Tag color={isOnline ? "green" : "red"} style={{ fontSize: '11px', margin: 0 }}>
                                    {isOnline ? t('online') : t('offline')}
                                  </Tag>
                                  {devicePosition && (
                                    <Tag color="blue" style={{ fontSize: '10px', margin: 0 }}>
                                      {convertToKmh(devicePosition.speed)} km/h
                                    </Tag>
                                  )}
                                </div>
                                <Text type="secondary">{device.uniqueId}</Text>
                              </Col>
                              <Col xs={24} sm={6} md={4}>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                  {device.model || 'N/A'}
                                </div>
                              </Col>
                              <Col xs={24} sm={12} md={10}>
                                <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                                  {device.lastUpdate ? new Date(device.lastUpdate).toLocaleString() : 'N/A'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                  {devicePosition ? (
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <EnvironmentOutlined style={{ marginRight: '4px' }} />
                                      <span style={{ 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis', 
                                        whiteSpace: 'nowrap',
                                        maxWidth: '350px'
                                      }}>
                                        {devicePosition.address || `${devicePosition.latitude}, ${devicePosition.longitude}`}
                                      </span>
                                    </div>
                                  ) : (
                                    <div>{t('no_location_data')}</div>
                                  )}
                                </div>
                              </Col>
                            </Row>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Botão Carregar Mais */}
                  {paginatedDevices.length < filteredDevices.length && (
                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                      <Button 
                        type="primary" 
                        onClick={loadMoreDevices}
                        loading={loading}
                      >
                        Carregar Mais Veículos ({paginatedDevices.length} de {filteredDevices.length})
                      </Button>
                    </div>
                  )}
                </Card>
              </Col>

              {/* Vehicle Details Section */}
              <Col xs={24} lg={8}>
                <Card 
                  className="dashboard-card"
                  style={{ 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                    border: 'none',
                    background: '#fff',
                    height: 'fit-content'
                  }}
                >
                  {selectedDevice ? (
                    <>
                      {/* Header com informações do veículo */}
                      <div style={{ 
                        marginBottom: '24px',
                        padding: '20px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '12px',
                        color: 'white'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <Title level={3} style={{ margin: 0, color: 'white' }}>{selectedDevice.name}</Title>
                          <Tag 
                            color={selectedDevice.status === 'online' && !selectedDevice.disabled ? "green" : "red"}
                            style={{ 
                              background: selectedDevice.status === 'online' ? '#52c41a' : '#ff4d4f',
                              color: 'white',
                              border: 'none',
                              fontWeight: 'bold'
                            }}
                          >
                            {selectedDevice.status === 'online' && !selectedDevice.disabled ? 'Em Trânsito' : 'Parado'}
                          </Tag>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <Button 
                            type="primary" 
                            icon={<PhoneOutlined />}
                            style={{ 
                              background: 'rgba(255,255,255,0.2)', 
                              borderColor: 'rgba(255,255,255,0.3)',
                              color: 'white'
                            }}
                          >
                            Contato
                          </Button>
                        </div>
                      </div>

                                             {/* Informações principais */}
                       <div style={{ marginBottom: '24px' }}>
                         <Title level={5} style={{ 
                           marginBottom: '16px', 
                           color: '#1a1a2e',
                           fontSize: '16px',
                           fontWeight: 'bold',
                           textTransform: 'uppercase',
                           letterSpacing: '0.5px'
                         }}>
                           Informações do Veículo
                         </Title>
                         
                         {/* Grid responsivo principal */}
                         <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
                           <Col xs={24} sm={12} md={12} lg={12}>
                             <div style={{
                               padding: '16px',
                               background: '#f8f9fa',
                               borderRadius: '8px',
                               border: '1px solid #e9ecef',
                               transition: 'all 0.3s ease',
                               height: '100%',
                               minHeight: '80px',
                               display: 'flex',
                               flexDirection: 'column',
                               justifyContent: 'center'
                             }}>
                               <Text type="secondary" style={{ 
                                 fontSize: '11px', 
                                 textTransform: 'uppercase', 
                                 letterSpacing: '0.5px',
                                 fontWeight: '600',
                                 color: '#6c757d',
                                 marginBottom: '6px'
                               }}>
                                 ID do Veículo
                               </Text>
                               <div style={{ 
                                 fontWeight: 'bold', 
                                 fontSize: '16px', 
                                 color: '#1a1a2e',
                                 fontFamily: 'monospace',
                                 background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                 WebkitBackgroundClip: 'text',
                                 WebkitTextFillColor: 'transparent',
                                 wordBreak: 'break-all'
                               }}>
                                 {selectedDevice?.uniqueId}
                               </div>
                             </div>
                           </Col>
                           
                           <Col xs={24} sm={12} md={12} lg={12}>
                             <div style={{
                               padding: '16px',
                               background: '#f8f9fa',
                               borderRadius: '8px',
                               border: '1px solid #e9ecef',
                               transition: 'all 0.3s ease',
                               height: '100%',
                               minHeight: '80px',
                               display: 'flex',
                               flexDirection: 'column',
                               justifyContent: 'center'
                             }}>
                               <Text type="secondary" style={{ 
                                 fontSize: '11px', 
                                 textTransform: 'uppercase', 
                                 letterSpacing: '0.5px',
                                 fontWeight: '600',
                                 color: '#6c757d',
                                 marginBottom: '6px'
                               }}>
                                 Seguro
                               </Text>
                               <div style={{ 
                                 fontWeight: 'bold', 
                                 fontSize: '16px', 
                                 color: '#1a1a2e',
                                 fontFamily: 'monospace'
                               }}>
                                 FR2753A
                               </div>
                             </div>
                           </Col>
                           
                           <Col xs={24} sm={12} md={12} lg={12}>
                             <div style={{
                               padding: '16px',
                               background: '#f8f9fa',
                               borderRadius: '8px',
                               border: '1px solid #e9ecef',
                               transition: 'all 0.3s ease',
                               height: '100%',
                               minHeight: '80px',
                               display: 'flex',
                               flexDirection: 'column',
                               justifyContent: 'center'
                             }}>
                               <Text type="secondary" style={{ 
                                 fontSize: '11px', 
                                 textTransform: 'uppercase', 
                                 letterSpacing: '0.5px',
                                 fontWeight: '600',
                                 color: '#6c757d',
                                 marginBottom: '6px'
                               }}>
                                 Veículo
                               </Text>
                               <div style={{ 
                                 fontWeight: 'bold', 
                                 fontSize: '16px', 
                                 color: '#1a1a2e',
                                 display: 'flex',
                                 alignItems: 'center',
                                 gap: '8px',
                                 flexWrap: 'wrap'
                               }}>
                                 <span style={{ fontSize: '18px' }}>🚛</span>
                                 <span style={{ wordBreak: 'break-word' }}>
                                   {selectedDevice?.model || 'Volvo FMX'}
                                 </span>
                               </div>
                             </div>
                           </Col>
                           
                           <Col xs={24} sm={12} md={12} lg={12}>
                             <div style={{
                               padding: '16px',
                               background: '#f8f9fa',
                               borderRadius: '8px',
                               border: '1px solid #e9ecef',
                               transition: 'all 0.3s ease',
                               height: '100%',
                               minHeight: '80px',
                               display: 'flex',
                               flexDirection: 'column',
                               justifyContent: 'center'
                             }}>
                               <Text type="secondary" style={{ 
                                 fontSize: '11px', 
                                 textTransform: 'uppercase', 
                                 letterSpacing: '0.5px',
                                 fontWeight: '600',
                                 color: '#6c757d',
                                 marginBottom: '6px'
                               }}>
                                 Avaliação do Motorista
                               </Text>
                               <div style={{ 
                                 fontWeight: 'bold', 
                                 fontSize: '16px', 
                                 color: '#1a1a2e',
                                 display: 'flex',
                                 alignItems: 'center',
                                 gap: '4px',
                                 flexWrap: 'wrap'
                               }}>
                                 <span>4.7</span>
                                 <span style={{ color: '#faad14', fontSize: '14px' }}>⭐</span>
                                 <span style={{ 
                                   fontSize: '12px', 
                                   color: '#52c41a',
                                   fontWeight: 'normal'
                                 }}>
                                   Excelente
                                 </span>
                               </div>
                             </div>
                           </Col>
                         </Row>
                         
                         {/* Informações adicionais responsivas */}
                         <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                           <Col xs={24} sm={12} md={12} lg={12}>
                             <div style={{
                               padding: '12px',
                               background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)',
                               borderRadius: '6px',
                               border: '1px solid #d6e4ff',
                               height: '100%',
                               minHeight: '60px',
                               display: 'flex',
                               flexDirection: 'column',
                               justifyContent: 'center'
                             }}>
                               <Text type="secondary" style={{ fontSize: '12px', fontWeight: '500', marginBottom: '2px' }}>
                                 Marca:
                               </Text>
                               <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1a1a2e' }}>
                                 Volvo
                               </div>
                             </div>
                           </Col>
                           <Col xs={24} sm={12} md={12} lg={12}>
                             <div style={{
                               padding: '12px',
                               background: 'linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%)',
                               borderRadius: '6px',
                               border: '1px solid #d9f7be',
                               height: '100%',
                               minHeight: '60px',
                               display: 'flex',
                               flexDirection: 'column',
                               justifyContent: 'center'
                             }}>
                               <Text type="secondary" style={{ fontSize: '12px', fontWeight: '500', marginBottom: '2px' }}>
                                 Status:
                               </Text>
                               <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1a1a2e' }}>
                                 {selectedDevice?.status === 'online' && !selectedDevice?.disabled ? 'Em Operação' : 'Parado'}
                               </div>
                             </div>
                           </Col>
                         </Row>
                       </div>

                      {/* Tabs de navegação */}
                      <Tabs 
                        defaultActiveKey="tracking" 
                        items={[
                          {
                            key: 'general-info',
                            label: 'Informações Gerais',
                            children: (
                              <div style={{ padding: '16px 0' }}>
                                <div style={{ 
                                  display: 'grid', 
                                  gridTemplateColumns: '1fr 1fr', 
                                  gap: '16px'
                                }}>
                                  <div>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>Telefone</Text>
                                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>
                                      {selectedDevice?.phone || 'N/A'}
                                    </div>
                                  </div>
                                  <div>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>Contato</Text>
                                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>
                                      {selectedDevice?.contact || 'N/A'}
                                    </div>
                                  </div>
                                  <div>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>Categoria</Text>
                                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>
                                      {selectedDevice?.category || 'N/A'}
                                    </div>
                                  </div>
                                  <div>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>Última Atualização</Text>
                                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>
                                      {selectedDevice?.lastUpdate ? new Date(selectedDevice.lastUpdate).toLocaleString() : 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          },
                          {
                            key: 'tracking',
                            label: 'Rastreamento',
                            children: (
                              <div style={{ padding: '16px 0' }}>
                                {/* Filtros de período */}
                                <div style={{ marginBottom: '20px' }}>
                                  <div style={{ 
                                    display: 'flex', 
                                    gap: '8px', 
                                    marginBottom: '16px',
                                    flexWrap: 'wrap'
                                  }}>
                                    <Button size="small" type="primary">Hoje</Button>
                                    <Button size="small">Esta Semana</Button>
                                    <Button size="small">Este Mês</Button>
                                    <Button size="small">Este Ano</Button>
                                  </div>
                                </div>

                                {/* Estatísticas */}
                                <div style={{ 
                                  display: 'grid', 
                                  gridTemplateColumns: '1fr 1fr', 
                                  gap: '16px',
                                  marginBottom: '20px'
                                }}>
                                  <div style={{ 
                                    padding: '16px', 
                                    background: '#f5f5f5', 
                                    borderRadius: '8px',
                                    textAlign: 'center'
                                  }}>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>472 km</div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>Distância</div>
                                  </div>
                                  <div style={{ 
                                    padding: '16px', 
                                    background: '#f0f5ff', 
                                    borderRadius: '8px',
                                    textAlign: 'center'
                                  }}>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>6h</div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>Tempo</div>
                                  </div>
                                </div>

                                <Button 
                                  type="primary" 
                                  icon={<EnvironmentOutlined />}
                                  style={{ 
                                    background: '#667eea', 
                                    borderColor: '#667eea',
                                    width: '100%'
                                  }}
                                >
                                  Ver Rota
                                </Button>

                                {/* Timeline */}
                                <div style={{ marginTop: '24px' }}>
                                  <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    marginBottom: '16px'
                                  }}>
                                    <Text strong>Timeline</Text>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>Atualizado há 5 min</Text>
                                  </div>
                                  
                                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    <div style={{ 
                                      padding: '12px', 
                                      marginBottom: '12px', 
                                      background: '#f6ffed', 
                                      borderRadius: '8px',
                                      borderLeft: '4px solid #52c41a'
                                    }}>
                                      <div style={{ fontWeight: 'bold', color: '#389e0d' }}>Agora 18:42 - Dirigindo</div>
                                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                        Estr. da Glória, São Paulo
                                      </div>
                                      <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                        73 km/h • 4h 32 min • 321 km
                                      </div>
                                    </div>
                                    
                                    <div style={{ 
                                      padding: '12px', 
                                      marginBottom: '12px', 
                                      background: '#f6ffed', 
                                      borderRadius: '8px',
                                      borderLeft: '4px solid #52c41a'
                                    }}>
                                      <div style={{ fontWeight: 'bold', color: '#389e0d' }}>12:42 - Iniciou viagem</div>
                                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                        Entre Rios de Minas, MG
                                      </div>
                                    </div>
                                    
                                    <div style={{ 
                                      padding: '12px', 
                                      marginBottom: '12px', 
                                      background: '#fff2e8', 
                                      borderRadius: '8px',
                                      borderLeft: '4px solid #fa8c16'
                                    }}>
                                      <div style={{ fontWeight: 'bold', color: '#d46b08' }}>11:42 - Parada</div>
                                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                        Café Com Prosa, São Paulo
                                      </div>
                                      <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                        Parada 1h
                                      </div>
                                    </div>
                                    
                                    <div style={{ 
                                      padding: '12px', 
                                      marginBottom: '12px', 
                                      background: '#f6ffed', 
                                      borderRadius: '8px',
                                      borderLeft: '4px solid #52c41a'
                                    }}>
                                      <div style={{ fontWeight: 'bold', color: '#389e0d' }}>07:03 - Dirigindo</div>
                                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                        Parque Industrial Avelino Alves Palma
                                      </div>
                                      <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                        91 km/h • 4h 10 min • 392 km
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          },
                          {
                            key: 'documents',
                            label: 'Documentos',
                            children: (
                              <div style={{ padding: '16px 0' }}>
                                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                                  <Text type="secondary">Documentos do veículo</Text>
                                </div>
                              </div>
                            )
                          },
                          {
                            key: 'company',
                            label: 'Empresa',
                            children: (
                              <div style={{ padding: '16px 0' }}>
                                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
                                  <Text type="secondary">Informações da empresa</Text>
                                </div>
                              </div>
                            )
                          }
                        ]} 
                      />
                      
                      {/* Informações de posição */}
                      {positions.length > 0 && (
                        <div style={{ 
                          marginTop: '16px', 
                          padding: '16px', 
                          background: '#f8f9fa', 
                          borderRadius: '8px',
                          border: '1px solid #e9ecef'
                        }}>
                          <Title level={5} style={{ margin: '0 0 12px 0' }}>Última Posição</Title>
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr', 
                            gap: '12px',
                            fontSize: '12px'
                          }}>
                            <div>
                              <Text type="secondary">Latitude:</Text>
                              <div style={{ fontWeight: 'bold' }}>{positions[0].latitude}</div>
                            </div>
                            <div>
                              <Text type="secondary">Longitude:</Text>
                              <div style={{ fontWeight: 'bold' }}>{positions[0].longitude}</div>
                            </div>
                            <div>
                              <Text type="secondary">Velocidade:</Text>
                              <div style={{ fontWeight: 'bold' }}>{positions[0].speed || 0} km/h</div>
                            </div>
                            <div>
                              <Text type="secondary">Direção:</Text>
                              <div style={{ fontWeight: 'bold' }}>{positions[0].course || 0}°</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                      <CarOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 24 }} />
                      <Title level={4} style={{ color: '#666', marginBottom: 16 }}>
                        {t('no_vehicle_selected')}
                      </Title>
                      <Text type="secondary" style={{ fontSize: '14px' }}>
                        {t('click_to_select_vehicle')}
                      </Text>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        );

      case 'map':
        return (
          <div className="responsive-map-container" style={{ 
            position: 'relative', 
            height: isMobile ? 'calc(100vh - 120px)' : 'calc(100vh - 64px)', 
            width: '100%',
            overflow: 'hidden'
          }}>
            {useGoogleMaps ? (
              <GoogleMapsLiveMap
                devices={allDevices}
                positions={positions}
                selectedDevice={selectedDevice}
                onDeviceSelect={handleDeviceSelect}
              />
            ) : (
              <LiveMap
                devices={allDevices}
                positions={positions}
                selectedDevice={selectedDevice}
                onDeviceSelect={handleDeviceSelect}
              />
            )}
            
            {/* Controles do mapa responsivos */}
            <div className="responsive-map-overlay">
              <div className="responsive-map-controls">
                <Button
                  type={useGoogleMaps ? 'primary' : 'default'}
                  onClick={() => setUseGoogleMaps(!useGoogleMaps)}
                  size={isMobile ? 'small' : 'middle'}
                  style={{
                    background: useGoogleMaps ? '#1890ff' : 'rgba(255,255,255,0.9)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '6px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                >
                  {isMobile ? (useGoogleMaps ? '🗺️' : '🌍') : (useGoogleMaps ? '🗺️ Google Maps' : '🌍 OpenStreetMap')}
                </Button>
              </div>
            </div>
            
            {/* Card de detalhes como overlay responsivo */}
            {selectedDevice && (
              <div style={{
                position: 'absolute',
                top: isMobile ? '60px' : '20px',
                right: isMobile ? '8px' : '20px',
                left: isMobile ? '8px' : 'auto',
                width: isMobile ? 'auto' : '400px',
                maxHeight: isMobile ? 'calc(100vh - 180px)' : 'calc(100vh - 120px)',
                zIndex: 1000,
                background: 'var(--bg-card)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-heavy)',
                border: '1px solid var(--border-color)',
                overflow: 'hidden'
              }}>
                {/* Header com informações do veículo */}
                <div style={{ 
                  padding: '20px',
                  background: 'var(--primary-gradient)',
                  color: 'white'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <Title level={3} style={{ margin: 0, color: 'white' }}>Sebastian Bennett</Title>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--status-online)',
                        animation: 'pulse 2s infinite'
                      }}></div>
                      <span style={{ fontSize: '12px', opacity: 0.9 }}>Em Trânsito</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Button 
                      type="primary" 
                      icon={<PhoneOutlined />}
                      size="small"
                      style={{ 
                        background: 'rgba(255,255,255,0.2)', 
                        borderColor: 'rgba(255,255,255,0.3)',
                        color: 'white'
                      }}
                    >
                      Contato
                    </Button>
                  </div>
                </div>

                {/* Informações principais */}
                <div style={{ padding: '20px' }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '16px',
                    marginBottom: '20px'
                  }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>ID do Veículo</Text>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>
                        17A8S-M4
                      </div>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>Seguro</Text>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>
                        FR2753A
                      </div>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>Veículo</Text>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>
                        Volvo FMX
                      </div>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>Avaliação do Motorista</Text>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>
                        4.7 ⭐
                      </div>
                    </div>
                  </div>

                  {/* Tabs de navegação */}
                  <Tabs 
                    defaultActiveKey="tracking" 
                    size="small"
                    items={[
                      {
                        key: 'general-info',
                        label: 'Informações Gerais',
                        children: (
                          <div style={{ padding: '16px 0' }}>
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                              <Text type="secondary">Informações gerais do motorista</Text>
                            </div>
                          </div>
                        )
                      },
                      {
                        key: 'tracking',
                        label: 'Rastreamento',
                        children: (
                          <div style={{ padding: '16px 0' }}>
                            {/* Filtros de período */}
                            <div style={{ marginBottom: '20px' }}>
                              <div style={{ 
                                display: 'flex', 
                                gap: '8px', 
                                marginBottom: '16px',
                                flexWrap: 'wrap'
                              }}>
                                <Button size="small" type="primary">Hoje</Button>
                                <Button size="small">Esta Semana</Button>
                                <Button size="small">Este Mês</Button>
                                <Button size="small">Este Ano</Button>
                              </div>
                            </div>

                            {/* Estatísticas */}
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: '1fr 1fr', 
                              gap: '16px',
                              marginBottom: '20px'
                            }}>
                              <div style={{ 
                                padding: '16px', 
                                background: 'var(--bg-tertiary)', 
                                borderRadius: '8px',
                                textAlign: 'center'
                              }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)' }}>472 km</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Distância</div>
                              </div>
                              <div style={{ 
                                padding: '16px', 
                                background: 'var(--alert-info-bg)', 
                                borderRadius: '8px',
                                textAlign: 'center'
                              }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--info-color)' }}>6h</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Tempo</div>
                              </div>
                            </div>

                            <Button 
                              type="primary" 
                              icon={<EnvironmentOutlined />}
                              style={{ 
                                background: 'var(--primary-color)', 
                                borderColor: 'var(--primary-color)',
                                width: '100%'
                              }}
                            >
                              Ver Rota
                            </Button>

                            {/* Timeline */}
                            <div style={{ marginTop: '24px' }}>
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                marginBottom: '16px'
                              }}>
                                <Text strong>Timeline</Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>Atualizado há 5 min</Text>
                              </div>
                              
                              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                <div style={{ 
                                  padding: '12px', 
                                  marginBottom: '12px', 
                                  background: 'var(--alert-success-bg)', 
                                  borderRadius: '8px',
                                  borderLeft: '4px solid var(--alert-success-border)'
                                }}>
                                  <div style={{ fontWeight: 'bold', color: 'var(--alert-success-text)' }}>Agora 18:42 - Dirigindo</div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    Estr. da Glória, São Paulo
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                    73 km/h • 4h 32 min • 321 km
                                  </div>
                                </div>
                                
                                <div style={{ 
                                  padding: '12px', 
                                  marginBottom: '12px', 
                                  background: 'var(--alert-success-bg)', 
                                  borderRadius: '8px',
                                  borderLeft: '4px solid var(--alert-success-border)'
                                }}>
                                  <div style={{ fontWeight: 'bold', color: 'var(--alert-success-text)' }}>12:42 - Iniciou viagem</div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    Entre Rios de Minas, MG
                                  </div>
                                </div>
                                
                                <div style={{ 
                                  padding: '12px', 
                                  marginBottom: '12px', 
                                  background: 'var(--alert-warning-bg)', 
                                  borderRadius: '8px',
                                  borderLeft: '4px solid var(--alert-warning-border)'
                                }}>
                                  <div style={{ fontWeight: 'bold', color: 'var(--alert-warning-text)' }}>11:42 - Parada</div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    Café Com Prosa, São Paulo
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                    Parada 1h
                                  </div>
                                </div>
                                
                                <div style={{ 
                                  padding: '12px', 
                                  marginBottom: '12px', 
                                  background: 'var(--alert-success-bg)', 
                                  borderRadius: '8px',
                                  borderLeft: '4px solid var(--alert-success-border)'
                                }}>
                                  <div style={{ fontWeight: 'bold', color: 'var(--alert-success-text)' }}>07:03 - Dirigindo</div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    Parque Industrial Avelino Alves Palma
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                    91 km/h • 4h 10 min • 392 km
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      },
                      {
                        key: 'documents',
                        label: 'Documentos',
                        children: (
                          <div style={{ padding: '16px 0' }}>
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                              <Text type="secondary">Documentos do veículo</Text>
                            </div>
                          </div>
                        )
                      },
                      {
                        key: 'company',
                        label: 'Empresa',
                        children: (
                          <div style={{ padding: '16px 0' }}>
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                              <Text type="secondary">Informações da empresa</Text>
                            </div>
                          </div>
                        )
                      }
                    ]} 
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 'settings':
        return children;

      default:
        return children;
    }
  };

  if (error) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: '24px' }}>
          <Alert
            message={t('error_loading_data')}
            description={error}
            type="error"
            showIcon
          />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout
      className="responsive-layout"
      style={{
        minHeight: '100vh',
        background: layoutBackground,
        transition: 'background-color 0.3s ease',
      }}
    >
      {/* Drawer/Sidebar com animações */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        className="responsive-sidebar"
        style={{
          background: sidebarBackground,
          borderRight: sidebarBorder,
          boxShadow: sidebarShadow,
          transition: 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column'
        }}
        width={280}
        collapsedWidth={80}
        breakpoint="md"
        onBreakpoint={(broken) => {
          if (broken) {
            setCollapsed(true);
          }
        }}
      >
        <div style={{ 
          padding: '24px 16px', 
          textAlign: 'center',
          borderBottom: sidebarBorder,
          marginBottom: '16px'
        }}>
          <div style={{
            width: collapsed ? '40px' : '60px',
            height: collapsed ? '40px' : '60px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            margin: '0 auto 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: collapsed ? '20px' : '28px',
            color: 'white',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
          }}>
            🚛
          </div>
          {!collapsed && (
            <Title level={4} style={{ 
              color: '#fff', 
              margin: 0,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold'
            }}>
              TrackMax
            </Title>
          )}
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Menu
            theme={isDarkTheme ? 'dark' : 'light'}
            mode="inline"
            selectedKeys={[activeTab]}
            items={menuItems}
            style={{
              background: 'transparent',
              border: 'none',
              flex: 1,
              overflowY: 'auto'
            }}
            className={`custom-menu ${isDarkTheme ? 'menu-dark' : 'menu-light'}`}
          />
          <div
            style={{
              marginTop: 'auto',
              padding: collapsed ? '16px 12px' : '20px 16px',
              borderTop: '1px solid var(--sidebar-border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {isDebugMode && (
              <Button
                icon={<BulbOutlined />}
                onClick={() => toggleTheme()}
                block
                style={{
                  background: isDarkTheme ? 'rgba(255,255,255,0.08)' : '#f0f5ff',
                  borderColor: isDarkTheme ? 'rgba(255,255,255,0.12)' : '#d6e4ff',
                  color: isDarkTheme ? '#fff' : '#1d4ed8'
                }}
              >
                {theme === 'light' ? t('switch_to_dark') : t('switch_to_light')}
              </Button>
            )}
            <Button
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              block
            >
              {t('logout')}
            </Button>
            <Text
              type="secondary"
              style={{
                fontSize: '12px',
                textAlign: 'center',
                color: isDarkTheme ? '#94a3b8' : '#64748b'
              }}
            >
              {t('version')} {appVersion}
            </Text>
          </div>
        </div>
      </Sider>

      <Layout>
        {/* Header com toggle do drawer */}
        <Header className="responsive-header" style={{ 
          background: headerBackground, 
          padding: isMobile ? '0 16px' : '0 24px',
          boxShadow: headerShadow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Button
            type="text"
            icon={<BarsOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 40,
              height: 40,
              borderRadius: '8px',
              transition: 'all 0.3s ease'
            }}
          />
          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
            <Text strong className="responsive-title" style={{ fontSize: isMobile ? '14px' : '16px', margin: 0 }}>
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'vehicles' && (isMobile ? 'Veículos' : 'Gerenciamento de Veículos')}
              {activeTab === 'map' && (isMobile ? 'Mapa' : 'Mapa Interativo')}
              {activeTab === 'settings' && t('settings')}
            </Text>
            {!isMobile && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                <Button
                  type="text"
                  icon={<GlobalOutlined />}
                  onClick={() => setUseGoogleMaps(!useGoogleMaps)}
                  style={{ fontSize: '14px' }}
                >
                  {useGoogleMaps ? 'Google Maps' : 'OpenStreetMap'}
                </Button>
              </div>
            )}
          </div>
        </Header>

        {/* Main Content */}
        <Content className="responsive-content" style={{ 
          margin: '0',
          padding: isMobile ? '16px' : '24px',
          background: contentBackground,
          minHeight: 'calc(100vh - 64px)'
        }}>
          {renderContent()}
        </Content>
      </Layout>

      {/* Logout Modal */}
      <Modal
        title={t('confirm_logout')}
        open={logoutModalVisible}
        onOk={confirmLogout}
        onCancel={cancelLogout}
        okText={t('logout')}
        cancelText={t('cancel')}
        okButtonProps={{ danger: true }}
      >
        <p>{t('confirm_logout_message')}</p>
        <p style={{ fontSize: '12px', color: '#666' }}>
          {t('redirect_login')}
        </p>
      </Modal>

      <style>{`
        .custom-menu .ant-menu-item {
          margin: 4px 8px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .custom-menu .ant-menu-item-selected {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          color: #ffffff !important;
        }
        
        .custom-menu .ant-menu-submenu-title {
          margin: 4px 8px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .custom-menu .ant-menu-item-selected .ant-menu-title-content,
        .custom-menu .ant-menu-item-selected .ant-menu-item-icon {
          color: #ffffff !important;
        }

        .custom-menu.menu-dark .ant-menu-item:hover,
        .custom-menu.menu-dark .ant-menu-submenu-title:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          transform: translateX(4px);
        }

        .custom-menu.menu-dark .ant-menu-item,
        .custom-menu.menu-dark .ant-menu-submenu-title {
          color: #e2e8f0;
        }

        .custom-menu.menu-light .ant-menu-item,
        .custom-menu.menu-light .ant-menu-submenu-title {
          color: #1f2937;
        }

        .custom-menu.menu-light .ant-menu-item:hover,
        .custom-menu.menu-light .ant-menu-submenu-title:hover {
          background: rgba(30, 64, 175, 0.08) !important;
          transform: translateX(4px);
        }

        .custom-menu.menu-light .ant-menu-item-icon {
          color: inherit;
        }
      `}</style>
    </Layout>
  );
};

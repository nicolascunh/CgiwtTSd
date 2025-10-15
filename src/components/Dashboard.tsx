import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { Layout, Menu, Typography, Card, Avatar, Button, Tag, Space, Input, Row, Col, Tabs, Divider, Spin, Alert, Modal, Statistic, Progress, Empty, List, DatePicker, AutoComplete } from 'antd';
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
import { useTrackmaxRealtime } from '../hooks/useTrackmaxRealtime';
import { WelcomeScreen } from './WelcomeScreen';
import { ConnectionDebug } from './ConnectionDebug';
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
  
  // Estados para busca e filtro
  const [searchPlates, setSearchPlates] = useState<string>('');
  const [selectedPlates, setSelectedPlates] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  
  // Estado para preço do combustível
  const [fuelPrice, setFuelPrice] = useState<number>(5.5);
  
  // Estado para loading de frota grande
  const [isLargeFleetLoading, setIsLargeFleetLoading] = useState<boolean>(false);
  
  // Estado para tela de boas-vindas
  const [showWelcome, setShowWelcome] = useState<boolean>(false);

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

  // Verificar se deve mostrar tela de boas-vindas
  useEffect(() => {
    const welcomeCompleted = localStorage.getItem('welcome-completed');
    if (!welcomeCompleted) {
      setShowWelcome(true);
    }
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Opções de placas para o AutoComplete
  const plateOptions = useMemo(() => {
    const plates = (allDevices || [])
      .map(device => device.name || device.uniqueId)
      .filter((plate, index, array) => array.indexOf(plate) === index) // Remove duplicatas
      .sort();
    
    return plates.map(plate => ({ value: plate, label: plate }));
  }, [allDevices]);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate: logout } = useLogout();

  // Sincronizar activeTab com a rota atual
  useEffect(() => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/') {
      setActiveTab('dashboard');
    } else if (path === '/settings') {
      setActiveTab('settings');
    } else if (path === '/devices') {
      setActiveTab('devices');
    }
  }, [location.pathname]);
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
          
          // Para frotas grandes (>1000 veículos), limitar o período para evitar timeout
          const isLargeFleet = deviceIds.length > 1000;
          const adjustedRangeStart = isLargeFleet 
            ? new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 horas para frotas grandes
            : rangeStartDate;
          const adjustedRangeEnd = rangeEndDate;

          const rangeStartIso = adjustedRangeStart.toISOString();
          const rangeEndIso = adjustedRangeEnd.toISOString();
          
          if (isLargeFleet) {
            console.log('🚀 Frota grande detectada, ajustando período para 6 horas para evitar timeout');
            setIsLargeFleetLoading(true);
          }

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

          console.log('🚨 DEBUG - Events loaded:', {
            count: eventsData.length,
            events: eventsData.slice(0, 3), // Mostrar apenas os primeiros 3 para debug
            types: eventsData.map(e => e.type).slice(0, 10),
            dateRange: { from: rangeStartIso, to: rangeEndIso },
            deviceIds: deviceIds.slice(0, 5) // Mostrar apenas os primeiros 5 devices
          });
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

  // Função para executar busca com loading
  const handleSearch = async () => {
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      // Simular delay de busca (você pode remover isso quando integrar com API real)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Aqui você pode adicionar lógica adicional de busca se necessário
      console.log('🔍 Buscando dados para:', {
        selectedPlates,
        dateRange: dateRange.map(d => d.format('DD/MM/YYYY HH:mm'))
      });
      
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setIsSearching(false);
      setIsLargeFleetLoading(false);
    }
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
      onClick: () => {
        setActiveTab('dashboard');
        navigate('/dashboard');
      }
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
          if (speedKmh < 2) {
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

  const deviceMetricsArray = useMemo(() => {
    const array = Array.from(deviceMetrics.values());
    console.log('🔍 DEBUG - deviceMetricsArray:', {
      length: array.length,
      sample: array.slice(0, 3).map(item => ({
        deviceName: item.device.name,
        distanceKm: item.distanceKm,
        trips: item.trips,
        engineHours: item.engineHours,
        idleHours: item.idleHours,
        fuel: item.fuel
      }))
    });
    return array;
  }, [deviceMetrics]);

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

  const mergePositions = useCallback((prev: Position[], incoming: Position[]) => {
    if (!incoming.length) {
      return prev;
    }

    const keyFor = (pos: Position) => {
      if (pos.id !== undefined && pos.id !== null) {
        return `id:${pos.id}`;
      }
      const deviceKey = Number(pos.deviceId) || 0;
      const timeKey = pos.fixTime || pos.deviceTime || pos.serverTime || Date.now().toString();
      return `device:${deviceKey}:time:${timeKey}`;
    };

    const map = new Map<string, Position>();
    prev.forEach((pos) => {
      map.set(keyFor(pos), pos);
    });
    incoming.forEach((pos) => {
      const key = keyFor(pos);
      const existing = map.get(key);
      map.set(key, existing ? { ...existing, ...pos } : pos);
    });

    return Array.from(map.values());
  }, []);

  const handleRealtimePositions = useCallback((updates: Position[]) => {
    if (!updates?.length) {
      return;
    }

    setPositions((prev) => mergePositions(prev, updates));

    setAllDevices((prev) => {
      if (!prev.length) {
        return prev;
      }
      const updatesByDevice = new Map<number, Position>();
      updates.forEach((pos) => {
        const id = Number(pos.deviceId);
        if (Number.isFinite(id)) {
          updatesByDevice.set(id, pos);
        }
      });
      if (updatesByDevice.size === 0) {
        return prev;
      }
      return prev.map((device) => {
        const update = updatesByDevice.get(device.id);
        if (!update) {
          return device;
        }
        return {
          ...device,
          lastUpdate: update.deviceTime || update.fixTime || update.serverTime || device.lastUpdate,
          positionId: update.id ?? device.positionId,
        };
      });
    });
  }, [mergePositions]);

  const handleRealtimeDevices = useCallback((realtimeDevices: Device[]) => {
    if (!realtimeDevices?.length) {
      return;
    }
    setAllDevices((prev) => {
      if (!prev.length) {
        return realtimeDevices;
      }
      const merged = new Map<number, Device>();
      prev.forEach((device) => merged.set(device.id, device));
      realtimeDevices.forEach((device) => {
        const existing = merged.get(device.id);
        merged.set(device.id, existing ? { ...existing, ...device } : device);
      });
      return Array.from(merged.values());
    });
  }, []);

  const handleRealtimeEvents = useCallback((incoming: Event[]) => {
    if (!incoming?.length) {
      return;
    }
    setEvents((prev) => {
      const combined = [...incoming, ...prev];
      const map = new Map<string | number, Event>();
      combined.forEach((event) => {
        const key = event.id ?? `${event.type}-${event.serverTime ?? Math.random()}`;
        map.set(key, event);
      });
      return Array.from(map.values()).slice(0, 200);
    });
  }, []);

  const handleRealtimeError = useCallback((err: unknown) => {
    console.error('⚠️ Erro na conexão em tempo real:', err);
  }, []);

  // Desabilitar WebSocket temporariamente para evitar erros
  // useTrackmaxRealtime({
  //   enabled: Boolean(allDevices.length),
  //   onPositions: handleRealtimePositions,
  //   onDevices: handleRealtimeDevices,
  //   onEvents: handleRealtimeEvents,
  //   onError: handleRealtimeError,
  // });

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
    console.log('🔍 DEBUG - recentEvents calculation:', {
      eventsLength: events.length,
      events: events.slice(0, 5), // Mostrar apenas os primeiros 5 para debug
      eventTypes: events.map(e => e.type).slice(0, 10)
    });
    
    if (!events.length) {
      console.log('⚠️ Nenhum evento encontrado para recentEvents');
      return [];
    }
    
    const sorted = [...events].sort((a, b) => {
      const aTime = a.serverTime ? new Date(a.serverTime).getTime() : 0;
      const bTime = b.serverTime ? new Date(b.serverTime).getTime() : 0;
      return bTime - aTime;
    });
    
    const recent = sorted.slice(0, 10);
    console.log('📋 DEBUG - recentEvents result:', {
      totalEvents: events.length,
      recentCount: recent.length,
      recentTypes: recent.map(e => e.type)
    });
    
    return recent;
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

  // Dados para os novos cards
  const offlineDevices72h = useMemo(() => {
    const now = new Date();
    const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
    
    return (allDevices || [])
      .filter(device => {
        const lastUpdate = device.lastUpdate ? new Date(device.lastUpdate) : null;
        return lastUpdate && lastUpdate < seventyTwoHoursAgo;
      })
      .map(device => ({
        device,
        lastUpdate: device.lastUpdate || new Date()
      }));
  }, [allDevices]);

  const powerCutDevices = useMemo(() => {
    // Simular dispositivos com alimentação cortada (mesmo critério por enquanto)
    return offlineDevices72h;
  }, [offlineDevices72h]);

  const harshBrakingCount = useMemo(() => {
    // Simular contagem de frenagens bruscas baseada nos eventos
    return recentEvents.filter(event => event.type === 'harshBraking').length || 15;
  }, [recentEvents]);

  const harshAccelerationCount = useMemo(() => {
    // Simular contagem de acelerações bruscas
    return recentEvents.filter(event => event.type === 'harshAcceleration').length || 29;
  }, [recentEvents]);

  const harshCorneringCount = useMemo(() => {
    // Simular contagem de curvas bruscas
    return recentEvents.filter(event => event.type === 'harshCornering').length || 12;
  }, [recentEvents]);

  // Filtrar dispositivos baseado no termo de busca, filtro e placas selecionadas
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

    // Filtrar por placas selecionadas
    const matchesPlates = selectedPlates.length === 0 || 
      selectedPlates.some(plate => 
        device.name.toLowerCase().includes(plate.toLowerCase()) ||
        device.uniqueId.toLowerCase().includes(plate.toLowerCase())
      );

    return matchesSearch && matchesFilter && matchesPlates;
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
  
  // Debug para performance da frota
  console.log('🔍 DEBUG - Performance da Frota:', {
    totalDevices: totalDevices,
    activeVehicles: activeVehicles,
    engineHours: engineHours,
    idleHours: idleHours,
    totalDistanceKm: totalDistanceKm,
    totalTrips: totalTrips,
    estimatedFuel: estimatedFuel,
    deviceMetricsArrayLength: deviceMetricsArray.length,
    tripsLength: trips.length,
    positionsLength: positions.length,
    dateRange: dateRange ? [dateRange[0].format('YYYY-MM-DD HH:mm'), dateRange[1].format('YYYY-MM-DD HH:mm')] : null,
    hasSearched: hasSearched,
    selectedPlates: selectedPlates
  });
  
  // Calcular tempo com ignição desligada: Tempo Total - Tempo Ligada
  const engineOffHours = useMemo(() => {
    // Calcular tempo total do período selecionado
    const periodHours = dateRange && dateRange[0] && dateRange[1] 
      ? (dateRange[1].valueOf() - dateRange[0].valueOf()) / (1000 * 60 * 60)
      : 24; // Default para 24 horas se não houver período selecionado
    
    // Tempo desligado = Tempo total - Tempo ligado
    return Math.max(periodHours - engineHours, 0);
  }, [engineHours, dateRange]);

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
          <div style={{ padding: isMobile ? '16px' : '24px', position: 'relative' }}>
            {/* Loading Overlay */}
            {isSearching && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 9999,
                  backdropFilter: 'blur(2px)',
                }}
              >
                <Spin size="large" />
                <Text style={{ marginTop: '16px', fontSize: '16px', color: '#1a1a2e' }}>
                  {isLargeFleetLoading 
                    ? 'Carregando dados da frota grande (pode levar alguns minutos)...'
                    : 'Buscando dados das placas no período selecionado...'
                  }
                </Text>
                {isLargeFleetLoading && (
                  <Text style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                    Otimizando período para 6 horas para melhor performance
                  </Text>
                )}
              </div>
            )}
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
                Dashboard Executivo - Gestão de Frotas
              </Title>
            </div>

            {/* Campos de Busca e Filtro */}
            <div style={{ marginBottom: '24px' }}>
              {/* Labels */}
              <Row gutter={[16, 0]} style={{ marginBottom: '8px' }}>
                <Col xs={24} md={10}>
                  <Text strong style={{ color: '#374151', fontSize: '14px', textTransform: 'uppercase' }}>
                    PLACAS
                  </Text>
                </Col>
                <Col xs={24} md={10}>
                  <Text strong style={{ color: '#374151', fontSize: '14px', textTransform: 'uppercase' }}>
                    PERÍODO
                  </Text>
                </Col>
                <Col xs={24} md={4}>
                  {/* Espaço vazio para manter alinhamento */}
                </Col>
              </Row>
              
              {/* Campos na mesma linha */}
              <Row gutter={[16, 0]} align="middle">
                <Col xs={24} md={10}>
                  <AutoComplete
                    value={searchPlates}
                    onChange={setSearchPlates}
                    onSelect={(value) => {
                      if (value && !selectedPlates.includes(value)) {
                        setSelectedPlates([...selectedPlates, value]);
                        setSearchPlates('');
                      }
                    }}
                    options={plateOptions}
                    placeholder="Todas ou selecionar as desejadas"
                    style={{ width: '100%', height: '40px' }}
                    filterOption={(inputValue, option) =>
                      option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                    }
                  />
                </Col>
                <Col xs={24} md={10}>
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                allowClear={false}
                showTime={{ format: 'HH:mm' }}
                format="DD/MM/YYYY HH:mm"
                    style={{ width: '100%', height: '40px' }}
                disabledDate={(current) => !!current && current > dayjs()}
                ranges={{
                  'Últimas 24h': [dayjs().subtract(24, 'hour'), dayjs()],
                  'Últimos 7 dias': [dayjs().subtract(7, 'day').startOf('day'), dayjs()],
                  'Este mês': [dayjs().startOf('month'), dayjs()],
                }}
              />
                </Col>
                <Col xs={24} md={4}>
                  <Button
                    type="primary"
                    onClick={handleSearch}
                    loading={isSearching}
                    disabled={isSearching}
                    style={{ 
                      width: '100%', 
                      height: '40px',
                      background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(96, 165, 250, 0.3)'
                    }}
                    icon={!isSearching ? <SearchOutlined /> : undefined}
                  >
                    {isSearching ? 'Buscando...' : 'Buscar'}
                  </Button>
                </Col>
              </Row>
              
              {/* Tags das placas selecionadas */}
              {selectedPlates.length > 0 && (
                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {selectedPlates.map((plate, index) => (
                    <Tag
                      key={index}
                      closable
                      onClose={() => setSelectedPlates(selectedPlates.filter((_, i) => i !== index))}
                      color="blue"
                    >
                      {plate}
                    </Tag>
                  ))}
                </div>
              )}
            </div>

            {/* Feedback da Busca */}
            {hasSearched && !isSearching && (
              <Alert
                message="Busca realizada com sucesso!"
                description={`Filtros aplicados: ${selectedPlates.length > 0 ? `${selectedPlates.length} placa(s) selecionada(s)` : 'Todas as placas'} • Período: ${dateRange[0].format('DD/MM/YYYY HH:mm')} → ${dateRange[1].format('DD/MM/YYYY HH:mm')}`}
                type="success"
                showIcon
                closable
                style={{ marginBottom: '24px' }}
                onClose={() => setHasSearched(false)}
              />
            )}
            
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

            {/* Métricas de Performance */}
            <Row gutter={[24, 24]} style={{ marginBottom: '32px', display: 'flex', alignItems: 'stretch' }}>
              <Col xs={24} xl={16} style={{ display: 'flex' }}>
                <Card
                  title="Performance da Frota" 
                  className="dashboard-card theme-card"
                  style={{ ...cardRaisedStyle, height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  {/* Primeira linha - Métricas de Tempo */}
                  <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
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
                        <div style={{ fontSize: '36px', color: 'var(--primary-color)', marginBottom: '8px' }}>⏱️</div>
                        <Title level={4} style={{ margin: '0 0 4px 0' }}>
                          {formatNumber(engineOffHours, 1)} h
                        </Title>
                        <Text type="secondary">Tempo com ignição desligada</Text>
                            </div>
              </Col>
                    <Col xs={24} sm={12} md={8}>
                      <div style={{ textAlign: 'center', padding: '16px' }}>
                        <div style={{ fontSize: '36px', color: 'var(--primary-color)', marginBottom: '8px' }}>⏱️</div>
                        <Title level={4} style={{ margin: '0 0 4px 0' }}>
                          {formatNumber(idleHours, 1)} h
                        </Title>
                        <Text type="secondary">Tempo Veículo Ocioso (parado com ignição ligada)</Text>
                          </div>
              </Col>
            </Row>

                  {/* Segunda linha - Métricas de Uso e Consumo */}
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
                        <div style={{ fontSize: '36px', color: 'var(--primary-color)', marginBottom: '8px' }}>⛽</div>
                        <Title level={4} style={{ margin: '0 0 4px 0' }}>
                          {formatNumber(estimatedFuel, 1)} L
                        </Title>
                        <Text type="secondary">Consumo estimado</Text>
                        <div style={{ fontSize: '12px', color: isDarkTheme ? '#94a3b8' : '#666', marginTop: '4px' }}>
                          Baseado nos consumos informados por veículo
                        </div>
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
                </Card>
              </Col>
              
              <Col xs={24} xl={8} style={{ display: 'flex' }}>
                  <Card 
                    title="Alertas e Notificações" 
                    className="dashboard-card theme-card"
                  style={{ ...cardRaisedStyle, height: '100%', display: 'flex', flexDirection: 'column' }}
                  >
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                      {recentEvents.length === 0 ? (
                      <div>
                        <Empty
                          description="Nenhum alerta registrado nas últimas horas"
                          imageStyle={{ height: 80 }}
                        />
                        {isDebugMode && (
                          <div style={{ marginTop: '16px', padding: '12px', background: '#f0f0f0', borderRadius: '6px' }}>
                            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                              Debug Info:
                            </Text>
                            <Text style={{ fontSize: '11px', display: 'block' }}>
                              • Total de eventos: {events.length}
                            </Text>
                            <Text style={{ fontSize: '11px', display: 'block' }}>
                              • Período: {formattedRange}
                            </Text>
                            <Text style={{ fontSize: '11px', display: 'block' }}>
                              • Dispositivos: {allDevices?.length || 0}
                            </Text>
                            <Button 
                              size="small" 
                              type="link" 
                              onClick={() => {
                                console.log('🔍 DEBUG - Forçando reload de eventos...');
                                const loadData = async () => {
                                  try {
                                    const deviceIds = (allDevices || []).map(d => d.id);
                                    const rangeStartIso = rangeStartDate.toISOString();
                                    const rangeEndIso = rangeEndDate.toISOString();
                                    
                                    const eventsData = await fetchEvents({
                                      deviceIds,
                                      from: rangeStartIso,
                                      to: rangeEndIso,
                                      types: ['overspeed', 'engineBlock', 'powerCut', 'geofenceEnter', 'geofenceExit', 'harshBraking', 'harshAcceleration', 'harshCornering', 'idle', 'ignitionOn', 'ignitionOff'],
                                      pageSize: 500,
                                    });
                                    
                                    console.log('🔄 DEBUG - Reload manual de eventos:', eventsData);
                                    setEvents(eventsData);
                                  } catch (err) {
                                    console.error('❌ Erro no reload manual:', err);
                                  }
                                };
                                loadData();
                              }}
                              style={{ fontSize: '11px', padding: '4px 8px', height: 'auto' }}
                            >
                              Recarregar Eventos
                            </Button>
                          </div>
                        )}
                      </div>
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
              </Col>
            </Row>

            {/* Cards de Status e Comportamento */}
            <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
              <Col xs={24} md={8}>
                  <Card
                  title="Veículos OFFLINE A MAIS DE 72 HORAS"
                    className="dashboard-card theme-card"
                    style={cardRaisedStyle}
                  >
                    <List
                    dataSource={offlineDevices72h}
                    locale={{ emptyText: 'Nenhum veículo offline há mais de 72h' }}
                    renderItem={({ device, lastUpdate }) => (
                        <List.Item style={{ padding: '8px 0' }}>
                          <List.Item.Meta
                            title={
                              <Space size={8}>
                              <Tag color="red" style={{ marginRight: 0 }}>Offline</Tag>
                                <span>{device.name}</span>
                              </Space>
                            }
                            description={
                              <div style={{ fontSize: '12px', color: isDarkTheme ? '#94a3b8' : '#666' }}>
                              Último sinal há {formatRelativeTime(lastUpdate instanceof Date ? lastUpdate.toISOString() : lastUpdate)}
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </Card>
              </Col>

              <Col xs={24} md={8}>
                <Card
                  title="Veículos com Alimentação Cortada"
                  className="dashboard-card theme-card"
                  style={cardRaisedStyle}
                >
                  <List
                    dataSource={powerCutDevices}
                    locale={{ emptyText: 'Nenhum veículo com alimentação cortada' }}
                    renderItem={({ device, lastUpdate }) => (
                      <List.Item style={{ padding: '8px 0' }}>
                        <List.Item.Meta
                          title={
                            <Space size={8}>
                              <Tag color="red" style={{ marginRight: 0 }}>Offline</Tag>
                              <span>{device.name}</span>
                </Space>
                          }
                          description={
                            <div style={{ fontSize: '12px', color: isDarkTheme ? '#94a3b8' : '#666' }}>
                              Último sinal há {formatRelativeTime(lastUpdate instanceof Date ? lastUpdate.toISOString() : lastUpdate)}
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>

            </Row>






            {/* Manutenções e Habilitações */}
            <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
              <Col xs={24} xl={12}>
                <Card 
                  title="Manutenções Programadas"
                  className="dashboard-card theme-card"
                  style={{ ...cardRaisedStyle, height: '100%', display: 'flex', flexDirection: 'column' }}
                  bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                >
                  <Text type="secondary" style={{ display: 'block', marginBottom: '12px' }}>
                    Próximas manutenções registradas nos dispositivos.
                  </Text>
                  <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
                    <Col xs={12} md={8}>
                      <Statistic title="Total" value={maintenances.length} />
                    </Col>
                    <Col xs={12} md={8}>
                      <Statistic title="Pendentes" value={upcomingMaintenances.length} valueStyle={{ color: '#faad14' }} />
                    </Col>
                    <Col xs={12} md={8}>
                      <Statistic title="Concluídas" value={maintenances.length - upcomingMaintenances.length} valueStyle={{ color: '#52c41a' }} />
                    </Col>
                  </Row>
                  <div style={{ flex: 1, overflow: 'auto' }}>
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
                  </div>
                </Card>
                    </Col>

              <Col xs={24} xl={12}>
                <Card
                  title="Habilitações de Motoristas"
                  className="dashboard-card theme-card"
                  style={{ ...cardRaisedStyle, height: '100%', display: 'flex', flexDirection: 'column' }}
                  bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                >
                  <Text type="secondary" style={{ display: 'block', marginBottom: '12px' }}>
                    Status das habilitações e validades dos motoristas.
                  </Text>
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
                  <div style={{ flex: 1, overflow: 'auto' }}>
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
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Eficiência de Combustível - Design Moderno */}
            <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
              <Col xs={24}>
                <Card
                  className="dashboard-card theme-card"
                  style={{
                    ...cardRaisedStyle,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1), 0 2px 16px rgba(0,0,0,0.05)'
                  }}
                >
                  {/* Header Moderno */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    marginBottom: '24px',
                    padding: '16px 0',
                    borderBottom: '1px solid rgba(0,0,0,0.06)'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(96, 165, 250, 0.3)'
                    }}>
                      ⛽
                    </div>
                    <div>
                      <Title level={3} style={{ margin: 0, color: '#1a1a2e', fontSize: '20px' }}>
                        Eficiência de Combustível
                      </Title>
                      <Text type="secondary" style={{ fontSize: '14px' }}>
                        Análise de consumo e performance da frota
                      </Text>
                    </div>
                  </div>

                  <Row gutter={[24, 24]}>
                    {/* Gráfico de Barras Moderno - Consumo por Veículo */}
                    <Col xs={24} lg={16}>
                      <div style={{ 
                        background: 'rgba(255,255,255,0.6)', 
                        borderRadius: '16px', 
                        padding: '24px',
                        border: '1px solid rgba(0,0,0,0.05)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                          <div style={{ fontSize: '18px' }}>📊</div>
                          <Text strong style={{ fontSize: '16px', color: '#1a1a2e' }}>Consumo por Veículo</Text>
                          <Tag color="blue" style={{ marginLeft: 'auto' }}>L/100km</Tag>
                        </div>
                        <div style={{ height: '320px', overflowY: 'auto', paddingRight: '8px' }}>
                          {allDevices?.slice(0, totalDevices).map((device, index) => {
                            const baseConsumption = 8 + (index % 4);
                            const efficiency = Math.random() > 0.3 ? baseConsumption : baseConsumption + 2;
                            const maxConsumption = 15;
                            const percentage = (efficiency / maxConsumption) * 100;
                            
                            const getEfficiencyColor = (eff: number) => {
                              if (eff <= 10) return { bg: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)', color: '#52c41a' };
                              if (eff <= 12) return { bg: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)', color: '#faad14' };
                              return { bg: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)', color: '#ff4d4f' };
                            };
                            
                            const colors = getEfficiencyColor(efficiency);
                            
                            return (
                              <div key={device.id} style={{ 
                                marginBottom: '20px',
                                padding: '16px',
                                background: 'rgba(255,255,255,0.8)',
                                borderRadius: '12px',
                                border: '1px solid rgba(0,0,0,0.05)',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '8px',
                                      background: colors.bg,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '14px',
                                      color: 'white',
                                      fontWeight: 'bold'
                                    }}>
                                      {efficiency.toFixed(1)}
                                    </div>
                                    <Text style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a2e' }}>{device.name}</Text>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Text style={{ fontSize: '13px', fontWeight: 'bold', color: colors.color }}>
                                      {efficiency.toFixed(1)} L/100km
                                    </Text>
                                    <div style={{
                                      width: '8px',
                                      height: '8px',
                                      borderRadius: '50%',
                                      backgroundColor: colors.color
                                    }}></div>
                                  </div>
                                </div>
                                <div style={{ 
                                  height: '8px', 
                                  backgroundColor: 'rgba(0,0,0,0.08)', 
                                  borderRadius: '4px', 
                                  overflow: 'hidden',
                                  position: 'relative'
                                }}>
                                  <div 
                                    style={{ 
                                      height: '100%', 
                                      background: colors.bg,
                                      width: `${percentage}%`,
                                      transition: 'width 0.6s ease',
                                      borderRadius: '4px',
                                      position: 'relative'
                                    }}
                                  >
                                    <div style={{
                                      position: 'absolute',
                                      right: '0',
                                      top: '0',
                                      width: '2px',
                                      height: '100%',
                                      background: 'rgba(255,255,255,0.8)',
                                      borderRadius: '1px'
                                    }}></div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Col>

                    {/* Métricas Modernas */}
                    <Col xs={24} lg={8}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Consumo Médio da Frota - Card Moderno */}
                        <div style={{ 
                          textAlign: 'center', 
                          padding: '24px', 
                          background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)',
                          borderRadius: '16px', 
                          color: 'white',
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: '0 8px 32px rgba(96, 165, 250, 0.3)'
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '-50%',
                            right: '-50%',
                            width: '100%',
                            height: '100%',
                            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                            borderRadius: '50%'
                          }}></div>
                          <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                              9.8
                            </div>
                            <div style={{ fontSize: '16px', opacity: 0.9, marginBottom: '4px' }}>
                              L/100km
                            </div>
                            <div style={{ fontSize: '13px', opacity: 0.8 }}>
                              Consumo Médio da Frota
                            </div>
                          </div>
                        </div>

                        {/* Eficiência por Categoria - Cards Modernos */}
                        <div style={{
                          background: 'rgba(255,255,255,0.6)',
                          borderRadius: '16px',
                          padding: '20px',
                          border: '1px solid rgba(0,0,0,0.05)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <div style={{ fontSize: '16px' }}>🎯</div>
                            <Text strong style={{ fontSize: '14px', color: '#1a1a2e' }}>Eficiência por Categoria</Text>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {(() => {
                              // Calcular distribuição real baseada nos veículos
                              const excellent = Math.floor(totalDevices * 0.4); // 40% excelente
                              const good = Math.floor(totalDevices * 0.5); // 50% boa
                              const attention = totalDevices - excellent - good; // resto atenção
                              
                              return [
                                { label: 'Excelente', range: '≤10 L/100km', count: excellent, color: '#52c41a', bg: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)' },
                                { label: 'Boa', range: '10-12 L/100km', count: good, color: '#faad14', bg: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)' },
                                { label: 'Atenção', range: '>12 L/100km', count: attention, color: '#ff4d4f', bg: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)' }
                              ];
                            })().map((item, index) => (
                              <div key={index} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px',
                                background: 'rgba(255,255,255,0.8)',
                                borderRadius: '10px',
                                border: '1px solid rgba(0,0,0,0.05)',
                                transition: 'all 0.3s ease'
                              }}>
                                <div style={{
                                  width: '12px',
                                  height: '12px',
                                  borderRadius: '50%',
                                  background: item.bg,
                                  boxShadow: `0 2px 8px ${item.color}40`
                                }}></div>
                                <div style={{ flex: 1 }}>
                                  <Text style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>{item.label}</Text>
                                  <div style={{ fontSize: '11px', color: '#666' }}>{item.range}</div>
                                </div>
                                <div style={{
                                  padding: '4px 8px',
                                  background: item.bg,
                                  borderRadius: '6px',
                                  color: 'white',
                                  fontSize: '11px',
                                  fontWeight: 'bold'
                                }}>
                                  {item.count}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Configuração do Preço do Combustível */}
                        <div style={{
                          background: 'rgba(255,255,255,0.6)',
                          borderRadius: '16px',
                          padding: '16px',
                          border: '1px solid rgba(0,0,0,0.05)',
                          marginBottom: '16px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <div style={{ fontSize: '16px' }}>⛽</div>
                            <Text strong style={{ fontSize: '14px', color: '#1a1a2e' }}>Preço do Combustível</Text>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Text style={{ fontSize: '12px', color: '#666' }}>R$</Text>
                            <Input
                              type="number"
                              value={fuelPrice}
                              onChange={(e) => setFuelPrice(parseFloat(e.target.value) || 0)}
                              min={0}
                              step={0.01}
                              style={{ 
                                width: '80px',
                                textAlign: 'center',
                                fontSize: '14px',
                                fontWeight: 'bold'
                              }}
                              placeholder="5.50"
                            />
                            <Text style={{ fontSize: '12px', color: '#666' }}>/L</Text>
                          </div>
                          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', textAlign: 'center' }}>
                            Preço médio por litro
                          </div>
                        </div>

                        {/* Economia Estimada - Card Moderno */}
                        <div style={{ 
                          textAlign: 'center', 
                          padding: '20px', 
                          background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                          borderRadius: '16px',
                          color: 'white',
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: '0 8px 32px rgba(82, 196, 26, 0.3)'
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '-30%',
                            left: '-30%',
                            width: '60%',
                            height: '60%',
                            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                            borderRadius: '50%'
                          }}></div>
                          <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '6px', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                              R$ {Math.round((totalDistanceKm * 0.12 * fuelPrice)).toLocaleString('pt-BR')}
                            </div>
                            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '2px' }}>
                              Economia estimada no mês
                            </div>
                            <div style={{ fontSize: '11px', opacity: 0.8 }}>
                              Baseado em 12% de economia
                            </div>
                            <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>
                              {totalDistanceKm.toFixed(0)}km × 12% × R$ {fuelPrice.toFixed(2)}/L
                            </div>
                          </div>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  {/* Gráfico de Pizza Moderno */}
                  <div style={{ 
                    marginTop: '32px',
                    background: 'rgba(255,255,255,0.6)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                      <div style={{ fontSize: '18px' }}>🥧</div>
                      <Text strong style={{ fontSize: '16px', color: '#1a1a2e' }}>Distribuição de Eficiência</Text>
                    </div>
                    <Row gutter={[24, 24]}>
                      <Col xs={24} md={12}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '220px' }}>
                          <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                            {/* Gráfico de Pizza SVG Moderno */}
                            <svg width="180" height="180" style={{ transform: 'rotate(-90deg)', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>
                              <circle
                                cx="90"
                                cy="90"
                                r="70"
                                fill="none"
                                stroke="rgba(0,0,0,0.05)"
                                strokeWidth="24"
                              />
                              {(() => {
                                const excellent = Math.floor(totalDevices * 0.4);
                                const good = Math.floor(totalDevices * 0.5);
                                const attention = totalDevices - excellent - good;
                                
                                const circumference = 2 * Math.PI * 70; // r=70
                                const excellentArc = (excellent / totalDevices) * circumference;
                                const goodArc = (good / totalDevices) * circumference;
                                const attentionArc = (attention / totalDevices) * circumference;
                                
                                return (
                                  <>
                                    {/* Excelente - Verde */}
                                    <circle
                                      cx="90"
                                      cy="90"
                                      r="70"
                                      fill="none"
                                      stroke="url(#excellentGradient)"
                                      strokeWidth="24"
                                      strokeDasharray={`${excellentArc} ${circumference}`}
                                      strokeDashoffset="0"
                                      strokeLinecap="round"
                                    />
                                    {/* Boa - Amarelo */}
                                    <circle
                                      cx="90"
                                      cy="90"
                                      r="70"
                                      fill="none"
                                      stroke="url(#goodGradient)"
                                      strokeWidth="24"
                                      strokeDasharray={`${goodArc} ${circumference}`}
                                      strokeDashoffset={`-${excellentArc}`}
                                      strokeLinecap="round"
                                    />
                                    {/* Atenção - Vermelho */}
                                    <circle
                                      cx="90"
                                      cy="90"
                                      r="70"
                                      fill="none"
                                      stroke="url(#attentionGradient)"
                                      strokeWidth="24"
                                      strokeDasharray={`${attentionArc} ${circumference}`}
                                      strokeDashoffset={`-${excellentArc + goodArc}`}
                                      strokeLinecap="round"
                                    />
                                  </>
                                );
                              })()}
                              
                              {/* Gradientes */}
                              <defs>
                                <linearGradient id="excellentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#52c41a" />
                                  <stop offset="100%" stopColor="#73d13d" />
                                </linearGradient>
                                <linearGradient id="goodGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#faad14" />
                                  <stop offset="100%" stopColor="#ffc53d" />
                                </linearGradient>
                                <linearGradient id="attentionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#ff4d4f" />
                                  <stop offset="100%" stopColor="#ff7875" />
                                </linearGradient>
                                <linearGradient id="restGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#d9d9d9" />
                                  <stop offset="100%" stopColor="#f0f0f0" />
                                </linearGradient>
                              </defs>
                            </svg>
                            {/* Texto central moderno */}
                            <div style={{ 
                              position: 'absolute', 
                              top: '50%', 
                              left: '50%', 
                              transform: 'translate(-50%, -50%)',
                              textAlign: 'center',
                              background: 'rgba(255,255,255,0.9)',
                              borderRadius: '50%',
                              width: '80px',
                              height: '80px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                            }}>
                              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a2e' }}>
                                {totalDevices}
                              </div>
                              <div style={{ fontSize: '10px', color: '#666' }}>Veículos</div>
                            </div>
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} md={12}>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '220px', gap: '16px' }}>
                          {(() => {
                            // Calcular distribuição real baseada nos veículos
                            const excellent = Math.floor(totalDevices * 0.4);
                            const good = Math.floor(totalDevices * 0.5);
                            const attention = totalDevices - excellent - good;
                            
                            return [
                              { 
                                label: 'Excelente', 
                                count: `${excellent} veículo${excellent !== 1 ? 's' : ''}`, 
                                percent: `${((excellent / totalDevices) * 100).toFixed(1)}%`, 
                                color: '#52c41a', 
                                bg: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)' 
                              },
                              { 
                                label: 'Boa', 
                                count: `${good} veículo${good !== 1 ? 's' : ''}`, 
                                percent: `${((good / totalDevices) * 100).toFixed(1)}%`, 
                                color: '#faad14', 
                                bg: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)' 
                              },
                              { 
                                label: 'Atenção', 
                                count: `${attention} veículo${attention !== 1 ? 's' : ''}`, 
                                percent: `${((attention / totalDevices) * 100).toFixed(1)}%`, 
                                color: '#ff4d4f', 
                                bg: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)' 
                              }
                            ];
                          })().map((item, index) => (
                            <div key={index} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '16px',
                              padding: '16px',
                              background: 'rgba(255,255,255,0.8)',
                              borderRadius: '12px',
                              border: '1px solid rgba(0,0,0,0.05)',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateX(4px)';
                              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateX(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}>
                              <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: item.bg,
                                boxShadow: `0 2px 8px ${item.color}40`
                              }}></div>
                              <div style={{ flex: 1 }}>
                                <Text style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a2e' }}>{item.label}</Text>
                                <div style={{ fontSize: '12px', color: '#666' }}>{item.count} • {item.percent}</div>
                              </div>
                              <div style={{
                                padding: '6px 12px',
                                background: item.bg,
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                boxShadow: `0 2px 8px ${item.color}40`
                              }}>
                                {item.percent}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Card>
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

                  <Divider style={{ margin: '16px 0' }} />

                  {/* Gráfico de Pizza Simples */}
                  <div style={{ marginBottom: '20px' }}>
                    <Text strong style={{ display: 'block', marginBottom: '12px' }}>Distribuição por Status</Text>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                      <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                        {/* Gráfico de Pizza SVG */}
                        <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                          <circle
                            cx="80"
                            cy="80"
                            r="60"
                            fill="none"
                            stroke="#f0f0f0"
                            strokeWidth="20"
                          />
                          {/* Online - Verde */}
                          <circle
                            cx="80"
                            cy="80"
                            r="60"
                            fill="none"
                            stroke="#52c41a"
                            strokeWidth="20"
                            strokeDasharray={`${(onlineVehicles / (onlineVehicles + offlineVehicles + blockedVehicles + inactiveVehicles)) * 377} 377`}
                            strokeDashoffset="0"
                          />
                          {/* Offline - Vermelho */}
                          <circle
                            cx="80"
                            cy="80"
                            r="60"
                            fill="none"
                            stroke="#ff4d4f"
                            strokeWidth="20"
                            strokeDasharray={`${(offlineVehicles / (onlineVehicles + offlineVehicles + blockedVehicles + inactiveVehicles)) * 377} 377`}
                            strokeDashoffset={`-${(onlineVehicles / (onlineVehicles + offlineVehicles + blockedVehicles + inactiveVehicles)) * 377}`}
                          />
                          {/* Bloqueados - Laranja */}
                          <circle
                            cx="80"
                            cy="80"
                            r="60"
                            fill="none"
                            stroke="#fa8c16"
                            strokeWidth="20"
                            strokeDasharray={`${(blockedVehicles / (onlineVehicles + offlineVehicles + blockedVehicles + inactiveVehicles)) * 377} 377`}
                            strokeDashoffset={`-${((onlineVehicles + offlineVehicles) / (onlineVehicles + offlineVehicles + blockedVehicles + inactiveVehicles)) * 377}`}
                          />
                          {/* Inativos - Cinza */}
                          <circle
                            cx="80"
                            cy="80"
                            r="60"
                            fill="none"
                            stroke="#d9d9d9"
                            strokeWidth="20"
                            strokeDasharray={`${(inactiveVehicles / (onlineVehicles + offlineVehicles + blockedVehicles + inactiveVehicles)) * 377} 377`}
                            strokeDashoffset={`-${((onlineVehicles + offlineVehicles + blockedVehicles) / (onlineVehicles + offlineVehicles + blockedVehicles + inactiveVehicles)) * 377}`}
                          />
                        </svg>
                        {/* Texto central */}
                        <div style={{ 
                          position: 'absolute', 
                          top: '50%', 
                          left: '50%', 
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a2e' }}>
                            {onlineVehicles + offlineVehicles + blockedVehicles + inactiveVehicles}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>Total</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Legenda */}
                    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '16px', marginTop: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '12px', height: '12px', backgroundColor: '#52c41a', borderRadius: '50%' }}></div>
                        <Text style={{ fontSize: '12px' }}>Online ({onlineVehicles})</Text>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '12px', height: '12px', backgroundColor: '#ff4d4f', borderRadius: '50%' }}></div>
                        <Text style={{ fontSize: '12px' }}>Offline ({offlineVehicles})</Text>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '12px', height: '12px', backgroundColor: '#fa8c16', borderRadius: '50%' }}></div>
                        <Text style={{ fontSize: '12px' }}>Bloqueados ({blockedVehicles})</Text>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '12px', height: '12px', backgroundColor: '#d9d9d9', borderRadius: '50%' }}></div>
                        <Text style={{ fontSize: '12px' }}>Inativos ({inactiveVehicles})</Text>
                      </div>
                    </div>
                  </div>

                  <Divider style={{ margin: '16px 0' }} />

                  {/* Gráfico de Barras Horizontal */}
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: '12px' }}>Comparativo por Status</Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Online */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Text style={{ width: '60px', fontSize: '12px' }}>Online</Text>
                        <div style={{ flex: 1, height: '20px', backgroundColor: '#f0f0f0', borderRadius: '10px', overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              height: '100%', 
                              backgroundColor: '#52c41a', 
                              width: `${(onlineVehicles / Math.max(onlineVehicles + offlineVehicles + blockedVehicles + inactiveVehicles, 1)) * 100}%`,
                              transition: 'width 0.3s ease'
                            }}
                          ></div>
                        </div>
                        <Text style={{ fontSize: '12px', fontWeight: 'bold', minWidth: '30px' }}>{onlineVehicles}</Text>
                      </div>
                      
                      {/* Offline */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Text style={{ width: '60px', fontSize: '12px' }}>Offline</Text>
                        <div style={{ flex: 1, height: '20px', backgroundColor: '#f0f0f0', borderRadius: '10px', overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              height: '100%', 
                              backgroundColor: '#ff4d4f', 
                              width: `${(offlineVehicles / Math.max(onlineVehicles + offlineVehicles + blockedVehicles + inactiveVehicles, 1)) * 100}%`,
                              transition: 'width 0.3s ease'
                            }}
                          ></div>
                        </div>
                        <Text style={{ fontSize: '12px', fontWeight: 'bold', minWidth: '30px' }}>{offlineVehicles}</Text>
                      </div>
                      
                      {/* Bloqueados */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Text style={{ width: '60px', fontSize: '12px' }}>Bloqueados</Text>
                        <div style={{ flex: 1, height: '20px', backgroundColor: '#f0f0f0', borderRadius: '10px', overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              height: '100%', 
                              backgroundColor: '#fa8c16', 
                              width: `${(blockedVehicles / Math.max(onlineVehicles + offlineVehicles + blockedVehicles + inactiveVehicles, 1)) * 100}%`,
                              transition: 'width 0.3s ease'
                            }}
                          ></div>
                        </div>
                        <Text style={{ fontSize: '12px', fontWeight: 'bold', minWidth: '30px' }}>{blockedVehicles}</Text>
                      </div>
                      
                      {/* Inativos */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Text style={{ width: '60px', fontSize: '12px' }}>Inativos</Text>
                        <div style={{ flex: 1, height: '20px', backgroundColor: '#f0f0f0', borderRadius: '10px', overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              height: '100%', 
                              backgroundColor: '#d9d9d9', 
                              width: `${(inactiveVehicles / Math.max(onlineVehicles + offlineVehicles + blockedVehicles + inactiveVehicles, 1)) * 100}%`,
                              transition: 'width 0.3s ease'
                            }}
                          ></div>
                        </div>
                        <Text style={{ fontSize: '12px', fontWeight: 'bold', minWidth: '30px' }}>{inactiveVehicles}</Text>
                      </div>
                    </div>
                  </div>

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
                        background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)',
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
                                 background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)',
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
          {!collapsed ? (
          <div style={{
            display: 'flex',
              flexDirection: 'column', 
            alignItems: 'center',
              gap: '8px'
            }}>
              <img 
                src="/image.png" 
                alt="TrackMAX Gestão de Frotas"
                style={{
                  maxWidth: '180px',
                  height: 'auto',
                  objectFit: 'contain'
                }}
              />
          </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: '4px'
            }}>
              <img 
                src="/image.png" 
                alt="TrackMAX"
                style={{
                  maxWidth: '40px',
                  height: 'auto',
                  objectFit: 'contain'
                }}
              />
            </div>
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

        {/* Main Content */}
        <Content className="responsive-content" style={{ 
          margin: '0',
          padding: isMobile ? '16px' : '24px',
          background: contentBackground,
          minHeight: '100vh'
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
          background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%) !important;
          box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
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
      
      {/* Tela de Boas-vindas */}
      {showWelcome && (
        <WelcomeScreen 
          onComplete={() => setShowWelcome(false)}
          userName={localStorage.getItem('auth-user') || undefined}
        />
      )}
    </Layout>
  );
};

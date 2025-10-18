import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { CSSProperties } from 'react';
import { Layout, Menu, Typography, Card, Avatar, Button, Tag, Space, Input, InputNumber, Row, Col, Tabs, Divider, Spin, Alert, Modal, Statistic, Progress, Empty, List, DatePicker, AutoComplete, Badge } from 'antd';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { Card as ShadcnCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge as ShadcnBadge } from '@/components/ui/badge';
import { Progress as ShadcnProgress } from '@/components/ui/progress';
// import packageJson from '../../package.json'; // Removido para evitar problemas de build
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
  ClockCircleOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router';
import { useLogout } from '@refinedev/core';
import { useTrackmaxApi } from '../hooks/useTrackmaxApi';
// import { useTrackmaxRealtime } from '../hooks/useTrackmaxRealtime'; // Removido temporariamente
import { useRateLimit } from '../hooks/useRateLimit';
import { useProgressiveLoading } from '../hooks/useProgressiveLoading';
import { usePriorityLoading } from '../hooks/usePriorityLoading';
// import { WelcomeScreen } from './WelcomeScreen'; // Removido
import { useDebounce } from '../hooks/useDebounce';
// import { ConnectionDebug } from './ConnectionDebug'; // Removido temporariamente
import { RateLimitStatus } from './RateLimitStatus';
import { LargeScaleLoader } from './LargeScaleLoader';
import { CardLoadingSkeleton } from './CardLoadingSkeleton';
import { StatisticValueSkeleton, BadgeValueSkeleton, StatisticValue } from './ValueSkeleton';
import { SplashScreen } from './SplashScreen';
import { useSplashScreen } from '../hooks/useSplashScreen';
import { getEventStyle, getEventLabel, getEventDescription } from '../utils/eventMapping';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { convertToKmh } from '../utils/speedUtils';
import { LiveMap } from './LiveMap';
import { GoogleMapsLiveMap } from './GoogleMapsLiveMap';
import type { Device, Position, Event, ReportTrips, Driver, MaintenanceRecord } from '../types';
import '../styles/dashboard.css';
import '../styles/themes.css';
import '../styles/responsive.css';

interface MetricRingProps {
  value: number;
  total: number;
  color: string;
  centerPrimary: string;
  centerSecondary?: string;
  backgroundColor?: string;
}

const MetricRing: React.FC<MetricRingProps> = ({
  value,
  total,
  color,
  centerPrimary,
  centerSecondary,
  backgroundColor = '#e2e8f0',
}) => {
  const percentage = total > 0 ? Math.min(Math.max((value / total) * 100, 0), 100) : 0;
  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <div
        className="h-full w-full rounded-full"
        style={{
          background: `conic-gradient(${color} ${percentage}%, ${backgroundColor} ${percentage}% 100%)`,
        }}
      />
      <div className="absolute flex h-12 w-12 flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
        <span className="text-sm font-semibold text-slate-900">{centerPrimary}</span>
        {centerSecondary && (
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            {centerSecondary}
          </span>
        )}
      </div>
    </div>
  );
};

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  ring: React.ReactNode;
  summary: React.ReactNode;
  footer?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, title, ring, summary, footer }) => (
  <div className="flex flex-col rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-center gap-2">
      <span className="text-xl">{icon}</span>
      <span className="text-sm font-semibold text-slate-700">{title}</span>
    </div>
    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {ring}
      <div className="flex-1 text-sm text-slate-600">{summary}</div>
    </div>
    {footer && <div className="mt-6 text-xs font-medium text-slate-500">{footer}</div>}
  </div>
);

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Mapeamento de eventos movido para utils/eventMapping.ts

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
  const [partialTrips, setPartialTrips] = useState<ReportTrips[]>([]);
  const [isLoadingPartial, setIsLoadingPartial] = useState(false);
  
  // Estados para paginação de eventos
  const [currentEventPage, setCurrentEventPage] = useState(0);
  const EVENTS_PER_PAGE = 5;
  
  // Estados para grande escala
  const [isLargeScaleLoading, setIsLargeScaleLoading] = useState(false);
  const [largeScaleProgress, setLargeScaleProgress] = useState({
    totalDevices: 0,
    processedDevices: 0,
    currentBatch: 0,
    totalBatches: 0,
    currentOperation: '',
    estimatedTimeRemaining: 0,
    errors: [] as string[]
  });
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(() => [dayjs().subtract(24, 'hour'), dayjs()]);
  
  // Debounce para evitar requisições desnecessárias
  const debouncedDateRange = useDebounce(dateRange, 500);
  
  // Splash screen
  const { splashState, hideSplash, showSplash } = useSplashScreen();
  
  // Estados para busca e filtro
  const [searchPlates, setSearchPlates] = useState<string>('');
  const [selectedPlates, setSelectedPlates] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  
  // Estado para preço do combustível
  const [fuelPrice, setFuelPrice] = useState<number>(5.5);
  const [fuelPriceOverrides, setFuelPriceOverrides] = useState<Record<number, number>>({});
  
  // Estado para busca de veículos no card de eficiência
  const [vehicleEfficiencySearch, setVehicleEfficiencySearch] = useState<string>('');
  
  // Estados para filtros de ordenação dos cards
  const [offline72hSortOrder, setOffline72hSortOrder] = useState<'oldest' | 'newest'>('oldest');
  const [powerCutSortOrder, setPowerCutSortOrder] = useState<'oldest' | 'newest'>('oldest');
  const [isRangeUpdating, setIsRangeUpdating] = useState(false);
  const [filteredDeviceIds, setFilteredDeviceIds] = useState<number[] | null>(null);
  const lastTripsFetchSignature = useRef<string>('');
  
  // Estado para loading de frota grande
  const [isLargeFleetLoading, setIsLargeFleetLoading] = useState<boolean>(false);
  
  // Estado para animação do dashboard
  const [isDashboardVisible, setIsDashboardVisible] = useState<boolean>(false);
  
  // Hook para gerenciar rate limiting
  const { rateLimitState, resetRateLimit, isRateLimited } = useRateLimit();

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

  // Removido: verificação de tela de boas-vindas

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

  const effectiveDevices = useMemo(() => {
    if (!allDevices || allDevices.length === 0) {
      return [] as Device[];
    }
    if (filteredDeviceIds && filteredDeviceIds.length > 0) {
      const allowedIds = new Set(filteredDeviceIds);
      return allDevices.filter(device => allowedIds.has(device.id));
    }
    return allDevices;
  }, [allDevices, filteredDeviceIds]);

  const activeDeviceIds = useMemo(
    () => effectiveDevices.map(device => device.id),
    [effectiveDevices],
  );
  const activeDeviceIdSet = useMemo(() => new Set(activeDeviceIds), [activeDeviceIds]);
  
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
  const { fetchDevices, fetchPositions, fetchEvents, fetchTrips, fetchDrivers, loading, error } = useTrackmaxApi();
  const { 
    loadingStates, 
    loadDataProgressively 
  } = useProgressiveLoading();

  const {
    loadingStates: priorityLoadingStates,
    currentPriority,
    updateLoadingState: updatePriorityLoading,
    isPriorityLoading,
    getLoadingMessage,
    getPriorityOrder,
    resetAllLoading: resetPriorityLoading
  } = usePriorityLoading();
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isDarkTheme = theme === 'dark';
  const isDebugMode = typeof window !== 'undefined' && window.localStorage.getItem('debug-mode') === 'true';
  const appVersion = '1.0.0'; // Versão fixa para evitar problemas de build

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

  // Carregar dados com prioridades - VERSÃO SIMPLIFICADA
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      try {
        if (!isMounted) return;
        
        console.log('🚀 DEBUG - Starting initial data load...');
        
        // Carregar dispositivos
        const result = await fetchDevices();
        const devicesData = result.devices || [];
        console.log('📱 DEBUG - Devices loaded:', devicesData.length);
        setAllDevices(devicesData);
        setDevices(devicesData);
        
        if (devicesData.length > 0) {
          const deviceIds = devicesData.map(d => d.id);
          
          // Carregar trips para performance
          const tripsData = await fetchTrips({
              deviceIds,
            from: rangeStartDate.toISOString(),
            to: rangeEndDate.toISOString(),
          });
          setTrips(tripsData);
          console.log('🛠️ DEBUG - Trips loaded:', tripsData.length);
          
          // Carregar motoristas
          const driversData = await fetchDrivers();
          setDrivers(driversData);
          console.log('👥 DEBUG - Drivers loaded:', driversData.length);
        }
        
        // Finalizar carregamento
        if (isMounted) {
          hideSplash();
        }
        
        } catch (err) {
        console.error('Erro ao carregar dados iniciais:', err);
        if (isMounted) {
          hideSplash();
        }
      }
    };

    loadInitialData();
    
    return () => {
      isMounted = false;
    };
  }, []); // Apenas executa uma vez no mount

  // Removido carregamento automático de eventos - apenas dados básicos

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

  const buildTripsSignature = useCallback((deviceIds: number[], start: Dayjs, end: Dayjs) => {
    const sortedIds = [...deviceIds].sort((a, b) => a - b);
    return `${sortedIds.join(',')}|${start.toDate().toISOString()}|${end.toDate().toISOString()}`;
  }, []);

  const fetchTripsForRange = useCallback(async (
    deviceIds: number[],
    start: Dayjs | null,
    end: Dayjs | null,
    options: { onStart?: () => void; onEnd?: () => void; skipSignatureCheck?: boolean } = {}
  ) => {
    console.log('🔍 DEBUG - fetchTripsForRange called:', { 
      deviceIdsLength: deviceIds.length, 
      start: start?.toISOString(), 
      end: end?.toISOString(),
      skipSignatureCheck: options.skipSignatureCheck
    });
    
    if (!start || !end || !deviceIds.length) {
      console.log('🔍 DEBUG - fetchTripsForRange early return - missing params');
      options.onEnd?.(); // Garantir que onEnd seja chamado
      return;
    }

    const signature = buildTripsSignature(deviceIds, start, end);
    if (!options.skipSignatureCheck && lastTripsFetchSignature.current === signature) {
      console.log('🔍 DEBUG - fetchTripsForRange early return - same signature');
      options.onEnd?.(); // Garantir que onEnd seja chamado
      return;
    }

    console.log('🔍 DEBUG - fetchTripsForRange calling onStart');
    options.onStart?.();
    
    try {
      console.log('🔍 DEBUG - fetchTripsForRange calling fetchTrips');
      const tripsData = await fetchTrips({
        deviceIds,
        from: start.toDate().toISOString(),
        to: end.toDate().toISOString(),
      });
      console.log('🔍 DEBUG - fetchTripsForRange fetchTrips completed:', tripsData?.length || 0, 'trips');
      setTrips(tripsData);
      setPartialTrips([]);
      lastTripsFetchSignature.current = signature;
    } catch (error) {
      console.error('🔍 DEBUG - fetchTripsForRange error:', error);
      throw error;
    } finally {
      console.log('🔍 DEBUG - fetchTripsForRange calling onEnd');
      options.onEnd?.();
    }
  }, [buildTripsSignature, fetchTrips]);

  const runSearch = useCallback(async (plates: string[]) => {
    console.log('🔍 DEBUG - runSearch started:', { plates, allDevicesLength: allDevices.length });
    
    if (!allDevices.length) {
      console.log('🔍 DEBUG - No devices available, returning');
      return;
    }
    const [start, end] = dateRange;
    if (!start || !end) {
      console.log('🔍 DEBUG - No date range, returning');
      return;
    }

    let matchingDeviceIds: number[] = [];

    if (plates.length > 0) {
      matchingDeviceIds = allDevices
        .filter(device =>
          plates.some(plate =>
            device.name.toLowerCase().includes(plate.toLowerCase()) ||
            device.uniqueId.toLowerCase().includes(plate.toLowerCase())
          )
        )
        .map(device => device.id);

      console.log('🔍 DEBUG - Matching devices found:', matchingDeviceIds.length);

      if (matchingDeviceIds.length === 0) {
        console.log('🔍 DEBUG - No matching devices, clearing data');
        setFilteredDeviceIds([]);
        setTrips([]);
        setPartialTrips([]);
        setIsSearching(false);
        setHasSearched(true);
        return;
      }

      setFilteredDeviceIds(matchingDeviceIds);
    } else {
      matchingDeviceIds = allDevices.map(device => device.id);
      setFilteredDeviceIds(null);
    }

    setHasSearched(true);

    try {
      console.log('🔍 DEBUG - Starting fetchTripsForRange');
      
      // Timeout de segurança para evitar blur infinito
      const timeoutId = setTimeout(() => {
        console.log('🔍 DEBUG - Search timeout reached, forcing end');
        setIsSearching(false);
        setIsLargeFleetLoading(false);
      }, 30000); // 30 segundos
      
      await fetchTripsForRange(matchingDeviceIds, start, end, {
        onStart: () => {
          console.log('🔍 DEBUG - fetchTripsForRange onStart');
          setIsSearching(true);
        },
        onEnd: () => {
          console.log('🔍 DEBUG - fetchTripsForRange onEnd');
          clearTimeout(timeoutId);
          setIsSearching(false);
        },
        skipSignatureCheck: true,
      });
      console.log('🔍 DEBUG - fetchTripsForRange completed successfully');
    } catch (error) {
      console.error('🔍 DEBUG - fetchTripsForRange error:', error);
      setIsSearching(false);
    } finally {
      setIsLargeFleetLoading(false);
    }
  }, [allDevices, dateRange, fetchTripsForRange]);

  const handleSearch = useCallback(() => {
    void runSearch(selectedPlates);
  }, [runSearch, selectedPlates]);

  const confirmLogout = () => {
    logout();
    setLogoutModalVisible(false);
  };

  const cancelLogout = () => {
    setLogoutModalVisible(false);
  };

  useEffect(() => {
    const [start, end] = debouncedDateRange;
    if (!start || !end || activeDeviceIds.length === 0) {
      return;
    }

    let isCancelled = false;

    fetchTripsForRange(activeDeviceIds, start, end, {
      onStart: () => {
        if (!isCancelled) {
          setIsRangeUpdating(true);
        }
      },
      onEnd: () => {
        if (!isCancelled) {
          setIsRangeUpdating(false);
        }
      },
    }).catch(() => {
      if (!isCancelled) {
        setIsRangeUpdating(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [debouncedDateRange, activeDeviceIds, fetchTripsForRange]);

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
    const activeTrips = isLoadingPartial ? partialTrips : trips;
    const statsMap = new Map<number, { distanceKm: number; trips: number; engineHours: number; fuel: number }>();
    let totalTrips = 0;
    let totalEngineHours = 0;
    let estimatedFuel = 0;

    activeTrips.forEach((trip) => {
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
  }, [trips, partialTrips, isLoadingPartial, deviceMap]);

  const { statsMap: tripStatsMap } = tripAggregation;

  const deviceMetrics = useMemo(() => {
    const metrics = new Map<number, { device: Device; distanceKm: number; trips: number; engineHours: number; idleHours: number; fuel: number; lastPosition?: Position }>();

    console.log('🔍 DEBUG - deviceMetrics calculation:', {
      effectiveDevicesLength: effectiveDevices.length,
      positionsLength: positions?.length,
      tripsLength: trips?.length,
      tripStatsMapSize: tripStatsMap?.size
    });

    if (!effectiveDevices.length) {
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
      const rawDeviceId = typeof pos.deviceId === 'string' ? Number(pos.deviceId) : pos.deviceId;
      if (!Number.isFinite(rawDeviceId)) {
        return;
      }
      const deviceId = Number(rawDeviceId);
      if (!activeDeviceIdSet.has(deviceId)) {
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

    effectiveDevices.forEach((device) => {
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
  }, [effectiveDevices, positions, tripStatsMap, rangeStartDate, rangeEndDate, activeDeviceIdSet]);

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
  
  // Calcular eficiência real de combustível por dispositivo (km/l)
  const deviceFuelEfficiency = useMemo(() => {
    const efficiencyMap = new Map<number, { 
      device: Device; 
      efficiency: number; 
      distance: number; 
      fuel: number; 
      fuelUsed: number;
      fuelSource: 'real' | 'estimated' | 'none';
      trips: number;
      hasRealData: boolean;
    }>();

    console.log('🔍 DEBUG - deviceMetricsArray length:', deviceMetricsArray.length);
    console.log('🔍 DEBUG - deviceMetricsArray sample:', deviceMetricsArray.slice(0, 3));

    deviceMetricsArray.forEach(({ device, distanceKm, fuel, trips }) => {
      let efficiency = 0;
      let hasRealData = false;
      let fuelUsed = 0;
      let fuelSource: 'real' | 'estimated' | 'none' = 'none';

      if (fuel > 0 && distanceKm > 0) {
        // Calcular eficiência real baseada em dados de trips
        efficiency = distanceKm / fuel;
        hasRealData = true;
        fuelUsed = fuel;
        fuelSource = 'real';
        console.log(`🔍 DEBUG - ${device.name}: ${distanceKm}km / ${fuel}L = ${efficiency.toFixed(2)} km/l (dados reais)`);
      } else {
        const consumption = (device.attributes as { consumption?: { kmPerL?: number } } | undefined)?.consumption?.kmPerL;
        if (consumption && consumption > 0 && distanceKm > 0) {
          efficiency = consumption;
          fuelUsed = distanceKm / consumption;
          fuelSource = 'estimated';
          hasRealData = false; // Dados teóricos, não reais
          console.log(`🔍 DEBUG - ${device.name}: ${efficiency} km/l (dados teóricos) -> consumo estimado ${fuelUsed.toFixed(2)}L`);
        } else if (fuel > 0) {
          fuelUsed = fuel;
          fuelSource = 'real';
          console.log(`🔍 DEBUG - ${device.name}: sem distância, mas registrou ${fuel}L consumidos`);
        } else {
          console.log(`🔍 DEBUG - ${device.name}: sem dados de eficiência`);
        }
      }

      efficiencyMap.set(device.id, {
        device,
        efficiency,
        distance: distanceKm,
        fuel,
        fuelUsed,
        fuelSource,
        trips,
        hasRealData
      });
    });

    console.log('🔍 DEBUG - efficiencyMap size:', efficiencyMap.size);
    return efficiencyMap;
  }, [deviceMetricsArray]);

  // Calcular eficiência média da frota (km/l)
  const averageFleetEfficiency = useMemo(() => {
    const devicesWithData = Array.from(deviceFuelEfficiency.values())
      .filter(item => item.efficiency > 0);
    
    console.log('🔍 DEBUG - devicesWithData length:', devicesWithData.length);
    
    if (devicesWithData.length === 0) {
      console.log('🔍 DEBUG - Nenhum dispositivo com dados de eficiência');
      return 0;
    }
    
    // Média ponderada por distância
    const totalDistance = devicesWithData.reduce((sum, item) => sum + item.distance, 0);
    if (totalDistance === 0) {
      console.log('🔍 DEBUG - Distância total é zero');
      return 0;
    }
    
    const weightedEfficiency = devicesWithData.reduce((sum, item) => {
      const weight = item.distance / totalDistance;
      return sum + (item.efficiency * weight);
    }, 0);
    
    console.log('🔍 DEBUG - Eficiência média da frota:', weightedEfficiency.toFixed(2), 'km/l');
    return weightedEfficiency;
  }, [deviceFuelEfficiency]);

  const getEffectiveFuelPrice = useCallback(
    (deviceId: number) => fuelPriceOverrides[deviceId] ?? fuelPrice,
    [fuelPriceOverrides, fuelPrice]
  );

  const handleFuelPriceOverrideChange = useCallback(
    (deviceId: number, value: number | null) => {
      setFuelPriceOverrides(prev => {
        const next = { ...prev };
        if (value === null || Number.isNaN(value)) {
          delete next[deviceId];
        } else if (Math.abs(value - fuelPrice) < 0.0001) {
          delete next[deviceId];
        } else {
          next[deviceId] = value;
        }
        return next;
      });
    },
    [fuelPrice]
  );

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

  // Função getEventStyle movida para utils/eventMapping.ts
  const describeEvent = (type: string) => getEventDescription(type);

  // Removido recentEvents - não carregamos mais eventos
  const recentEvents: Event[] = [];

  // Removido paginação de eventos - não carregamos mais eventos
  const paginatedEvents: Event[] = [];
  const totalEventPages = 0;

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
    
    console.log('🔍 DEBUG - offlineDevices72h calculation:');
    console.log('  - effectiveDevices length:', effectiveDevices?.length || 0);
    console.log('  - positions length:', positions?.length || 0);
    console.log('  - seventyTwoHoursAgo:', seventyTwoHoursAgo.toISOString());
    console.log('  - now:', now.toISOString());
    
    const result = (effectiveDevices || [])
      .map(device => {
        // Usar o lastUpdate do dispositivo diretamente
        if (!device.lastUpdate) {
          console.log(`  - Device ${device.name} (${device.id}): No lastUpdate`);
          return null;
        }
        
        const lastUpdate = new Date(device.lastUpdate);
        const isOffline72h = lastUpdate < seventyTwoHoursAgo;
        
        console.log(`  - Device ${device.name} (${device.id}): lastUpdate=${lastUpdate.toISOString()}, isOffline72h=${isOffline72h}`);
        
        if (isOffline72h) {
          return {
            device,
            lastUpdate: device.lastUpdate,
            lastUpdateDate: lastUpdate
          };
        }
        return null;
      })
      .filter((item): item is { device: Device; lastUpdate: string; lastUpdateDate: Date } => item !== null)
      .sort((a, b) => {
        if (offline72hSortOrder === 'oldest') {
          return a.lastUpdateDate.getTime() - b.lastUpdateDate.getTime();
        } else {
          return b.lastUpdateDate.getTime() - a.lastUpdateDate.getTime();
        }
      });
    
    console.log('  - Result length:', result.length);
    return result;
  }, [effectiveDevices, positions, offline72hSortOrder]);

  const powerCutDevices = useMemo(() => {
    return (effectiveDevices || [])
      .map(device => {
        // Verificar se o dispositivo tem powerCut == true nos attributes
        const powerCut = device.attributes?.powerCut;
        if (powerCut === true) {
          // Encontrar a posição mais recente do dispositivo
          const devicePosition = positions.find(pos => pos.deviceId === device.id);
          const lastUpdate = devicePosition?.deviceTime || device.lastUpdate || new Date().toISOString();
          return {
            device,
            lastUpdate,
            lastUpdateDate: new Date(lastUpdate)
          };
        }
        return null;
      })
      .filter((item): item is { device: Device; lastUpdate: string; lastUpdateDate: Date } => item !== null)
      .sort((a, b) => {
        if (powerCutSortOrder === 'oldest') {
          return a.lastUpdateDate.getTime() - b.lastUpdateDate.getTime();
        } else {
          return b.lastUpdateDate.getTime() - a.lastUpdateDate.getTime();
        }
      });
  }, [effectiveDevices, positions, powerCutSortOrder]);

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
  const filteredDevices = (effectiveDevices || []).filter(device => {
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
  const totalDevices = effectiveDevices.length;
  const activeVehicles = effectiveDevices.filter(device => !device.disabled).length;
  const blockedVehicles = effectiveDevices.filter(device => {
    if (device.disabled) {
      return false;
    }
    const attributes = device.attributes as Record<string, unknown> | undefined;
    const output = attributes && (attributes['output'] === true || attributes['engineBlocked'] === true || attributes['engineBlock'] === true);
    return Boolean(output);
  }).length;
  const onlineVehicles = effectiveDevices.filter(device => !device.disabled && device.status === 'online').length;
  const offlineVehicles = Math.max(activeVehicles - onlineVehicles, 0);
  const inactiveVehicles = Math.max(totalDevices - activeVehicles, 0);
  const statusDistribution = useMemo(() => {
    const total = onlineVehicles + offlineVehicles + blockedVehicles + inactiveVehicles;
    const safeTotal = Math.max(total, 1);
    const circumference = 2 * Math.PI * 80;
    const baseStatuses = [
      {
        key: 'online',
        label: 'Online',
        count: onlineVehicles,
        color: '#10b981',
        summaryGradient: 'from-emerald-50 to-emerald-100',
        summaryBorder: 'border-emerald-200',
        summaryText: 'text-emerald-700',
        summaryValue: 'text-emerald-800',
        badgeLabel: 'OK',
        badgeClass: 'bg-emerald-500 hover:bg-emerald-600 text-white',
        legendBorder: 'border-emerald-100',
        legendAccent: 'bg-emerald-500/10',
        legendDot: 'bg-emerald-500',
        legendText: 'text-emerald-700',
        legendMuted: 'text-emerald-600',
        progressClass: 'bg-emerald-500'
      },
      {
        key: 'offline',
        label: 'Offline',
        count: offlineVehicles,
        color: '#ef4444',
        summaryGradient: 'from-rose-50 to-rose-100',
        summaryBorder: 'border-rose-200',
        summaryText: 'text-rose-700',
        summaryValue: 'text-rose-800',
        badgeLabel: 'Atenção',
        badgeClass: 'bg-rose-500 hover:bg-rose-600 text-white',
        legendBorder: 'border-rose-100',
        legendAccent: 'bg-rose-500/10',
        legendDot: 'bg-rose-500',
        legendText: 'text-rose-700',
        legendMuted: 'text-rose-600',
        progressClass: 'bg-rose-500'
      },
      {
        key: 'blocked',
        label: 'Bloqueados',
        count: blockedVehicles,
        color: '#f97316',
        summaryGradient: 'from-amber-50 to-amber-100',
        summaryBorder: 'border-amber-200',
        summaryText: 'text-amber-700',
        summaryValue: 'text-amber-800',
        badgeLabel: 'Bloqueado',
        badgeClass: 'bg-amber-500 hover:bg-amber-600 text-white',
        legendBorder: 'border-amber-100',
        legendAccent: 'bg-amber-500/10',
        legendDot: 'bg-amber-500',
        legendText: 'text-amber-700',
        legendMuted: 'text-amber-600',
        progressClass: 'bg-amber-500'
      },
      {
        key: 'inactive',
        label: 'Inativos',
        count: inactiveVehicles,
        color: '#6b7280',
        summaryGradient: 'from-slate-50 to-slate-100',
        summaryBorder: 'border-slate-200',
        summaryText: 'text-slate-700',
        summaryValue: 'text-slate-800',
        badgeLabel: 'Inativo',
        badgeClass: 'bg-slate-500 hover:bg-slate-600 text-white',
        legendBorder: 'border-slate-200',
        legendAccent: 'bg-slate-500/10',
        legendDot: 'bg-slate-500',
        legendText: 'text-slate-700',
        legendMuted: 'text-slate-600',
        progressClass: 'bg-slate-500'
      }
    ];

    let cumulativeDash = 0;

    const breakdown = baseStatuses.map((status) => {
      const ratio = safeTotal > 0 ? status.count / safeTotal : 0;
      const precisePercent = ratio * 100;
      const percent = Math.round(precisePercent);
      const dash = ratio * circumference;
      const dashOffset = -cumulativeDash;
      cumulativeDash += dash;

      return {
        ...status,
        ratio,
        percent,
        precisePercent,
        dash,
        dashOffset
      };
    });

    return {
      total,
      safeTotal,
      circumference,
      breakdown
    };
  }, [onlineVehicles, offlineVehicles, blockedVehicles, inactiveVehicles]);
  const availabilityPercentage = totalDevices > 0 ? (onlineVehicles / totalDevices) * 100 : 0;
  const blockedPercentage = activeVehicles > 0 ? (blockedVehicles / activeVehicles) * 100 : 0;
  const availabilityPercentLabel = formatNumber(availabilityPercentage, 1);
  const blockedPercentLabel = formatNumber(blockedPercentage, 1);
  const activeRangeVehicles = effectiveDevices.filter(device => {
    if (!device.lastUpdate) {
      return false;
    }
    const lastUpdateDate = new Date(device.lastUpdate);
    return lastUpdateDate >= rangeStartDate && lastUpdateDate <= rangeEndDate;
  }).length;
  const activeRangePercent = totalDevices > 0 ? (activeRangeVehicles / totalDevices) * 100 : 0;
  const activeRangePercentLabel = formatNumber(activeRangePercent, 1);

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
    return (effectiveDevices || [])
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
  }, [effectiveDevices, positions]);

  const offlineDevicesList = useMemo(() => {
    return (effectiveDevices || [])
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
  }, [effectiveDevices, positions]);

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

  // Card de manutenções vazio - será implementado com módulo completo
  const upcomingMaintenances = useMemo((): MaintenanceRecord[] => {
    return [];
  }, []);

  // Renderizar conteúdo baseado na aba ativa
  const renderContent = () => {
    switch (activeTab) {
            case 'dashboard':
        return (
          <div style={{ padding: isMobile ? '16px' : '24px', position: 'relative' }}>
            {/* Barra de Progresso no Topo */}
            { (isSearching || isRangeUpdating) && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                backgroundColor: '#e2e8f0',
                zIndex: 10000
              }}>
                <div style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)',
                  animation: 'progressBar 2s ease-in-out infinite',
                  width: '100%'
                }} />
              </div>
            )}

            {/* Loading Overlay Melhorado */}
            { (isSearching || isRangeUpdating) && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 9999,
                  transition: 'all 0.3s ease-in-out',
                }}
              >
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '32px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  maxWidth: '400px',
                  textAlign: 'center'
                }}>
                <Spin size="large" />
                  <Text style={{ 
                    marginTop: '20px', 
                    fontSize: '16px', 
                    color: '#1a1a2e',
                    fontWeight: '500',
                    display: 'block'
                  }}>
                    {isRangeUpdating
                      ? 'Atualizando dados do período selecionado...'
                      : isLargeFleetLoading
                    ? 'Carregando dados da frota grande (pode levar alguns minutos)...'
                        : 'Buscando dados das placas no período selecionado...'}
                </Text>
                  {isSearching && isLargeFleetLoading && (
                    <Text style={{ 
                      marginTop: '12px', 
                      fontSize: '14px', 
                      color: '#666',
                      display: 'block'
                    }}>
                    Otimizando período para 6 horas para melhor performance
                  </Text>
                )}
                  <div style={{
                    marginTop: '16px',
                    fontSize: '12px',
                    color: '#999',
                    opacity: 0.8
                  }}>
                    Por favor, aguarde...
                  </div>
                </div>
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
                        const nextPlates = [...selectedPlates, value];
                        setSelectedPlates(nextPlates);
                        setSearchPlates('');
                        if (filteredDeviceIds !== null) {
                          void runSearch(nextPlates);
                        }
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
                presets={[
                  { label: 'Últimas 24h', value: [dayjs().subtract(24, 'hour'), dayjs()] },
                  { label: 'Últimos 7 dias', value: [dayjs().subtract(7, 'day').startOf('day'), dayjs()] },
                  { label: 'Este mês', value: [dayjs().startOf('month'), dayjs()] },
                ]}
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
                      background: isSearching 
                        ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 50%, #475569 100%)'
                        : 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)',
                      border: 'none',
                      boxShadow: isSearching 
                        ? '0 2px 8px rgba(148, 163, 184, 0.3)'
                        : '0 4px 12px rgba(96, 165, 250, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                    icon={!isSearching ? <SearchOutlined /> : undefined}
                  >
                    {isSearching ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Spin size="small" />
                        Buscando...
                      </span>
                    ) : (
                      'Buscar'
                    )}
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
                      onClose={() => {
                        const nextPlates = selectedPlates.filter((_, i) => i !== index);
                        setSelectedPlates(nextPlates);
                        if (filteredDeviceIds !== null) {
                          void runSearch(nextPlates);
                        }
                      }}
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
            
            {!isPriorityLoading('top-cards') ? (
              <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  icon="🚗"
                  title="Veículos Ativos"
                  ring={
                    <MetricRing
                      value={activeVehicles}
                      total={Math.max(totalDevices, 1)}
                      color="#2563eb"
                      centerPrimary={formatNumber(activeVehicles)}
                      centerSecondary=""
                    />
                  }
                  summary={
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-slate-900">
                        {formatNumber(activeVehicles)} veículos ativos
                      </p>
                      <p className="text-xs text-slate-500">
                        Frota total considerada: {formatNumber(totalDevices)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Inativos: {formatNumber(inactiveVehicles)}
                      </p>
                  </div>
                  }
                  footer={
                    <span>
                      Filtro aplicado: {filteredDeviceIds ? `${formatNumber(activeDeviceIds.length)} veículo(s)` : 'todos os veículos'}
                    </span>
                  }
                />

                <MetricCard
                  icon="🔒"
                  title="Veículos Bloqueados"
                  ring={
                    <MetricRing
                      value={blockedVehicles}
                      total={Math.max(activeVehicles, 1)}
                      color="#f97316"
                      centerPrimary={formatNumber(blockedVehicles)}
                      centerSecondary=""
                    />
                  }
                  summary={
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-slate-900">
                        {formatNumber(blockedVehicles)} veículos bloqueados
                      </p>
                      <p className="text-xs text-slate-500">
                        Representa {blockedPercentLabel}% da frota ativa
                      </p>
                        </div>
                  }
                  footer={<span>Veículos ativos monitorados: {formatNumber(activeVehicles)}</span>}
                />

                <MetricCard
                  icon="📊"
                  title="Disponibilidade"
                  ring={
                    <MetricRing
                      value={onlineVehicles}
                      total={Math.max(onlineVehicles + offlineVehicles, 1)}
                      color="#3b82f6"
                      centerPrimary={totalDevices > 0 ? `${Math.round(availabilityPercentage)}%` : '0%'}
                      centerSecondary=""
                    />
                  }
                  summary={
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-slate-900">
                        {formatNumber(onlineVehicles)} veículos online
                      </p>
                      <p className="text-xs text-slate-500">
                        Offline: {formatNumber(offlineVehicles)}
                      </p>
                  </div>
                  }
                  footer={<span>Disponibilidade média: {availabilityPercentLabel}%</span>}
                />

                <MetricCard
                  icon="⏰"
                  title="Ativos no Período"
                  ring={
                    <MetricRing
                      value={activeRangeVehicles}
                      total={Math.max(totalDevices, 1)}
                      color="#8b5cf6"
                      centerPrimary={formatNumber(activeRangeVehicles)}
                      centerSecondary=""
                    />
                  }
                  summary={
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-slate-900">
                        {formatNumber(activeRangeVehicles)} veículos atualizaram
                      </p>
                      <p className="text-xs text-slate-500">
                        Cobertura do período: {activeRangePercentLabel}%
                      </p>
                        </div>
                  }
                  footer={<span>Intervalo selecionado: {formattedRange}</span>}
                />
                      </div>
            ) : (
              <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <CardLoadingSkeleton key={index} height="220px" />
                ))}
                    </div>
            )}

            {/* Distribuição por Status */}
            <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
              <Col xs={24} lg={24} xl={24}>
                <ShadcnCard className="w-full border border-slate-200 bg-white/80 shadow-lg backdrop-blur-sm">
                  <CardHeader className="flex flex-col gap-1 pb-3 sm:flex-row sm:items-center sm:justify-between sm:pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                      <BarChartOutlined className="text-blue-600" />
                      Distribuição por Status
                    </CardTitle>
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Atualização automática
                  </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {statusDistribution.breakdown.map((status) => (
                        <div
                          key={status.key}
                          className={`flex flex-col gap-2 rounded-xl border bg-gradient-to-br p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${status.summaryGradient} ${status.summaryBorder}`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className={`text-xs font-semibold uppercase tracking-wide ${status.summaryText}`}>
                                {status.label}
                              </p>
                              <p className={`text-xl font-bold ${status.summaryValue}`}>{status.count}</p>
                  </div>
                            <ShadcnBadge
                              variant="secondary"
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${status.badgeClass}`}
                            >
                              {status.badgeLabel}
                            </ShadcnBadge>
                        </div>
                          <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                            <span>Participação</span>
                            <span className={status.summaryValue}>{status.percent}%</span>
                      </div>
                    </div>
                      ))}
                  </div>
                  
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,260px)_1fr]">
                      <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white/75 p-4 shadow-sm">
                        <div className="flex w-full items-center justify-between text-sm">
                          <h3 className="text-base font-semibold text-slate-800">Distribuição Visual</h3>
                          <ShadcnBadge variant="outline" className="rounded-full border-slate-200 px-2 py-0 text-xs text-slate-600">
                            Total {statusDistribution.total}
                          </ShadcnBadge>
                  </div>
                        <div className="relative flex h-48 w-48 items-center justify-center">
                          <svg width="200" height="200" viewBox="0 0 200 200" className="h-full w-full -rotate-90">
                            <circle cx="100" cy="100" r="80" fill="none" stroke="#e2e8f0" strokeWidth="16" />
                            {statusDistribution.breakdown.map((status) => {
                              const dashArray = `${Math.max(status.dash, 0).toFixed(2)} ${statusDistribution.circumference.toFixed(2)}`;
                              const dashOffset = status.dashOffset.toFixed(2);
                            return (
                                <circle
                                  key={status.key}
                                  cx="100"
                                  cy="100"
                                  r="80"
                                  fill="none"
                                  stroke={status.color}
                                  strokeWidth="16"
                                  strokeDasharray={dashArray}
                                  strokeDashoffset={dashOffset}
                                  strokeLinecap="round"
                                  className="transition-[stroke-dasharray,stroke-dashoffset] duration-700 ease-out"
                                />
                              );
                            })}
                      </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                            <span className="text-3xl font-semibold text-slate-900">{statusDistribution.total}</span>
                            <span className="text-[11px] font-medium text-slate-500">Veículos monitorados</span>
                        </div>
                      </div>
                        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-medium text-slate-600">
                          {statusDistribution.breakdown.map((status) => (
                            <span
                              key={`${status.key}-chip`}
                              className={`flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-0.5 text-slate-600 ${status.legendAccent}`}
                            >
                              <span className={`h-2 w-2 rounded-full ${status.legendDot}`} />
                              {status.label}: {status.percent}%
                            </span>
                          ))}
                    </div>
                  </div>
                  
                      <div className="grid gap-3">
                        {statusDistribution.breakdown.map((status) => (
                          <div
                            key={`${status.key}-legend`}
                            className={`group relative overflow-hidden rounded-xl border bg-white/75 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${status.legendBorder}`}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <span className={`h-2.5 w-2.5 rounded-full ${status.legendDot}`} />
                                <div>
                                  <p className={`text-sm font-semibold ${status.legendText}`}>{status.label}</p>
                                  <p className={`text-[11px] font-medium ${status.legendMuted}`}>{status.count} veículos</p>
                    </div>
                      </div>
                              <div className="text-right">
                                <p className="text-base font-semibold text-slate-900">{status.percent}%</p>
                                <p className="text-[11px] text-slate-500">({status.count})</p>
                        </div>
                    </div>
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${status.progressClass}`}
                                style={{ width: `${Math.min(status.precisePercent, 100).toFixed(2)}%` }}
                              />
                    </div>
                    </div>
                        ))}
                      </div>
                        </div>
                  </CardContent>
                </ShadcnCard>
                </Col>
              </Row>

            {/* Métricas de Performance */}
            <Row gutter={[24, 24]} style={{ marginBottom: '32px', display: 'flex', alignItems: 'stretch' }}>
              <Col xs={24} xl={16} style={{ display: 'flex' }}>
                {!isPriorityLoading('performance') ? (
                <Card
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>Performance da Frota</span>
                        {isLoadingPartial && (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            fontSize: '12px',
                            color: '#1890ff'
                          }}>
                            <Spin size="small" />
                            <span>Carregando...</span>
                          </div>
                        )}
                      </div>
                    }
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
                ) : (
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
                          <StatisticValueSkeleton size="large" />
                          <Text type="secondary">Tempo com ignição ligada</Text>
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <div style={{ textAlign: 'center', padding: '16px' }}>
                          <div style={{ fontSize: '36px', color: 'var(--primary-color)', marginBottom: '8px' }}>⏱️</div>
                          <StatisticValueSkeleton size="large" />
                          <Text type="secondary">Tempo com ignição desligada</Text>
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <div style={{ textAlign: 'center', padding: '16px' }}>
                          <div style={{ fontSize: '36px', color: 'var(--primary-color)', marginBottom: '8px' }}>⏱️</div>
                          <StatisticValueSkeleton size="large" />
                          <Text type="secondary">Tempo Veículo Ocioso (parado com ignição ligada)</Text>
                        </div>
                      </Col>
                    </Row>
                    
                    {/* Segunda linha - Métricas de Distância */}
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12} md={8}>
                        <div style={{ textAlign: 'center', padding: '16px' }}>
                          <div style={{ fontSize: '36px', color: 'var(--primary-color)', marginBottom: '8px' }}>📈</div>
                          <StatisticValueSkeleton size="large" />
                          <Text type="secondary">Distância percorrida no período</Text>
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <div style={{ textAlign: 'center', padding: '16px' }}>
                          <div style={{ fontSize: '36px', color: 'var(--primary-color)', marginBottom: '8px' }}>⛽</div>
                          <StatisticValueSkeleton size="large" />
                          <Text type="secondary">Combustível estimado (L)</Text>
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <div style={{ textAlign: 'center', padding: '16px' }}>
                          <div style={{ fontSize: '36px', color: 'var(--primary-color)', marginBottom: '8px' }}>🚘</div>
                          <StatisticValueSkeleton size="large" />
                          <Text type="secondary">Viagens concluídas no período</Text>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                )}
              </Col>
              
              <Col xs={24} xl={8} style={{ display: 'flex' }}>
                {!isPriorityLoading('alerts') ? (
                  <Card 
                    title="Alertas e Notificações" 
                    className="dashboard-card theme-card"
                  style={{ ...cardRaisedStyle, height: '100%', display: 'flex', flexDirection: 'column' }}
                  >
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {recentEvents.length === 0 ? (
                      <div>
                        <Empty
                          description="Nenhum alerta registrado nas últimas horas"
                          styles={{ image: { height: 80 } }}
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
                              • Dispositivos: {effectiveDevices.length}
                            </Text>
                            <Button 
                              size="small" 
                              type="link" 
                              onClick={() => {
                                console.log('🔍 DEBUG - Forçando reload de eventos...');
                                const loadData = async () => {
                                  try {
                                    const deviceIds = activeDeviceIds;
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
                      ) : (
                        <>
                          {/* Lista de eventos com scroll interno */}
                          <div style={{ 
                            flex: 1, 
                            overflowY: 'auto', 
                            overflowX: 'hidden',
                            maxHeight: '300px',
                            paddingRight: '4px',
                            scrollbarWidth: 'thin',
                            scrollbarColor: isDarkTheme ? '#4a4a4a #2a2a2a' : '#d9d9d9 #f0f0f0'
                          }}>
                            {paginatedEvents.map((event) => {
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
                          
                          {/* Controles de paginação */}
                          {totalEventPages > 1 && (
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              padding: '12px 0',
                              borderTop: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                              marginTop: '8px'
                            }}>
                              <div style={{ fontSize: '12px', color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>
                                Página {currentEventPage + 1} de {totalEventPages} • {recentEvents.length} eventos
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <Button
                                  size="small"
                                  disabled={currentEventPage === 0}
                                  onClick={() => setCurrentEventPage(Math.max(0, currentEventPage - 1))}
                                  style={{ fontSize: '11px', height: '24px' }}
                                >
                                  ← Anterior
                                </Button>
                                <Button
                                  size="small"
                                  disabled={currentEventPage >= totalEventPages - 1}
                                  onClick={() => setCurrentEventPage(Math.min(totalEventPages - 1, currentEventPage + 1))}
                                  style={{ fontSize: '11px', height: '24px' }}
                                >
                                  Próxima →
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </Card>
                ) : (
                  <CardLoadingSkeleton 
                    title="Alertas e Notificações" 
                    type="events" 
                    height="100%"
                  />
                )}
              </Col>
            </Row>

            {/* Cards de Status e Comportamento */}
            <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
              <Col xs={24} md={12}>
                  <Card
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span style={{ flex: 1 }}>Veículos offline a mais de 72 horas</span>
                      {isPriorityLoading('top-cards') ? (
                        <BadgeValueSkeleton />
                      ) : (
                        <Badge 
                          count={offlineDevices72h.length} 
                          style={{ 
                            backgroundColor: '#ff4d4f',
                            marginLeft: '8px',
                            flexShrink: 0
                          }} 
                        />
                      )}
                    </div>
                  }
                    className="dashboard-card theme-card"
                    style={{ ...cardRaisedStyle, height: '400px', display: 'flex', flexDirection: 'column' }}
                    styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: '16px' } }}
                  >
                    {/* Filtro de ordenação */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginBottom: '12px',
                      padding: '8px 12px',
                      background: 'rgba(0,0,0,0.02)',
                      borderRadius: '6px'
                    }}>
                      <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                        Ordenar por:
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          size="small"
                          type={offline72hSortOrder === 'oldest' ? 'primary' : 'default'}
                          onClick={() => setOffline72hSortOrder('oldest')}
                          style={{ fontSize: '11px' }}
                        >
                          Mais antigo
                        </Button>
                        <Button
                          size="small"
                          type={offline72hSortOrder === 'newest' ? 'primary' : 'default'}
                          onClick={() => setOffline72hSortOrder('newest')}
                          style={{ fontSize: '11px' }}
                        >
                          Mais recente
                        </Button>
                      </div>
                    </div>
                    
                    <div 
                      className="custom-scroll-container"
                      style={{ 
                        flex: 1, 
                        overflowY: 'auto', 
                        overflowX: 'hidden',
                        maxHeight: '260px',
                        paddingRight: '4px',
                        scrollbarWidth: 'thin',
                        scrollbarColor: isDarkTheme ? '#4a4a4a #2a2a2a' : '#d9d9d9 #f0f0f0'
                      }}>
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
                                Último sinal há {formatRelativeTime(lastUpdate)}
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                    </div>
                  </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span style={{ flex: 1 }}>Veículos com Alimentação Cortada</span>
                      {isPriorityLoading('top-cards') ? (
                        <BadgeValueSkeleton />
                      ) : (
                        <Badge 
                          count={powerCutDevices.length} 
                          style={{ 
                            backgroundColor: '#ff4d4f',
                            marginLeft: '8px',
                            flexShrink: 0
                          }} 
                        />
                      )}
                    </div>
                  }
                  className="dashboard-card theme-card"
                  style={{ ...cardRaisedStyle, height: '400px', display: 'flex', flexDirection: 'column' }}
                  styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: '16px' } }}
                >
                  {/* Filtro de ordenação */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '12px',
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.02)',
                    borderRadius: '6px'
                  }}>
                    <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                      Ordenar por:
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        size="small"
                        type={powerCutSortOrder === 'oldest' ? 'primary' : 'default'}
                        onClick={() => setPowerCutSortOrder('oldest')}
                        style={{ fontSize: '11px' }}
                      >
                        Mais antigo
                      </Button>
                      <Button
                        size="small"
                        type={powerCutSortOrder === 'newest' ? 'primary' : 'default'}
                        onClick={() => setPowerCutSortOrder('newest')}
                        style={{ fontSize: '11px' }}
                      >
                        Mais recente
                      </Button>
                    </div>
                  </div>
                  
                  <div 
                    className="custom-scroll-container"
                    style={{ 
                      flex: 1, 
                      overflowY: 'auto', 
                      overflowX: 'hidden',
                      maxHeight: '260px',
                      paddingRight: '4px',
                      scrollbarWidth: 'thin',
                      scrollbarColor: isDarkTheme ? '#4a4a4a #2a2a2a' : '#d9d9d9 #f0f0f0'
                    }}>
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
                                Último sinal há {formatRelativeTime(lastUpdate)}
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                  </div>
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
                  styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
                >
                  <Text type="secondary" style={{ display: 'block', marginBottom: '12px' }}>
                    Módulo de manutenções será implementado em breve.
                  </Text>
                  <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
                    <Col xs={12} md={8}>
                      <div style={{ position: 'relative' }}>
                        <Statistic title="Total" value={upcomingMaintenances.length} />
                        {isPriorityLoading('performance') && (
                          <div style={{ 
                            position: 'absolute', 
                            top: '50%', 
                            left: '50%', 
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1
                          }}>
                            <StatisticValueSkeleton />
                          </div>
                        )}
                      </div>
                    </Col>
                    <Col xs={12} md={8}>
                      <div style={{ position: 'relative' }}>
                        <Statistic 
                          title="Pendentes" 
                          value={upcomingMaintenances.length} 
                          valueStyle={{ color: '#faad14' }} 
                        />
                        {isPriorityLoading('performance') && (
                          <div style={{ 
                            position: 'absolute', 
                            top: '50%', 
                            left: '50%', 
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1
                          }}>
                            <StatisticValueSkeleton />
                          </div>
                        )}
                      </div>
                    </Col>
                    <Col xs={12} md={8}>
                      <div style={{ position: 'relative' }}>
                        <Statistic 
                          title="Concluídas" 
                          value={0} 
                          valueStyle={{ color: '#52c41a' }} 
                        />
                        {isPriorityLoading('performance') && (
                          <div style={{ 
                            position: 'absolute', 
                            top: '50%', 
                            left: '50%', 
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1
                          }}>
                            <StatisticValueSkeleton />
                          </div>
                        )}
                      </div>
                    </Col>
                  </Row>
                  <div style={{ flex: 1, overflow: 'auto' }}>
                  <List
                    size="small"
                    dataSource={upcomingMaintenances}
                      locale={{ emptyText: 'Módulo de manutenções em desenvolvimento' }}
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
                  styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
                >
                  <Text type="secondary" style={{ display: 'block', marginBottom: '12px' }}>
                    Status das habilitações e validades dos motoristas.
                  </Text>
                  <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
                    <Col xs={12} md={8}>
                      <div style={{ position: 'relative' }}>
                      <Statistic title="Motoristas" value={driverMetrics.total} />
                        {isPriorityLoading('alerts') && (
                          <div style={{ 
                            position: 'absolute', 
                            top: '50%', 
                            left: '50%', 
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1
                          }}>
                            <StatisticValueSkeleton />
                          </div>
                        )}
                      </div>
                    </Col>
                    <Col xs={12} md={8}>
                      <div style={{ position: 'relative' }}>
                        <Statistic 
                          title="CNHs vencidas" 
                          value={driverMetrics.expired} 
                          valueStyle={{ color: '#ff4d4f' }} 
                        />
                        {isPriorityLoading('alerts') && (
                          <div style={{ 
                            position: 'absolute', 
                            top: '50%', 
                            left: '50%', 
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1
                          }}>
                            <StatisticValueSkeleton />
                          </div>
                        )}
                      </div>
                    </Col>
                    <Col xs={12} md={8}>
                      <div style={{ position: 'relative' }}>
                        <Statistic 
                          title="Vencendo 30 dias" 
                          value={driverMetrics.expiringSoon} 
                          valueStyle={{ color: '#faad14' }} 
                        />
                        {isPriorityLoading('alerts') && (
                          <div style={{ 
                            position: 'absolute', 
                            top: '50%', 
                            left: '50%', 
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1
                          }}>
                            <StatisticValueSkeleton />
                          </div>
                        )}
                      </div>
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
                    <Col xs={24}>
                      <div style={{ 
                        background: 'rgba(255,255,255,0.6)', 
                        borderRadius: '16px', 
                        padding: '24px',
                        border: '1px solid rgba(0,0,0,0.05)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ fontSize: '18px' }}>📊</div>
                          <Text strong style={{ fontSize: '16px', color: '#1a1a2e' }}>Eficiência por Veículo</Text>
                            <Tag color="green">km/l</Tag>
                        </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>
                            Período: {formattedRange}
                          </div>
                        </div>
                        
                        {/* Campo de busca para veículos */}
                        <div style={{ marginBottom: '16px' }}>
                          <Input
                            placeholder="Buscar veículo específico..."
                            prefix={<SearchOutlined />}
                            value={vehicleEfficiencySearch}
                            onChange={(e) => setVehicleEfficiencySearch(e.target.value)}
                            style={{ 
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                            allowClear
                          />
                        </div>
                        {/* Contador de veículos */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          marginBottom: '12px',
                          padding: '8px 12px',
                          background: 'rgba(0,0,0,0.02)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          color: '#6b7280'
                        }}>
                          <span>
                            {(() => {
                              const allDevices = Array.from(deviceFuelEfficiency.values());
                              const filteredDevices = vehicleEfficiencySearch 
                                ? allDevices.filter(item => 
                                    item.device.name.toLowerCase().includes(vehicleEfficiencySearch.toLowerCase()) ||
                                    item.device.uniqueId.toLowerCase().includes(vehicleEfficiencySearch.toLowerCase())
                                  )
                                : allDevices;
                              return `${filteredDevices.length} veículo${filteredDevices.length !== 1 ? 's' : ''} ${vehicleEfficiencySearch ? 'encontrado' + (filteredDevices.length !== 1 ? 's' : '') : 'disponível' + (filteredDevices.length !== 1 ? 's' : '')}`;
                            })()}
                          </span>
                          {vehicleEfficiencySearch && (
                            <Button 
                              type="link" 
                              size="small" 
                              onClick={() => setVehicleEfficiencySearch('')}
                              style={{ padding: 0, fontSize: '12px' }}
                            >
                              Limpar busca
                            </Button>
                          )}
                        </div>
                        
                        <div style={{ height: '320px', overflowY: 'auto', paddingRight: '8px' }}>
                          {(() => {
                            // Buscar todos os veículos, não apenas os com eficiência
                            const allDevices = Array.from(deviceFuelEfficiency.values());
                            
                            // Aplicar filtro de busca se houver termo
                            const filteredDevices = vehicleEfficiencySearch 
                              ? allDevices.filter(item => 
                                  item.device.name.toLowerCase().includes(vehicleEfficiencySearch.toLowerCase()) ||
                                  item.device.uniqueId.toLowerCase().includes(vehicleEfficiencySearch.toLowerCase())
                                )
                              : allDevices;
                            
                            // Ordenar por eficiência (maior primeiro) ou por nome se não houver eficiência
                            const devicesWithEfficiency = filteredDevices
                              .sort((a, b) => {
                                const efficiencyDiff = (b.efficiency || 0) - (a.efficiency || 0);
                                if (efficiencyDiff !== 0) {
                                  return efficiencyDiff;
                                }
                                return a.device.name.localeCompare(b.device.name);
                              });
                            
                            console.log('🔍 DEBUG - devicesWithEfficiency length:', devicesWithEfficiency.length);
                            
                            if (devicesWithEfficiency.length === 0) {
                              return (
                                <div style={{ 
                                  textAlign: 'center', 
                                  padding: '40px 20px',
                                  color: '#666'
                                }}>
                                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                                  <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                                    {vehicleEfficiencySearch 
                                      ? 'Nenhum veículo encontrado' 
                                      : 'Nenhum veículo disponível'
                                    }
                                  </div>
                                  <div style={{ fontSize: '14px', opacity: 0.8 }}>
                                    {vehicleEfficiencySearch 
                                      ? 'Tente buscar por outro termo' 
                                      : 'Aguarde o carregamento dos dados'
                                    }
                                  </div>
                                </div>
                              );
                            }
                            
                            return devicesWithEfficiency.map((item) => {
                              const efficiencyValue = item.efficiency > 0 ? item.efficiency : 0;
                              const efficiencyLabel = efficiencyValue > 0 ? efficiencyValue.toFixed(1) : '—';
                            const maxEfficiency = 20; // 20 km/l como referência máxima
                              const percentage = efficiencyValue > 0 ? Math.min((efficiencyValue / maxEfficiency) * 100, 100) : 0;
                            
                            const getEfficiencyColor = (eff: number) => {
                              if (eff >= 12) return { bg: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)', color: '#52c41a' };
                              if (eff >= 8) return { bg: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)', color: '#faad14' };
                              return { bg: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)', color: '#ff4d4f' };
                            };
                            
                              const colors = getEfficiencyColor(efficiencyValue);
                              const effectiveFuelPrice = getEffectiveFuelPrice(item.device.id);
                              const isOverrideActive = Object.prototype.hasOwnProperty.call(fuelPriceOverrides, item.device.id);
                              const fuelUsedLiters = item.fuelUsed > 0 ? item.fuelUsed : 0;
                              const fuelUsedLabel = fuelUsedLiters > 0
                                ? fuelUsedLiters.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                : '—';
                              const estimatedCost = fuelUsedLiters > 0 ? fuelUsedLiters * effectiveFuelPrice : 0;
                              const costLabel = fuelUsedLiters > 0
                                ? estimatedCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                : '—';
                              const priceLabel = effectiveFuelPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                              const distanceLabel = item.distance > 0
                                ? item.distance.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                                : '0,0';
                              const isRealData = item.fuelSource === 'real' || item.hasRealData;
                            
                            return (
                                <div
                                  key={item.device.id}
                                  style={{
                                marginBottom: '20px',
                                padding: '16px',
                                    background: 'rgba(255,255,255,0.85)',
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
                                  }}
                                >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <div
                                        style={{
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
                                        }}
                                      >
                                        {efficiencyLabel}
                                    </div>
                                    <div>
                                      <Text style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a2e' }}>{item.device.name}</Text>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                    <Text style={{ fontSize: '13px', fontWeight: 'bold', color: colors.color }}>
                                        {efficiencyLabel} km/l
                                    </Text>
                                      <Text style={{ fontSize: '11px', color: '#666' }}>
                                        {distanceLabel} km
                                      </Text>
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
                                  <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#555' }}>
                                      <span>
                                        Consumo {isRealData ? 'real' : 'estimado'}
                                      </span>
                                      <span style={{ fontWeight: 600, color: '#1a1a2e' }}>
                                        {fuelUsedLabel} L
                                      </span>
                              </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#555' }}>
                                      <span>Custo estimado</span>
                                      <span style={{ fontWeight: 600, color: '#1a1a2e' }}>
                                        {costLabel}
                                      </span>
                        </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#555', flexWrap: 'wrap' }}>
                                      <span>Valor combustível:</span>
                                      <InputNumber
                                        size="small"
                              min={0}
                              step={0.01}
                                        precision={2}
                                        value={isOverrideActive ? fuelPriceOverrides[item.device.id] : effectiveFuelPrice}
                                        onChange={(value) => handleFuelPriceOverrideChange(item.device.id, value)}
                                        style={{ width: '120px' }}
                                      />
                                      <Text style={{ fontSize: '11px', color: '#666' }}>
                                        R$ {priceLabel}
                                      </Text>
                                      {isOverrideActive && (
                                        <Button
                                          type="link"
                                          size="small"
                                          onClick={() => handleFuelPriceOverrideChange(item.device.id, null)}
                                          style={{ padding: 0 }}
                                        >
                                          Usar padrão
                                        </Button>
                                      )}
                          </div>
                          </div>
                        </div>
                              );
                            });
                              })()}
                              </div>
                        </div>
                      </Col>
                    </Row>
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

  // Efeito para animar entrada do dashboard
  useEffect(() => {
    if (!splashState.isVisible) {
      // Pequeno delay para transição suave
      const timer = setTimeout(() => {
        setIsDashboardVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [splashState.isVisible]);

  return (
    <Layout
      className="responsive-layout"
      style={{
        minHeight: '100vh',
        background: layoutBackground,
        opacity: isDashboardVisible ? 1 : 0,
        transform: isDashboardVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out, background-color 0.3s ease',
      }}
    >
      {/* Rate Limiting Status */}
      <RateLimitStatus 
        isActive={isRateLimited} 
        onRetry={resetRateLimit}
      />
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
            
            {/* Botão de Toggle do Drawer */}
            <Button
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              block
              style={{
                background: isDarkTheme ? 'rgba(255,255,255,0.08)' : '#f0f5ff',
                borderColor: isDarkTheme ? 'rgba(255,255,255,0.12)' : '#d6e4ff',
                color: isDarkTheme ? '#fff' : '#1d4ed8'
              }}
            >
              {collapsed ? 'Expandir' : 'Recolher'}
            </Button>
            
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
      
      
      {/* Loader para Grande Escala */}
      <LargeScaleLoader
        isVisible={isLargeScaleLoading}
        totalDevices={largeScaleProgress.totalDevices}
        processedDevices={largeScaleProgress.processedDevices}
        currentBatch={largeScaleProgress.currentBatch}
        totalBatches={largeScaleProgress.totalBatches}
        currentOperation={largeScaleProgress.currentOperation}
        estimatedTimeRemaining={largeScaleProgress.estimatedTimeRemaining}
        errors={largeScaleProgress.errors}
        onRetry={() => {
          console.log('🔄 Retry solicitado para grande escala');
          // Implementar lógica de retry
        }}
        onCancel={() => {
          console.log('❌ Cancelar processamento de grande escala');
          setIsLargeScaleLoading(false);
        }}
      />

      {/* Splash Screen */}
      <SplashScreen
        isVisible={splashState.isVisible}
        message={splashState.message}
      />

    </Layout>
  );
};

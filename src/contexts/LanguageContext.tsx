import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'pt-BR' | 'en-US' | 'es-ES';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  'pt-BR': {
    // Dashboard
    dashboard: 'Dashboard',
    vehicles: 'Veículos',
    drivers: 'Motoristas',
    reports: 'Relatórios',
    notifications: 'Notificações',
    settings: 'Configurações',
    logout: 'Sair',
    all: 'Todos',
    active: 'Ativos',
    inactive: 'Inativos',
    search_vehicles: 'Buscar veículos...',
    loading_devices: 'Carregando dispositivos...',
    error_loading_data: 'Erro ao carregar dados',
    confirm_logout: 'Confirmar saída',
    confirm_logout_message: 'Tem certeza que deseja sair?',
    cancel: 'Cancelar',
    redirect_login: 'Você será redirecionado para a página de login.',
    
    // Vehicle info
    vehicle_info: 'Informações do veículo',
    information: 'INFORMAÇÕES',
    id: 'ID',
    model: 'Modelo',
    status: 'Status',
    phone: 'Telefone',
    contact: 'Contato',
    category: 'Categoria',
    last_update: 'Última atualização',
    driver: 'MOTORISTA',
    driver_info_not_available: 'Informações do motorista não disponíveis',
    actions: 'Ações',
    company: 'Empresa',
    online: 'Online',
    offline: 'Offline',
    
    // Devices page
    live_map: 'Mapa em Tempo Real',
    select_vehicle: 'Selecionar Veículo',
    select_vehicle_details: 'Selecione um veículo para ver os detalhes',
    general: 'Geral',
    tracking: 'Rastreamento',
    total_distance: 'Distância Total',
    total_time: 'Tempo Total',
    average_speed: 'Velocidade Média',
    fuel_consumption: 'Consumo de Combustível',
    recent_activity: 'Atividade Recente',
    call_driver: 'Ligar para Motorista',
    send_message: 'Enviar Mensagem',
    company_name: 'Nome da Empresa',
    cnpj: 'CNPJ',
    address: 'Endereço',
    email: 'E-mail',
    license: 'CNH',
    
    // Time filters
    today: 'Hoje',
    this_week: 'Esta semana',
    this_month: 'Este mês',
    this_year: 'Este ano',
    
    // Login
    username: 'Usuário',
    password: 'Senha',
    login: 'Entrar',
    please_enter_username: 'Por favor, informe seu usuário!',
    please_enter_password: 'Por favor, informe sua senha!',
    login_failed: 'Falha no login',
    invalid_credentials: 'Credenciais inválidas',
    server_error: 'Erro do servidor',
    network_error: 'Erro de rede',
    
    // Common
    no_location_data: 'Sem dados de localização',
    select_device_details: 'Selecione um dispositivo para ver os detalhes',
    
    // Performance
    performance: 'Performance',
    performance_monitor: 'Monitor de Performance',
    loading_metrics: 'Métricas de Carregamento',
    auto_optimization: 'Otimização Automática',
    performance_settings: 'Configure o monitoramento e otimização de performance',
    
    // Dashboard
    live_camera: 'Câmera ao Vivo',
    view_mode: 'Modo de Visualização',
    grid_view: 'Visualização em Grade',
    list_view: 'Visualização em Lista',
    no_vehicle_selected: 'Nenhum Veículo Selecionado',
    click_to_select_vehicle: 'Clique em um veículo na lista para ver seus detalhes'
  },
  'en-US': {
    // Dashboard
    dashboard: 'Dashboard',
    vehicles: 'Vehicles',
    drivers: 'Drivers',
    reports: 'Reports',
    notifications: 'Notifications',
    settings: 'Settings',
    logout: 'Logout',
    all: 'All',
    active: 'Active',
    inactive: 'Inactive',
    search_vehicles: 'Search vehicles...',
    loading_devices: 'Loading devices...',
    error_loading_data: 'Error loading data',
    confirm_logout: 'Confirm logout',
    confirm_logout_message: 'Are you sure you want to logout?',
    cancel: 'Cancel',
    redirect_login: 'You will be redirected to the login page.',
    
    // Vehicle info
    vehicle_info: 'Vehicle Information',
    information: 'INFORMATION',
    id: 'ID',
    model: 'Model',
    status: 'Status',
    phone: 'Phone',
    contact: 'Contact',
    category: 'Category',
    last_update: 'Last Update',
    driver: 'DRIVER',
    driver_info_not_available: 'Driver information not available',
    actions: 'Actions',
    company: 'Company',
    online: 'Online',
    offline: 'Offline',
    
    // Devices page
    live_map: 'Live Map',
    select_vehicle: 'Select Vehicle',
    select_vehicle_details: 'Select a vehicle to see details',
    general: 'General',
    tracking: 'Tracking',
    total_distance: 'Total Distance',
    total_time: 'Total Time',
    average_speed: 'Average Speed',
    fuel_consumption: 'Fuel Consumption',
    recent_activity: 'Recent Activity',
    call_driver: 'Call Driver',
    send_message: 'Send Message',
    company_name: 'Company Name',
    cnpj: 'CNPJ',
    address: 'Address',
    email: 'Email',
    license: 'License',
    
    // Time filters
    today: 'Today',
    this_week: 'This week',
    this_month: 'This month',
    this_year: 'This year',
    
    // Login
    username: 'Username',
    password: 'Password',
    login: 'Login',
    please_enter_username: 'Please enter your username!',
    please_enter_password: 'Please enter your password!',
    login_failed: 'Login failed',
    invalid_credentials: 'Invalid credentials',
    server_error: 'Server error',
    network_error: 'Network error',
    
    // Common
    no_location_data: 'No location data',
    select_device_details: 'Select a device to see details',
    
    // Performance
    performance: 'Performance',
    performance_monitor: 'Performance Monitor',
    loading_metrics: 'Loading Metrics',
    auto_optimization: 'Auto Optimization',
    performance_settings: 'Configure performance monitoring and optimization',
    
    // Dashboard
    live_camera: 'Live Camera',
    view_mode: 'View Mode',
    grid_view: 'Grid View',
    list_view: 'List View',
    no_vehicle_selected: 'No Vehicle Selected',
    click_to_select_vehicle: 'Click on a vehicle in the list to see its details'
  },
  'es-ES': {
    // Dashboard
    dashboard: 'Panel de Control',
    vehicles: 'Vehículos',
    drivers: 'Conductores',
    reports: 'Reportes',
    notifications: 'Notificaciones',
    settings: 'Configuración',
    logout: 'Cerrar Sesión',
    all: 'Todos',
    active: 'Activos',
    inactive: 'Inactivos',
    search_vehicles: 'Buscar vehículos...',
    loading_devices: 'Cargando dispositivos...',
    error_loading_data: 'Error al cargar datos',
    confirm_logout: 'Confirmar cierre de sesión',
    confirm_logout_message: '¿Estás seguro de que quieres cerrar sesión?',
    cancel: 'Cancelar',
    redirect_login: 'Serás redirigido a la página de inicio de sesión.',
    
    // Vehicle info
    vehicle_info: 'Información del Vehículo',
    information: 'INFORMACIÓN',
    id: 'ID',
    model: 'Modelo',
    status: 'Estado',
    phone: 'Teléfono',
    contact: 'Contacto',
    category: 'Categoría',
    last_update: 'Última Actualización',
    driver: 'CONDUCTOR',
    driver_info_not_available: 'Información del conductor no disponible',
    actions: 'Acciones',
    company: 'Empresa',
    online: 'En línea',
    offline: 'Desconectado',
    
    // Devices page
    live_map: 'Mapa en Tiempo Real',
    select_vehicle: 'Seleccionar Vehículo',
    select_vehicle_details: 'Selecciona un vehículo para ver detalles',
    general: 'General',
    tracking: 'Seguimiento',
    total_distance: 'Distancia Total',
    total_time: 'Tiempo Total',
    average_speed: 'Velocidad Promedio',
    fuel_consumption: 'Consumo de Combustible',
    recent_activity: 'Actividad Reciente',
    call_driver: 'Llamar Conductor',
    send_message: 'Enviar Mensaje',
    company_name: 'Nombre de la Empresa',
    cnpj: 'CNPJ',
    address: 'Dirección',
    email: 'Correo',
    license: 'Licencia',
    
    // Time filters
    today: 'Hoy',
    this_week: 'Esta semana',
    this_month: 'Este mes',
    this_year: 'Este año',
    
    // Login
    username: 'Usuario',
    password: 'Contraseña',
    login: 'Iniciar Sesión',
    please_enter_username: '¡Por favor ingresa tu usuario!',
    please_enter_password: '¡Por favor ingresa tu contraseña!',
    login_failed: 'Error de inicio de sesión',
    invalid_credentials: 'Credenciales inválidas',
    server_error: 'Error del servidor',
    network_error: 'Error de red',
    
    // Common
    no_location_data: 'Sin datos de ubicación',
    select_device_details: 'Selecciona un dispositivo para ver detalles',
    
    // Performance
    performance: 'Rendimiento',
    performance_monitor: 'Monitor de Rendimiento',
    loading_metrics: 'Métricas de Carga',
    auto_optimization: 'Optimización Automática',
    performance_settings: 'Configure el monitoreo y optimización de rendimiento',
    
    // Dashboard
    live_camera: 'Cámara en Vivo',
    view_mode: 'Modo de Vista',
    grid_view: 'Vista de Cuadrícula',
    list_view: 'Vista de Lista',
    no_vehicle_selected: 'Ningún Vehículo Seleccionado',
    click_to_select_vehicle: 'Haga clic en un vehículo de la lista para ver sus detalles'
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'pt-BR';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

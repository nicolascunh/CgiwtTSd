/**
 * Mapeamento centralizado de tipos de eventos para nomes legíveis
 * Utilizado em toda a aplicação para exibir nomes consistentes dos eventos
 */

export interface EventStyle {
  label: string;
  icon: string;
  color: string;
  lightBg: string;
  darkBg: string;
  description?: string;
}

export interface EventMapping {
  [key: string]: EventStyle;
}

// Mapeamento principal de eventos do Traccar
export const EVENT_STYLE_MAP: EventMapping = {
  // Eventos de velocidade e condução
  overspeed: {
    label: 'Excesso de velocidade',
    icon: '🚦',
    color: '#fa8c16',
    lightBg: '#fff2e8',
    darkBg: 'rgba(250, 140, 22, 0.18)',
    description: 'Veículo excedeu o limite de velocidade configurado'
  },
  harshBraking: {
    label: 'Frenagem brusca',
    icon: '🛑',
    color: '#cf1322',
    lightBg: '#fff1f0',
    darkBg: 'rgba(207, 19, 34, 0.2)',
    description: 'Detectada frenagem abrupta do veículo'
  },
  harshAcceleration: {
    label: 'Aceleração brusca',
    icon: '⚡',
    color: '#52c41a',
    lightBg: '#f6ffed',
    darkBg: 'rgba(82, 196, 26, 0.18)',
    description: 'Detectada aceleração abrupta do veículo'
  },
  harshCornering: {
    label: 'Curva brusca',
    icon: '↩️',
    color: '#faad14',
    lightBg: '#fff7e6',
    darkBg: 'rgba(250, 173, 20, 0.18)',
    description: 'Detectada curva ou manobra brusca'
  },

  // Eventos de motor e energia
  engineBlock: {
    label: 'Veículo bloqueado',
    icon: '🔒',
    color: '#ff4d4f',
    lightBg: '#fff1f0',
    darkBg: 'rgba(255, 77, 79, 0.2)',
    description: 'Motor do veículo foi bloqueado remotamente'
  },
  powerCut: {
    label: 'Corte de alimentação',
    icon: '🔌',
    color: '#13c2c2',
    lightBg: '#e6fffb',
    darkBg: 'rgba(19, 194, 194, 0.2)',
    description: 'Alimentação elétrica do dispositivo foi cortada'
  },
  ignitionOn: {
    label: 'Ignição ligada',
    icon: '🔑',
    color: '#52c41a',
    lightBg: '#f6ffed',
    darkBg: 'rgba(82, 196, 26, 0.18)',
    description: 'Motor do veículo foi ligado'
  },
  ignitionOff: {
    label: 'Ignição desligada',
    icon: '🔑',
    color: '#fa8c16',
    lightBg: '#fff2e8',
    darkBg: 'rgba(250, 140, 22, 0.18)',
    description: 'Motor do veículo foi desligado'
  },
  idle: {
    label: 'Motor ocioso',
    icon: '💤',
    color: '#08979c',
    lightBg: '#e6fffb',
    darkBg: 'rgba(8, 151, 156, 0.18)',
    description: 'Veículo está com motor ligado mas parado'
  },

  // Eventos de geocerca
  geofenceEnter: {
    label: 'Entrada em geocerca',
    icon: '🧱',
    color: '#2f54eb',
    lightBg: '#f0f5ff',
    darkBg: 'rgba(47, 84, 235, 0.2)',
    description: 'Veículo entrou em uma área geocercada'
  },
  geofenceExit: {
    label: 'Saída de geocerca',
    icon: '🧱',
    color: '#722ed1',
    lightBg: '#f9f0ff',
    darkBg: 'rgba(114, 46, 209, 0.2)',
    description: 'Veículo saiu de uma área geocercada'
  },

  // Eventos de dispositivo
  deviceOnline: {
    label: 'Dispositivo online',
    icon: '🟢',
    color: '#52c41a',
    lightBg: '#f6ffed',
    darkBg: 'rgba(82, 196, 26, 0.18)',
    description: 'Dispositivo conectou-se ao servidor'
  },
  deviceOffline: {
    label: 'Dispositivo offline',
    icon: '🔴',
    color: '#ff4d4f',
    lightBg: '#fff1f0',
    darkBg: 'rgba(255, 77, 79, 0.2)',
    description: 'Dispositivo perdeu conexão com o servidor'
  },
  deviceMoving: {
    label: 'Veículo em movimento',
    icon: '🚗',
    color: '#1890ff',
    lightBg: '#e6f7ff',
    darkBg: 'rgba(24, 144, 255, 0.18)',
    description: 'Veículo começou a se mover'
  },
  deviceStopped: {
    label: 'Veículo parado',
    icon: '⏸️',
    color: '#faad14',
    lightBg: '#fff7e6',
    darkBg: 'rgba(250, 173, 20, 0.18)',
    description: 'Veículo parou de se mover'
  },

  // Eventos de alarme
  alarm: {
    label: 'Alarme ativado',
    icon: '🚨',
    color: '#ff4d4f',
    lightBg: '#fff1f0',
    darkBg: 'rgba(255, 77, 79, 0.2)',
    description: 'Alarme de segurança foi ativado'
  },
  tampering: {
    label: 'Tentativa de violação',
    icon: '🔓',
    color: '#cf1322',
    lightBg: '#fff1f0',
    darkBg: 'rgba(207, 19, 34, 0.2)',
    description: 'Detectada tentativa de violação do dispositivo'
  },
  maintenanceRequired: {
    label: 'Manutenção necessária',
    icon: '🔧',
    color: '#fa8c16',
    lightBg: '#fff2e8',
    darkBg: 'rgba(250, 140, 22, 0.18)',
    description: 'Veículo necessita de manutenção'
  },

  // Eventos de bateria e energia
  lowBattery: {
    label: 'Bateria baixa',
    icon: '🔋',
    color: '#faad14',
    lightBg: '#fff7e6',
    darkBg: 'rgba(250, 173, 20, 0.18)',
    description: 'Bateria do dispositivo está baixa'
  },
  lowPower: {
    label: 'Energia baixa',
    icon: '⚡',
    color: '#fa8c16',
    lightBg: '#fff2e8',
    darkBg: 'rgba(250, 140, 22, 0.18)',
    description: 'Nível de energia do dispositivo está baixo'
  },

  // Eventos de SOS
  sOS: {
    label: 'SOS ativado',
    icon: '🆘',
    color: '#cf1322',
    lightBg: '#fff1f0',
    darkBg: 'rgba(207, 19, 34, 0.2)',
    description: 'Botão de emergência SOS foi ativado'
  },

  // Eventos gerais
  general: {
    label: 'Evento geral',
    icon: 'ℹ️',
    color: '#1890ff',
    lightBg: '#e6f7ff',
    darkBg: 'rgba(24, 144, 255, 0.18)',
    description: 'Evento geral do sistema'
  }
};

// Estilo padrão para eventos não mapeados
export const DEFAULT_EVENT_STYLE: EventStyle = {
  label: 'Evento desconhecido',
  icon: '⚠️',
  color: '#faad14',
  lightBg: '#fff7e6',
  darkBg: 'rgba(250, 173, 20, 0.18)',
  description: 'Tipo de evento não reconhecido'
};

// Mapeamento de eventos da timeline (baseado em posições)
export const TIMELINE_EVENT_MAP: EventMapping = {
  driving: {
    label: 'Dirigindo',
    icon: '🚗',
    color: '#52c41a',
    lightBg: '#f6ffed',
    darkBg: 'rgba(82, 196, 26, 0.18)',
    description: 'Veículo em movimento'
  },
  stopped: {
    label: 'Parado',
    icon: '⏸️',
    color: '#faad14',
    lightBg: '#fff7e6',
    darkBg: 'rgba(250, 173, 20, 0.18)',
    description: 'Veículo parado'
  },
  started: {
    label: 'Iniciou viagem',
    icon: '▶️',
    color: '#1890ff',
    lightBg: '#e6f7ff',
    darkBg: 'rgba(24, 144, 255, 0.18)',
    description: 'Veículo iniciou uma nova viagem'
  },
  warning: {
    label: 'Alerta',
    icon: '⚠️',
    color: '#ff4d4f',
    lightBg: '#fff1f0',
    darkBg: 'rgba(255, 77, 79, 0.2)',
    description: 'Alerta ou aviso do sistema'
  }
};

/**
 * Obtém o estilo e informações de um evento baseado no tipo
 */
export const getEventStyle = (eventType: string): EventStyle => {
  return EVENT_STYLE_MAP[eventType] || DEFAULT_EVENT_STYLE;
};

/**
 * Obtém o estilo de um evento da timeline
 */
export const getTimelineEventStyle = (eventType: string): EventStyle => {
  return TIMELINE_EVENT_MAP[eventType] || DEFAULT_EVENT_STYLE;
};

/**
 * Obtém o nome legível de um evento
 */
export const getEventLabel = (eventType: string): string => {
  return getEventStyle(eventType).label;
};

/**
 * Obtém a descrição de um evento
 */
export const getEventDescription = (eventType: string): string => {
  return getEventStyle(eventType).description || 'Sem descrição disponível';
};

/**
 * Obtém o ícone de um evento
 */
export const getEventIcon = (eventType: string): string => {
  return getEventStyle(eventType).icon;
};

/**
 * Obtém a cor de um evento
 */
export const getEventColor = (eventType: string): string => {
  return getEventStyle(eventType).color;
};

/**
 * Obtém o fundo de um evento baseado no tema
 */
export const getEventBackground = (eventType: string, isDarkTheme: boolean = false): string => {
  const style = getEventStyle(eventType);
  return isDarkTheme ? style.darkBg : style.lightBg;
};

/**
 * Lista todos os tipos de eventos disponíveis
 */
export const getAllEventTypes = (): string[] => {
  return Object.keys(EVENT_STYLE_MAP);
};

/**
 * Lista todos os tipos de eventos da timeline
 */
export const getAllTimelineEventTypes = (): string[] => {
  return Object.keys(TIMELINE_EVENT_MAP);
};

/**
 * Verifica se um tipo de evento é válido
 */
export const isValidEventType = (eventType: string): boolean => {
  return eventType in EVENT_STYLE_MAP;
};

/**
 * Verifica se um tipo de evento da timeline é válido
 */
export const isValidTimelineEventType = (eventType: string): boolean => {
  return eventType in TIMELINE_EVENT_MAP;
};

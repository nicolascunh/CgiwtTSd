// Tipos baseados na API do Trackmax
export type Device = {
  id: number;
  name: string;
  uniqueId: string;
  status: string;
  disabled: boolean;
  lastUpdate: string;
  positionId: number;
  groupId: number;
  phone: string;
  model: string;
  contact: string;
  category: string;
  geofenceIds: number[];
  attributes: Record<string, unknown>;
};

export type Position = {
  id: number;
  deviceId: number;
  protocol: string;
  deviceTime: string;
  fixTime: string;
  serverTime: string;
  outdated: boolean;
  valid: boolean;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  course: number;
  address: string;
  accuracy: number;
  network: Record<string, unknown>;
  attributes: Record<string, unknown>;
};

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  readonly: boolean;
  administrator: boolean;
  map: string;
  latitude: number;
  longitude: number;
  zoom: number;
  password: string;
  twelveHourFormat: boolean;
  coordinateFormat: string;
  disabled: boolean;
  expirationTime: string;
  deviceLimit: number;
  userLimit: number;
  deviceReadonly: boolean;
  limitCommands: boolean;
  poiLayer: string;
  token: string;
  attributes: Record<string, unknown>;
};

export type Group = {
  id: number;
  name: string;
  groupId: number;
  attributes: Record<string, unknown>;
};

export type Driver = {
  id: number;
  name: string;
  uniqueId: string;
  email?: string;
  phone?: string;
  deviceId?: number;
  license?: string;
  licenseExpiry?: string;
  licenseCategory?: string;
  attributes: Record<string, unknown>;
};

export type Notification = {
  id: number;
  type: string;
  always: boolean;
  web: boolean;
  mail: boolean;
  sms: boolean;
  calendarId: number;
  attributes: Record<string, unknown>;
};

export type NotificationType = {
  type: string;
};

export type Event = {
  id: number;
  type: string;
  serverTime: string;
  deviceId: number;
  positionId: number;
  geofenceId: number;
  maintenanceId: number;
  attributes: Record<string, unknown>;
};

export type MaintenanceRecord = {
  id: number;
  name: string;
  deviceId: number;
  start: number;
  period: number;
  type: "hours" | "distance" | "days";
  attributes: Record<string, unknown>;
};

export type ReportSummary = {
  deviceId: number;
  deviceName: string;
  maxSpeed: number;
  averageSpeed: number;
  distance: number;
  spentFuel: number;
  engineHours: number;
};

export type ReportTrips = {
  deviceId: number;
  deviceName: string;
  maxSpeed: number;
  averageSpeed: number;
  distance: number;
  spentFuel: number;
  duration: number;
  startTime: string;
  startAddress: string;
  startLat: number;
  startLon: number;
  endTime: string;
  endAddress: string;
  endLat: number;
  endLon: number;
  driverUniqueId: number;
  driverName: string;
};

export type ReportStops = {
  deviceId: number;
  deviceName: string;
  duration: number;
  startTime: string;
  address: string;
  lat: number;
  lon: number;
  endTime: string;
  spentFuel: number;
  engineHours: number;
};

export type Permission = {
  userId: number;
  deviceId: number;
  groupId: number;
  geofenceId: number;
  calendarId: number;
  attributeId: number;
  driverId: number;
  managedUserId: number;
};

// Google Maps related types
export type GoogleMapsConfig = {
  apiKey: string;
  libraries: string[];
  defaultZoom: number;
  defaultCenter: {
    lat: number;
    lng: number;
  };
};

export type MapMarker = {
  id: number;
  position: {
    lat: number;
    lng: number;
  };
  title: string;
  description?: string;
  icon?: string;
  deviceId?: number;
};

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

// Environment variables type
export type EnvironmentConfig = {
  VITE_GOOGLE_MAPS_API_KEY: string;
  VITE_API_URL?: string;
};

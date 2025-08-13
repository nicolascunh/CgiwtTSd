export type Device = {
  id: string;
  name: string;
  uniqueId: string;
  status: string;
  disabled: boolean;
  lastUpdate: string;
  positionId: string;
  groupId: string;
  phone: string;
  model: string;
  contact: string;
  category: string;
  geofenceIds: string[];
};

export type Position = {
  id: string;
  protocol: string;
  deviceId: string;
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
  attributes: Record<string, unknown>;
};

export type User = {
  id: string;
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
};

export type Command = {
  id: string;
  deviceId: string;
  type: string;
  textChannel: boolean;
  description: string;
};

export type RouteReport = {
  id: string;
  deviceId: string;
  routeId: string;
  startTime: string;
  endTime: string;
  duration: number;
  distance: number;
  averageSpeed: number;
  maxSpeed: number;
  status: string;
};

export type Notification = {
  id: string;
  type: string;
  userId: string;
  attributes: Record<string, unknown>;
  calendarId: string;
  always: boolean;
  notificators: string[];
};

export type Driver = {
  id: string;
  name: string;
  uniqueId: string;
  attributes: Record<string, unknown>;
};

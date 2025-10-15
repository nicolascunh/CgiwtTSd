import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  Clock, 
  MapPin, 
  Zap,
  Phone,
  User,
  Info,
  X
} from 'lucide-react';
import type { Device, Position } from '../types';

interface VehicleCardProps {
  device: Device;
  position: Position;
  onClose: () => void;
  onSelect: () => void;
  onViewDetails: () => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  device,
  position,
  onClose,
  onSelect,
  onViewDetails
}) => {
  const isOnline = new Date(position.deviceTime).getTime() > Date.now() - 5 * 60 * 1000;
  const lastUpdate = new Date(position.deviceTime);
  const speedKmh = Math.round(position.speed * 3.6); // Converter m/s para km/h

  const getStatusVariant = () => {
    if (isOnline) return 'default';
    if (position.outdated) return 'secondary';
    return 'destructive';
  };

  const getStatusText = () => {
    if (isOnline) return 'Online';
    if (position.outdated) return 'Desatualizado';
    return 'Offline';
  };

  const formatAddress = (address: string) => {
    if (!address) return 'Endereço não disponível';
    return address.length > 50 ? `${address.substring(0, 50)}...` : address;
  };

  return (
    <Card className="w-80 max-h-96 overflow-auto shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg text-blue-600 mb-1">
              {device.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              ID: {device.uniqueId}
            </p>
          </div>
          <Badge variant={getStatusVariant()} className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Localização */}
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-foreground leading-relaxed">
            {formatAddress(position.address)}
          </p>
        </div>

        {/* Coordenadas */}
        <p className="text-xs text-muted-foreground">
          Lat: {position.latitude.toFixed(6)}, Lng: {position.longitude.toFixed(6)}
        </p>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-muted/50 rounded-md">
            <p className="text-xs text-muted-foreground">Velocidade</p>
            <p className={`text-sm font-semibold ${speedKmh > 80 ? 'text-red-500' : 'text-green-500'}`}>
              {speedKmh} km/h
            </p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-md">
            <p className="text-xs text-muted-foreground">Curso</p>
            <p className="text-sm font-semibold">{position.course}°</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-md">
            <p className="text-xs text-muted-foreground">Altitude</p>
            <p className="text-sm font-semibold">{Math.round(position.altitude)}m</p>
          </div>
        </div>

        {/* Informações do dispositivo */}
        <div className="p-3 bg-muted/30 rounded-lg space-y-2">
          {device.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3 text-blue-500" />
              <span className="text-xs">{device.phone}</span>
            </div>
          )}
          
          {device.contact && (
            <div className="flex items-center gap-2">
              <User className="w-3 h-3 text-purple-500" />
              <span className="text-xs">{device.contact}</span>
            </div>
          )}

          {device.model && (
            <div className="flex items-center gap-2">
              <Car className="w-3 h-3 text-orange-500" />
              <span className="text-xs">{device.model}</span>
            </div>
          )}
        </div>

        {/* Última atualização */}
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Atualizado há {Math.round((Date.now() - lastUpdate.getTime()) / 60000)} min
          </p>
        </div>

        {/* Precisão */}
        {position.accuracy && (
          <p className="text-xs text-muted-foreground">
            Precisão: ±{Math.round(position.accuracy)}m
          </p>
        )}

        {/* Botões de ação */}
        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            onClick={onSelect}
            className="flex-1"
          >
            <Car className="w-3 h-3 mr-1" />
            Selecionar
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={onViewDetails}
            className="flex-1"
          >
            <Info className="w-3 h-3 mr-1" />
            Detalhes
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={onClose}
            className="px-2"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Car, 
  MapPin, 
  Clock,
  Zap,
  Phone,
  User,
  Info,
  History
} from 'lucide-react';
import type { Device, Position } from '../types';

interface VehicleDetailsModalProps {
  visible: boolean;
  device: Device | null;
  position: Position | null;
  onClose: () => void;
  onCenterMap: () => void;
}

export const VehicleDetailsModal: React.FC<VehicleDetailsModalProps> = ({
  visible,
  device,
  position,
  onClose,
  onCenterMap
}) => {
  if (!device || !position) return null;

  const isOnline = new Date(position.deviceTime).getTime() > Date.now() - 5 * 60 * 1000;
  const lastUpdate = new Date(position.deviceTime);
  const speedKmh = Math.round(position.speed * 3.6);

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

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('pt-BR');
  };

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-500" />
            <span>Detalhes do Veículo</span>
            <Badge variant={getStatusVariant()} className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {getStatusText()}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Informações detalhadas sobre o veículo selecionado
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Informações básicas do dispositivo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{device.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID Único</label>
                  <p className="font-mono text-sm bg-muted px-2 py-1 rounded">{device.uniqueId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge variant={getStatusVariant()}>{getStatusText()}</Badge>
                  </div>
                </div>
                
                {device.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4" />
                      <span>{device.phone}</span>
                    </div>
                  </div>
                )}
                
                {device.contact && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contato</label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4" />
                      <span>{device.contact}</span>
                    </div>
                  </div>
                )}
                
                {device.model && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Modelo</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Car className="w-4 h-4" />
                      <span>{device.model}</span>
                    </div>
                  </div>
                )}
                
                {device.category && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                    <p className="mt-1">{device.category}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Posição atual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Posição Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Velocidade</p>
                  <p className={`text-2xl font-bold ${speedKmh > 80 ? 'text-red-500' : 'text-green-500'}`}>
                    {speedKmh} km/h
                  </p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Curso</p>
                  <p className="text-2xl font-bold">{position.course}°</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Latitude</p>
                  <p className="text-sm font-mono">{position.latitude.toFixed(6)}</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Longitude</p>
                  <p className="text-sm font-mono">{position.longitude.toFixed(6)}</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Altitude</p>
                  <p className="text-sm font-bold">{Math.round(position.altitude)}m</p>
                </div>
              </div>

              {position.address && (
                <div className="mb-2">
                  <p className="font-medium text-sm">Endereço:</p>
                  <p className="text-sm text-muted-foreground">{position.address}</p>
                </div>
              )}

              {position.accuracy && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Precisão: ±{Math.round(position.accuracy)}m
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações de Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-sm">Dispositivo</p>
                    <p className="text-sm text-muted-foreground">{formatTime(position.deviceTime)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Zap className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-sm">Fix GPS</p>
                    <p className="text-sm text-muted-foreground">{formatTime(position.fixTime)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <History className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="font-medium text-sm">Servidor</p>
                    <p className="text-sm text-muted-foreground">{formatTime(position.serverTime)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações técnicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Técnicas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Protocolo</label>
                  <p className="mt-1">{position.protocol}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Válido</label>
                  <div className="mt-1">
                    <Badge variant={position.valid ? 'default' : 'destructive'}>
                      {position.valid ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Desatualizado</label>
                  <div className="mt-1">
                    <Badge variant={position.outdated ? 'secondary' : 'default'}>
                      {position.outdated ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Desabilitado</label>
                  <div className="mt-1">
                    <Badge variant={device.disabled ? 'destructive' : 'default'}>
                      {device.disabled ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Atributos adicionais */}
          {(device.attributes && Object.keys(device.attributes).length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Atributos do Dispositivo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(device.attributes).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                      <span className="font-medium text-sm">{key}</span>
                      <span className="text-sm text-muted-foreground">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {(position.attributes && Object.keys(position.attributes).length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Atributos da Posição</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(position.attributes).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                      <span className="font-medium text-sm">{key}</span>
                      <span className="text-sm text-muted-foreground">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={onCenterMap}>
            <MapPin className="w-4 h-4 mr-2" />
            Centralizar no Mapa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

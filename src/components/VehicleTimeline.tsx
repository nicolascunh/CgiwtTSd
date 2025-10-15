import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  MapPin, 
  Clock,
  AlertTriangle,
  Play,
  Pause
} from 'lucide-react';
import type { Position } from '../types';

interface TimelineEvent {
  id: string;
  type: 'driving' | 'stopped' | 'started' | 'warning';
  time: string;
  location: string;
  details?: string;
  duration?: string;
  distance?: string;
  speed?: number;
}

interface VehicleTimelineProps {
  positions: Position[];
  selectedDeviceId?: number;
  onRefresh?: () => void;
}

export const VehicleTimeline: React.FC<VehicleTimelineProps> = ({
  positions,
  selectedDeviceId,
  onRefresh
}) => {
  // Gerar eventos da timeline baseado nas posições
  const generateTimelineEvents = (): TimelineEvent[] => {
    if (!positions.length) return [];

    const events: TimelineEvent[] = [];
    const sortedPositions = [...positions].sort((a, b) => 
      new Date(b.deviceTime).getTime() - new Date(a.deviceTime).getTime()
    );

    sortedPositions.forEach((position, index) => {
      const isOnline = new Date(position.deviceTime).getTime() > Date.now() - 5 * 60 * 1000;
      const speedKmh = Math.round(position.speed * 3.6);
      
      let eventType: TimelineEvent['type'] = 'driving';
      let details = `${speedKmh} km/h`;
      
      if (speedKmh < 5) {
        eventType = 'stopped';
        details = 'Parado';
      } else if (index === sortedPositions.length - 1 && isOnline) {
        eventType = 'started';
        details = `${speedKmh} km/h`;
      }

      // Adicionar duração e distância se disponível
      if (index < sortedPositions.length - 1) {
        const nextPosition = sortedPositions[index + 1];
        const timeDiff = new Date(position.deviceTime).getTime() - new Date(nextPosition.deviceTime).getTime();
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0 || minutes > 0) {
          details += ` ${hours}h ${minutes}min`;
        }
      }

      events.push({
        id: `event-${position.id}`,
        type: eventType,
        time: new Date(position.deviceTime).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        location: position.address || `${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)}`,
        details,
        speed: speedKmh
      });
    });

    return events.slice(0, 10); // Limitar a 10 eventos mais recentes
  };

  const events = generateTimelineEvents();
  const lastUpdate = positions.length > 0 ? new Date(positions[0].deviceTime) : new Date();

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'driving':
        return <Car className="w-4 h-4 text-green-500" />;
      case 'stopped':
        return <Pause className="w-4 h-4 text-orange-500" />;
      case 'started':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <MapPin className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEventVariant = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'driving':
        return 'default';
      case 'stopped':
        return 'secondary';
      case 'started':
        return 'default';
      case 'warning':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getEventText = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'driving':
        return 'Dirigindo';
      case 'stopped':
        return 'Parado';
      case 'started':
        return 'Iniciou viagem';
      case 'warning':
        return 'Alerta';
      default:
        return 'Atividade';
    }
  };

  return (
    <Card className="h-full bg-gray-900 border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-white text-lg">Timeline</CardTitle>
            <p className="text-gray-400 text-xs">
              Atualizado há {Math.round((Date.now() - lastUpdate.getTime()) / 60000)} min
            </p>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onRefresh}
            className="text-blue-500 hover:text-blue-400"
          >
            Atualizar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={event.id} className="flex gap-3">
                {/* Timeline dot */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center">
                  {getEventIcon(event.type)}
                </div>
                
                {/* Event content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white text-sm">
                      {event.time}
                    </span>
                    <Badge variant={getEventVariant(event.type)} className="text-xs">
                      {getEventText(event.type)}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-1 truncate">
                    {event.location}
                  </p>
                  
                  {event.details && (
                    <p className="text-gray-400 text-xs">
                      {event.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Clock className="w-6 h-6 mx-auto mb-2" />
            <p>Nenhuma atividade recente</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

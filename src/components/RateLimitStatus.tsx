import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface RateLimitStatusProps {
  isActive: boolean;
  onRetry: () => void;
}

export const RateLimitStatus: React.FC<RateLimitStatusProps> = ({ isActive, onRetry }) => {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (isActive && countdown === 0) {
      setCountdown(30); // 30 segundos de cooldown
    }
  }, [isActive, countdown]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!isActive && countdown === 0) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto mb-4 border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <span className="text-xl">⚠️</span>
          Rate Limiting Detectado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-orange-700">
          <p>Muitas requisições foram feitas simultaneamente.</p>
          <p>O sistema está processando os dados em lotes menores com delays.</p>
        </div>
        
        {countdown > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              Cooldown: {countdown}s
            </Badge>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button 
            onClick={onRetry} 
            disabled={countdown > 0}
            variant="outline" 
            size="sm"
            className="text-orange-600 border-orange-300 hover:bg-orange-100"
          >
            {countdown > 0 ? `Aguardar ${countdown}s` : 'Tentar Novamente'}
          </Button>
        </div>
        
        <div className="text-xs text-orange-600">
          💡 Dica: O sistema agora processa dados em lotes de 20 dispositivos com 2s de delay entre lotes.
        </div>
      </CardContent>
    </Card>
  );
};




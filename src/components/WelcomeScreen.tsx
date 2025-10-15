import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard,
  CheckCircle
} from 'lucide-react';

interface WelcomeScreenProps {
  onComplete: () => void;
  userName?: string;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete, userName }) => {
  const startUsing = () => {
    localStorage.setItem('welcome-completed', 'true');
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-5">
      <Card className="max-w-lg w-full bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 border-0 rounded-2xl shadow-2xl">
        <CardContent className="p-10 bg-white/95 rounded-xl m-1 text-center">
          {/* Ícone */}
          <div className="text-6xl mb-6 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
            <LayoutDashboard className="mx-auto" />
          </div>

          {/* Título */}
          <CardTitle className="text-2xl mb-4 text-gray-900">
            🚗 Bem-vindo ao Sistema de Gestão de Frotas!
          </CardTitle>

          {/* Descrição */}
          <p className="text-base text-gray-600 mb-8 leading-relaxed">
            Olá <strong>{userName || 'Usuário'}</strong>! Você está prestes a conhecer uma das mais 
            completas plataformas de gestão de frotas do mercado.
          </p>

          {/* Funcionalidades principais */}
          <div className="mb-8 p-5 bg-blue-50/50 rounded-xl border border-blue-100">
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-blue-600">📊 Dashboard Executivo</p>
                <p className="text-sm text-muted-foreground">Visão completa da performance da sua frota</p>
              </div>
              <div>
                <p className="font-semibold text-blue-600">🚗 Rastreamento em Tempo Real</p>
                <p className="text-sm text-muted-foreground">Localização precisa de todos os veículos</p>
              </div>
              <div>
                <p className="font-semibold text-blue-600">🚨 Alertas Inteligentes</p>
                <p className="text-sm text-muted-foreground">Notificações importantes em tempo real</p>
              </div>
            </div>
          </div>

          {/* Botão */}
          <Button 
            size="lg"
            onClick={startUsing}
            className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 hover:from-blue-500 hover:via-blue-600 hover:to-blue-700 border-0 shadow-lg h-12 px-8 text-base font-semibold"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Começar a usar!
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

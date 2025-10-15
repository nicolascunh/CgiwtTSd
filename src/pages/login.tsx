import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Lock } from 'lucide-react';
import { useLogin } from '@refinedev/core';

export const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const { mutate: login } = useLogin();
  const [formValues, setFormValues] = useState({ username: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(formValues);
    } catch (error: any) {
      console.error('Erro ao fazer login:', error?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = (formValues.username?.trim() || '') !== '' && (formValues.password?.trim() || '') !== '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
      <Card className="w-full max-w-md bg-white shadow-2xl rounded-2xl relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full opacity-10" />
        
        <CardHeader className="text-center pb-8">
          <div className="flex flex-col items-center mb-6">
            <img 
              src="/image.png" 
              alt="TrackMAX Gestão de Frotas"
              className="max-w-xs h-auto object-contain mb-6"
            />
          </div>
          
          <p className="text-muted-foreground text-base">
            Faça login para acessar o sistema
          </p>
        </CardHeader>
        
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-4 h-4" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Digite seu usuário"
                  value={formValues.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="pl-10 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-4 h-4" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={formValues.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="pl-10 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={!isFormValid || loading}
              className={`w-full h-12 text-base font-semibold ${
                isFormValid 
                  ? 'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 hover:from-blue-500 hover:via-blue-600 hover:to-blue-700 shadow-lg' 
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-xs text-muted-foreground">
              Sistema de Gerenciamento de Frota
            </p>
            <p className="text-center text-xs text-muted-foreground mt-1">
              API: /api
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import React from 'react';
import { ConnectionDebug } from '../components/ConnectionDebug';
import { WebSocketStatus } from '../components/WebSocketStatus';

export const DebugConnectionPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Debug de Conectividade</h1>
      
      <ConnectionDebug />
      
      <WebSocketStatus showEvents={true} />
      
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">Como usar esta página</h3>
        <div className="text-sm text-yellow-700 space-y-1">
          <p>1. <strong>Faça login</strong> primeiro para ter credenciais válidas</p>
          <p>2. <strong>Execute os testes</strong> para verificar conectividade</p>
          <p>3. <strong>Verifique o console</strong> para logs detalhados</p>
          <p>4. <strong>Compare resultados</strong> entre diferentes proxies</p>
        </div>
      </div>
    </div>
  );
};

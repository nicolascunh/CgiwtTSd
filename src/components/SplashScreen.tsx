import React from 'react';

interface SplashScreenProps {
  isVisible: boolean;
  message?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  isVisible, 
  message = "Carregando..."
}) => {
  // Debug: sempre mostrar se isVisible for true
  console.log('SplashScreen render:', { isVisible, message });

  if (!isVisible) {
    console.log('SplashScreen: not visible, returning null');
    return null;
  }

  // Criar um portal para garantir que a splash screen apareça por cima de tudo
  const splashElement = document.createElement('div');
  splashElement.id = 'trackmax-splash-screen';
  splashElement.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #ffffff !important;
      background-color: #ffffff !important;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      color: #333;
      font-family: Arial, sans-serif;
      opacity: 1;
      margin: 0;
      padding: 0;
      border: none;
      outline: none;
    ">
      <!-- Logo -->
      <div style="
        margin-bottom: 32px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      ">
        <img 
          src="/logo_trackmax_gestao.png" 
          alt="TrackMAX Gestão de Frotas" 
          style="
            height: 150px;
            width: auto;
          "
        />
      </div>

      <!-- Loading -->
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      ">
        <!-- Loading moderno com múltiplos pontos -->
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        ">
          <div style="
            width: 12px;
            height: 12px;
            background: #1890ff;
            border-radius: 50%;
            animation: bounce 1.4s ease-in-out infinite both;
            animation-delay: -0.32s;
          "></div>
          <div style="
            width: 12px;
            height: 12px;
            background: #1890ff;
            border-radius: 50%;
            animation: bounce 1.4s ease-in-out infinite both;
            animation-delay: -0.16s;
          "></div>
          <div style="
            width: 12px;
            height: 12px;
            background: #1890ff;
            border-radius: 50%;
            animation: bounce 1.4s ease-in-out infinite both;
            animation-delay: 0s;
          "></div>
        </div>
        
        <!-- Mensagem -->
        <div style="
          font-size: 16px;
          color: #666;
          text-align: center;
          font-weight: bold;
          min-height: 20px;
        ">
          ${message}
        </div>
      </div>
    </div>
    
    <style>
      @keyframes bounce {
        0%, 80%, 100% {
          transform: scale(0);
          opacity: 0.5;
        }
        40% {
          transform: scale(1);
          opacity: 1;
        }
      }
      
      /* Garantir que o fundo seja branco */
      body, html {
        background: #ffffff !important;
        background-color: #ffffff !important;
      }
      
      #trackmax-splash-screen {
        background: #ffffff !important;
        background-color: #ffffff !important;
      }
    </style>
  `;

  // Remover splash screen existente se houver
  const existingSplash = document.getElementById('trackmax-splash-screen');
  if (existingSplash) {
    existingSplash.remove();
  }

  // Adicionar ao body
  document.body.appendChild(splashElement);

  return null; // Não renderiza nada no React, usa DOM direto
};

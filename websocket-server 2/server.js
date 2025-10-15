const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { WebSocket } = require('ws');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configurar CORS
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Configurar Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configurações
const TRACCAR_WS_URL = process.env.TRACCAR_WS_URL || 'ws://35.230.168.225:8082/api/events';
const PORT = process.env.PORT || 3000;

// Armazenar conexão com Traccar
let traccarConnection = null;
let isTraccarConnected = false;

// Função para conectar ao Traccar
function connectToTraccar() {
  try {
    console.log('🔗 Conectando ao Traccar:', TRACCAR_WS_URL);
    
    traccarConnection = new WebSocket(TRACCAR_WS_URL);
    
    traccarConnection.on('open', () => {
      console.log('✅ Conectado ao Traccar WebSocket');
      isTraccarConnected = true;
      
      // Notificar todos os clientes sobre a conexão
      io.emit('traccar-status', { connected: true });
    });
    
    traccarConnection.on('message', (data) => {
      try {
        const event = JSON.parse(data.toString());
        console.log('📨 Evento recebido do Traccar:', event.type || 'unknown');
        
        // Retransmitir para todos os clientes conectados
        io.emit('traccar-event', event);
      } catch (error) {
        console.error('❌ Erro ao processar evento do Traccar:', error);
      }
    });
    
    traccarConnection.on('error', (error) => {
      console.error('❌ Erro na conexão Traccar:', error);
      isTraccarConnected = false;
      io.emit('traccar-status', { connected: false, error: error.message });
    });
    
    traccarConnection.on('close', () => {
      console.log('🔌 Conexão Traccar fechada');
      isTraccarConnected = false;
      io.emit('traccar-status', { connected: false });
      
      // Tentar reconectar após 5 segundos
      setTimeout(() => {
        console.log('🔄 Tentando reconectar ao Traccar...');
        connectToTraccar();
      }, 5000);
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar conexão Traccar:', error);
    isTraccarConnected = false;
  }
}

// Gerenciar conexões de clientes
io.on('connection', (socket) => {
  console.log('👤 Cliente conectado:', socket.id);
  
  // Enviar status atual da conexão Traccar
  socket.emit('traccar-status', { connected: isTraccarConnected });
  
  // Enviar eventos recentes (se houver)
  // TODO: Implementar cache de eventos recentes
  
  socket.on('disconnect', () => {
    console.log('👋 Cliente desconectado:', socket.id);
  });
  
  // Ping/pong para manter conexão viva
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    traccarConnected: isTraccarConnected,
    clients: io.engine.clientsCount,
    timestamp: new Date().toISOString()
  });
});

// Rota para obter status
app.get('/status', (req, res) => {
  res.json({
    traccarConnected: isTraccarConnected,
    clients: io.engine.clientsCount,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor WebSocket rodando na porta ${PORT}`);
  console.log(`📡 Conectando ao Traccar: ${TRACCAR_WS_URL}`);
  
  // Conectar ao Traccar
  connectToTraccar();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, fechando servidor...');
  
  if (traccarConnection) {
    traccarConnection.close();
  }
  
  server.close(() => {
    console.log('✅ Servidor fechado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT, fechando servidor...');
  
  if (traccarConnection) {
    traccarConnection.close();
  }
  
  server.close(() => {
    console.log('✅ Servidor fechado');
    process.exit(0);
  });
});

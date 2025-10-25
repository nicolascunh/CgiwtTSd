# Google Maps API Setup

## Configuração da Chave de API do Google Maps

Sua chave de API do Google Maps foi configurada com sucesso no projeto TrackMax:

**Chave de API:** `AIzaSyCVF12ojdhyhYoWiNWkoxXGsxBdajMufqA`

## Arquivos Configurados

### 1. Arquivo de Ambiente (`.env`)
```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyCVF12ojdhyhYoWiNWkoxXGsxBdajMufqA
```

### 2. Script do Google Maps (`index.html`)
O script do Google Maps foi adicionado ao HTML principal com as bibliotecas necessárias:
- `places` - Para autocomplete de endereços
- `geometry` - Para cálculos geométricos

### 3. Configuração da API (`src/config/api.ts`)
Arquivo centralizado com todas as configurações da API, incluindo:
- Chave da API
- Bibliotecas carregadas
- Configurações padrão do mapa
- Funções auxiliares

### 4. Hook personalizado (`src/hooks/useGoogleMaps.ts`)
Hook React que fornece:
- Verificação se o Google Maps está carregado
- Funções para criar mapas e marcadores
- Geocoding e reverse geocoding
- Cálculo de distâncias

### 5. Componente de exemplo (`src/components/GoogleMapsExample.tsx`)
Componente demonstrativo que mostra como usar a API do Google Maps.

## Como Usar

### 1. Usando o Hook
```typescript
import { useGoogleMaps } from '../hooks/useGoogleMaps';

const MyComponent = () => {
  const { isLoaded, createMap, geocodeAddress } = useGoogleMaps();
  
  if (!isLoaded) return <div>Carregando...</div>;
  
  // Usar as funções do Google Maps
};
```

### 2. Usando a Configuração
```typescript
import { API_CONFIG } from '../config/api';

const apiKey = API_CONFIG.GOOGLE_MAPS.API_KEY;
```

### 3. Acessando o Google Maps Globalmente
```typescript
// Verificar se está carregado
if (typeof window !== 'undefined' && window.google) {
  // Usar window.google.maps
}
```

## Funcionalidades Disponíveis

- ✅ Criação de mapas
- ✅ Adição de marcadores
- ✅ Geocoding (endereço → coordenadas)
- ✅ Reverse geocoding (coordenadas → endereço)
- ✅ Cálculo de distâncias
- ✅ Autocomplete de endereços
- ✅ Cálculos geométricos

## Próximos Passos

1. **Testar a integração** - Execute o projeto e verifique se o Google Maps carrega
2. **Implementar no mapa existente** - Integre com o componente `LiveMap.tsx` se necessário
3. **Adicionar funcionalidades** - Use as funções disponíveis para melhorar a experiência do usuário

## Notas Importantes

- A chave de API está configurada tanto no arquivo `.env` quanto diretamente no HTML
- O projeto usa Leaflet por padrão, mas agora também tem suporte ao Google Maps
- Todas as configurações estão centralizadas no arquivo `src/config/api.ts`
- O hook `useGoogleMaps` facilita o uso da API em componentes React

## Troubleshooting

Se o Google Maps não carregar:
1. Verifique se a chave de API está correta
2. Confirme se o domínio está autorizado no Google Cloud Console
3. Verifique o console do navegador para erros
4. Use o componente `GoogleMapsExample` para testar a integração



















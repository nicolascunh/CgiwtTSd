import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Space, Row, Col, Input, Statistic } from 'antd';
import { CarOutlined, SearchOutlined } from '@ant-design/icons';
import '../styles/responsive.css';

const { Title, Text } = Typography;

export const ResponsiveTestPage: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <div className="responsive-content">
      <Card className="responsive-card">
        <Title level={2} className="responsive-title">
          Teste de Responsividade
        </Title>
        
        <div className="responsive-spacing-md">
          <Text className="responsive-text">
            Tamanho da tela: {isMobile ? 'Mobile' : 'Desktop'} ({window.innerWidth}px)
          </Text>
        </div>

        {/* Teste de Grid Responsivo */}
        <div className="responsive-spacing-lg">
          <Title level={3} className="responsive-subtitle">
            Grid Responsivo
          </Title>
          
          <Row gutter={[isMobile ? 16 : 24, isMobile ? 16 : 24]}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card className="responsive-card">
                <Statistic
                  title="Total Veículos"
                  value={150}
                  prefix={<CarOutlined />}
                  valueStyle={{ fontSize: isMobile ? '20px' : '24px' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card className="responsive-card">
                <Statistic
                  title="Veículos Ativos"
                  value={120}
                  prefix={<CarOutlined />}
                  valueStyle={{ fontSize: isMobile ? '20px' : '24px' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card className="responsive-card">
                <Statistic
                  title="Veículos Inativos"
                  value={30}
                  prefix={<CarOutlined />}
                  valueStyle={{ fontSize: isMobile ? '20px' : '24px' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card className="responsive-card">
                <Statistic
                  title="Eficiência"
                  value={85}
                  suffix="%"
                  valueStyle={{ fontSize: isMobile ? '20px' : '24px' }}
                />
              </Card>
            </Col>
          </Row>
        </div>

        {/* Teste de Busca Responsiva */}
        <div className="responsive-spacing-lg">
          <Title level={3} className="responsive-subtitle">
            Busca Responsiva
          </Title>
          
          <div className="responsive-search-container">
            <Input
              placeholder="Buscar veículos..."
              prefix={<SearchOutlined />}
              className="responsive-search-bar"
              size={isMobile ? 'large' : 'middle'}
            />
          </div>
        </div>

        {/* Teste de Botões Responsivos */}
        <div className="responsive-spacing-lg">
          <Title level={3} className="responsive-subtitle">
            Botões Responsivos
          </Title>
          
          <div className="responsive-button-group">
            <Button type="primary" className="responsive-button">
              Botão Principal
            </Button>
            <Button className="responsive-button">
              Botão Secundário
            </Button>
            <Button type="dashed" className="responsive-button">
              Botão Tracejado
            </Button>
          </div>
        </div>

        {/* Teste de Cards Responsivos */}
        <div className="responsive-spacing-lg">
          <Title level={3} className="responsive-subtitle">
            Cards Responsivos
          </Title>
          
          <div className="responsive-device-list">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="responsive-device-card">
                <div className="responsive-device-header">
                  <Title level={5} style={{ margin: 0 }}>
                    Veículo {item}
                  </Title>
                  <Text type="secondary">ID: VH{item.toString().padStart(3, '0')}</Text>
                </div>
                <div className="responsive-device-details">
                  <Text className="responsive-small-text">Status: Online</Text>
                  <Text className="responsive-small-text">Última atualização: há 5 min</Text>
                  <Text className="responsive-small-text">Localização: São Paulo, SP</Text>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Teste de Estatísticas Responsivas */}
        <div className="responsive-spacing-lg">
          <Title level={3} className="responsive-subtitle">
            Estatísticas Responsivas
          </Title>
          
          <div className="responsive-stats">
            <div className="responsive-stat-card">
              <div className="responsive-stat-value">150</div>
              <div className="responsive-stat-label">Total Veículos</div>
            </div>
            <div className="responsive-stat-card">
              <div className="responsive-stat-value">120</div>
              <div className="responsive-stat-label">Ativos</div>
            </div>
            <div className="responsive-stat-card">
              <div className="responsive-stat-value">30</div>
              <div className="responsive-stat-label">Inativos</div>
            </div>
            <div className="responsive-stat-card">
              <div className="responsive-stat-value">85%</div>
              <div className="responsive-stat-label">Eficiência</div>
            </div>
          </div>
        </div>

        {/* Informações de Breakpoints */}
        <div className="responsive-spacing-lg">
          <Title level={3} className="responsive-subtitle">
            Breakpoints CSS
          </Title>
          
          <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px' }}>
            <Text className="responsive-text">
              <strong>Breakpoints definidos:</strong><br/>
              • Mobile: &lt; 768px<br/>
              • Tablet: 768px - 1023px<br/>
              • Desktop: 1024px - 1199px<br/>
              • Large: 1200px - 1439px<br/>
              • XL: &gt; 1440px
            </Text>
          </div>
        </div>

        <div className="responsive-spacing-lg">
          <Button 
            type="primary" 
            onClick={() => window.location.reload()}
            className="responsive-button"
          >
            Recarregar Página
          </Button>
        </div>
      </Card>
    </div>
  );
};















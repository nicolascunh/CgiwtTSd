import React from 'react';
import { Card, Skeleton, Row, Col } from 'antd';

interface CardLoadingSkeletonProps {
  title?: string;
  type?: 'performance' | 'events' | 'trips' | 'devices' | 'map';
  height?: string;
}

export const CardLoadingSkeleton: React.FC<CardLoadingSkeletonProps> = ({ 
  title = "Carregando...", 
  type = 'performance',
  height = '300px'
}) => {
  const renderSkeletonContent = () => {
    switch (type) {
      case 'performance':
        return (
          <div>
            {/* Primeira linha - Métricas de Tempo */}
            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
              <Col xs={24} sm={12} md={8}>
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <Skeleton.Avatar size={48} style={{ marginBottom: '8px' }} />
                  <Skeleton.Input size="small" style={{ width: '60px', marginBottom: '4px' }} />
                  <Skeleton.Input size="small" style={{ width: '80px' }} />
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <Skeleton.Avatar size={48} style={{ marginBottom: '8px' }} />
                  <Skeleton.Input size="small" style={{ width: '60px', marginBottom: '4px' }} />
                  <Skeleton.Input size="small" style={{ width: '80px' }} />
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <Skeleton.Avatar size={48} style={{ marginBottom: '8px' }} />
                  <Skeleton.Input size="small" style={{ width: '60px', marginBottom: '4px' }} />
                  <Skeleton.Input size="small" style={{ width: '80px' }} />
                </div>
              </Col>
            </Row>
            
            {/* Segunda linha - Métricas de Distância */}
            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
              <Col xs={24} sm={12} md={8}>
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <Skeleton.Avatar size={48} style={{ marginBottom: '8px' }} />
                  <Skeleton.Input size="small" style={{ width: '60px', marginBottom: '4px' }} />
                  <Skeleton.Input size="small" style={{ width: '80px' }} />
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <Skeleton.Avatar size={48} style={{ marginBottom: '8px' }} />
                  <Skeleton.Input size="small" style={{ width: '60px', marginBottom: '4px' }} />
                  <Skeleton.Input size="small" style={{ width: '80px' }} />
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <Skeleton.Avatar size={48} style={{ marginBottom: '8px' }} />
                  <Skeleton.Input size="small" style={{ width: '60px', marginBottom: '4px' }} />
                  <Skeleton.Input size="small" style={{ width: '80px' }} />
                </div>
              </Col>
            </Row>
            
            {/* Barra de progresso */}
            <div style={{ marginTop: '16px' }}>
              <Skeleton.Input size="small" style={{ width: '100px', marginBottom: '8px' }} />
              <Skeleton.Button size="small" style={{ width: '100%', height: '8px' }} />
            </div>
          </div>
        );
        
      case 'events':
        return (
          <div>
            {[...Array(5)].map((_, index) => (
              <div key={index} style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                <Skeleton.Avatar size={32} style={{ marginRight: '12px' }} />
                <div style={{ flex: 1 }}>
                  <Skeleton.Input size="small" style={{ width: '70%', marginBottom: '4px' }} />
                  <Skeleton.Input size="small" style={{ width: '50%' }} />
                </div>
              </div>
            ))}
          </div>
        );
        
      case 'trips':
        return (
          <div>
            {[...Array(3)].map((_, index) => (
              <div key={index} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #f0f0f0', borderRadius: '8px' }}>
                <Row gutter={[8, 8]}>
                  <Col span={8}>
                    <Skeleton.Input size="small" style={{ width: '100%' }} />
                  </Col>
                  <Col span={8}>
                    <Skeleton.Input size="small" style={{ width: '100%' }} />
                  </Col>
                  <Col span={8}>
                    <Skeleton.Input size="small" style={{ width: '100%' }} />
                  </Col>
                </Row>
              </div>
            ))}
          </div>
        );
        
      case 'devices':
        return (
          <div>
            {[...Array(4)].map((_, index) => (
              <div key={index} style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                <Skeleton.Avatar size={40} style={{ marginRight: '12px' }} />
                <div style={{ flex: 1 }}>
                  <Skeleton.Input size="small" style={{ width: '60%', marginBottom: '4px' }} />
                  <Skeleton.Input size="small" style={{ width: '40%' }} />
                </div>
                <Skeleton.Button size="small" style={{ width: '60px' }} />
              </div>
            ))}
          </div>
        );
        
      case 'map':
        return (
          <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <Skeleton.Avatar size={64} style={{ marginBottom: '16px' }} />
              <Skeleton.Input size="small" style={{ width: '120px' }} />
            </div>
          </div>
        );
        
      default:
        return <Skeleton active />;
    }
  };

  return (
    <Card
      title={title}
      className="dashboard-card theme-card"
      style={{ 
        height: height,
        display: 'flex',
        flexDirection: 'column',
        opacity: 0.8,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        border: '1px solid rgba(255,255,255,0.2)',
        backdropFilter: 'blur(10px)',
        animation: 'pulse 2s ease-in-out infinite'
      }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {renderSkeletonContent()}
      </div>
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.8; }
          50% { opacity: 0.6; }
          100% { opacity: 0.8; }
        }
      `}</style>
    </Card>
  );
};

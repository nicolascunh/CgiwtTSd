import React from 'react';
import { Skeleton } from 'antd';

interface ValueSkeletonProps {
  size?: 'small' | 'default' | 'large';
  width?: string | number;
  style?: React.CSSProperties;
}

export const ValueSkeleton: React.FC<ValueSkeletonProps> = ({ 
  size = 'default',
  width = '60px',
  style = {}
}) => {
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { height: '20px', fontSize: '14px' };
      case 'large':
        return { height: '32px', fontSize: '24px' };
      default:
        return { height: '24px', fontSize: '18px' };
    }
  };

  const sizeConfig = getSizeConfig();

  return (
    <Skeleton.Input
      active
      size="small"
      style={{
        width,
        height: sizeConfig.height,
        ...style
      }}
    />
  );
};

// Componente específico para valores de estatísticas
export const StatisticValueSkeleton: React.FC<{ size?: 'small' | 'default' | 'large' }> = ({ 
  size = 'default' 
}) => {
  const getWidth = () => {
    switch (size) {
      case 'small':
        return '40px';
      case 'large':
        return '80px';
      default:
        return '60px';
    }
  };

  return (
    <ValueSkeleton 
      size={size}
      width={getWidth()}
      style={{
        marginBottom: '4px',
        borderRadius: '4px'
      }}
    />
  );
};

// Componente que renderiza valor ou skeleton
export const StatisticValue: React.FC<{ 
  value: number | string | null; 
  loading: boolean; 
  size?: 'small' | 'default' | 'large';
}> = ({ value, loading, size = 'default' }) => {
  if (loading) {
    return <StatisticValueSkeleton size={size} />;
  }
  return <span>{value}</span>;
};

// Componente para badges/contadores
export const BadgeValueSkeleton: React.FC = () => {
  return (
    <Skeleton.Avatar
      size="small"
      style={{
        width: '24px',
        height: '24px',
        borderRadius: '12px'
      }}
    />
  );
};

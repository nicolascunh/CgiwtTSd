import React, { useEffect, useState } from 'react';
import { Card, Typography, Button, Space } from 'antd';
import { useNavigate } from 'react-router';

const { Title, Text } = Typography;

export const DebugPage: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<string>('Checking...');
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const credentials = localStorage.getItem('auth-credentials');
      const user = localStorage.getItem('auth-user');
      
      if (credentials && user) {
        setAuthStatus(`Authenticated as: ${user}`);
      } else {
        setAuthStatus('Not authenticated');
      }
    };

    checkAuth();
  }, []);

  const clearAuth = () => {
    localStorage.removeItem('auth-credentials');
    localStorage.removeItem('auth-user');
    setAuthStatus('Auth cleared');
  };

  const goToDashboard = () => {
    navigate('/');
  };

  return (
    <Card style={{ margin: '20px' }}>
      <Title level={2}>Debug Page</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Text strong>Authentication Status: </Text>
          <Text>{authStatus}</Text>
        </div>

        <div>
          <Text strong>LocalStorage Contents:</Text>
          <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
            {JSON.stringify({
              'auth-credentials': localStorage.getItem('auth-credentials') ? '***' : null,
              'auth-user': localStorage.getItem('auth-user'),
            }, null, 2)}
          </pre>
        </div>

        <Space>
          <Button type="primary" onClick={goToDashboard}>
            Go to Dashboard
          </Button>
          <Button onClick={clearAuth}>
            Clear Auth
          </Button>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </Space>
      </Space>
    </Card>
  );
};

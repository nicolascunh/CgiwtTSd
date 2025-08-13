import React, { useState } from 'react';
import { Card, Button, Input, Form, message, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, CarOutlined } from '@ant-design/icons';
import { useLogin } from '@refinedev/core';

const { Title, Text } = Typography;

export const TestAuthPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { mutate: login } = useLogin();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    
    try {
      console.log('Attempting login with:', values.username);
      
      // Usar o hook do Refine para login
      await login(values);
      
      console.log('Login successful via Refine hook');
      message.success('Login realizado com sucesso!');
      
      // O redirecionamento será feito automaticamente pelo Refine
      
    } catch (error: any) {
      console.log('Login error:', error);
      message.error(error?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
    }}>
      <div style={{ 
        background: 'white', 
        padding: '48px', 
        borderRadius: '16px', 
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        width: '100%',
        maxWidth: '420px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '100px',
          height: '100px',
          background: 'linear-gradient(45deg, #722ed1, #1890ff)',
          borderRadius: '50%',
          opacity: 0.1
        }} />
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #722ed1, #1890ff)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 8px 24px rgba(114, 46, 209, 0.3)'
          }}>
            <CarOutlined style={{ fontSize: '32px', color: 'white' }} />
          </div>
          
          <Title level={2} style={{ margin: 0, color: '#1a1a2e', fontWeight: 'bold' }}>
            Teste de Autenticação
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Teste o login com suas credenciais do servidor
          </Text>
        </div>

        <Form
          form={form}
          name="test-auth"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            label="Usuário"
            rules={[{ required: true, message: 'Por favor, informe seu usuário!' }]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: '#722ed1' }} />} 
              placeholder="Digite seu usuário"
              style={{ 
                borderRadius: '8px',
                height: '48px',
                fontSize: '16px'
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Senha"
            rules={[{ required: true, message: 'Por favor, informe sua senha!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: '#722ed1' }} />} 
              placeholder="Digite sua senha"
              style={{ 
                borderRadius: '8px',
                height: '48px',
                fontSize: '16px'
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: '24px' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ 
                width: '100%',
                height: '48px',
                background: 'linear-gradient(135deg, #722ed1, #1890ff)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(114, 46, 209, 0.3)'
              }}
            >
              {loading ? 'Testando...' : 'Testar Login'}
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '24px 0' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Teste de Conexão com API
          </Text>
        </Divider>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            API: http://35.230.168.225:8082/api/session
          </Text>
        </div>
      </div>
    </div>
  );
};

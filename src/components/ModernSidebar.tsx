import React from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetTrigger 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  CarOutlined, 
  UserOutlined, 
  SettingOutlined,
  DashboardOutlined,
  LogoutOutlined,
  TeamOutlined,
  FileTextOutlined,
  BarChartOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router';
import { useLogout } from '@refinedev/core';
import { useLanguage } from '../contexts/LanguageContext';

interface ModernSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isMobile: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const ModernSidebar: React.FC<ModernSidebarProps> = ({
  isOpen,
  onOpenChange,
  isMobile,
  collapsed,
  onToggleCollapse,
  activeTab,
  onTabChange
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate: logout } = useLogout();
  const { t } = useLanguage();

  const menuItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: <DashboardOutlined className="h-5 w-5" />,
      path: '/dashboard'
    },
    {
      key: 'devices',
      label: 'Dispositivos',
      icon: <CarOutlined className="h-5 w-5" />,
      path: '/devices'
    },
    {
      key: 'drivers',
      label: 'Motoristas',
      icon: <UserOutlined className="h-5 w-5" />,
      path: '/drivers'
    },
    {
      key: 'reports',
      label: 'Relatórios',
      icon: <FileTextOutlined className="h-5 w-5" />,
      path: '/reports'
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: <BarChartOutlined className="h-5 w-5" />,
      path: '/analytics'
    },
    {
      key: 'team',
      label: 'Equipe',
      icon: <TeamOutlined className="h-5 w-5" />,
      path: '/team'
    },
    {
      key: 'settings',
      label: 'Configurações',
      icon: <SettingOutlined className="h-5 w-5" />,
      path: '/settings'
    }
  ];

  const handleLogout = () => {
    logout();
  };

  const handleNavigation = (path: string, tab: string) => {
    console.log('🚀 Navegando para:', path, 'tab:', tab);
    navigate(path);
    onTabChange(tab);
    if (isMobile) {
      onOpenChange(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/image.png" 
              alt="TrackMAX"
              className="h-10 w-10 rounded-lg"
            />
            {!collapsed && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900">TrackMAX</h2>
                <p className="text-xs text-slate-500">Gestão de Frota</p>
              </div>
            )}
          </div>
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-8 w-8 p-0"
            >
              {collapsed ? <MenuOutlined /> : <MenuOutlined />}
            </Button>
          )}
        </div>
      </div>


      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.key}
              variant={activeTab === item.key ? "default" : "ghost"}
              className={`w-full justify-start h-12 px-4 ${
                activeTab === item.key 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              onClick={() => handleNavigation(item.path, item.key)}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                {!collapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </div>
            </Button>
          ))}
        </nav>
      </div>

      {/* Footer com Usuário e Logout */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="space-y-3">
          {/* User Profile e Logout */}
          <div className="space-y-2">
            {/* User Profile - Sem Card */}
            <div className="flex items-center gap-3 px-3 py-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/user-avatar.jpg" alt="User" />
                <AvatarFallback className="bg-blue-500 text-white text-xs font-semibold">
                  U
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    Usuário Logado
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    usuario@trackmax.com
                  </p>
                </div>
              )}
              {/* Botão Sair no lugar do Online */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogoutOutlined className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-80 p-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop sidebar
  return (
    <div 
      className={`bg-white border-r border-slate-200 shadow-xl transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-80'
      }`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: collapsed ? '80px' : '320px',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 1000,
        transform: 'translateZ(0)'
      }}
    >
      {sidebarContent}
    </div>
  );
};


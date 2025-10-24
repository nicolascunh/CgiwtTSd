import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip } from 'antd';
import { 
  CarOutlined, 
  UserOutlined, 
  SettingOutlined,
  DashboardOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { useLogout, useGetIdentity } from '@refinedev/core';

interface ShadcnSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const menuItems = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: DashboardOutlined,
    path: '/dashboard'
  },
  {
    key: 'drivers',
    label: 'Motoristas',
    icon: UserOutlined,
    path: '/drivers'
  },
  {
    key: 'maintenances',
    label: 'Manutenções',
    icon: CarOutlined,
    path: '/maintenances'
  },
  {
    key: 'tires',
    label: 'Controle de Pneus',
    icon: SyncOutlined,
    path: '/tires'
  },
  {
    key: 'settings',
    label: 'Configurações',
    icon: SettingOutlined,
    path: '/settings'
  }
];

export const ShadcnSidebar: React.FC<ShadcnSidebarProps> = ({
  collapsed,
  onToggleCollapse,
  activeTab,
  onTabChange,
  onLogout
}) => {
  const navigate = useNavigate();
  const { data: identity } = useGetIdentity<{ id: string; name?: string; username?: string; email?: string }>();

  const handleNavigation = (path: string, key: string) => {
    navigate(path);
    onTabChange(key);
  };

  // Obter username do usuário
  const username = identity?.email || identity?.username || 'usuario@trackmax.com';
  
  // Obter iniciais do usuário para o avatar
  const getUserInitials = () => {
    if (identity?.name) {
      const names = identity.name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return identity.name.substring(0, 2).toUpperCase();
    }
    if (identity?.username) {
      return identity.username.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex h-16 items-center border-b px-4",
        collapsed ? "flex-col justify-center gap-2" : "justify-between"
      )}>
        {collapsed ? (
          /* Collapsed state - Stack vertically and center */
          <>
            <img 
              src="/image.png" 
              alt="TrackMAX"
              className="h-8 w-8 rounded-lg"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="h-6 w-6 p-0"
            >
              <MenuUnfoldOutlined className="h-3 w-3" />
            </Button>
          </>
        ) : (
          /* Expanded state - Horizontal layout */
          <>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <img 
                src="/image.png" 
                alt="TrackMAX"
                className="h-8 w-8 rounded-lg shrink-0"
              />
              <span className="font-semibold truncate">TrackMAX</span>
            </div>
            
            {/* Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="h-8 w-8 shrink-0"
            >
              <MenuFoldOutlined className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            const isInDevelopment = item.key === 'drivers' || item.key === 'maintenances' || item.key === 'tires';
            
            const button = (
              <Button
                key={item.key}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "justify-start gap-2",
                  collapsed ? "px-2" : "px-3",
                  isActive && "bg-secondary font-medium",
                  isInDevelopment && "cursor-not-allowed opacity-70"
                )}
                onClick={() => {
                  // Não navega se estiver em desenvolvimento
                  if (!isInDevelopment) {
                    handleNavigation(item.path, item.key);
                  }
                }}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Button>
            );

            // Wrap com tooltip se estiver em desenvolvimento
            if (isInDevelopment) {
              return (
                <Tooltip 
                  key={item.key}
                  title="🚧 Em desenvolvimento" 
                  placement="right"
                  mouseEnterDelay={0.3}
                  arrow
                >
                  {button}
                </Tooltip>
              );
            }
            
            return button;
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        {collapsed ? (
          /* Collapsed state - Stack vertically */
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              title="Sair"
            >
              <LogoutOutlined className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          /* Expanded state - Centralizado sem card */
          <>
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 overflow-hidden min-w-0 text-center">
                <p className="text-sm font-medium leading-none truncate">
                  {username}
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="h-8 w-8 p-0 shrink-0 text-destructive hover:text-destructive"
              >
                <LogoutOutlined className="h-4 w-4" />
              </Button>
            </div>

            {/* Version */}
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Versão 1.0.0
            </p>
          </>
        )}
      </div>
    </div>
  );
};


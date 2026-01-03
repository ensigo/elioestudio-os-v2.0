import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Briefcase, 
  CheckSquare, 
  Users, 
  BarChart3,
  FileText, 
  Settings, 
  LifeBuoy,
  X,
  Building2,
  MessageSquare,
  Megaphone,
  Mail,
  Server,
  BarChart3,
  FileText
} from 'lucide-react';
import { NavItem, UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onNavigate, isOpen, onClose, userRole = 'DEV' }) => {
  const currentRole = userRole as UserRole;
  const isAdminOrSuper = currentRole === 'ADMIN' || currentRole === 'SUPERADMIN';

  // Definición de ítems de navegación
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clientes', label: 'Clientes', icon: Building2 },
    { id: 'proyectos', label: 'Proyectos', icon: Briefcase },
    { id: 'tareas', label: 'Tareas', icon: CheckSquare },
    { id: 'calendario', label: 'Calendario', icon: Calendar },
    { id: 'equipo', label: 'Mi Equipo', icon: Users },
    { id: 'reportes', label: 'Reportes', icon: BarChart3,
  FileText, roles: ['ADMIN', 'SUPERADMIN'] },
    { id: 'tickets', label: 'Tickets', icon: MessageSquare },
    { id: 'sem', label: 'SEM Ads', icon: Megaphone },
    { id: 'mailing', label: 'E-mail Marketing', icon: Mail },
    { id: 'hosting', label: 'Hosting y Dominios', icon: Server },
    { id: 'analisis', label: 'Análisis', icon: BarChart3,
  FileText },
    { id: 'contratos', label: 'Contratos', icon: FileText },
    
    // Items inferiores
    { id: 'configuracion', label: 'Configuración', icon: Settings, roles: ['ADMIN', 'SUPERADMIN'], isBottom: true },
    { id: 'soporte', label: 'Soporte', icon: LifeBuoy, isBottom: true },
  ];

  const filteredItems = navItems.filter(item => 
    !item.roles || item.roles.includes(currentRole)
  );

  const mainItems = filteredItems.filter(i => !i.isBottom);
  const bottomItems = filteredItems.filter(i => i.isBottom);

  const NavButton: React.FC<{ item: NavItem }> = ({ item }) => {
    const isActive = activeTab === item.id;
    return (
      <button
        onClick={() => {
          onNavigate(item.id);
          if (window.innerWidth < 1024) onClose();
        }}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group mb-1 ${
          isActive 
            ? 'bg-elio-yellow text-white shadow-md shadow-elio-yellow/20' 
            : 'text-elio-steel hover:bg-gray-100 hover:text-elio-black'
        }`}
      >
        <item.icon 
          size={18} 
          className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-elio-black'} 
        />
        <span className="font-medium text-sm">{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-40 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-gray-100">
          <img 
            src="/images/logo_elio_horizontal.png" 
            alt="ElioEstudio" 
            className="h-10"
          />

          {/* Botón Cerrar (Solo Móvil) */}
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-elio-black">
            <X size={20} />
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto sidebar-scroll">
          <div className="space-y-1">
            {mainItems.map(item => (
              <NavButton key={item.id} item={item} />
            ))}
          </div>
        </nav>

        {/* Footer / Bottom Items */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="space-y-1">
            {bottomItems.map(item => (
              <NavButton key={item.id} item={item} />
            ))}
          </div>
        </div>
      </aside>
    </>
  );
};
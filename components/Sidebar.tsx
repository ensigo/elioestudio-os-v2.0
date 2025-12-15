import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Briefcase, 
  CheckSquare, 
  Users, 
  BarChart3, 
  Settings, 
  LifeBuoy,
  LogOut,
  X,
  Building2,
  MessageSquare,
  Megaphone,
  Mail
} from 'lucide-react';
import { NavItem, UserRole } from '../types';
import { CURRENT_USER_ROLE } from '../constants';

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onNavigate, isOpen, onClose }) => {
  const userRole = CURRENT_USER_ROLE.role as UserRole;

  // Definición de ítems de navegación
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clientes', label: 'Clientes', icon: Building2 },
    { id: 'proyectos', label: 'Proyectos', icon: Briefcase },
    { id: 'tareas', label: 'Tareas', icon: CheckSquare },
    { id: 'calendario', label: 'Calendario', icon: Calendar },
    { id: 'equipo', label: 'Mi Equipo', icon: Users },
    { id: 'reportes', label: 'Reportes', icon: BarChart3 },
    { id: 'tickets', label: 'Tickets', icon: MessageSquare },
    { id: 'sem', label: 'SEM Ads', icon: Megaphone },
    { id: 'mailing', label: 'E-mail Marketing', icon: Mail },
    
    // Items inferiores
    { id: 'configuracion', label: 'Configuración', icon: Settings, roles: ['ADMIN'], isBottom: true },
    { id: 'soporte', label: 'Soporte', icon: LifeBuoy, isBottom: true },
  ];

  const filteredItems = navItems.filter(item => 
    !item.roles || item.roles.includes(userRole)
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
          
          {/* LOGO ELIOESTUDIO - VISTA CORREGIDA Y AMPLIADA */}
          <svg 
            width="190" 
            height="45" 
            viewBox="0 0 650 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="mt-2"
          >
            {/* GRUPO GRIS (Izquierda) */}
            <rect x="0" y="10" width="100" height="28" fill="#9CA3AF" />   {/* Barra Superior Gris */}
            <rect x="50" y="44" width="50" height="20" fill="#9CA3AF" />   {/* Barra Media Gris */}
            <rect x="0" y="70" width="100" height="28" fill="#9CA3AF" />   {/* Barra Inferior Gris */}
            
            {/* GRUPO NEGRO (Derecha - Formando la E) */}
            <rect x="115" y="10" width="100" height="28" fill="#1F2937" /> {/* Barra Superior Negra */}
            <rect x="115" y="44" width="60" height="20" fill="#1F2937" />  {/* Barra Media Negra */}
            <rect x="115" y="70" width="100" height="28" fill="#1F2937" /> {/* Barra Inferior Negra */}

            {/* TEXTO COMPLETO */}
            <text 
              x="240" 
              y="78" 
              fill="#1F2937" 
              style={{ font: 'normal 400 65px Montserrat, sans-serif', letterSpacing: '4px' }}
            >
              ELIO<tspan style={{ fontWeight: 300 }}>ESTUDIO</tspan>
            </text>
          </svg>

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
          <div className="space-y-1 mb-4">
            {bottomItems.map(item => (
              <NavButton key={item.id} item={item} />
            ))}
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 px-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-elio-yellow/10 flex items-center justify-center text-elio-yellow font-bold text-xs">
                {CURRENT_USER_ROLE.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-elio-black truncate">{CURRENT_USER_ROLE.name}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{CURRENT_USER_ROLE.role}</p>
              </div>
            </div>
            <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
              <LogOut size={14} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
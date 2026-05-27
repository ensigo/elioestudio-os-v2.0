import React from 'react';
import {
  LayoutDashboard, Calendar, Briefcase, CheckSquare, Users, BarChart3,
  FileText, Settings, LifeBuoy, X, Building2, MessageSquare,
  Megaphone, Mail, Server, TrendingUp
} from 'lucide-react';
import { NavItem, UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

interface NavGroup {
  label?: string;
  roles?: UserRole[];
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onNavigate, isOpen, onClose, userRole = 'DEV' }) => {
  const currentRole = userRole as UserRole;

  const allGroups: NavGroup[] = [
    {
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      label: 'Trabajo',
      items: [
        { id: 'clientes',   label: 'Clientes',    icon: Building2 },
        { id: 'proyectos',  label: 'Proyectos',   icon: Briefcase },
        { id: 'tareas',     label: 'Tareas',      icon: CheckSquare },
        { id: 'calendario', label: 'Calendario',  icon: Calendar },
        { id: 'equipo',     label: 'Mi Equipo',   icon: Users },
        { id: 'tickets',    label: 'Tickets',     icon: MessageSquare },
      ]
    },
    {
      label: 'Marketing',
      items: [
        { id: 'sem',     label: 'SEM Ads',          icon: Megaphone },
        { id: 'mailing', label: 'E-mail Marketing', icon: Mail },
      ]
    },
    {
      label: 'Gestión',
      roles: ['ADMIN', 'SUPERADMIN'] as UserRole[],
      items: [
        { id: 'reportes',  label: 'Reportes',          icon: BarChart3,   roles: ['ADMIN', 'SUPERADMIN'] as UserRole[] },
        { id: 'hosting',   label: 'Hosting y Dominios',icon: Server,      roles: ['ADMIN', 'SUPERADMIN'] as UserRole[] },
        { id: 'analisis',  label: 'Análisis',          icon: TrendingUp,  roles: ['ADMIN', 'SUPERADMIN'] as UserRole[] },
        { id: 'contratos', label: 'Contratos',         icon: FileText,    roles: ['ADMIN', 'SUPERADMIN'] as UserRole[] },
      ]
    },
  ];

  const bottomItems: NavItem[] = [
    { id: 'configuracion', label: 'Configuración', icon: Settings, roles: ['ADMIN', 'SUPERADMIN'] as UserRole[], isBottom: true },
    { id: 'soporte',       label: 'Soporte',       icon: LifeBuoy,  isBottom: true },
  ];

  const canSee = (item: NavItem | { roles?: UserRole[] }) =>
    !item.roles || item.roles.includes(currentRole);

  const NavButton: React.FC<{ item: NavItem }> = ({ item }) => {
    const isActive = activeTab === item.id;
    return (
      <button
        onClick={() => {
          onNavigate(item.id);
          if (window.innerWidth < 1024) onClose();
        }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
          isActive
            ? 'bg-elio-yellow text-white shadow-sm shadow-elio-yellow/20'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <item.icon
          size={17}
          className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700 transition-colors'}
        />
        <span className={`font-medium text-sm ${isActive ? 'text-white' : ''}`}>{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 flex flex-col z-40
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 flex-shrink-0">
          <img src="/images/logo_elio_horizontal.png" alt="ElioEstudio" className="h-9" />
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto sidebar-scroll space-y-1">
          {allGroups.map((group, gi) => {
            if (!canSee(group as any)) return null;
            const visibleItems = group.items.filter(canSee);
            if (visibleItems.length === 0) return null;
            return (
              <div key={gi} className={gi > 0 ? 'pt-3' : ''}>
                {group.label && (
                  <p className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {group.label}
                  </p>
                )}
                {visibleItems.map(item => (
                  <NavButton key={item.id} item={item} />
                ))}
              </div>
            );
          })}
        </nav>

        {/* Bottom items */}
        <div className="p-3 border-t border-gray-100 bg-slate-50/60 space-y-0.5 flex-shrink-0">
          {bottomItems.filter(canSee).map(item => (
            <NavButton key={item.id} item={item} />
          ))}
        </div>
      </aside>
    </>
  );
};

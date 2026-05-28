import { useState, useRef, useEffect } from 'react';
import { authFetch } from '../lib/auth-fetch';
import {
  Search, Plus, Menu, LogOut, User, Key, X, Check, AlertCircle,
  Building2, Briefcase, CheckSquare, MessageSquare, Loader2
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { TicketModal } from './TicketModal';

interface Usuario {
  id: string;
  name: string;
  email: string;
  role: string;
  position: string | null;
  avatarUrl: string | null;
}

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard', clientes: 'Clientes', proyectos: 'Proyectos',
  tareas: 'Tareas', calendario: 'Calendario', equipo: 'Mi Equipo',
  reportes: 'Reportes', tickets: 'Tickets', sem: 'SEM Ads',
  mailing: 'E-mail Marketing', hosting: 'Hosting y Dominios',
  analisis: 'Análisis', contratos: 'Contratos',
  configuracion: 'Configuración', soporte: 'Soporte',
};

interface HeaderProps {
  usuario?: Usuario | null;
  onLogout?: () => void;
  onNavigate?: (page: string) => void;
  onMenuClick?: () => void;
  currentPage?: string;
}

interface SearchResult {
  id: string;
  label: string;
  sub?: string;
  type: 'cliente' | 'proyecto' | 'tarea' | 'ticket';
  page: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export const Header: React.FC<HeaderProps> = ({ usuario, onLogout, onNavigate, onMenuClick, currentPage = 'dashboard' }) => {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchFocusedIdx, setSearchFocusedIdx] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(searchQuery, 280);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  // Global search
  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    const q = debouncedQuery.toLowerCase();

    const run = async () => {
      setIsSearching(true);
      try {
        const [cliRes, proyRes, tarRes, tickRes] = await Promise.all([
          authFetch('/api/clientes'),
          authFetch('/api/proyectos'),
          authFetch('/api/tareas'),
          authFetch('/api/tickets'),
        ]);
        const [clientes, proyectos, tareas, tickets] = await Promise.all([
          cliRes.ok ? cliRes.json() : [],
          proyRes.ok ? proyRes.json() : [],
          tarRes.ok ? tarRes.json() : [],
          tickRes.ok ? tickRes.json() : [],
        ]);

        const results: SearchResult[] = [];

        (Array.isArray(clientes) ? clientes : [])
          .filter((c: any) => c.name?.toLowerCase().includes(q))
          .slice(0, 3)
          .forEach((c: any) => results.push({ id: c.id, label: c.name, sub: c.email || '', type: 'cliente', page: 'clientes' }));

        (Array.isArray(proyectos) ? proyectos : [])
          .filter((p: any) => p.title?.toLowerCase().includes(q))
          .slice(0, 3)
          .forEach((p: any) => results.push({ id: p.id, label: p.title, sub: p.cliente?.name || '', type: 'proyecto', page: 'proyectos' }));

        (Array.isArray(tareas) ? tareas : [])
          .filter((t: any) => t.title?.toLowerCase().includes(q))
          .slice(0, 4)
          .forEach((t: any) => results.push({ id: t.id, label: t.title, sub: t.proyecto?.title || '', type: 'tarea', page: 'tareas' }));

        (Array.isArray(tickets) ? tickets : [])
          .filter((t: any) => t.title?.toLowerCase().includes(q))
          .slice(0, 2)
          .forEach((t: any) => results.push({ id: t.id, label: t.title, sub: `#${t.id.slice(-6).toUpperCase()}`, type: 'ticket', page: 'tickets' }));

        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };
    run();
  }, [debouncedQuery]);

  // Close search on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsSearchOpen(false);
      setSearchQuery('');
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchFocusedIdx(i => Math.min(i + 1, searchResults.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchFocusedIdx(i => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && searchFocusedIdx >= 0) {
      const r = searchResults[searchFocusedIdx];
      if (r) navigateToResult(r);
    }
  };

  const navigateToResult = (r: SearchResult) => {
    onNavigate?.(r.page);
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchFocusedIdx(-1);
  };

  const TYPE_ICONS: Record<string, React.ReactNode> = {
    cliente: <Building2 size={13} className="text-blue-500" />,
    proyecto: <Briefcase size={13} className="text-purple-500" />,
    tarea: <CheckSquare size={13} className="text-green-500" />,
    ticket: <MessageSquare size={13} className="text-orange-500" />,
  };
  const TYPE_LABELS: Record<string, string> = {
    cliente: 'Cliente', proyecto: 'Proyecto', tarea: 'Tarea', ticket: 'Ticket'
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setIsChangingPassword(true);
    try {
      const response = await authFetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change-password',
          userId: usuario?.id,
          password: currentPassword,
          newPassword
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setPasswordError(data.error || 'Error al cambiar contraseña');
      } else {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => { setIsPasswordModalOpen(false); setPasswordSuccess(false); }, 2000);
      }
    } catch {
      setPasswordError('Error de conexión');
    }
    setIsChangingPassword(false);
  };

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess(false);
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20 shadow-sm">

        {/* Left: page title / mobile toggle */}
        <div className="flex items-center gap-4">
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors" onClick={onMenuClick}>
            <Menu size={22} className="text-gray-500" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 hidden md:block">
            {PAGE_TITLES[currentPage] || 'Dashboard'}
          </h1>
          <span className="lg:hidden font-bold text-lg text-gray-900">ElioOS</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">

          {/* Búsqueda global */}
          <div ref={searchRef} className="relative hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 animate-spin" size={14} />
              )}
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar tareas, clientes, proyectos..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setIsSearchOpen(true); setSearchFocusedIdx(-1); }}
                onFocus={() => setIsSearchOpen(true)}
                onKeyDown={handleSearchKeyDown}
                className="w-72 pl-9 pr-4 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-elio-yellow rounded-lg text-sm outline-none transition-all placeholder-gray-400"
              />
            </div>

            {/* Resultados dropdown */}
            {isSearchOpen && searchQuery.length >= 2 && (
              <div className="absolute top-full mt-1.5 left-0 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                {searchResults.length === 0 && !isSearching ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-gray-400">Sin resultados para &ldquo;{searchQuery}&rdquo;</p>
                  </div>
                ) : (
                  <ul>
                    {searchResults.map((r, i) => (
                      <li key={r.id}>
                        <button
                          onMouseEnter={() => setSearchFocusedIdx(i)}
                          onClick={() => navigateToResult(r)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            i === searchFocusedIdx ? 'bg-gray-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gray-100 rounded-md">
                            {TYPE_ICONS[r.type]}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{r.label}</p>
                            {r.sub && <p className="text-xs text-gray-400 truncate">{r.sub}</p>}
                          </div>
                          <span className="flex-shrink-0 text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                            {TYPE_LABELS[r.type]}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-2 text-[10px] text-gray-400">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px]">↑↓</kbd> navegar
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] ml-1">Enter</kbd> abrir
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] ml-1">Esc</kbd> cerrar
                </div>
              </div>
            )}
          </div>

          {/* Nuevo Ticket */}
          <button
            onClick={() => setIsTicketModalOpen(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-all font-medium text-sm shadow-sm"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Nuevo Ticket</span>
          </button>

          <div className="h-5 w-px bg-gray-200 hidden sm:block" />

          <NotificationBell onNavigate={onNavigate} />

          {/* Perfil */}
          <div className="relative">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            >
              <div className="h-9 w-9 rounded-full bg-elio-yellow text-white flex items-center justify-center font-bold text-sm border-2 border-yellow-400/50 shadow-sm hover:shadow-md transition-shadow">
                {usuario ? getInitials(usuario.name) : 'U'}
              </div>
              <div className="hidden lg:flex flex-col items-start">
                <span className="text-xs font-bold text-gray-900 leading-none">
                  {usuario?.name?.split(' ')[0] || 'Usuario'}
                </span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  {usuario?.role || 'GUEST'}
                </span>
              </div>
            </div>

            {isProfileMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsProfileMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-40">
                  <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                    <p className="font-bold text-sm text-gray-900 truncate">{usuario?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{usuario?.email}</p>
                  </div>
                  <button
                    onClick={() => { setIsProfileMenuOpen(false); setIsProfileModalOpen(true); }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                  >
                    <User size={14} className="text-gray-400" /> Mi Perfil
                  </button>
                  <button
                    onClick={() => { setIsProfileMenuOpen(false); setIsPasswordModalOpen(true); }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                  >
                    <Key size={14} className="text-gray-400" /> Cambiar Contraseña
                  </button>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={() => { setIsProfileMenuOpen(false); onLogout?.(); }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                    >
                      <LogOut size={14} /> Cerrar Sesión
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <TicketModal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} />

      {/* Modal Mi Perfil */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900">Mi Perfil</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-elio-yellow text-white flex items-center justify-center font-bold text-2xl shadow-md">
                  {usuario ? getInitials(usuario.name) : 'U'}
                </div>
                <div>
                  <h4 className="font-bold text-xl text-gray-900">{usuario?.name}</h4>
                  <p className="text-gray-500 text-sm">{usuario?.email}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Rol</span>
                  <span className="text-sm font-semibold text-gray-900">{usuario?.role}</span>
                </div>
                {usuario?.position && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Cargo</span>
                    <span className="text-sm font-semibold text-gray-900">{usuario.position}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button onClick={() => setIsProfileModalOpen(false)} className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cambiar Contraseña */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900">Cambiar Contraseña</h3>
              <button onClick={closePasswordModal} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3 bg-green-50 border border-green-100 rounded-xl flex items-center gap-2 text-green-700 text-sm">
                  <Check size={15} /> ¡Contraseña actualizada correctamente!
                </div>
              )}
              {[
                { label: 'Contraseña Actual', value: currentPassword, onChange: setCurrentPassword },
                { label: 'Nueva Contraseña', value: newPassword, onChange: setNewPassword },
                { label: 'Confirmar Nueva Contraseña', value: confirmPassword, onChange: setConfirmPassword },
              ].map(field => (
                <div key={field.label}>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{field.label}</label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={field.value}
                    onChange={e => field.onChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-elio-yellow/40 focus:border-elio-yellow transition-all"
                    required
                    minLength={field.label !== 'Contraseña Actual' ? 6 : undefined}
                  />
                </div>
              ))}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showPasswords} onChange={e => setShowPasswords(e.target.checked)} className="rounded accent-elio-yellow" />
                <span className="text-sm text-gray-600">Mostrar contraseñas</span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closePasswordModal} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isChangingPassword} className="px-5 py-2 bg-elio-yellow text-white rounded-xl text-sm font-bold hover:bg-elio-yellow-hover disabled:opacity-50 transition-colors">
                  {isChangingPassword ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

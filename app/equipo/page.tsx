import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { RendimientoEmpleado } from '../../components/RendimientoEmpleado';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  Clock, 
  Calendar, 
  ArrowLeft, 
  Mail, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Plus,
  X,
  Key,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  FileText,
  CalendarDays,
  Check,
  XCircle,
  Loader2
} from 'lucide-react';

interface Usuario {
  id: string;
  name: string;
  email: string;
  role: string;
  position: string | null;
  avatarUrl: string | null;
  joinDate: string;
  tipoContrato?: string;
  // Datos Personales
  dni?: string | null;
  fechaNacimiento?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  codigoPostal?: string | null;
  telefono?: string | null;
  telefonoEmergencia?: string | null;
  // Datos Bancarios
  iban?: string | null;
  titularCuenta?: string | null;
  // Seguridad Social
  numSeguridadSocial?: string | null;
  tipoContratacion?: string | null;
  fechaAltaSS?: string | null;
}

interface Permiso {
  id: string;
  tipo: string;
  motivo: string | null;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  fechaSolicitud: string;
  fechaResolucion: string | null;
  comentarioAdmin: string | null;
  solicitante: { id: string; name: string; email: string; position: string | null };
  aprobador: { id: string; name: string } | null;
}

export const TeamPage = () => {
  const { usuario: currentUser, canAccessReports, canManageUsers } = useAuth();
  
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPermisoModalOpen, setIsPermisoModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'bancario' | 'seguridad'>('personal');
  const [selectedPermiso, setSelectedPermiso] = useState<Permiso | null>(null);
  // Estados para vista de empleado (no-admin)
  const [miTab, setMiTab] = useState<'perfil' | 'horario' | 'permisos'>('perfil');
  const [misJornadas, setMisJornadas] = useState<any[]>([]);
  const [loadingJornadas, setLoadingJornadas] = useState(false);
  const [semanaOffset, setSemanaOffset] = useState(0);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'DEV',
    position: '',
    tipoContrato: 'COMPLETA',
    dni: '',
    fechaNacimiento: '',
    direccion: '',
    ciudad: '',
    codigoPostal: '',
    telefono: '',
    telefonoEmergencia: '',
    iban: '',
    titularCuenta: '',
    numSeguridadSocial: '',
    tipoContratacion: '',
    fechaAltaSS: ''
  });
  
  const [permisoForm, setPermisoForm] = useState({
    tipo: 'VACACIONES',
    motivo: '',
    fechaInicio: '',
    fechaFin: ''
  });
  
  // Password states
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  
  // Approval state
  const [comentarioAdmin, setComentarioAdmin] = useState('');

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN';

  // Cargar datos
  useEffect(() => {
    fetchData();
  }, []);

  // Calcular fechas de la semana
    const getWeekDates = (offset: number) => {
      const hoy = new Date();
      const lunes = new Date(hoy);
      lunes.setDate(hoy.getDate() - hoy.getDay() + 1 + (offset * 7));
      const domingo = new Date(lunes);
      domingo.setDate(lunes.getDate() + 6);
      return {
        inicio: lunes.toISOString().split('T')[0],
        fin: domingo.toISOString().split('T')[0],
        lunesDate: lunes,
        domingoDate: domingo
      };
    };

    const semana = getWeekDates(semanaOffset);

  // Cargar jornadas cuando cambia la pestaña o la semana
    useEffect(() => {
      if (miTab === 'horario' && currentUser?.id) {
        setLoadingJornadas(true);
        fetch(`/api/control-horario?entity=jornadas&usuarioId=${currentUser.id}&fechaInicio=${semana.inicio}&fechaFin=${semana.fin}`)
          .then(res => res.json())
          .then(data => {
            setMisJornadas(Array.isArray(data) ? data : []);
            setLoadingJornadas(false);
          })
          .catch(() => setLoadingJornadas(false));
      }
    }, [miTab, semanaOffset, currentUser?.id]);

  const fetchData = async () => {
    try {
      const [usuariosRes, permisosRes] = await Promise.all([
        fetch('/api/usuarios'),
        fetch('/api/permisos')
      ]);

      if (usuariosRes.ok) {
        const usuariosData = await usuariosRes.json();
        setUsuarios(usuariosData);
      }

      if (permisosRes.ok) {
        const permisosData = await permisosRes.json();
        setPermisos(permisosData);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Crear usuario
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const nuevoUsuario = await response.json();
        setUsuarios([...usuarios, nuevoUsuario]);
        setIsCreateModalOpen(false);
        setFormData({ name: '', email: '', role: 'DEV', position: '' });
      }
    } catch (err) {
      console.error('Error creando usuario:', err);
    }
  };

  // Actualizar usuario
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const response = await fetch('/api/usuarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedUser.id, ...formData })
      });

      if (response.ok) {
        const usuarioActualizado = await response.json();
        setUsuarios(usuarios.map(u => u.id === usuarioActualizado.id ? usuarioActualizado : u));
        setSelectedUser(usuarioActualizado);
        setIsEditModalOpen(false);
      }
    } catch (err) {
      console.error('Error actualizando usuario:', err);
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      const response = await fetch('/api/usuarios', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId })
      });

      if (response.ok) {
        setUsuarios(usuarios.filter(u => u.id !== userId));
        setSelectedUser(null);
      }
    } catch (err) {
      console.error('Error eliminando usuario:', err);
    }
  };

  // Establecer contraseña
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;

    setIsSettingPassword(true);
    setPasswordMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set-password',
          targetUserId: selectedUser.id,
          targetPassword: newPassword,
          adminRole: currentUser?.role
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordMessage({ type: 'success', text: 'Contraseña establecida correctamente' });
        setNewPassword('');
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setPasswordMessage({ type: '', text: '' });
        }, 2000);
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Error al establecer contraseña' });
      }
    } catch (err) {
      setPasswordMessage({ type: 'error', text: 'Error de conexión' });
    }

    setIsSettingPassword(false);
  };

  // Solicitar permiso
  const handleSolicitarPermiso = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const solicitanteId = selectedUser?.id || currentUser?.id;
    if (!solicitanteId) return;

    try {
      const response = await fetch('/api/permisos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...permisoForm,
          solicitanteId
        })
      });

      if (response.ok) {
        const nuevoPermiso = await response.json();
        setPermisos([nuevoPermiso, ...permisos]);
        setIsPermisoModalOpen(false);
        setPermisoForm({ tipo: 'VACACIONES', motivo: '', fechaInicio: '', fechaFin: '' });
      }
    } catch (err) {
      console.error('Error solicitando permiso:', err);
    }
  };

  // Aprobar/Rechazar permiso
  const handleResolverPermiso = async (estado: 'APROBADO' | 'RECHAZADO') => {
    if (!selectedPermiso || !currentUser) return;

    try {
      const response = await fetch('/api/permisos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPermiso.id,
          estado,
          comentarioAdmin,
          aprobadorId: currentUser.id
        })
      });

      if (response.ok) {
        const permisoActualizado = await response.json();
        setPermisos(permisos.map(p => p.id === permisoActualizado.id ? permisoActualizado : p));
        setIsApprovalModalOpen(false);
        setSelectedPermiso(null);
        setComentarioAdmin('');
      }
    } catch (err) {
      console.error('Error resolviendo permiso:', err);
    }
  };

  const openEditModal = (user: Usuario) => {
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      position: user.position || '',
      tipoContrato: user.tipoContrato || 'COMPLETA',
      dni: user.dni || '',
      fechaNacimiento: user.fechaNacimiento ? user.fechaNacimiento.split('T')[0] : '',
      direccion: user.direccion || '',
      ciudad: user.ciudad || '',
      codigoPostal: user.codigoPostal || '',
      telefono: user.telefono || '',
      telefonoEmergencia: user.telefonoEmergencia || '',
      iban: user.iban || '',
      titularCuenta: user.titularCuenta || '',
      numSeguridadSocial: user.numSeguridadSocial || '',
      tipoContratacion: user.tipoContratacion || '',
      fechaAltaSS: user.fechaAltaSS ? user.fechaAltaSS.split('T')[0] : ''
    });
    setIsEditModalOpen(true);
  };

  const openPasswordModal = (user: Usuario) => {
    setSelectedUser(user);
    setNewPassword('');
    setPasswordMessage({ type: '', text: '' });
    setIsPasswordModalOpen(true);
  };

  const getPermisosUsuario = (userId: string) => {
    return permisos.filter(p => p.solicitante.id === userId);
  };

  const getPermisosPendientes = () => {
    return permisos.filter(p => p.estado === 'PENDIENTE');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'VACACIONES': return 'Vacaciones';
      case 'PERMISO': return 'Permiso';
      case 'BAJA_MEDICA': return 'Baja Médica';
      case 'ASUNTOS_PROPIOS': return 'Asuntos Propios';
      default: return tipo;
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return <Badge variant="warning">Pendiente</Badge>;
      case 'APROBADO': return <Badge variant="success">Aprobado</Badge>;
      case 'RECHAZADO': return <Badge variant="danger">Rechazado</Badge>;
      default: return <Badge variant="neutral">{estado}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 text-elio-yellow animate-spin" />
      </div>
    );
  }

  // Si NO es admin, mostrar solo su propia ficha
  if (!isAdmin) {
    const miUsuario = usuarios.find(u => u.id === currentUser?.id);
    const misPermisos = getPermisosUsuario(currentUser?.id || '');

    const formatHoraJornada = (dateStr: string | null) => {
      if (!dateStr) return '--:--';
      return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };

    const formatMinutosJornada = (minutos: number | null) => {
      if (!minutos) return '--';
      const h = Math.floor(minutos / 60);
      const m = minutos % 60;
      return `${h}h ${m}m`;
    };

    // Calcular stats de la semana
    const jornadasFinalizadas = misJornadas.filter(j => j.estado === 'FINALIZADA');
    const totalMinutosSemana = jornadasFinalizadas.reduce((acc, j) => acc + (j.totalMinutos || 0), 0);
    const horasObjetivoSemana = miUsuario?.tipoContrato === 'MEDIA' ? 20 : 37.5;
    const balanceSemana = (totalMinutosSemana / 60) - horasObjetivoSemana;

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header con info básica */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 rounded-full bg-elio-yellow text-white flex items-center justify-center text-3xl font-bold shadow-lg">
              {miUsuario?.name.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900">{miUsuario?.name}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="blue">{miUsuario?.position || 'Sin cargo'}</Badge>
                <Badge variant="neutral">{miUsuario?.role}</Badge>
                <Badge variant={miUsuario?.tipoContrato === 'MEDIA' ? 'warning' : 'success'}>
                  {miUsuario?.tipoContrato === 'MEDIA' ? '20h/semana' : '37.5h/semana'}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mt-2 flex items-center">
                <Mail size={14} className="mr-1"/> {miUsuario?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Pestañas */}
        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setMiTab('perfil')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              miTab === 'perfil' 
                ? 'border-elio-yellow text-slate-900' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText size={16} className="inline mr-2" />
            Mi Perfil
          </button>
          <button
            onClick={() => setMiTab('horario')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              miTab === 'horario' 
                ? 'border-elio-yellow text-slate-900' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Clock size={16} className="inline mr-2" />
            Mi Horario
          </button>
          <button
            onClick={() => setMiTab('permisos')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              miTab === 'permisos' 
                ? 'border-elio-yellow text-slate-900' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Calendar size={16} className="inline mr-2" />
            Mis Permisos
          </button>
        </div>

        {/* Contenido de pestañas */}
        {miTab === 'perfil' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Datos de Contacto */}
            <Card title="Datos de Contacto">
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-bold">Email</span>
                  <p className="text-slate-900">{miUsuario?.email}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-bold">Teléfono</span>
                  <p className="text-slate-900">{miUsuario?.telefono || 'No registrado'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-bold">Teléfono de Emergencia</span>
                  <p className="text-slate-900">{miUsuario?.telefonoEmergencia || 'No registrado'}</p>
                </div>
              </div>
            </Card>

            {/* Datos Personales */}
            <Card title="Información Personal">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 uppercase font-bold">DNI</span>
                    <p className="text-slate-900">{miUsuario?.dni || 'No registrado'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase font-bold">Fecha de Nacimiento</span>
                    <p className="text-slate-900">
                      {miUsuario?.fechaNacimiento 
                        ? new Date(miUsuario.fechaNacimiento).toLocaleDateString('es-ES') 
                        : 'No registrada'}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-bold">Dirección</span>
                  <p className="text-slate-900">
                    {miUsuario?.direccion 
                      ? `${miUsuario.direccion}, ${miUsuario.codigoPostal || ''} ${miUsuario.ciudad || ''}` 
                      : 'No registrada'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Información Laboral */}
            <Card title="Información Laboral" className="md:col-span-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-bold">Puesto</span>
                  <p className="text-slate-900">{miUsuario?.position || 'No especificado'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-bold">Tipo de Contrato</span>
                  <p className="text-slate-900">
                    {miUsuario?.tipoContrato === 'MEDIA' ? 'Media Jornada (20h/sem)' : 'Jornada Completa (37.5h/sem)'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-bold">Fecha de Inicio</span>
                  <p className="text-slate-900">
                    {miUsuario?.joinDate ? new Date(miUsuario.joinDate).toLocaleDateString('es-ES') : 'No registrada'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-bold">Rol</span>
                  <p className="text-slate-900">{miUsuario?.role}</p>
                </div>
              </div>
            </Card>

            <div className="md:col-span-2 text-center text-sm text-slate-400">
              <Shield size={16} className="inline mr-1" />
              Si necesitas actualizar algún dato, contacta con Recursos Humanos
            </div>
          </div>
        )}

        {miTab === 'horario' && (
          <div className="space-y-6">
            {/* Selector de semana y resumen */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSemanaOffset(prev => prev - 1)}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <span className="text-sm font-medium min-w-[200px] text-center">
                    {semana.lunesDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    {' - '}
                    {semana.domingoDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <button 
                    onClick={() => setSemanaOffset(prev => prev + 1)}
                    className="p-2 hover:bg-slate-100 rounded-lg rotate-180"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  {semanaOffset !== 0 && (
                    <button 
                      onClick={() => setSemanaOffset(0)}
                      className="px-3 py-1 text-xs bg-slate-100 rounded-lg hover:bg-slate-200"
                    >
                      Hoy
                    </button>
                  )}
                </div>
                
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-slate-500">Trabajado:</span>
                    <span className="font-bold ml-1">{(totalMinutosSemana / 60).toFixed(1)}h</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Objetivo:</span>
                    <span className="font-bold ml-1">{horasObjetivoSemana}h</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Balance:</span>
                    <span className={`font-bold ml-1 ${balanceSemana >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {balanceSemana >= 0 ? '+' : ''}{balanceSemana.toFixed(1)}h
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de jornadas */}
            <Card title="Registro de Jornadas">
              {loadingJornadas ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-elio-yellow" size={32} />
                </div>
              ) : misJornadas.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No hay jornadas registradas esta semana</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-slate-600">Fecha</th>
                        <th className="px-4 py-3 text-center font-bold text-slate-600">Entrada</th>
                        <th className="px-4 py-3 text-center font-bold text-slate-600">Pausa</th>
                        <th className="px-4 py-3 text-center font-bold text-slate-600">Regreso</th>
                        <th className="px-4 py-3 text-center font-bold text-slate-600">Salida</th>
                        <th className="px-4 py-3 text-center font-bold text-slate-600">Total</th>
                        <th className="px-4 py-3 text-center font-bold text-slate-600">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {misJornadas.map((jornada: any) => (
                        <tr key={jornada.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <span className="font-medium capitalize">
                              {new Date(jornada.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono">
                            <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                              {formatHoraJornada(jornada.horaInicio)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono">
                            {jornada.horaPausaAlmuerzo ? (
                              <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded">
                                {formatHoraJornada(jornada.horaPausaAlmuerzo)}
                              </span>
                            ) : <span className="text-slate-300">--:--</span>}
                          </td>
                          <td className="px-4 py-3 text-center font-mono">
                            {jornada.horaReinicioAlmuerzo ? (
                              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                {formatHoraJornada(jornada.horaReinicioAlmuerzo)}
                              </span>
                            ) : <span className="text-slate-300">--:--</span>}
                          </td>
                          <td className="px-4 py-3 text-center font-mono">
                            {jornada.horaFin ? (
                              <span className="bg-red-50 text-red-700 px-2 py-1 rounded">
                                {formatHoraJornada(jornada.horaFin)}
                              </span>
                            ) : <span className="text-slate-300">--:--</span>}
                          </td>
                          <td className="px-4 py-3 text-center font-bold">
                            {formatMinutosJornada(jornada.totalMinutos)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={
                              jornada.estado === 'FINALIZADA' ? 'success' :
                              jornada.estado === 'PAUSADA' ? 'warning' : 'blue'
                            }>
                              {jornada.estado === 'FINALIZADA' ? 'Finalizada' :
                               jornada.estado === 'PAUSADA' ? 'Pausada' : 'En curso'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {miTab === 'permisos' && (
          <div className="space-y-6">
            {/* Botón solicitar */}
            <Card title="Solicitar Permiso / Vacaciones">
              <button
                onClick={() => {
                  setSelectedUser(miUsuario || null);
                  setIsPermisoModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-elio-yellow text-white rounded-lg font-bold hover:bg-elio-yellow-hover transition-colors"
              >
                <Plus size={18} /> Nueva Solicitud
              </button>
            </Card>

            {/* Histórico */}
            <Card title="Mis Solicitudes">
              {misPermisos.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No tienes solicitudes registradas</p>
              ) : (
                <div className="space-y-3">
                  {misPermisos.map(permiso => (
                    <div key={permiso.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-bold text-slate-900">{getTipoLabel(permiso.tipo)}</span>
                          {permiso.motivo && <p className="text-sm text-slate-500 mt-1">{permiso.motivo}</p>}
                        </div>
                        {getEstadoBadge(permiso.estado)}
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-3">
                        <span className="flex items-center gap-1">
                          <CalendarDays size={12} /> {formatDate(permiso.fechaInicio)} - {formatDate(permiso.fechaFin)}
                        </span>
                        <span>Solicitado: {formatDate(permiso.fechaSolicitud)}</span>
                        {permiso.fechaResolucion && (
                          <span>Resuelto: {formatDate(permiso.fechaResolucion)}</span>
                        )}
                      </div>
                      {permiso.comentarioAdmin && (
                        <p className="text-xs text-slate-600 mt-2 bg-white p-2 rounded border">
                          <strong>Comentario:</strong> {permiso.comentarioAdmin}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Modal Solicitar Permiso */}
        {isPermisoModalOpen && (
          <PermisoModal
            onClose={() => setIsPermisoModalOpen(false)}
            onSubmit={handleSolicitarPermiso}
            form={permisoForm}
            setForm={setPermisoForm}
          />
        )}
      </div>
    );
  }

  // --- VISTA ADMIN: DETALLE DE EMPLEADO ---
  if (selectedUser && !isEditModalOpen && !isPasswordModalOpen) {
    const permisosUsuario = getPermisosUsuario(selectedUser.id);

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setSelectedUser(null)}
              className="p-2 hover:bg-white rounded-full transition-colors text-slate-500 shadow-sm border border-transparent hover:border-slate-200"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Ficha de Empleado</h1>
              <p className="text-slate-500 text-sm">Detalles y gestión de acceso.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => openEditModal(selectedUser)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Edit3 size={16} /> Editar
            </button>
            <button
              onClick={() => handleDeleteUser(selectedUser.id)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              <Trash2 size={16} /> Eliminar
            </button>
          </div>
        </div>

        {/* Profile Card */}
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 rounded-full bg-elio-yellow text-white flex items-center justify-center text-3xl font-bold shadow-lg">
              {selectedUser.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{selectedUser.name}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="blue">{selectedUser.position || 'Sin cargo'}</Badge>
                <Badge variant="neutral">{selectedUser.role}</Badge>
                <Badge variant={selectedUser.tipoContrato === 'MEDIA' ? 'warning' : 'success'}>
                  {selectedUser.tipoContrato === 'MEDIA' ? '20h/semana' : '37.5h/semana'}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mt-2 flex items-center">
                <Mail size={14} className="mr-1"/> {selectedUser.email}
              </p>
            </div>
          </div>
        </div>

        {/* Pestañas de Datos */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('personal')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'personal' 
                  ? 'bg-elio-yellow text-white' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Datos Personales
            </button>
            <button
              onClick={() => setActiveTab('bancario')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'bancario' 
                  ? 'bg-elio-yellow text-white' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Datos Bancarios
            </button>
            <button
              onClick={() => setActiveTab('seguridad')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'seguridad' 
                  ? 'bg-elio-yellow text-white' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Seguridad Social
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'personal' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">DNI/NIE</label>
                  <p className="text-slate-900">{selectedUser.dni || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Fecha Nacimiento</label>
                  <p className="text-slate-900">
                    {selectedUser.fechaNacimiento 
                      ? new Date(selectedUser.fechaNacimiento).toLocaleDateString('es-ES') 
                      : '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Teléfono</label>
                  <p className="text-slate-900">{selectedUser.telefono || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Teléfono Emergencia</label>
                  <p className="text-slate-900">{selectedUser.telefonoEmergencia || '-'}</p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Dirección</label>
                  <p className="text-slate-900">{selectedUser.direccion || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Ciudad</label>
                  <p className="text-slate-900">{selectedUser.ciudad || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Código Postal</label>
                  <p className="text-slate-900">{selectedUser.codigoPostal || '-'}</p>
                </div>
              </div>
            )}

            {activeTab === 'bancario' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">IBAN</label>
                  <p className="text-slate-900 font-mono">{selectedUser.iban || '-'}</p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Titular de la Cuenta</label>
                  <p className="text-slate-900">{selectedUser.titularCuenta || '-'}</p>
                </div>
              </div>
            )}

            {activeTab === 'seguridad' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nº Seguridad Social</label>
                  <p className="text-slate-900 font-mono">{selectedUser.numSeguridadSocial || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Contrato</label>
                  <p className="text-slate-900">
                    {selectedUser.tipoContrato === 'MEDIA' ? 'Media Jornada (20h)' : 'Jornada Completa (37.5h)'}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tipo Contratación</label>
                  <p className="text-slate-900">{selectedUser.tipoContratacion || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Fecha Alta SS</label>
                  <p className="text-slate-900">
                    {selectedUser.fechaAltaSS 
                      ? new Date(selectedUser.fechaAltaSS).toLocaleDateString('es-ES') 
                      : '-'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Grid de acciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Gestión de Acceso">
            <div className="space-y-3">
              <button 
                onClick={() => openPasswordModal(selectedUser)}
                className="w-full text-left px-4 py-3 bg-elio-yellow/10 hover:bg-elio-yellow/20 border border-elio-yellow/30 rounded-lg text-sm font-medium transition-all text-slate-700 flex items-center"
              >
                <Key size={16} className="mr-3 text-elio-yellow"/> Establecer / Cambiar Contraseña
              </button>
              <button 
                onClick={() => {
                  setIsPermisoModalOpen(true);
                }}
                className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-medium transition-all text-slate-700 flex items-center"
              >
                <CalendarDays size={16} className="mr-3 text-blue-600"/> Asignar Permiso / Vacaciones
              </button>
            </div>
          </Card>

          {canAccessReports && (
            <Card title="">
              <RendimientoEmpleado 
                usuarioId={selectedUser.id} 
                tipoContrato={selectedUser.tipoContrato || "COMPLETA"}
              />
            </Card>
          )}
        </div>

        {/* Histórico de permisos */}
        <Card title="Histórico de Permisos y Vacaciones">
          {permisosUsuario.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No hay solicitudes registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Tipo</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Fechas</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Solicitado</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600">Estado</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Resuelto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {permisosUsuario.map(permiso => (
                    <tr key={permiso.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{getTipoLabel(permiso.tipo)}</span>
                        {permiso.motivo && <p className="text-xs text-slate-500">{permiso.motivo}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(permiso.fechaInicio)} - {formatDate(permiso.fechaFin)}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {formatDate(permiso.fechaSolicitud)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getEstadoBadge(permiso.estado)}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {permiso.fechaResolucion ? formatDate(permiso.fechaResolucion) : '-'}
                        {permiso.aprobador && <span className="block">por {permiso.aprobador.name}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // --- VISTA ADMIN: LISTA DE EQUIPO ---
  const permisosPendientes = getPermisosPendientes();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Directorio de Equipo</h1>
          <p className="text-slate-500 text-sm">Gestión de personal y accesos.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-elio-black text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center space-x-2 text-sm font-bold shadow-sm"
        >
          <Plus size={16} />
          <span>Añadir Miembro</span>
        </button>
      </div>

      {/* Solicitudes pendientes */}
      {permisosPendientes.length > 0 && (
        <Card title={`⚠️ Solicitudes Pendientes (${permisosPendientes.length})`} className="border-yellow-200 bg-yellow-50/30">
          <div className="space-y-3">
            {permisosPendientes.map(permiso => (
              <div key={permiso.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                <div>
                  <p className="font-bold text-slate-900">{permiso.solicitante.name}</p>
                  <p className="text-sm text-slate-600">
                    {getTipoLabel(permiso.tipo)}: {formatDate(permiso.fechaInicio)} - {formatDate(permiso.fechaFin)}
                  </p>
                  {permiso.motivo && <p className="text-xs text-slate-500 mt-1">{permiso.motivo}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedPermiso(permiso);
                      setIsApprovalModalOpen(true);
                    }}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-1"
                  >
                    <Check size={16} /> Revisar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Lista de usuarios */}
      {usuarios.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Users size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">No hay miembros en el equipo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {usuarios.map(user => (
            <div 
              key={user.id} 
              onClick={() => setSelectedUser(user)}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-elio-yellow/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-600 group-hover:bg-elio-yellow group-hover:text-white transition-colors">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{user.name}</h3>
                  <p className="text-xs text-slate-500 uppercase font-medium">{user.role}</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-50 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Cargo</span>
                  <span className="font-medium text-slate-900">{user.position || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Email</span>
                  <span className="font-medium text-slate-900 truncate max-w-[150px]">{user.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modales */}
      {isCreateModalOpen && (
        <UserModal
          title="Nuevo Miembro"
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateUser}
          form={formData}
          setForm={setFormData}
        />
      )}

      {isEditModalOpen && selectedUser && (
        <UserModal
          title="Editar Miembro"
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateUser}
          form={formData}
          setForm={setFormData}
        />
      )}

      {isPasswordModalOpen && selectedUser && (
        <PasswordModal
          user={selectedUser}
          onClose={() => setIsPasswordModalOpen(false)}
          onSubmit={handleSetPassword}
          password={newPassword}
          setPassword={setNewPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          message={passwordMessage}
          isLoading={isSettingPassword}
        />
      )}

      {isPermisoModalOpen && (
        <PermisoModal
          onClose={() => setIsPermisoModalOpen(false)}
          onSubmit={handleSolicitarPermiso}
          form={permisoForm}
          setForm={setPermisoForm}
          isAdmin={isAdmin}
          userName={selectedUser?.name}
        />
      )}

      {isApprovalModalOpen && selectedPermiso && (
        <ApprovalModal
          permiso={selectedPermiso}
          onClose={() => {
            setIsApprovalModalOpen(false);
            setSelectedPermiso(null);
            setComentarioAdmin('');
          }}
          onApprove={() => handleResolverPermiso('APROBADO')}
          onReject={() => handleResolverPermiso('RECHAZADO')}
          comentario={comentarioAdmin}
          setComentario={setComentarioAdmin}
        />
      )}
    </div>
  );
};

// --- COMPONENTES MODALES ---

const UserModal = ({ title, onClose, onSubmit, form, setForm }: any) => {
  const [editTab, setEditTab] = useState<'basico' | 'personal' | 'bancario' | 'seguridad'>('basico');
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-lg text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {[
            { key: 'basico', label: 'Básico' },
            { key: 'personal', label: 'Personal' },
            { key: 'bancario', label: 'Bancario' },
            { key: 'seguridad', label: 'Seguridad Social' }
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setEditTab(tab.key as any)}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                editTab === tab.key 
                  ? 'bg-white border-b-2 border-elio-yellow text-elio-yellow' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="p-6 overflow-y-auto flex-1">
          {editTab === 'basico' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nombre *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Rol *</label>
                  <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none">
                    <option value="DEV">Desarrollador</option>
                    <option value="COPY">Copywriter</option>
                    <option value="DESIGNER">Diseñador</option>
                    <option value="PM">Project Manager</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="SUPERADMIN">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cargo</label>
                  <input type="text" value={form.position} onChange={(e) => setForm({...form, position: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none" placeholder="Ej: Community Manager" />
                </div>
              </div>
            </div>
          )}

          {editTab === 'personal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">DNI/NIE</label>
                  <input type="text" value={form.dni} onChange={(e) => setForm({...form, dni: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none" placeholder="12345678A" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Fecha Nacimiento</label>
                  <input type="date" value={form.fechaNacimiento} onChange={(e) => setForm({...form, fechaNacimiento: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Teléfono</label>
                  <input type="tel" value={form.telefono} onChange={(e) => setForm({...form, telefono: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none" placeholder="612345678" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Teléfono Emergencia</label>
                  <input type="tel" value={form.telefonoEmergencia} onChange={(e) => setForm({...form, telefonoEmergencia: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none" placeholder="612345678" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Dirección</label>
                <input type="text" value={form.direccion} onChange={(e) => setForm({...form, direccion: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none" placeholder="Calle, número, piso..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Ciudad</label>
                  <input type="text" value={form.ciudad} onChange={(e) => setForm({...form, ciudad: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none" placeholder="Madrid" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Código Postal</label>
                  <input type="text" value={form.codigoPostal} onChange={(e) => setForm({...form, codigoPostal: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none" placeholder="28001" />
                </div>
              </div>
            </div>
          )}

          {editTab === 'bancario' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">IBAN</label>
                <input type="text" value={form.iban} onChange={(e) => setForm({...form, iban: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none font-mono" placeholder="ES00 0000 0000 0000 0000 0000" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Titular de la Cuenta</label>
                <input type="text" value={form.titularCuenta} onChange={(e) => setForm({...form, titularCuenta: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none" placeholder="Nombre completo del titular" />
              </div>
            </div>
          )}

          {editTab === 'seguridad' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nº Seguridad Social</label>
                  <input type="text" value={form.numSeguridadSocial} onChange={(e) => setForm({...form, numSeguridadSocial: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none font-mono" placeholder="00/00000000/00" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Fecha Alta SS</label>
                  <input type="date" value={form.fechaAltaSS} onChange={(e) => setForm({...form, fechaAltaSS: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo de Contrato</label>
                  <select value={form.tipoContrato} onChange={(e) => setForm({...form, tipoContrato: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none">
                    <option value="COMPLETA">Jornada Completa (37.5h)</option>
                    <option value="MEDIA">Media Jornada (20h)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo Contratación</label>
                  <select value={form.tipoContratacion} onChange={(e) => setForm({...form, tipoContratacion: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none">
                    <option value="">Seleccionar...</option>
                    <option value="INDEFINIDO">Indefinido</option>
                    <option value="TEMPORAL">Temporal</option>
                    <option value="PRACTICAS">Prácticas</option>
                    <option value="FORMACION">Formación</option>
                    <option value="AUTONOMO">Autónomo</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="pt-6 flex justify-end gap-2 border-t border-gray-100 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-elio-yellow text-white rounded-lg text-sm font-bold hover:bg-elio-yellow-hover">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PasswordModal = ({ user, onClose, onSubmit, password, setPassword, showPassword, setShowPassword, message, isLoading }: any) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="font-bold text-lg text-gray-900">Establecer Contraseña</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
      </div>
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <p className="text-sm text-blue-800">Usuario: <strong>{user.name}</strong></p>
          <p className="text-xs text-blue-600 mt-1">{user.email}</p>
        </div>
        {message.text && (
          <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nueva Contraseña *</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none pr-12" required minLength={6} placeholder="Mínimo 6 caracteres" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
        <div className="pt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancelar</button>
          <button type="submit" disabled={isLoading} className="px-4 py-2 bg-elio-yellow text-white rounded-lg text-sm font-bold hover:bg-elio-yellow-hover disabled:opacity-50">
            {isLoading ? 'Guardando...' : 'Establecer'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const PermisoModal = ({ onClose, onSubmit, form, setForm, isAdmin, userName }: any) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="font-bold text-lg text-gray-900">
          {isAdmin && userName ? `Asignar Permiso a ${userName}` : 'Solicitar Permiso'}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
      </div>
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo *</label>
          <select value={form.tipo} onChange={(e) => setForm({...form, tipo: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none">
            <option value="VACACIONES">Vacaciones</option>
            <option value="PERMISO">Permiso</option>
            <option value="BAJA_MEDICA">Baja Médica</option>
            <option value="ASUNTOS_PROPIOS">Asuntos Propios</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Desde *</label>
            <input type="date" value={form.fechaInicio} onChange={(e) => setForm({...form, fechaInicio: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Hasta *</label>
            <input type="date" value={form.fechaFin} onChange={(e) => setForm({...form, fechaFin: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none" required />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Motivo</label>
          <textarea value={form.motivo} onChange={(e) => setForm({...form, motivo: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none" rows={2} placeholder="Opcional" />
        </div>
        <div className="pt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-elio-yellow text-white rounded-lg text-sm font-bold hover:bg-elio-yellow-hover">
            {isAdmin ? 'Asignar' : 'Enviar Solicitud'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const ApprovalModal = ({ permiso, onClose, onApprove, onReject, comentario, setComentario }: any) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="font-bold text-lg text-gray-900">Revisar Solicitud</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
      </div>
      <div className="p-6 space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <p className="font-bold text-blue-900">{permiso.solicitante.name}</p>
          <p className="text-sm text-blue-700 mt-1">{permiso.tipo}: {new Date(permiso.fechaInicio).toLocaleDateString('es-ES')} - {new Date(permiso.fechaFin).toLocaleDateString('es-ES')}</p>
          {permiso.motivo && <p className="text-sm text-blue-600 mt-2">{permiso.motivo}</p>}
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Comentario (opcional)</label>
          <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none" rows={2} placeholder="Añade un comentario si lo deseas" />
        </div>
        <div className="pt-4 flex justify-between">
          <button onClick={onReject} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 flex items-center gap-2">
            <XCircle size={16} /> Rechazar
          </button>
          <button onClick={onApprove} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 flex items-center gap-2">
            <Check size={16} /> Aprobar
          </button>
        </div>
      </div>
    </div>
  </div>
);
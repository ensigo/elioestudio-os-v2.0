import React, { useState, useEffect, useCallback } from 'react';
import { Client } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Tabs } from '../../components/ui/Tabs';
import { CalendarioContenidos } from '../../components/CalendarioContenidos';
import { 
  ArrowLeft, Edit, Mail, Phone, MapPin, 
  Briefcase, CheckSquare, Shield, Lock, Eye, EyeOff, Users,
  Plus, Trash2, Clock,
  ExternalLink, ChevronDown, ChevronRight, Globe, Share2
} from 'lucide-react';

interface ClientDetailPageProps {
  client: Client;
  onBack: () => void;
  usuarios: any[];
  currentUser: { id: string; role: string; name: string };
  onClientUpdate: (client: Client) => void;
}

interface Credential {
  id: string;
  clienteId: string;
  category: string;
  platform: string;
  url?: string;
  username: string;
  passwordEncrypted: string;
  email?: string;
  notes?: string;
  isActive: boolean;
  createdById?: string;
  createdByName?: string;
  lastModifiedById?: string;
  lastModifiedByName?: string;
  createdAt: string;
  updatedAt: string;
}

interface ClienteUsuario {
  id: string;
  usuarioId: string;
  role: string;
  usuario: { id: string; name: string; email: string; role: string; position?: string; };
}

const CREDENTIAL_CATEGORIES = [
  { id: 'SOCIAL', label: 'Redes Sociales', icon: Share2, color: 'bg-pink-100 text-pink-700' },
  { id: 'WEB_CMS', label: 'Webs / CMS', icon: Globe, color: 'bg-blue-100 text-blue-700' },
  { id: 'EMAIL', label: 'Cuentas de Email', icon: Mail, color: 'bg-green-100 text-green-700' },
  { id: 'HOSTING', label: 'Hosting / Dominios', icon: Globe, color: 'bg-purple-100 text-purple-700' },
  { id: 'ANALYTICS', label: 'Analytics / SEO', icon: Briefcase, color: 'bg-orange-100 text-orange-700' },
  { id: 'ADS', label: 'Publicidad (Ads)', icon: Briefcase, color: 'bg-yellow-100 text-yellow-700' },
  { id: 'OTHER', label: 'Otros', icon: Lock, color: 'bg-gray-100 text-gray-700' }
];

const PLATFORMS_BY_CATEGORY: Record<string, string[]> = {
  SOCIAL: ['Facebook', 'Instagram', 'Twitter/X', 'LinkedIn', 'YouTube', 'TikTok', 'Pinterest'],
  WEB_CMS: ['WordPress', 'Shopify', 'Wix', 'PrestaShop', 'Magento', 'Drupal'],
  EMAIL: ['Gmail', 'Outlook', 'cPanel Email', 'Zoho Mail'],
  HOSTING: ['GoDaddy', 'Hostinger', 'SiteGround', 'OVH', 'Cloudflare', 'Namecheap'],
  ANALYTICS: ['Google Analytics', 'Google Search Console', 'SEMrush', 'Ahrefs', 'Hotjar'],
  ADS: ['Google Ads', 'Meta Ads', 'LinkedIn Ads', 'TikTok Ads'],
  OTHER: ['Otro']
};

const formatDate = (d: string) => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const ClientDetailPage: React.FC<ClientDetailPageProps> = ({ client, onBack, usuarios, currentUser, onClientUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editClientForm, setEditClientForm] = useState({
    name: client.name, nombreComercial: (client as any).nombreComercial || "", email: client.email || '', phone: client.phone || '',
    address: client.address || '', contactPerson: client.contactPerson || '',
    taxId: client.fiscalData?.taxId || '', status: client.status,
    metricoolBrandId: (client as any).metricoolBrandId || ''
  });
  const [metricoolBrands, setMetricoolBrands] = useState<{id: string; name: string}[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);

  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [showAddCredential, setShowAddCredential] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    SOCIAL: true, WEB_CMS: true, EMAIL: true, HOSTING: true, ANALYTICS: true, ADS: true, OTHER: true
  });
  
  const [newCredential, setNewCredential] = useState({
    category: 'WEB_CMS', platform: '', customPlatform: '', url: '',
    username: '', passwordEncrypted: '', email: '', notes: ''
  });

  const [teamMembers, setTeamMembers] = useState<ClienteUsuario[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [showAddTeamMember, setShowAddTeamMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('MEMBER');

  const [proyectos, setProyectos] = useState<any[]>([]);
  const [tareas, setTareas] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // Cargar marcas de Metricool
  const loadMetricoolBrands = async () => {
    setLoadingBrands(true);
    try {
      const res = await fetch('/api/clientes?resource=metricool&action=brands');
      if (res.ok) {
        const data = await res.json();
        // Metricool puede devolver diferentes estructuras
        const brands = data.brands || data || [];
        setMetricoolBrands(brands.map((b: any) => ({ id: String(b.id), name: b.label || b.title || 'Sin nombre' })));
      }
    } catch (err) {
      console.error('Error cargando marcas Metricool:', err);
    } finally {
      setLoadingBrands(false);
    }
  };

  const loadCredentials = useCallback(async () => {
    setIsLoadingCredentials(true);
    try {
      const res = await fetch("/api/clientes?resource=credentials&clienteId=" + client.id);
      if (res.ok) setCredentials(await res.json());
    } catch (err) { console.error(err); }
    finally { setIsLoadingCredentials(false); }
  }, [client.id]);

  const loadTeamMembers = useCallback(async () => {
    setIsLoadingTeam(true);
    try {
      const res = await fetch("/api/clientes?resource=team&clienteId=" + client.id);
      if (res.ok) setTeamMembers(await res.json());
    } catch (err) { console.error(err); }
    finally { setIsLoadingTeam(false); }
  }, [client.id]);

  const loadProjectsAndTasks = useCallback(async () => {
    setIsLoadingProjects(true);
    try {
      const res = await fetch("/api/clientes?id=" + client.id);
      if (res.ok) {
        const data = await res.json();
        setProyectos(data.proyectos || []);
        setTareas((data.proyectos || []).flatMap((p: any) => p.tareas || []));
      }
    } catch (err) { console.error(err); }
    finally { setIsLoadingProjects(false); }
  }, [client.id]);

  useEffect(() => {
    if (activeTab === 'credentials') loadCredentials();
    else if (activeTab === 'team') loadTeamMembers();
    else if (activeTab === 'projects') loadProjectsAndTasks();
  }, [activeTab, loadCredentials, loadTeamMembers, loadProjectsAndTasks]);

  // Cargar marcas de Metricool cuando se abre edición
  useEffect(() => {
    if (isEditingClient && metricoolBrands.length === 0) {
      loadMetricoolBrands();
    }
  }, [isEditingClient]);

  const handleSaveClientEdit = async () => {
    try {
      const res = await fetch('/api/clientes', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: client.id, name: editClientForm.name, nombreComercial: (editClientForm as any).nombreComercial || null, email: editClientForm.email, phone: editClientForm.phone, address: editClientForm.address, contactPerson: editClientForm.contactPerson, taxId: editClientForm.taxId, status: editClientForm.status, metricoolBrandId: editClientForm.metricoolBrandId })
      });
      if (res.ok) {
        const updated = await res.json();
        onClientUpdate({ 
          ...client, 
          name: updated.name, 
          email: updated.email, 
          phone: updated.phone,
          address: updated.address, 
          contactPerson: updated.contactPerson,
          fiscalData: { taxId: updated.taxId }, 
          status: updated.status,
          metricoolBrandId: updated.metricoolBrandId
        } as any);
        setIsEditingClient(false);
      }
    } catch (err) { alert('Error al guardar'); }
  };

  const handleAddCredential = async () => {
    const platformToSave = newCredential.platform === 'custom' ? newCredential.customPlatform : newCredential.platform;
    if (!newCredential.category || !platformToSave || !newCredential.username || !newCredential.passwordEncrypted) {
      alert('Categoría, plataforma, usuario y contraseña son obligatorios'); return;
    }
    try {
      const res = await fetch('/api/clientes?resource=credentials', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: client.id, category: newCredential.category, platform: platformToSave,
          url: newCredential.url || null, username: newCredential.username,
          passwordEncrypted: newCredential.passwordEncrypted, email: newCredential.email || null,
          notes: newCredential.notes || null, createdById: currentUser.id, createdByName: currentUser.name
        })
      });
      if (res.ok) {
        const newCred = await res.json();
        setCredentials(prev => [...prev, newCred]);
        setShowAddCredential(false);
        setNewCredential({ category: 'WEB_CMS', platform: '', customPlatform: '', url: '', username: '', passwordEncrypted: '', email: '', notes: '' });
      }
    } catch (err) { alert('Error al crear'); }
  };

  const handleUpdateCredential = async () => {
    if (!editingCredential) return;
    try {
      const res = await fetch('/api/clientes?resource=credentials', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingCredential.id, ...editingCredential,
          modifiedById: currentUser.id, modifiedByName: currentUser.name })
      });
      if (res.ok) {
        const updated = await res.json();
        setCredentials(prev => prev.map(c => c.id === updated.id ? updated : c));
        setEditingCredential(null);
      }
    } catch (err) { alert('Error al actualizar'); }
  };

  const handleDeleteCredential = async (credId: string) => {
    if (!confirm('¿Eliminar esta credencial?')) return;
    try {
      const res = await fetch('/api/clientes?resource=credentials', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: credId })
      });
      if (res.ok) setCredentials(prev => prev.filter(c => c.id !== credId));
    } catch (err) { alert('Error'); }
  };

  const handleAddTeamMember = async () => {
    if (!selectedUserId) { alert('Selecciona un usuario'); return; }
    try {
      const res = await fetch('/api/clientes?resource=team', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId: client.id, usuarioId: selectedUserId, role: selectedRole })
      });
      if (res.ok) {
        const newMember = await res.json();
        setTeamMembers(prev => [...prev, newMember]);
        setShowAddTeamMember(false); setSelectedUserId(''); setSelectedRole('MEMBER');
      } else { const e = await res.json(); alert(e.error || 'Error'); }
    } catch (err) { alert('Error'); }
  };

  const handleRemoveTeamMember = async (id: string) => {
    if (!confirm('¿Eliminar?')) return;
    try {
      const res = await fetch('/api/clientes?resource=team', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) setTeamMembers(prev => prev.filter(m => m.id !== id));
    } catch (err) { alert('Error'); }
  };

  const getStatusBadge = (s: string) => {
    switch(s) {
      case 'ACTIVE': return <Badge variant="success">ACTIVO</Badge>;
      case 'RISK': return <Badge variant="warning">RIESGO</Badge>;
      case 'PAUSED': return <Badge variant="neutral">PAUSA</Badge>;
      case 'CHURNED': return <Badge variant="danger">BAJA</Badge>;
      default: return <Badge>{s}</Badge>;
    }
  };

  const credentialsByCategory = credentials.reduce((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(c);
    return acc;
  }, {} as Record<string, Credential[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">{client.name} {getStatusBadge(client.status)}</h1>
            <p className="text-sm text-gray-500">{client.fiscalData?.taxId}</p>
          </div>
        </div>
        {currentUser.role === 'ADMIN' && (
          <button onClick={() => setIsEditingClient(true)} className="flex items-center gap-2 bg-white border px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
            <Edit size={16} />Editar Cliente
          </button>
        )}
      </div>

      <Tabs activeTab={activeTab} onChange={setActiveTab} tabs={[
        { id: 'overview', label: 'Visión General', icon: Briefcase },
        { id: 'projects', label: 'Tareas y Proyectos', icon: CheckSquare },
        { id: 'credentials', label: 'Accesos y Claves', icon: Shield },
        { id: 'team', label: 'Equipo Asignado', icon: Users },
      ]} />

      <div className="min-h-[400px]">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Datos de Contacto" action={currentUser.role === 'ADMIN' && !isEditingClient && (
              <button onClick={() => setIsEditingClient(true)} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded flex items-center">
                <Edit size={12} className="mr-1" /> Editar
              </button>
            )}>
              {isEditingClient ? (
                <div className="space-y-3">
                  <input value={editClientForm.name} onChange={e => setEditClientForm({...editClientForm, name: e.target.value})} placeholder="Nombre Fiscal" className="w-full px-3 py-2 border rounded-lg text-sm" />
                  <input value={(editClientForm as any).nombreComercial || ""} onChange={e => setEditClientForm({...editClientForm, nombreComercial: e.target.value} as any)} placeholder="Nombre Comercial (interno)" className="w-full px-3 py-2 border rounded-lg text-sm" />
                  <input value={editClientForm.taxId} onChange={e => setEditClientForm({...editClientForm, taxId: e.target.value})} placeholder="CIF/NIF" className="w-full px-3 py-2 border rounded-lg text-sm" />
                  <input value={editClientForm.address} onChange={e => setEditClientForm({...editClientForm, address: e.target.value})} placeholder="Dirección" className="w-full px-3 py-2 border rounded-lg text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={editClientForm.email} onChange={e => setEditClientForm({...editClientForm, email: e.target.value})} placeholder="Email" className="px-3 py-2 border rounded-lg text-sm" />
                    <input value={editClientForm.phone} onChange={e => setEditClientForm({...editClientForm, phone: e.target.value})} placeholder="Teléfono" className="px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <input value={editClientForm.contactPerson} onChange={e => setEditClientForm({...editClientForm, contactPerson: e.target.value})} placeholder="Contacto" className="w-full px-3 py-2 border rounded-lg text-sm" />
                  <select value={editClientForm.status} onChange={e => setEditClientForm({...editClientForm, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="ACTIVE">Activo</option><option value="RISK">Riesgo</option><option value="PAUSED">Pausa</option><option value="CHURNED">Baja</option>
                  </select>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Marca Metricool</label>
                    <select 
                      value={editClientForm.metricoolBrandId} 
                      onChange={e => setEditClientForm({...editClientForm, metricoolBrandId: e.target.value})} 
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      disabled={loadingBrands}
                    >
                      <option value="">{loadingBrands ? 'Cargando...' : 'Sin vincular'}</option>
                      {metricoolBrands.map(brand => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveClientEdit} className="flex-1 bg-elio-yellow text-white py-2 rounded-lg text-sm">Guardar</button>
                    <button onClick={() => setIsEditingClient(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2"><MapPin size={16} className="text-gray-400" /><span className="text-sm">{client.address || 'Sin dirección'}</span></div>
                  <div className="flex items-center gap-2"><Mail size={16} className="text-gray-400" /><span className="text-sm text-blue-600">{client.email || 'Sin email'}</span></div>
                  <div className="flex items-center gap-2"><Phone size={16} className="text-gray-400" /><span className="text-sm">{client.phone || 'Sin teléfono'}</span></div>
                  <div className="pt-3 border-t"><p className="text-xs text-gray-500">Contacto</p><p className="text-sm font-medium">{client.contactPerson || 'No especificado'}</p></div>
                </div>
              )}
            </Card>
            <Card title="Info Fiscal">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <div><p className="text-xs text-gray-500">CIF/NIF</p><p className="font-bold">{client.fiscalData?.taxId || '-'}</p></div>
                {getStatusBadge(client.status)}
              </div>
            </Card>
          </div>
          
          {/* Calendario de Contenidos */}
          <div className="mt-6">
            <Card title="">
              <CalendarioContenidos 
                clienteId={client.id} 
                metricoolBrandId={(client as any).metricoolBrandId}
              />
            </Card>
          </div>
          </>
        )}

        {/* PROJECTS TAB */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            {isLoadingProjects ? <p className="text-center py-8 text-gray-400">Cargando...</p> : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {proyectos.length ? proyectos.map(p => (
                    <div key={p.id} className="bg-white p-4 rounded-xl border">
                      <Badge variant={p.status === 'ACTIVE' ? 'success' : 'neutral'}>{p.status}</Badge>
                      <h4 className="font-bold mt-2">{p.title}</h4>
                    </div>
                  )) : <p className="col-span-2 text-gray-400">No hay proyectos</p>}
                </div>
                <Card title="Últimas Tareas" noPadding>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Tarea</th><th className="px-4 py-2">Estado</th><th className="px-4 py-2">Responsable</th></tr></thead>
                    <tbody>
                      {tareas.length ? tareas.slice(0,5).map(t => (
                        <tr key={t.id} className="border-t"><td className="px-4 py-2">{t.title}</td><td className="px-4 py-2"><Badge>{t.status}</Badge></td><td className="px-4 py-2">{t.assignee?.name || '-'}</td></tr>
                      )) : <tr><td colSpan={3} className="px-4 py-4 text-center text-gray-400">Sin tareas</td></tr>}
                    </tbody>
                  </table>
                </Card>
              </>
            )}
          </div>
        )}

        {/* CREDENTIALS TAB */}
        {activeTab === 'credentials' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div><h3 className="text-lg font-bold">Bóveda de Credenciales</h3><p className="text-sm text-gray-500">Accesos organizados por categoría</p></div>
              <button onClick={() => setShowAddCredential(true)} className="flex items-center gap-2 bg-elio-black text-white px-4 py-2 rounded-lg text-sm"><Plus size={16} />Añadir</button>
            </div>

            {isLoadingCredentials ? <p className="text-center py-8">Cargando...</p> : credentials.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-dashed border-2">
                <Shield size={40} className="mx-auto mb-3 text-gray-300" /><p className="text-gray-500">Sin credenciales</p>
              </div>
            ) : (
              <div className="space-y-3">
                {CREDENTIAL_CATEGORIES.map(cat => {
                  const items = credentialsByCategory[cat.id] || [];
                  if (!items.length) return null;
                  const Icon = cat.icon;
                  return (
                    <div key={cat.id} className="bg-white border rounded-xl overflow-hidden">
                      <button onClick={() => setExpandedCategories(prev => ({...prev, [cat.id]: !prev[cat.id]}))} className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100">
                        <div className="flex items-center gap-3">
                          <div className={"w-8 h-8 rounded-lg flex items-center justify-center " + cat.color}><Icon size={16} /></div>
                          <span className="font-bold">{cat.label}</span>
                          <span className="text-xs bg-gray-200 px-2 rounded-full">{items.length}</span>
                        </div>
                        {expandedCategories[cat.id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </button>
                      {expandedCategories[cat.id] && (
                        <div className="divide-y">
                          {items.map(cred => (
                            <div key={cred.id} className="p-4 hover:bg-gray-50">
                              <div className="flex justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold">{cred.platform}</h4>
                                    {cred.url && <a href={cred.url.startsWith('http') ? cred.url : 'https://' + cred.url} target="_blank" rel="noopener noreferrer" className="text-blue-500"><ExternalLink size={14} /></a>}
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                                    <div><span className="text-xs text-gray-500">Usuario</span><p className="font-mono">{cred.username}</p></div>
                                    <div><span className="text-xs text-gray-500">Contraseña</span>
                                      <div className="flex items-center gap-2">
                                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">{visiblePasswords[cred.id] ? cred.passwordEncrypted : '••••••••'}</code>
                                        <button onClick={() => setVisiblePasswords(prev => ({...prev, [cred.id]: !prev[cred.id]}))}>{visiblePasswords[cred.id] ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                                      </div>
                                    </div>
                                  </div>
                                  {cred.email && <p className="text-sm mt-2"><span className="text-gray-500">Email:</span> {cred.email}</p>}
                                  {cred.notes && <p className="text-xs mt-2 bg-yellow-50 p-2 rounded italic">📝 {cred.notes}</p>}
                                  <div className="mt-3 pt-2 border-t text-[10px] text-gray-400 flex gap-4">
                                    <span><Clock size={10} className="inline" /> Creado: {formatDate(cred.createdAt)} por {cred.createdByName || 'Sistema'}</span>
                                    {cred.updatedAt !== cred.createdAt && <span><Edit size={10} className="inline" /> Modificado: {formatDate(cred.updatedAt)} por {cred.lastModifiedByName}</span>}
                                  </div>
                                </div>
                                <div className="flex gap-1 ml-4">
                                  {cred.url && <a href={cred.url.startsWith('http') ? cred.url : 'https://' + cred.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-600"><ExternalLink size={16} /></a>}
                                  <button onClick={() => setEditingCredential(cred)} className="p-2 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-600"><Edit size={16} /></button>
                                  <button onClick={() => handleDeleteCredential(cred.id)} className="p-2 hover:bg-red-50 rounded text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TEAM TAB */}
        {activeTab === 'team' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div><h3 className="text-lg font-bold">Equipo Asignado</h3></div>
              <button onClick={() => setShowAddTeamMember(true)} className="flex items-center gap-2 bg-elio-black text-white px-4 py-2 rounded-lg text-sm"><Plus size={16} />Asignar</button>
            </div>
            {isLoadingTeam ? <p className="text-center py-8">Cargando...</p> : teamMembers.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-dashed border-2"><Users size={40} className="mx-auto mb-3 text-gray-300" /><p className="text-gray-500">Sin usuarios asignados</p></div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {teamMembers.map(m => (
                  <div key={m.id} className="bg-white p-4 rounded-xl border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold">{m.usuario.name.charAt(0)}</div>
                      <div><p className="font-bold">{m.usuario.name}</p><p className="text-xs text-gray-500">{m.usuario.position || m.usuario.role}</p>
                        {m.role === 'LEAD' && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Lead</span>}
                      </div>
                    </div>
                    <button onClick={() => handleRemoveTeamMember(m.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: Añadir Credencial */}
      <Modal isOpen={showAddCredential} onClose={() => setShowAddCredential(false)} title="Nueva Credencial">
        <div className="space-y-4">
          <select value={newCredential.category} onChange={e => setNewCredential(prev => ({...prev, category: e.target.value, platform: ''}))} className="w-full px-3 py-2 border rounded-lg text-sm">
            {CREDENTIAL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select value={newCredential.platform} onChange={e => setNewCredential(prev => ({...prev, platform: e.target.value}))} className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">Seleccionar...</option>
            {(PLATFORMS_BY_CATEGORY[newCredential.category] || []).map(p => <option key={p} value={p}>{p}</option>)}
            <option value="custom">-- Otro --</option>
          </select>
          {newCredential.platform === 'custom' && <input value={newCredential.customPlatform} onChange={e => setNewCredential(prev => ({...prev, customPlatform: e.target.value}))} placeholder="Nombre plataforma" className="w-full px-3 py-2 border rounded-lg text-sm" />}
          <input value={newCredential.url} onChange={e => setNewCredential(prev => ({...prev, url: e.target.value}))} placeholder="URL de acceso" className="w-full px-3 py-2 border rounded-lg text-sm" />
          <div className="grid grid-cols-2 gap-4">
            <input value={newCredential.username} onChange={e => setNewCredential(prev => ({...prev, username: e.target.value}))} placeholder="Usuario *" className="px-3 py-2 border rounded-lg text-sm" />
            <input value={newCredential.passwordEncrypted} onChange={e => setNewCredential(prev => ({...prev, passwordEncrypted: e.target.value}))} placeholder="Contraseña *" type="text" className="px-3 py-2 border rounded-lg text-sm font-mono" />
          </div>
          <input value={newCredential.email} onChange={e => setNewCredential(prev => ({...prev, email: e.target.value}))} placeholder="Email recuperación" className="w-full px-3 py-2 border rounded-lg text-sm" />
          <textarea value={newCredential.notes} onChange={e => setNewCredential(prev => ({...prev, notes: e.target.value}))} placeholder="Notas" rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" />
          <div className="flex gap-3">
            <button onClick={handleAddCredential} className="flex-1 bg-elio-yellow text-white py-2 rounded-lg">Guardar</button>
            <button onClick={() => setShowAddCredential(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Editar Credencial */}
      <Modal isOpen={!!editingCredential} onClose={() => setEditingCredential(null)} title="Editar Credencial">
        {editingCredential && (
          <div className="space-y-4">
            <select value={editingCredential.category} onChange={e => setEditingCredential(prev => prev ? {...prev, category: e.target.value} : null)} className="w-full px-3 py-2 border rounded-lg text-sm">
              {CREDENTIAL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <input value={editingCredential.platform} onChange={e => setEditingCredential(prev => prev ? {...prev, platform: e.target.value} : null)} placeholder="Plataforma" className="w-full px-3 py-2 border rounded-lg text-sm" />
            <input value={editingCredential.url || ''} onChange={e => setEditingCredential(prev => prev ? {...prev, url: e.target.value} : null)} placeholder="URL" className="w-full px-3 py-2 border rounded-lg text-sm" />
            <div className="grid grid-cols-2 gap-4">
              <input value={editingCredential.username} onChange={e => setEditingCredential(prev => prev ? {...prev, username: e.target.value} : null)} placeholder="Usuario" className="px-3 py-2 border rounded-lg text-sm" />
              <input value={editingCredential.passwordEncrypted} onChange={e => setEditingCredential(prev => prev ? {...prev, passwordEncrypted: e.target.value} : null)} placeholder="Contraseña" type="text" className="px-3 py-2 border rounded-lg text-sm font-mono" />
            </div>
            <input value={editingCredential.email || ''} onChange={e => setEditingCredential(prev => prev ? {...prev, email: e.target.value} : null)} placeholder="Email" className="w-full px-3 py-2 border rounded-lg text-sm" />
            <textarea value={editingCredential.notes || ''} onChange={e => setEditingCredential(prev => prev ? {...prev, notes: e.target.value} : null)} rows={2} placeholder="Notas" className="w-full px-3 py-2 border rounded-lg text-sm" />
            <div className="bg-gray-50 p-3 rounded text-xs text-gray-500">
              <p>Creado: {formatDate(editingCredential.createdAt)} por {editingCredential.createdByName}</p>
              {editingCredential.lastModifiedByName && <p>Modificado: {formatDate(editingCredential.updatedAt)} por {editingCredential.lastModifiedByName}</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={handleUpdateCredential} className="flex-1 bg-elio-yellow text-white py-2 rounded-lg">Guardar</button>
              <button onClick={() => setEditingCredential(null)} className="px-4 py-2 border rounded-lg">Cancelar</button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: Asignar Usuario */}
      <Modal isOpen={showAddTeamMember} onClose={() => setShowAddTeamMember(false)} title="Asignar Usuario">
        <div className="space-y-4">
          <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">Seleccionar...</option>
            {usuarios.filter(u => !teamMembers.some(m => m.usuarioId === u.id)).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="MEMBER">Miembro</option><option value="LEAD">Lead / Account Manager</option>
          </select>
          <div className="flex gap-3">
            <button onClick={handleAddTeamMember} className="flex-1 bg-elio-yellow text-white py-2 rounded-lg">Asignar</button>
            <button onClick={() => setShowAddTeamMember(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
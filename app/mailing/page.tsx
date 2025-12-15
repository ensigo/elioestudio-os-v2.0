import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { 
  Mail, Plus, Search, Send, MousePointer2, 
  Users, AlertOctagon, X, Save, Ban, Eye,
  BarChart2, Calendar, FileEdit
} from 'lucide-react';

// --- TYPES ---
type PlatformType = 'MAILCHIMP' | 'ACTIVECAMPAIGN' | 'KLAVIYO' | 'BREVO';
type StatusType = 'SENT' | 'SCHEDULED' | 'DRAFT';

interface MailingMetrics {
  delivered: number;
  opens: number;
  clicks: number;
  bounces: number;
  unsubscribes: number;
  spamComplaints: number;
}

interface MailingCampaign {
  id: string;
  internalName: string;
  subject: string;
  client: string;
  platform: PlatformType;
  status: StatusType;
  sendDate: string; // Fecha de envío o programada
  audienceSize: number;
  metrics?: MailingMetrics;
}

// --- MOCK DATA ---
const INITIAL_MAILINGS: MailingCampaign[] = [
  {
    id: 'em-001',
    internalName: 'Newsletter Noviembre - Black Friday Teaser',
    subject: '👀 ¿Preparado para lo que viene? Acceso VIP dentro.',
    client: 'TechSolutions S.L.',
    platform: 'MAILCHIMP',
    status: 'SENT',
    sendDate: '2025-11-15',
    audienceSize: 12500,
    metrics: {
      delivered: 12450,
      opens: 4890,
      clicks: 1205,
      bounces: 50,
      unsubscribes: 12,
      spamComplaints: 2
    }
  },
  {
    id: 'em-002',
    internalName: 'Automatización: Carrito Abandonado (Seq 1)',
    subject: 'Te has dejado algo increíble en el carrito...',
    client: 'Nike Store Madrid',
    platform: 'KLAVIYO',
    status: 'SENT',
    sendDate: 'Automático (Last 30 days)',
    audienceSize: 850,
    metrics: {
      delivered: 840,
      opens: 520, // High Open Rate typical for cart abandonment
      clicks: 210,
      bounces: 10,
      unsubscribes: 5,
      spamComplaints: 0
    }
  },
  {
    id: 'em-003',
    internalName: 'Promo Navidad - Early Bird',
    subject: 'Regala tecnología al mejor precio 🎁',
    client: 'TechSolutions S.L.',
    platform: 'ACTIVECAMPAIGN',
    status: 'SCHEDULED',
    sendDate: '2025-12-01',
    audienceSize: 15000,
    // No metrics yet
  },
  {
    id: 'em-004',
    internalName: 'Boletín Mensual: Tendencias SEO',
    subject: '[Borrador] 5 Cambios en el algoritmo de Google',
    client: 'Startup Unicornio',
    platform: 'BREVO',
    status: 'DRAFT',
    sendDate: '',
    audienceSize: 0,
  }
];

// --- CLIENTS MOCK ---
const MOCK_CLIENTS = [
  'TechSolutions S.L.',
  'Restaurante La Abuela',
  'Startup Unicornio',
  'Nike Store Madrid',
  'Clínica Dental Sonrisas'
];

export default function MailingPage() {
  // State
  const [mailings, setMailings] = useState<MailingCampaign[]>(INITIAL_MAILINGS);
  const [selectedMailing, setSelectedMailing] = useState<MailingCampaign | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Edit Mode State (Results Registration)
  const [isEditing, setIsEditing] = useState(false);
  const [editMetrics, setEditMetrics] = useState<MailingMetrics>({
      delivered: 0, opens: 0, clicks: 0, bounces: 0, unsubscribes: 0, spamComplaints: 0
  });

  // Init Edit Form when opening mailing
  useEffect(() => {
    if (selectedMailing) {
        setIsEditing(false);
        if (selectedMailing.metrics) {
            setEditMetrics(selectedMailing.metrics);
        } else {
            // Default init if no metrics exist
            setEditMetrics({
                delivered: selectedMailing.audienceSize,
                opens: 0,
                clicks: 0,
                bounces: 0,
                unsubscribes: 0,
                spamComplaints: 0
            });
        }
    }
  }, [selectedMailing]);

  // Create Form State
  const [formData, setFormData] = useState({
    client: '',
    internalName: '',
    subject: '',
    platform: 'MAILCHIMP' as PlatformType,
    status: 'DRAFT' as StatusType,
    sendDate: '',
    audienceSize: ''
  });

  // --- HELPERS ---
  const formatNumber = (num: number) => new Intl.NumberFormat('es-ES').format(num);

  const getStatusBadge = (status: StatusType) => {
    switch (status) {
      case 'SENT': return <Badge variant="success">Enviado</Badge>;
      case 'SCHEDULED': return <Badge variant="blue">Programado</Badge>;
      case 'DRAFT': return <Badge variant="neutral">Borrador</Badge>;
    }
  };

  const getPlatformBadge = (platform: PlatformType) => {
    let colorClass = '';
    switch (platform) {
      case 'MAILCHIMP': colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-200'; break;
      case 'KLAVIYO': colorClass = 'bg-green-50 text-green-800 border-green-200'; break;
      case 'ACTIVECAMPAIGN': colorClass = 'bg-blue-50 text-blue-800 border-blue-200'; break;
      default: colorClass = 'bg-gray-100 text-gray-700 border-gray-200';
    }
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${colorClass}`}>
        {platform}
      </span>
    );
  };

  // KPI Calculations
  const calculateRate = (part: number, total: number) => {
    if (!total || total === 0) return '0.0%';
    return ((part / total) * 100).toFixed(1) + '%';
  };

  // --- HANDLERS ---
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.internalName || !formData.client) return;

    const newMailing: MailingCampaign = {
      id: `em-${Date.now()}`,
      internalName: formData.internalName,
      subject: formData.subject || '(Sin Asunto)',
      client: formData.client,
      platform: formData.platform,
      status: formData.status,
      sendDate: formData.sendDate || 'Pendiente',
      audienceSize: formData.audienceSize ? parseInt(formData.audienceSize) : 0,
      metrics: undefined
    };

    setMailings([newMailing, ...mailings]);
    setIsCreateModalOpen(false);
    
    // Reset
    setFormData({
      client: '', internalName: '', subject: '', platform: 'MAILCHIMP', status: 'DRAFT', sendDate: '', audienceSize: ''
    });
  };

  const handleUpdateMetrics = () => {
    if (!selectedMailing) return;

    const updatedMailing = {
        ...selectedMailing,
        status: 'SENT' as StatusType, // Force status to SENT if we are adding metrics
        metrics: editMetrics
    };

    setMailings(mailings.map(m => m.id === selectedMailing.id ? updatedMailing : m));
    setSelectedMailing(updatedMailing);
    setIsEditing(false);
  };

  const MetricInput = ({ label, value, field }: { label: string, value: number, field: keyof MailingMetrics }) => (
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{label}</label>
        <input 
            type="number" 
            value={value}
            onChange={(e) => setEditMetrics({...editMetrics, [field]: parseInt(e.target.value) || 0})}
            className="w-full border border-gray-300 rounded px-3 py-2 text-lg font-bold text-gray-900 focus:border-elio-yellow outline-none bg-white"
        />
      </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="text-elio-yellow" /> E-mail Marketing
          </h1>
          <p className="text-gray-500 text-sm">Auditoría de campañas, newsletters y automatizaciones.</p>
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
             <input type="text" placeholder="Buscar mailing..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:border-elio-yellow" />
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-elio-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2 font-medium whitespace-nowrap shadow-sm"
          >
             <Plus size={18} />
             <span>Nuevo Mailing</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <Card noPadding className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Plataforma</th>
                <th className="px-6 py-4">Campaña / Asunto</th>
                <th className="px-6 py-4">Audiencia</th>
                <th className="px-6 py-4 text-right">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mailings.map(mail => (
                <tr 
                  key={mail.id} 
                  onClick={() => setSelectedMailing(mail)}
                  className="group hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">{getStatusBadge(mail.status)}</td>
                  <td className="px-6 py-4">{getPlatformBadge(mail.platform)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col max-w-md">
                      <span className="font-bold text-gray-900 group-hover:text-elio-yellow-hover truncate transition-colors">{mail.internalName}</span>
                      <span className="text-xs text-gray-500 truncate italic">
                        {mail.subject}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-1 uppercase font-bold">{mail.client}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                     <div className="flex items-center gap-2">
                        <Users size={14} className="text-gray-400"/>
                        {mail.audienceSize > 0 ? formatNumber(mail.audienceSize) : '-'}
                     </div>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-500 font-mono text-xs">
                     {mail.sendDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* --- MODAL DETALLE / REGISTRO RESULTADOS --- */}
      {selectedMailing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedMailing(null)} />
          
          <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className={`border-b border-gray-100 px-6 py-5 flex justify-between items-start transition-colors ${isEditing ? 'bg-yellow-50' : 'bg-slate-50'}`}>
               <div>
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusBadge(selectedMailing.status)}
                    {getPlatformBadge(selectedMailing.platform)}
                    <span className="text-xs font-mono text-gray-400 uppercase">ID: {selectedMailing.id}</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 line-clamp-1">{selectedMailing.internalName}</h2>
                  <p className="text-sm text-gray-500 mt-1"><span className="font-bold text-gray-700">Asunto:</span> {selectedMailing.subject}</p>
               </div>
               
               <div className="flex items-center gap-2">
                 {isEditing ? (
                   <>
                      <button 
                        onClick={() => setIsEditing(false)} 
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      >
                         <X size={20} />
                      </button>
                      <button 
                        onClick={handleUpdateMetrics} 
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-green-700 shadow-sm"
                      >
                         <Save size={16} /> Guardar Resultados
                      </button>
                   </>
                 ) : (
                   <>
                      <button 
                        onClick={() => setIsEditing(true)} 
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-gray-50 shadow-sm"
                      >
                         <FileEdit size={16} /> Registrar Resultados
                      </button>
                      <button onClick={() => setSelectedMailing(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={24} />
                      </button>
                   </>
                 )}
               </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto bg-gray-50/50">
              
              {isEditing ? (
                /* --- EDIT MODE FORM --- */
                <div className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800 mb-4 flex items-center">
                        <AlertOctagon size={16} className="mr-2" />
                        Edita los valores absolutos. Los porcentajes se calcularán automáticamente al guardar.
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <MetricInput label="Entregados (Delivered)" value={editMetrics.delivered} field="delivered" />
                        <MetricInput label="Aperturas (Opens)" value={editMetrics.opens} field="opens" />
                        <MetricInput label="Clics Totales" value={editMetrics.clicks} field="clicks" />
                        <MetricInput label="Rebotes (Bounces)" value={editMetrics.bounces} field="bounces" />
                        <MetricInput label="Bajas (Unsubs)" value={editMetrics.unsubscribes} field="unsubscribes" />
                        <MetricInput label="Quejas Spam" value={editMetrics.spamComplaints} field="spamComplaints" />
                    </div>
                </div>
              ) : (
                /* --- READ MODE --- */
                <>
                {(!selectedMailing.metrics || (selectedMailing.status !== 'SENT' && !selectedMailing.metrics)) ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BarChart2 size={48} className="text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-600">Métricas no disponibles</h3>
                    <p className="text-gray-400 max-w-sm">
                        Esta campaña aún está en estado <strong>{selectedMailing.status}</strong>. 
                        Pulsa "Registrar Resultados" para añadir datos manualmente.
                    </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                    {/* Row 1: Positive Engagement */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        {/* Open Rate */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Eye size={14}/> Tasa de Apertura</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">
                                    {calculateRate(selectedMailing.metrics!.opens, selectedMailing.metrics!.delivered)}
                                </p>
                            </div>
                            <div className="bg-blue-50 text-blue-600 p-2 rounded-lg"><Eye size={20}/></div>
                            </div>
                            <p className="text-xs text-gray-400">{formatNumber(selectedMailing.metrics!.opens)} aperturas únicas</p>
                            <div className="w-full bg-gray-100 h-1 mt-4 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full" style={{ width: calculateRate(selectedMailing.metrics!.opens, selectedMailing.metrics!.delivered) }}></div>
                            </div>
                        </div>

                        {/* CTR */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><MousePointer2 size={14}/> Tasa de Clics (CTR)</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">
                                    {calculateRate(selectedMailing.metrics!.clicks, selectedMailing.metrics!.delivered)}
                                </p>
                            </div>
                            <div className="bg-green-50 text-green-600 p-2 rounded-lg"><MousePointer2 size={20}/></div>
                            </div>
                            <p className="text-xs text-gray-400">{formatNumber(selectedMailing.metrics!.clicks)} clics totales</p>
                            <div className="w-full bg-gray-100 h-1 mt-4 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full" style={{ width: calculateRate(selectedMailing.metrics!.clicks, selectedMailing.metrics!.delivered) }}></div>
                            </div>
                        </div>

                        {/* Deliverability */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Send size={14}/> Entregabilidad</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">
                                    {calculateRate(selectedMailing.metrics!.delivered, selectedMailing.audienceSize)}
                                </p>
                            </div>
                            <div className="bg-purple-50 text-purple-600 p-2 rounded-lg"><Send size={20}/></div>
                            </div>
                            <p className="text-xs text-gray-400">{formatNumber(selectedMailing.metrics!.delivered)} entregados de {formatNumber(selectedMailing.audienceSize)}</p>
                        </div>
                    </div>

                    {/* Row 2: Negative Engagement (The Audit Part) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center justify-between">
                            <div>
                            <p className="text-xs font-bold text-red-500 uppercase flex items-center gap-1 mb-1"><Ban size={14}/> Rebotes (Bounces)</p>
                            <p className="text-xl font-bold text-red-900">{formatNumber(selectedMailing.metrics!.bounces)}</p>
                            <p className="text-[10px] text-red-400">Emails no existentes o buzones llenos.</p>
                            </div>
                            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-red-500 font-bold text-xs shadow-sm">
                            {calculateRate(selectedMailing.metrics!.bounces, selectedMailing.audienceSize)}
                            </div>
                        </div>

                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-center justify-between">
                            <div>
                            <p className="text-xs font-bold text-orange-600 uppercase flex items-center gap-1 mb-1"><AlertOctagon size={14}/> Bajas + Spam</p>
                            <p className="text-xl font-bold text-orange-900">{selectedMailing.metrics!.unsubscribes + selectedMailing.metrics!.spamComplaints}</p>
                            <p className="text-[10px] text-orange-500">Usuarios que han rechazado el correo.</p>
                            </div>
                            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-orange-500 font-bold text-xs shadow-sm">
                            {calculateRate(selectedMailing.metrics!.unsubscribes + selectedMailing.metrics!.spamComplaints, selectedMailing.audienceSize)}
                            </div>
                        </div>
                    </div>

                    </div>
                )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL CREAR (FORM) --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCreateModalOpen(false)} />
           
           <div className="relative bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
                 <h3 className="font-bold text-lg text-gray-800">Planificar Nuevo Mailing</h3>
                 <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>

              <form onSubmit={handleCreate} className="p-6 overflow-y-auto space-y-5">
                 {/* Form content remains same... */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cliente <span className="text-red-500">*</span></label>
                       <select 
                         required
                         className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50 bg-white"
                         value={formData.client}
                         onChange={e => setFormData({...formData, client: e.target.value})}
                       >
                          <option value="">Seleccionar cliente...</option>
                          {MOCK_CLIENTS.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Interno <span className="text-red-500">*</span></label>
                       <input 
                         required
                         type="text" 
                         placeholder="Ej: Newsletter Octubre" 
                         className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
                         value={formData.internalName}
                         onChange={e => setFormData({...formData, internalName: e.target.value})}
                       />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Asunto (Subject Line)</label>
                    <input 
                      type="text" 
                      placeholder="El asunto que verá el usuario..." 
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
                      value={formData.subject}
                      onChange={e => setFormData({...formData, subject: e.target.value})}
                    />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Plataforma</label>
                       <select 
                         className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50 bg-white"
                         value={formData.platform}
                         onChange={e => setFormData({...formData, platform: e.target.value as PlatformType})}
                       >
                          <option value="MAILCHIMP">Mailchimp</option>
                          <option value="ACTIVECAMPAIGN">ActiveCampaign</option>
                          <option value="KLAVIYO">Klaviyo</option>
                          <option value="BREVO">Brevo</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estado Inicial</label>
                       <select 
                         className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50 bg-white"
                         value={formData.status}
                         onChange={e => setFormData({...formData, status: e.target.value as StatusType})}
                       >
                          <option value="DRAFT">Borrador</option>
                          <option value="SCHEDULED">Programado</option>
                          <option value="SENT">Enviado (Log manual)</option>
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha Envío</label>
                       <input 
                         type="date" 
                         className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
                         value={formData.sendDate}
                         onChange={e => setFormData({...formData, sendDate: e.target.value})}
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tamaño Audiencia (Aprox)</label>
                       <input 
                         type="number" 
                         placeholder="0"
                         className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
                         value={formData.audienceSize}
                         onChange={e => setFormData({...formData, audienceSize: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className="pt-4 flex justify-end gap-3 border-t border-gray-50 mt-4">
                   <button 
                     type="button" 
                     onClick={() => setIsCreateModalOpen(false)} 
                     className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors"
                   >
                     Cancelar
                   </button>
                   <button 
                     type="submit" 
                     className="px-6 py-2 bg-elio-yellow text-white rounded-lg font-bold hover:bg-elio-yellow-hover transition-colors shadow-lg shadow-elio-yellow/20 flex items-center"
                   >
                     <Save size={18} className="mr-2" /> Guardar Mailing
                   </button>
                 </div>

              </form>
           </div>
        </div>
      )}

    </div>
  );
}
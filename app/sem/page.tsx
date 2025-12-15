import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { 
  Megaphone, Search, Plus, TrendingUp, DollarSign, 
  MousePointer2, Users, Target, BarChart2, Calendar,
  ExternalLink, X, Save, Edit2, RotateCcw
} from 'lucide-react';

// --- TYPES ---
type PlatformType = 'GOOGLE' | 'META' | 'TIKTOK';
type StatusType = 'ACTIVE' | 'PAUSED' | 'ENDED' | 'PLANNED';

interface Campaign {
  id: string;
  name: string;
  client: string;
  platform: PlatformType;
  status: StatusType;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  kpis: {
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    cpa: number;
    roas: number;
  }
}

// --- MOCK DATA INICIAL ---
const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'cmp-001',
    name: 'Black Friday 2025 - Conversión',
    client: 'TechSolutions S.L.',
    platform: 'META',
    status: 'ACTIVE',
    startDate: '2025-11-20',
    endDate: '2025-11-30',
    budget: 5000,
    spent: 3250.50,
    kpis: {
      impressions: 150420,
      clicks: 4520,
      ctr: 3.01,
      conversions: 185,
      cpa: 17.57,
      roas: 4.5
    }
  },
  {
    id: 'cmp-002',
    name: 'Lanzamiento Web - Search Brand',
    client: 'Restaurante La Abuela',
    platform: 'GOOGLE',
    status: 'ACTIVE',
    startDate: '2025-10-01',
    endDate: '2025-12-31',
    budget: 1200,
    spent: 850.00,
    kpis: {
      impressions: 25000,
      clicks: 1200,
      ctr: 4.8,
      conversions: 350, 
      cpa: 2.42,
      roas: 12.0
    }
  },
  {
    id: 'cmp-003',
    name: 'Retargeting Carrito Abandonado',
    client: 'TechSolutions S.L.',
    platform: 'META',
    status: 'PAUSED',
    startDate: '2025-09-01',
    endDate: '2025-09-30',
    budget: 1000,
    spent: 980.00,
    kpis: {
      impressions: 45000,
      clicks: 980,
      ctr: 2.17,
      conversions: 45,
      cpa: 21.77,
      roas: 2.8
    }
  },
  {
    id: 'cmp-004',
    name: 'Captación Leads Q4',
    client: 'Startup Unicornio',
    platform: 'GOOGLE',
    status: 'ACTIVE',
    startDate: '2025-10-01',
    endDate: '2025-12-31',
    budget: 10000,
    spent: 4500.00,
    kpis: {
      impressions: 89000,
      clicks: 3500,
      ctr: 3.93,
      conversions: 120,
      cpa: 37.50,
      roas: 1.5
    }
  }
];

// --- CLIENTS MOCK FOR SELECT ---
const MOCK_CLIENTS = [
  'TechSolutions S.L.',
  'Restaurante La Abuela',
  'Startup Unicornio',
  'Nike Store Madrid',
  'Clínica Dental Sonrisas'
];

export default function SemPage() {
  // Main State
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  
  // Creation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    client: '',
    platform: 'GOOGLE' as PlatformType,
    status: 'ACTIVE' as StatusType,
    budget: '',
    startDate: '',
    endDate: ''
  });

  // Edit Mode State (Inside Detail Modal)
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Campaign | null>(null);

  // --- EFFECT: Sync Edit Form when selecting campaign ---
  useEffect(() => {
    if (selectedCampaign) {
      setEditForm(selectedCampaign);
      setIsEditing(false); // Reset edit mode on open
    } else {
        setEditForm(null);
    }
  }, [selectedCampaign]);

  // --- HELPERS ---
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  
  const formatNumber = (num: number) => 
    new Intl.NumberFormat('es-ES').format(num);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="success">Activa</Badge>;
      case 'PAUSED': return <Badge variant="neutral">Pausada</Badge>;
      case 'ENDED': return <Badge variant="danger">Finalizada</Badge>;
      case 'PLANNED': return <Badge variant="blue">Planificada</Badge>;
      default: return <Badge>Desconocido</Badge>;
    }
  };

  const getPlatformIcon = (platform: string) => {
    if (platform === 'GOOGLE') return (
      <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 font-bold text-[10px]">
        <span className="w-2 h-2 rounded-full bg-blue-500"></span> Google Ads
      </div>
    );
    if (platform === 'TIKTOK') return (
      <div className="flex items-center gap-1 bg-slate-900 text-white px-2 py-1 rounded border border-slate-700 font-bold text-[10px]">
        <span className="w-2 h-2 rounded-full bg-cyan-400"></span> TikTok Ads
      </div>
    );
    return (
      <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 font-bold text-[10px]">
        <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Meta Ads
      </div>
    );
  };

  const getDurationDays = (start: string, end: string) => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (isNaN(s) || isNaN(e)) return '--';
    const days = Math.ceil((e - s) / (1000 * 3600 * 24));
    return `${days} días`;
  };

  const calculateProgress = (spent: number, budget: number) => {
    if (budget === 0) return 0;
    const percent = (spent / budget) * 100;
    return Math.min(percent, 100);
  };

  // --- HANDLERS: CREATE ---
  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.name || !createFormData.client || !createFormData.budget) return;

    const newCampaign: Campaign = {
      id: `cmp-${Date.now()}`,
      name: createFormData.name,
      client: createFormData.client,
      platform: createFormData.platform,
      status: createFormData.status,
      budget: parseFloat(createFormData.budget),
      startDate: createFormData.startDate,
      endDate: createFormData.endDate,
      spent: 0,
      kpis: {
        impressions: 0,
        clicks: 0,
        ctr: 0,
        conversions: 0,
        cpa: 0,
        roas: 0
      }
    };

    setCampaigns([newCampaign, ...campaigns]);
    setIsCreateModalOpen(false);
    
    setCreateFormData({
      name: '',
      client: '',
      platform: 'GOOGLE',
      status: 'ACTIVE',
      budget: '',
      startDate: '',
      endDate: ''
    });
  };

  // --- HANDLERS: UPDATE (EDIT MODE) ---
  const handleEditChange = (field: string, value: any, isKpi = false) => {
      if (!editForm) return;

      if (isKpi) {
          // Update KPI and Recalculate derived metrics
          const newKpis = { ...editForm.kpis, [field]: parseFloat(value) || 0 };
          
          // Auto Calc CTR
          if (newKpis.impressions > 0) {
              newKpis.ctr = parseFloat(((newKpis.clicks / newKpis.impressions) * 100).toFixed(2));
          } else {
              newKpis.ctr = 0;
          }

          // Auto Calc CPA
          // Need to use current spent or updated spent? 
          // If we update spent (root level), we need to pass it here.
          // Let's assume 'field' is one of the inputs.
          
          setEditForm({ ...editForm, kpis: newKpis });
      } else {
          // Root level update (Spent, Budget, Status)
          const updatedForm = { ...editForm, [field]: value };
          
          // If spending changed, recalc CPA
          if (field === 'spent') {
              const spent = parseFloat(value) || 0;
              const conversions = updatedForm.kpis.conversions;
              if (conversions > 0) {
                  updatedForm.kpis.cpa = parseFloat((spent / conversions).toFixed(2));
              } else {
                  updatedForm.kpis.cpa = 0;
              }
          }

          setEditForm(updatedForm);
      }
  };

  // Specific handler for conversions to update CPA
  const handleConversionChange = (val: string) => {
      if (!editForm) return;
      const conv = parseFloat(val) || 0;
      const spent = editForm.spent;
      
      const newKpis = { ...editForm.kpis, conversions: conv };
      
      if (conv > 0) {
          newKpis.cpa = parseFloat((spent / conv).toFixed(2));
      } else {
          newKpis.cpa = 0;
      }
      
      setEditForm({ ...editForm, kpis: newKpis });
  };

  const handleSaveChanges = () => {
      if (!editForm) return;
      // Update the main list
      setCampaigns(campaigns.map(c => c.id === editForm.id ? editForm : c));
      setSelectedCampaign(editForm); // Update view
      setIsEditing(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="text-elio-yellow" /> Gestión SEM & Social Ads
          </h1>
          <p className="text-gray-500 text-sm">Control unificado de campañas de pago (PPC).</p>
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
             <input type="text" placeholder="Buscar campaña..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:border-elio-yellow" />
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-elio-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2 font-medium whitespace-nowrap shadow-sm"
          >
             <Plus size={18} />
             <span>Nueva Campaña</span>
          </button>
        </div>
      </div>

      {/* Campaigns Table */}
      <Card noPadding className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Plataforma</th>
                <th className="px-6 py-4">Cliente / Campaña</th>
                <th className="px-6 py-4">Duración</th>
                <th className="px-6 py-4 text-right">Inversión</th>
                <th className="px-6 py-4 text-center">ROAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaigns.map(camp => (
                <tr 
                  key={camp.id} 
                  onClick={() => setSelectedCampaign(camp)}
                  className="group hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    {getStatusBadge(camp.status)}
                  </td>
                  <td className="px-6 py-4">
                    {getPlatformIcon(camp.platform)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 group-hover:text-elio-yellow-hover transition-colors">{camp.name}</span>
                      <span className="text-xs text-gray-500">{camp.client}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-600">
                      <span className="block font-medium">{getDurationDays(camp.startDate, camp.endDate)}</span>
                      <span className="text-gray-400">{camp.startDate} - {camp.endDate}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                     <div className="flex flex-col items-end">
                       <span className="font-mono font-medium text-gray-900">{formatCurrency(camp.spent)}</span>
                       <span className="text-[10px] text-gray-400">de {formatCurrency(camp.budget)}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-bold ${camp.kpis.roas >= 4 ? 'text-green-600' : camp.kpis.roas >= 2 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {camp.kpis.roas}x
                    </span>
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                    No hay campañas activas. Crea una nueva para comenzar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* --- MODAL DETALLE / EDICIÓN --- */}
      {selectedCampaign && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedCampaign(null)} />
          
          <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Header Modal */}
            <div className={`border-b border-gray-100 px-6 py-5 flex justify-between items-start transition-colors ${isEditing ? 'bg-yellow-50' : 'bg-slate-50'}`}>
               <div>
                  <div className="flex items-center gap-3 mb-2">
                    {/* Status is editable in Edit Mode */}
                    {isEditing ? (
                        <select 
                            value={editForm.status}
                            onChange={(e) => handleEditChange('status', e.target.value)}
                            className="text-xs font-bold uppercase rounded border border-gray-300 px-2 py-1 bg-white outline-none focus:border-elio-yellow"
                        >
                            <option value="ACTIVE">Activa</option>
                            <option value="PAUSED">Pausada</option>
                            <option value="PLANNED">Planificada</option>
                            <option value="ENDED">Finalizada</option>
                        </select>
                    ) : (
                        getStatusBadge(editForm.status)
                    )}
                    
                    {getPlatformIcon(editForm.platform)}
                    <span className="text-xs font-mono text-gray-400 uppercase">ID: {editForm.id}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{editForm.name}</h2>
                  <p className="text-sm text-gray-500">{editForm.client}</p>
               </div>
               
               <div className="flex items-center gap-2">
                 {isEditing ? (
                   <>
                     <button 
                        onClick={() => setIsEditing(false)} // Cancel
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors" 
                        title="Cancelar edición"
                     >
                        <X size={20} />
                     </button>
                     <button 
                        onClick={handleSaveChanges} 
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-green-700 shadow-sm"
                     >
                        <Save size={16} /> Guardar
                     </button>
                   </>
                 ) : (
                   <>
                     <button 
                        onClick={() => setIsEditing(true)} 
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-gray-50 shadow-sm"
                     >
                        <Edit2 size={16} /> Actualizar Datos
                     </button>
                     <button onClick={() => setSelectedCampaign(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={24} />
                     </button>
                   </>
                 )}
               </div>
            </div>

            {/* Body: Dashboard */}
            <div className="p-6 overflow-y-auto bg-gray-50/50">
               
               {/* 1. Investment Bar & Edit */}
               <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6">
                  <div className="flex justify-between items-end mb-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2 mb-2">
                        <DollarSign size={14} /> Inversión & Presupuesto
                      </h4>
                      
                      <div className="flex items-center gap-4">
                          {/* Spent Input */}
                          <div>
                              <label className="text-xs text-gray-400 block mb-1">Gastado</label>
                              {isEditing ? (
                                  <div className="relative">
                                      <input 
                                        type="number" 
                                        value={editForm.spent} 
                                        onChange={(e) => handleEditChange('spent', e.target.value)}
                                        className="text-2xl font-bold text-gray-900 border-b-2 border-elio-yellow bg-transparent outline-none w-32 focus:bg-yellow-50"
                                      />
                                      <span className="absolute right-0 bottom-2 text-sm text-gray-400">€</span>
                                  </div>
                              ) : (
                                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(editForm.spent)}</p>
                              )}
                          </div>
                          
                          <span className="text-gray-300 text-2xl font-light">/</span>

                          {/* Budget Input */}
                          <div>
                              <label className="text-xs text-gray-400 block mb-1">Presupuesto</label>
                              {isEditing ? (
                                  <div className="relative">
                                      <input 
                                        type="number" 
                                        value={editForm.budget} 
                                        onChange={(e) => handleEditChange('budget', e.target.value)}
                                        className="text-xl font-bold text-gray-600 border-b border-gray-300 bg-transparent outline-none w-28 focus:border-elio-yellow focus:bg-yellow-50"
                                      />
                                      <span className="absolute right-0 bottom-1 text-xs text-gray-400">€</span>
                                  </div>
                              ) : (
                                  <p className="text-xl font-medium text-gray-500">{formatCurrency(editForm.budget)}</p>
                              )}
                          </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-700">{calculateProgress(editForm.spent, editForm.budget).toFixed(1)}% Consumido</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-elio-yellow h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${calculateProgress(editForm.spent, editForm.budget)}%` }}
                    ></div>
                  </div>
               </div>

               {/* 2. KPI GRID */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Impressions */}
                  <div className={`p-4 rounded-xl border shadow-sm transition-all ${isEditing ? 'bg-white border-yellow-300 shadow-md' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <Users size={16} />
                      <span className="text-xs font-bold uppercase">Impresiones</span>
                    </div>
                    {isEditing ? (
                        <input 
                            type="number" 
                            value={editForm.kpis.impressions}
                            onChange={(e) => handleEditChange('impressions', e.target.value, true)}
                            className="w-full text-2xl font-bold text-gray-900 border-b-2 border-gray-200 focus:border-elio-yellow outline-none bg-transparent"
                        />
                    ) : (
                        <p className="text-2xl font-bold text-gray-900">{formatNumber(editForm.kpis.impressions)}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">Alcance Total</p>
                  </div>

                  {/* Clicks & CTR */}
                  <div className={`p-4 rounded-xl border shadow-sm transition-all ${isEditing ? 'bg-white border-yellow-300 shadow-md' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <MousePointer2 size={16} />
                      <span className="text-xs font-bold uppercase">Clics & CTR</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                       {isEditing ? (
                           <input 
                                type="number" 
                                value={editForm.kpis.clicks}
                                onChange={(e) => handleEditChange('clicks', e.target.value, true)}
                                className="w-24 text-2xl font-bold text-gray-900 border-b-2 border-gray-200 focus:border-elio-yellow outline-none bg-transparent"
                            />
                       ) : (
                           <p className="text-2xl font-bold text-gray-900">{formatNumber(editForm.kpis.clicks)}</p>
                       )}
                       
                       {/* CTR is Auto-calculated */}
                       <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${editForm.kpis.ctr > 2 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {editForm.kpis.ctr}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                        {isEditing ? 'CTR se autocalcula' : 'Calidad del Anuncio'}
                    </p>
                  </div>

                  {/* Conversions */}
                  <div className={`p-4 rounded-xl border shadow-sm transition-all ${isEditing ? 'bg-white border-yellow-300 shadow-md' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <Target size={16} />
                      <span className="text-xs font-bold uppercase">Conversiones</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                       {isEditing ? (
                            <input 
                                type="number" 
                                value={editForm.kpis.conversions}
                                onChange={(e) => handleConversionChange(e.target.value)}
                                className="w-24 text-2xl font-bold text-gray-900 border-b-2 border-gray-200 focus:border-elio-yellow outline-none bg-transparent"
                            />
                       ) : (
                            <p className="text-2xl font-bold text-gray-900">{editForm.kpis.conversions}</p>
                       )}
                       
                       <div className="text-right">
                         <p className="text-xs font-bold text-gray-700">{formatCurrency(editForm.kpis.cpa)}</p>
                         <p className="text-[10px] text-gray-400">CPA (Auto)</p>
                       </div>
                    </div>
                  </div>

                  {/* ROAS */}
                  <div className={`p-4 rounded-xl border shadow-sm transition-all relative overflow-hidden ${isEditing ? 'bg-white border-yellow-300 shadow-md' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <TrendingUp size={16} />
                      <span className="text-xs font-bold uppercase">ROAS</span>
                    </div>
                    
                    {isEditing ? (
                         <div className="flex items-center">
                            <input 
                                type="number"
                                step="0.1" 
                                value={editForm.kpis.roas}
                                onChange={(e) => handleEditChange('roas', e.target.value, true)}
                                className="w-20 text-3xl font-bold text-gray-900 border-b-2 border-gray-200 focus:border-elio-yellow outline-none bg-transparent z-10 relative"
                            />
                            <span className="text-xl font-bold text-gray-400 ml-1">x</span>
                         </div>
                    ) : (
                        <p className={`text-3xl font-bold ${editForm.kpis.roas >= 4 ? 'text-green-500' : 'text-gray-900'}`}>
                        {editForm.kpis.roas}x
                        </p>
                    )}
                    
                    <p className="text-xs text-gray-400 mt-1">Retorno de Inversión</p>
                    {/* Visual decoration */}
                    <div className={`absolute bottom-0 right-0 p-2 opacity-10 ${editForm.kpis.roas >= 4 ? 'text-green-500' : 'text-gray-400'}`}>
                      <BarChart2 size={48} />
                    </div>
                  </div>

               </div>
               
               {/* Footer Info */}
               <div className="mt-6 flex justify-end">
                  {!isEditing && (
                    <a href="#" className="flex items-center text-sm text-blue-600 hover:underline font-medium">
                        Ver reporte detallado en {editForm.platform === 'GOOGLE' ? 'Google Ads' : editForm.platform === 'TIKTOK' ? 'TikTok Business' : 'Meta Business Suite'} <ExternalLink size={14} className="ml-1" />
                    </a>
                  )}
               </div>

            </div>
          </div>
        </div>
      )}

      {/* --- MODAL NUEVA CAMPAÑA (CRUD) --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCreateModalOpen(false)} />
          
          <div className="relative bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
             <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-lg text-gray-800">Alta de Nueva Campaña</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
             </div>

             <form onSubmit={handleCreateCampaign} className="p-6 overflow-y-auto space-y-5">
                {/* Form fields same as before... */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cliente <span className="text-red-500">*</span></label>
                      <select 
                        required
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50 bg-white"
                        value={createFormData.client}
                        onChange={e => setCreateFormData({...createFormData, client: e.target.value})}
                      >
                         <option value="">Seleccionar cliente...</option>
                         {MOCK_CLIENTS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Campaña <span className="text-red-500">*</span></label>
                      <input 
                        required
                        type="text" 
                        placeholder="Ej: Promo Verano 2026" 
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
                        value={createFormData.name}
                        onChange={e => setCreateFormData({...createFormData, name: e.target.value})}
                      />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Plataforma <span className="text-red-500">*</span></label>
                      <div className="flex gap-2">
                         {(['GOOGLE', 'META', 'TIKTOK'] as PlatformType[]).map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setCreateFormData({...createFormData, platform: p})}
                              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                                createFormData.platform === p 
                                  ? 'bg-elio-black text-white border-elio-black' 
                                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                               {p}
                            </button>
                         ))}
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estado Inicial</label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50 bg-white"
                        value={createFormData.status}
                        onChange={e => setCreateFormData({...createFormData, status: e.target.value as StatusType})}
                      >
                         <option value="ACTIVE">Activa</option>
                         <option value="PAUSED">Pausada</option>
                         <option value="PLANNED">Planificada</option>
                      </select>
                   </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Inversión (€)</label>
                      <input 
                        required
                        type="number" 
                        min="0"
                        placeholder="0.00" 
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
                        value={createFormData.budget}
                        onChange={e => setCreateFormData({...createFormData, budget: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha Inicio</label>
                      <input 
                        required
                        type="date" 
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
                        value={createFormData.startDate}
                        onChange={e => setCreateFormData({...createFormData, startDate: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha Fin</label>
                      <input 
                        required
                        type="date" 
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
                        value={createFormData.endDate}
                        onChange={e => setCreateFormData({...createFormData, endDate: e.target.value})}
                      />
                   </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
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
                     <Save size={18} className="mr-2" /> Guardar Campaña
                   </button>
                </div>

             </form>
          </div>
        </div>
      )}

    </div>
  );
}
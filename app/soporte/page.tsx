'use client';
import React, { useState } from 'react';
import { Search, FileText, Download, Upload, Filter, X, Check, Trash2, ChevronDown, AlertCircle } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

// --- MOCK DATA ---
const INITIAL_DOCS = [
  { id: 1, name: 'Guía de Estilo ElioEstudio.pdf', familia: 'Diseño', subfamilia: 'Branding', fecha: '10/12/2025' },
  { id: 2, name: 'Protocolo Eliminación Backlinks.pdf', familia: 'SEO', subfamilia: 'Off-page', fecha: '12/12/2025' },
  { id: 3, name: 'Manual de Onboarding.pdf', familia: 'RRHH', subfamilia: 'Procesos', fecha: '01/12/2025' },
  { id: 4, name: 'Plantilla Factura Clientes.docx', familia: 'Administración', subfamilia: 'Finanzas', fecha: '15/12/2025' },
];

const FAMILIES = ['Diseño', 'SEO', 'RRHH', 'Administración', 'Desarrollo'];
const SUBFAMILIES = ['Branding', 'Off-page', 'On-page', 'Procesos', 'Finanzas', 'Recursos', 'Legal', 'Frontend'];

export default function SoportePage() {
  // State
  const [docs, setDocs] = useState(INITIAL_DOCS);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [filterFamily, setFilterFamily] = useState('');
  
  // Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    familia: '',
    subfamilia: '',
    file: null as File | null
  });

  // --- LOGIC: Filter ---
  const filteredDocs = docs.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFamily = filterFamily === '' || d.familia === filterFamily;
    return matchesSearch && matchesFamily;
  });

  // --- ACTIONS ---
  const handleDownload = (docName: string) => {
    // Simulación de descarga
    const confirm = window.confirm(`¿Quieres descargar "${docName}"?`);
    if (confirm) {
      // Aquí iría la llamada real al backend
      setTimeout(() => alert(`✅ Descarga completada: ${docName}`), 500);
    }
  };

  const handleDelete = (id: number) => {
    const confirm = window.confirm("¿Seguro que quieres eliminar este documento? Esta acción no se puede deshacer.");
    if (confirm) {
      setDocs(docs.filter(d => d.id !== id));
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.name || !uploadForm.familia || !uploadForm.file) {
      alert("Por favor completa los campos obligatorios.");
      return;
    }

    const newDoc = {
      id: Date.now(),
      name: uploadForm.name, // Usamos el nombre manual o el del archivo
      familia: uploadForm.familia,
      subfamilia: uploadForm.subfamilia || 'General',
      fecha: new Date().toLocaleDateString('es-ES')
    };

    setDocs([newDoc, ...docs]);
    
    // Reset & Close
    setUploadForm({ name: '', familia: '', subfamilia: '', file: null });
    setIsUploadModalOpen(false);
    alert("✅ Documento subido y clasificado correctamente.");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadForm(prev => ({
        ...prev,
        file: file,
        name: prev.name || file.name // Auto-fill name if empty
      }));
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Biblioteca de Conocimiento</h1>
          <p className="text-slate-500">Repositorio centralizado de manuales y procedimientos.</p>
        </div>
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 shadow-md transition-all active:scale-95"
        >
          <Upload size={18} /> Subir Documento
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px] flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar documento..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${showFilters ? 'bg-slate-100 border-slate-300 text-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <Filter size={18} /> Filtros <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-slate-50 p-4 border-b border-slate-200 animate-in slide-in-from-top-2">
             <div className="max-w-xs">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Filtrar por Familia</label>
                <select 
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  value={filterFamily}
                  onChange={e => setFilterFamily(e.target.value)}
                >
                   <option value="">Todas las familias</option>
                   {FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
             </div>
          </div>
        )}
        
        {/* Table */}
        <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                <tr>
                <th className="p-4 font-medium">Documento</th>
                <th className="p-4 font-medium">Categorización</th>
                <th className="p-4 font-medium">Fecha Subida</th>
                <th className="p-4 font-medium text-right">Acciones</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {filteredDocs.length > 0 ? filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4">
                        <div className="flex items-center gap-3 font-medium text-slate-700">
                           <div className="p-2 bg-red-50 text-red-500 rounded-lg group-hover:bg-red-100 transition-colors border border-red-100">
                             <FileText size={20} />
                           </div>
                           <span className="truncate max-w-[250px]">{doc.name}</span>
                        </div>
                    </td>
                    <td className="p-4">
                       <div className="flex flex-col items-start gap-1">
                          <Badge variant="neutral">{doc.familia}</Badge>
                          <span className="text-xs text-slate-400 pl-1">{doc.subfamilia}</span>
                       </div>
                    </td>
                    <td className="p-4 text-slate-500 text-sm">{doc.fecha}</td>
                    <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                               onClick={() => handleDownload(doc.name)}
                               className="text-slate-400 hover:text-slate-900 p-2 hover:bg-slate-200 rounded-lg transition-all"
                               title="Descargar"
                           >
                               <Download size={18} />
                           </button>
                           <button 
                               onClick={() => handleDelete(doc.id)}
                               className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all"
                               title="Eliminar Documento"
                           >
                               <Trash2 size={18} />
                           </button>
                        </div>
                    </td>
                </tr>
                )) : (
                    <tr>
                        <td colSpan={4} className="p-12 text-center">
                           <div className="flex flex-col items-center justify-center text-slate-400">
                              <FileText size={48} className="mb-4 opacity-20" />
                              <p className="text-lg font-medium">No se encontraron documentos.</p>
                              <p className="text-sm">Prueba a cambiar los filtros o sube uno nuevo.</p>
                           </div>
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>

      {/* MODAL UPLOAD */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                 <h3 className="font-bold text-lg text-slate-800">Subir Documento</h3>
                 <button onClick={() => setIsUploadModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
              </div>
              
              <form onSubmit={handleUploadSubmit} className="space-y-5 overflow-y-auto pr-2">
                 
                 {/* File Input */}
                 <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative group">
                    <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    />
                    <div className="flex flex-col items-center gap-2">
                        {uploadForm.file ? (
                            <>
                                <div className="p-3 bg-green-100 text-green-600 rounded-full mb-1">
                                   <Check size={24} />
                                </div>
                                <span className="font-bold text-slate-800 text-sm break-all px-4">{uploadForm.file.name}</span>
                                <span className="text-xs text-green-600 font-medium">Archivo seleccionado</span>
                            </>
                        ) : (
                            <>
                                <div className="p-3 bg-slate-100 text-slate-400 rounded-full mb-1 group-hover:bg-slate-200 transition-colors">
                                   <Upload size={24} />
                                </div>
                                <span className="font-medium text-slate-600 text-sm">Haz clic para seleccionar</span>
                                <span className="text-xs text-slate-400">PDF, Office (Max 10MB)</span>
                            </>
                        )}
                    </div>
                 </div>

                 {/* Metadata Inputs */}
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Visible <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      className="w-full border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all text-sm" 
                      required 
                      placeholder="Ej: Manual de Identidad 2024"
                      value={uploadForm.name} 
                      onChange={e => setUploadForm({...uploadForm, name: e.target.value})} 
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Familia <span className="text-red-500">*</span></label>
                        <select 
                           className="w-full border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-slate-400 text-sm bg-white"
                           required
                           value={uploadForm.familia}
                           onChange={e => setUploadForm({...uploadForm, familia: e.target.value})}
                        >
                           <option value="">Seleccionar...</option>
                           {FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subfamilia</label>
                        <select 
                           className="w-full border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-slate-400 text-sm bg-white"
                           value={uploadForm.subfamilia}
                           onChange={e => setUploadForm({...uploadForm, subfamilia: e.target.value})}
                        >
                           <option value="">(General)</option>
                           {SUBFAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                 </div>

                 <div className="flex gap-3 pt-2">
                     <button type="button" onClick={() => setIsUploadModalOpen(false)} className="flex-1 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-lg text-sm">Cancelar</button>
                     <button 
                        type="submit" 
                        disabled={!uploadForm.file} 
                        className="flex-1 py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg shadow-slate-900/20"
                     >
                        Guardar Documento
                     </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
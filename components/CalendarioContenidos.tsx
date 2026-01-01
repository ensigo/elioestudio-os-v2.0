import React, { useState, useEffect } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, RefreshCw, ExternalLink, 
  AlertCircle, Loader2 
} from 'lucide-react';
import { 
  FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok, FaYoutube, 
  FaTwitter, FaPinterestP, FaGoogle 
} from 'react-icons/fa';

interface Post {
  id: string;
  scheduledDate: string;
  networks: string[];
  content: string;
  mediaUrl?: string;
  status: string;
}

interface CalendarioContenidosProps {
  clienteId: string;
  metricoolBrandId?: string | null;
}

const NETWORK_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  facebook: { icon: FaFacebookF, color: '#1877F2', bg: 'bg-blue-100' },
  instagram: { icon: FaInstagram, color: '#E4405F', bg: 'bg-pink-100' },
  linkedin: { icon: FaLinkedinIn, color: '#0A66C2', bg: 'bg-blue-100' },
  tiktok: { icon: FaTiktok, color: '#000000', bg: 'bg-gray-100' },
  youtube: { icon: FaYoutube, color: '#FF0000', bg: 'bg-red-100' },
  twitter: { icon: FaTwitter, color: '#1DA1F2', bg: 'bg-blue-100' },
  pinterest: { icon: FaPinterestP, color: '#E60023', bg: 'bg-red-100' },
  google: { icon: FaGoogle, color: '#4285F4', bg: 'bg-blue-100' },
  googlebusiness: { icon: FaGoogle, color: '#4285F4', bg: 'bg-blue-100' },
};

export const CalendarioContenidos: React.FC<CalendarioContenidosProps> = ({ 
  clienteId, 
  metricoolBrandId 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Cargar posts programados
  const fetchScheduledPosts = async () => {
    if (!metricoolBrandId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(
        `/api/clientes?resource=metricool&action=scheduled&brandId=${metricoolBrandId}`
      );
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al cargar posts');
      }
      
      const data = await res.json();
      
      // Transformar datos de Metricool al formato que necesitamos
      // La API devuelve { data: [...] }
      const postsArray = data.data || data.posts || data || [];
      const transformedPosts = postsArray.map((post: any) => ({
        id: post.id || post._id,
        scheduledDate: post.publicationDate?.dateTime || post.scheduledDate || post.date || new Date().toISOString(),
        networks: post.providers?.map((p: any) => p.network) || [],
        content: post.text || post.content || '',
        mediaUrl: post.media?.[0] || post.mediaUrl,
        status: post.providers?.[0]?.status || 'scheduled'
      }));
      
      setPosts(transformedPosts);
      setLastSync(new Date());
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (metricoolBrandId) {
      fetchScheduledPosts();
    }
  }, [metricoolBrandId]);

  // Navegación del calendario
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Generar días del mes
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Lunes = 0

    const days: (Date | null)[] = [];
    
    // Días vacíos al inicio
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Días del mes
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  // Obtener posts de un día específico
  const getPostsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return posts.filter(post => {
      const postDate = new Date(post.scheduledDate).toISOString().split('T')[0];
      return postDate === dateStr;
    });
  };

  // Calcular última fecha con contenido programado
  const getLastScheduledDate = () => {
    if (posts.length === 0) return null;
    const sortedPosts = [...posts].sort((a, b) => 
      new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
    );
    return new Date(sortedPosts[0].scheduledDate);
  };

  const lastScheduledDate = getLastScheduledDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Renderizar icono de red social
  const renderNetworkIcon = (network: string, size: 'sm' | 'md' = 'sm') => {
    const config = NETWORK_CONFIG[network.toLowerCase()] || NETWORK_CONFIG.google;
    const Icon = config.icon;
    const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    
    return (
      <div 
        className={`${sizeClass} rounded-full flex items-center justify-center`}
        style={{ color: config.color }}
      >
        <Icon size={size === 'sm' ? 12 : 16} />
      </div>
    );
  };

  // Si no hay metricoolBrandId configurado
  if (!metricoolBrandId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
        <AlertCircle className="mx-auto mb-3 text-yellow-500" size={32} />
        <h4 className="font-bold text-yellow-800 mb-1">Metricool no vinculado</h4>
        <p className="text-sm text-yellow-700">
          Vincula este cliente con una marca de Metricool para ver el calendario de contenidos.
        </p>
      </div>
    );
  }

  const days = getDaysInMonth();
  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="space-y-4">
      {/* Header con info y sincronización */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Calendar size={20} className="text-slate-400" />
            Calendario de Contenidos
          </h3>
          {lastScheduledDate && (
            <p className="text-sm text-slate-500 mt-1">
              Contenido programado hasta: {' '}
              <span className="font-semibold text-green-600">
                {lastScheduledDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {lastSync && (
            <span className="text-xs text-slate-400">
              Última sync: {lastSync.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchScheduledPosts}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Sincronizar
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Navegación del mes */}
      <div className="flex items-center justify-between bg-slate-50 rounded-lg p-2">
        <button onClick={prevMonth} className="p-2 hover:bg-white rounded-lg transition-colors">
          <ChevronLeft size={20} className="text-slate-600" />
        </button>
        <span className="font-semibold text-slate-800">
          {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={nextMonth} className="p-2 hover:bg-white rounded-lg transition-colors">
          <ChevronRight size={20} className="text-slate-600" />
        </button>
      </div>

      {/* Calendario */}
      {loading && posts.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          {/* Cabecera días de la semana */}
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
            {weekDays.map(day => (
              <div key={day} className="py-2 text-center text-xs font-bold text-slate-500 uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="min-h-[80px] bg-slate-50/50 border-b border-r border-slate-100" />;
              }

              const dayPosts = getPostsForDay(day);
              const isToday = day.toDateString() === new Date().toDateString();
              const isPast = day < today;

              return (
                <div 
                  key={day.toISOString()} 
                  className={`min-h-[80px] p-1 border-b border-r border-slate-100 ${
                    isToday ? 'bg-yellow-50' : isPast ? 'bg-slate-50/50' : 'bg-white'
                  }`}
                >
                  <div className={`text-xs font-medium mb-1 ${
                    isToday ? 'text-yellow-600' : isPast ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {day.getDate()}
                  </div>
                  
                  <div className="space-y-0.5">
                    {dayPosts.slice(0, 3).map((post, postIdx) => (
                      <div 
                        key={post.id || postIdx}
                        className="flex items-center gap-1 px-1 py-0.5 bg-white rounded border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors"
                        title={post.content}
                        onClick={() => setSelectedPost(post)}
                      >
                        <div className="flex -space-x-1">
                          {(post.networks || []).slice(0, 3).map((network, nIdx) => (
                            <div key={nIdx}>
                              {renderNetworkIcon(network)}
                            </div>
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-500 truncate flex-1">
                          {new Date(post.scheduledDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                    {dayPosts.length > 3 && (
                      <div className="text-[10px] text-slate-400 text-center">
                        +{dayPosts.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resumen de redes sociales */}
      {posts.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="text-xs text-slate-500">Redes activas:</span>
          {Object.keys(NETWORK_CONFIG).map(network => {
            const count = posts.filter(p => 
              p.networks?.some(n => n.toLowerCase() === network)
            ).length;
            if (count === 0) return null;
            
            return (
              <div key={network} className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-full">
                {renderNetworkIcon(network)}
                <span className="text-xs text-slate-600">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de detalle del post */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPost(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Detalle de publicación</h3>
              <button onClick={() => setSelectedPost(null)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Fecha y hora */}
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar size={16} />
                <span>
                  {new Date(selectedPost.scheduledDate).toLocaleDateString('es-ES', { 
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                  })}
                  {' a las '}
                  {new Date(selectedPost.scheduledDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Estado */}
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedPost.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                  selectedPost.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {selectedPost.status === 'PUBLISHED' ? '✓ Publicado' : 
                   selectedPost.status === 'PENDING' ? '⏳ Programado' : selectedPost.status}
                </span>
              </div>

              {/* Redes sociales */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Redes:</span>
                <div className="flex gap-1">
                  {selectedPost.networks.map((network, idx) => (
                    <div key={idx}>{renderNetworkIcon(network, 'md')}</div>
                  ))}
                </div>
              </div>

              {/* Contenido */}
              <div>
                <p className="text-sm text-slate-500 mb-1">Contenido:</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg">
                  {selectedPost.content || 'Sin contenido'}
                </p>
              </div>

              {/* Media */}
              {selectedPost.mediaUrl && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Media:</p>
                  {selectedPost.mediaUrl.includes('.mp4') ? (
                    <video src={selectedPost.mediaUrl} controls className="w-full rounded-lg max-h-48 object-cover" />
                  ) : (
                    <img src={selectedPost.mediaUrl} alt="Media" className="w-full rounded-lg max-h-48 object-cover" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
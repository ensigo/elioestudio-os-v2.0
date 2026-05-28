import { FC, useState, FormEvent } from 'react';
import { LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

export const LoginPage: FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await onLogin(email, password);
    
    if (!result.success) {
      setError(result.error || 'Error al iniciar sesión');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex">
      {/* Panel izquierdo — marca */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-elio-yellow p-12">
        <img src="/images/logo_vertical.png" alt="ElioEstudio" className="h-16 w-auto object-contain object-left" />
        <div>
          <p className="text-5xl font-bold text-white leading-tight mb-4">
            Tu estudio,<br />en orden.
          </p>
          <p className="text-yellow-100 text-base leading-relaxed">
            Gestión de proyectos, clientes y equipo desde un solo lugar.
          </p>
        </div>
        <p className="text-yellow-200/60 text-xs">© {new Date().getFullYear()} ElioEstudio</p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Logo móvil */}
          <div className="lg:hidden text-center mb-10">
            <img src="/images/logo_vertical.png" alt="ElioEstudio" className="h-20 mx-auto invert" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Accede a tu cuenta</h1>
            <p className="text-slate-400 text-sm mt-1">Introduce tus credenciales para continuar</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
              <AlertCircle size={16} className="flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-elio-yellow focus:bg-white/8 transition-all text-white placeholder-slate-600 text-sm"
                placeholder="tu@elioestudio.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-elio-yellow focus:bg-white/8 transition-all text-white placeholder-slate-600 text-sm pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-elio-yellow text-white font-bold rounded-xl hover:bg-elio-yellow-hover transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} />
                  Entrar
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-600 mt-8">
            ¿Problemas para acceder? Contacta al administrador
          </p>
        </div>
      </div>
    </div>
  );
};
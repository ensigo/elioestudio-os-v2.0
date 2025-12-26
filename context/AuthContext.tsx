import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Usuario {
  id: string;
  name: string;
  email: string;
  role: string;
  position: string | null;
  avatarUrl: string | null;
}

interface AuthContextType {
  usuario: Usuario | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  canAccessReports: boolean;
  canManageUsers: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar sesión al cargar
  useEffect(() => {
    const checkSession = async () => {
      const storedUserId = localStorage.getItem('elioUserId');
      
      if (storedUserId) {
        try {
          const response = await fetch(`/api/auth?userId=${storedUserId}`);
          if (response.ok) {
            const data = await response.json();
            setUsuario(data.usuario);
          } else {
            localStorage.removeItem('elioUserId');
          }
        } catch (err) {
          console.error('Error verificando sesión:', err);
          localStorage.removeItem('elioUserId');
        }
      }
      
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      setUsuario(data.usuario);
      localStorage.setItem('elioUserId', data.usuario.id);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('elioUserId');
  };

  const canAccessReports = usuario?.role === 'ADMIN' || usuario?.role === 'SUPERADMIN';
  const canManageUsers = usuario?.role === 'ADMIN' || usuario?.role === 'SUPERADMIN';

  return (
    <AuthContext.Provider value={{
      usuario,
      isLoading,
      isAuthenticated: !!usuario,
      login,
      logout,
      canAccessReports,
      canManageUsers
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
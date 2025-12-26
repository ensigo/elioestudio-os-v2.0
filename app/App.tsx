import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

// Páginas
import { DashboardPage } from './page';
import { ClientsPage as ClientesPage } from './clientes/page';
import { ProjectsPage as ProyectosPage } from './proyectos/page';
import { TasksPage as TareasPage } from './tareas/page';
import { CalendarPage as CalendarioPage } from './calendario/page';
import { TeamPage as EquipoPage } from './equipo/page';
import ReportesPage from './reportes/page';
import { TicketsPage } from './tickets/page';
import SemPage from './sem/page';
import MailingPage from './mailing/page';
import SoportePage from './soporte/page';
import ConfiguracionPage from './configuracion/page';
import { LoginPage } from './login/page';

import { TimeTrackingProvider } from '../context/TimeTrackingContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { GlobalTimerWidget } from '../components/GlobalTimerWidget';

// Componente interno que usa el contexto de auth
function AppContent() {
  const { usuario, isLoading, isAuthenticated, login, logout, canAccessReports } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Mostrar loading mientras verifica sesión
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-elio-yellow/30 border-t-elio-yellow rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  // Proteger reportes
  const handleNavigate = (page: string) => {
    if (page === 'reportes' && !canAccessReports) {
      alert('No tienes permisos para acceder a esta sección');
      return;
    }
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'clientes': return <ClientesPage />;
      case 'proyectos': return <ProyectosPage />;
      case 'tareas': return <TareasPage />;
      case 'calendario': return <CalendarioPage />;
      case 'equipo': return <EquipoPage />;
      case 'reportes': return canAccessReports ? <ReportesPage /> : <DashboardPage />;
      case 'tickets': return <TicketsPage />;
      case 'sem': return <SemPage />;
      case 'mailing': return <MailingPage />;
      case 'soporte': return <SoportePage />;
      case 'configuracion': return <ConfiguracionPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <TimeTrackingProvider>
      <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
        <Sidebar 
          activeTab={currentPage} 
          onNavigate={handleNavigate} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          userRole={usuario?.role}
        />

        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden lg:ml-64 transition-all duration-300">
          <Header usuario={usuario} onLogout={logout} />
          
          <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative bg-slate-50">
            <div className="max-w-7xl mx-auto pb-20">
              {renderPage()}
            </div>
          </main>
        </div>
        
        <GlobalTimerWidget />
      </div>
    </TimeTrackingProvider>
  );
}

// Componente principal con Provider
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
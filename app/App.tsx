import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

// Importaciones con Alias para coincidir con el Switch solicitado
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

import { TimeTrackingProvider } from '../context/TimeTrackingContext';
import { GlobalTimerWidget } from '../components/GlobalTimerWidget';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'clientes': return <ClientesPage />;
      case 'proyectos': return <ProyectosPage />;
      case 'tareas': return <TareasPage />;
      case 'calendario': return <CalendarioPage />;
      case 'equipo': return <EquipoPage />;
      case 'reportes': return <ReportesPage />;
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
        {/* Sidebar Navigation */}
        <Sidebar 
          activeTab={currentPage} 
          onNavigate={setCurrentPage} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Layout Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden lg:ml-64 transition-all duration-300">
          <Header />
          
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative bg-slate-50">
            <div className="max-w-7xl mx-auto pb-20">
              {renderPage()}
            </div>
          </main>
        </div>
        
        {/* Essential Business Widgets Only */}
        <GlobalTimerWidget />
      </div>
    </TimeTrackingProvider>
  );
}
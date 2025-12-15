import { Client, Project, UserProfile, Task, TimeEntry, CalendarEvent } from '../types';

export const MOCK_USERS: UserProfile[] = [
  { id: 'u1', name: 'Alejandro Magno', email: 'alex@elio.com', role: 'ADMIN', position: 'Director', joinDate: '2022-01-01' },
  { id: 'u2', name: 'Elena Nito', email: 'elena@elio.com', role: 'MANAGER', position: 'Project Manager', joinDate: '2022-03-15' },
  { id: 'u3', name: 'Aitor Tilla', email: 'aitor@elio.com', role: 'DEV', position: 'Senior Dev', joinDate: '2023-01-10' },
  { id: 'u4', name: 'Ana Tomía', email: 'ana@elio.com', role: 'DESIGNER', position: 'Lead Designer', joinDate: '2023-05-20' },
];

export const MOCK_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'TechSolutions S.L.',
    fiscalData: { taxId: 'B12345678', address: 'Calle Tecnológica 12, Madrid' },
    status: 'ACTIVE',
    responsibleId: 'u2',
    lastActivity: 'Hace 2 horas',
    email: 'contacto@techsolutions.com',
    phone: '+34 910 000 000',
    contactPerson: 'Carlos CTO',
    address: 'Calle Tecnológica 12, Madrid',
    contract: {
      startDate: '2023-01-01',
      endDate: '2023-12-31',
      services: ['WEB', 'MAINTENANCE', 'SEO'],
      monthlyHours: 40,
      hourlyRate: 65
    },
    credentials: [
      { id: 'cr1', platform: 'WordPress Admin', url: 'https://techsolutions.com/wp-admin', username: 'admin_elio', passwordEncrypted: 'RicoPollo123!', notes: 'Acceso total' },
      { id: 'cr2', platform: 'FTP', url: 'ftp.techsolutions.com', username: 'ftp_user', passwordEncrypted: 'X992_ss!!', notes: 'Solo carpeta /public_html' }
    ]
  },
  {
    id: 'c2',
    name: 'Restaurante La Abuela',
    fiscalData: { taxId: 'B87654321', address: 'Plaza Mayor 1, Valencia' },
    status: 'RISK', // Critical status
    responsibleId: 'u1',
    lastActivity: 'Hace 5 días',
    email: 'info@laabuela.es',
    phone: '+34 600 123 456',
    contactPerson: 'Doña María',
    address: 'Plaza Mayor 1, Valencia',
    contract: {
      startDate: '2022-06-01',
      endDate: '2023-06-01',
      services: ['SOCIAL', 'SEM'],
      monthlyHours: 15,
      hourlyRate: 50
    },
    credentials: [
      { id: 'cr3', platform: 'Instagram', username: '@laabuela_vlc', passwordEncrypted: 'PaellaValenciana2023', notes: 'Verificación en dos pasos activa (Móvil María)' }
    ]
  },
  {
    id: 'c3',
    name: 'Startup Unicornio',
    fiscalData: { taxId: 'B99999999', address: 'Av. Diagonal 200, Barcelona' },
    status: 'PAUSED',
    responsibleId: 'u2',
    lastActivity: 'Hace 3 semanas',
    email: 'founders@unicorn.io',
    phone: '+34 930 999 999',
    contactPerson: 'Marc Founder',
    address: 'Av. Diagonal 200, Barcelona',
    contract: {
      startDate: '2023-09-01',
      endDate: '2024-09-01',
      services: ['SEO', 'SEM', 'WEB'],
      monthlyHours: 80,
      hourlyRate: 75
    },
    credentials: []
  }
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    title: 'Desarrollo E-commerce',
    clientId: 'c1', // Link to TechSolutions
    status: 'ACTIVE',
    budget: 15000,
    deadline: '2023-12-31',
    isArchived: false,
    tags: ['Web', 'Shopify']
  },
  {
    id: 'p2',
    title: 'Campaña SEO Q4',
    clientId: 'c1', // Link to TechSolutions
    status: 'ACTIVE',
    budget: 3500,
    deadline: '2023-11-30',
    isArchived: false,
    tags: ['SEO', 'Content']
  },
  {
    id: 'p3',
    title: 'Rebranding Redes Sociales',
    clientId: 'c2', // Link to Restaurante La Abuela (RISK)
    status: 'BLOCKED', // Matches client risk
    budget: 1200,
    deadline: '2023-10-15',
    isArchived: false,
    tags: ['Social', 'Design']
  },
  {
    id: 'p4',
    title: 'Auditoría Técnica',
    clientId: 'c3', // Link to Startup Unicornio
    status: 'PENDING',
    budget: 5000,
    deadline: '2024-01-20',
    isArchived: false,
    tags: ['Audit', 'Consulting']
  },
  {
    id: 'p5',
    title: 'Mantenimiento Web Mensual',
    clientId: 'c2',
    status: 'ACTIVE',
    budget: 500,
    deadline: '2023-12-31',
    isArchived: false,
    tags: ['Maintenance']
  }
];

export const MOCK_TASKS: Task[] = [
  // 1. Tarea "Vencida ayer" (Red Alert)
  {
    id: 't1',
    title: 'Entrega final wireframes Home',
    description: 'Debe incluir la versión móvil y desktop.',
    status: 'PENDING',
    priority: 'URGENT',
    type: 'STRATEGIC',
    projectId: 'p3', // Rebranding (La Abuela)
    assigneeId: 'u4', // Ana Designer
    estimatedHours: 4,
    dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    subtasks: []
  },
  // 2. Tarea "Para hoy" (Red/Orange Alert)
  {
    id: 't2',
    title: 'Revisión Google Analytics Semanal',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    type: 'OPERATIONAL',
    projectId: 'p5', // Mantenimiento
    assigneeId: 'u2', // Elena
    estimatedHours: 1,
    dueDate: new Date().toISOString().split('T')[0], // Today
    subtasks: []
  },
  // 3. Tarea con checklist incompleto (Blocked Closure)
  {
    id: 't3',
    title: 'Integración Pasarela Stripe',
    description: 'Configurar webhooks y testear pagos.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    type: 'OPERATIONAL',
    projectId: 'p1', // E-commerce
    assigneeId: 'u3', // Aitor Dev
    estimatedHours: 8,
    dueDate: '2023-12-15',
    subtasks: [
      { id: 'st1', title: 'Obtener API Keys', isCompleted: true },
      { id: 'st2', title: 'Configurar Webhooks', isCompleted: false },
      { id: 'st3', title: 'Testear pagos sandbox', isCompleted: false }
    ]
  },
  {
    id: 't4',
    title: 'Keyword Research',
    status: 'IN_REVIEW',
    priority: 'MEDIUM',
    type: 'STRATEGIC',
    projectId: 'p2',
    assigneeId: 'u2',
    estimatedHours: 5,
    dueDate: '2023-11-20',
    subtasks: []
  },
  {
    id: 't5',
    title: 'Reunión Kickoff Cliente',
    status: 'CLOSED',
    priority: 'HIGH',
    type: 'MEETING',
    projectId: 'p1',
    assigneeId: 'u1',
    estimatedHours: 1,
    dueDate: '2023-09-01',
    subtasks: []
  }
];

// MOCK TIME ENTRIES FOR AUDIT
// Current Date string
const today = new Date();
const todayStr = today.toISOString().split('T')[0];
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split('T')[0];

export const MOCK_TIME_ENTRIES: TimeEntry[] = [
  // User 1 (Admin/Director) - 6h total (Good)
  { id: 'te1', userId: 'u1', taskId: 't5', startTime: `${todayStr}T09:00:00`, endTime: `${todayStr}T11:00:00`, durationSeconds: 7200, isManual: false, createdAt: todayStr },
  { id: 'te2', userId: 'u1', taskId: 't4', startTime: `${todayStr}T12:00:00`, endTime: `${todayStr}T16:00:00`, durationSeconds: 14400, isManual: true, description: 'Revisión estratégica', createdAt: todayStr },

  // User 2 (Manager) - 7.5h total (Excellent)
  { id: 'te3', userId: 'u2', taskId: 't2', startTime: `${todayStr}T08:30:00`, endTime: `${todayStr}T13:00:00`, durationSeconds: 16200, isManual: false, createdAt: todayStr },
  { id: 'te4', userId: 'u2', taskId: 't4', startTime: `${todayStr}T14:00:00`, endTime: `${todayStr}T17:00:00`, durationSeconds: 10800, isManual: false, createdAt: todayStr },

  // User 3 (Dev - Aitor Tilla) - 3h total (LOW PERFORMANCE ALERT)
  { id: 'te5', userId: 'u3', taskId: 't3', startTime: `${todayStr}T10:00:00`, endTime: `${todayStr}T13:00:00`, durationSeconds: 10800, isManual: false, createdAt: todayStr },
  // No afternoon entries for Aitor!

  // User 4 (Designer) - 5h total (Medium)
  { id: 'te6', userId: 'u4', taskId: 't1', startTime: `${todayStr}T09:00:00`, endTime: `${todayStr}T14:00:00`, durationSeconds: 18000, isManual: false, createdAt: todayStr },
];

// MOCK CALENDAR EVENTS
const nextFriday = new Date(today);
nextFriday.setDate(today.getDate() + (5 - today.getDay())); // Set to next Friday

const vacationStart = new Date(today); // Vacation starts today for 3 days to verify yellow bar

export const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: 'e1',
    title: 'Daily Meeting',
    type: 'MEETING',
    startDate: todayStr,
    startTime: '09:30',
    attendees: ['u1', 'u2', 'u3', 'u4']
  },
  {
    id: 'e2',
    title: 'Daily Meeting',
    type: 'MEETING',
    startDate: yesterdayStr,
    startTime: '09:30',
    attendees: ['u1', 'u2', 'u3', 'u4']
  },
  {
    id: 'e3',
    title: 'Entrega Fase 1: E-commerce',
    type: 'DEADLINE',
    startDate: nextFriday.toISOString().split('T')[0],
    startTime: '17:00',
    relatedTaskId: 't3',
    description: 'Entrega crítica al cliente.'
  },
  {
    id: 'e4',
    title: 'Ana Tomía - Vacaciones',
    type: 'VACATION',
    startDate: todayStr,
    endDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0], // 3 days
    attendees: ['u4'],
    description: 'Vacaciones aprobadas por RRHH'
  }
];

// Helper to get client name (Simulating a JOIN)
export const getClientName = (clientId: string) => {
  const client = MOCK_CLIENTS.find(c => c.id === clientId);
  return client ? client.name : 'Unknown Client';
};

// Helper to get project title
export const getProjectName = (projectId: string) => {
  const project = MOCK_PROJECTS.find(p => p.id === projectId);
  return project ? project.title : 'Unknown Project';
};

// Helper to get responsible name
export const getResponsibleName = (userId: string) => {
  const user = MOCK_USERS.find(u => u.id === userId);
  return user ? user.name : 'Unassigned';
};

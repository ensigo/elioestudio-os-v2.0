import { UserProfile, UserRole } from './types';

// CAMBIA ESTO A 'ADMIN' O 'DEV' PARA PROBAR
export const CURRENT_USER_ROLE: Omit<UserProfile, 'id' | 'joinDate' | 'email'> = {
  name: 'Alejandro Magno',
  role: 'ADMIN', 
  position: 'Director de Operaciones',
  avatarUrl: undefined
};

export const MOCK_NOTIFICATIONS = [
  { id: 1, title: 'Presupuesto aprobado', message: 'Cliente Nike ha validado el Q3.', time: '10m', type: 'success' },
  { id: 2, title: 'Alerta de Deadline', message: 'Proyecto Webflow vence en 48h.', time: '1h', type: 'warning' },
];

export const ROADMAP = [
  {
    phase: 1,
    name: 'Foundation & Security',
    modules: ['Authentication', 'Role Management', 'Database Schema'],
    validationGoal: 'Secure user login and persistent role-based access.'
  },
  {
    phase: 2,
    name: 'Task Core',
    modules: ['Task CRUD', 'Status Logic', 'Assignment System'],
    validationGoal: 'Complete task lifecycle management without logical errors.'
  },
  {
    phase: 3,
    name: 'Productivity Suite',
    modules: ['Time Tracking', 'Reporting', 'Notifications'],
    validationGoal: 'Accurate time logging and real-time user alerts.'
  }
];

export const SCHEMA_DEFINITIONS = [
  {
    name: 'Users',
    type: 'auth.users',
    fields: [
      { name: 'id', type: 'uuid', constraints: ['PK', 'DEFAULT gen_random_uuid()'] },
      { name: 'email', type: 'text', constraints: ['UNIQUE', 'NOT NULL'] },
      { name: 'role', type: 'varchar', constraints: ['CHECK (role IN (...))'] },
    ],
    policies: [
      'SELECT: auth.uid() = id',
      'UPDATE: auth.uid() = id OR auth.role() = "admin"',
    ]
  },
  {
    name: 'Tasks',
    type: 'public.tasks',
    fields: [
      { name: 'id', type: 'uuid', constraints: ['PK'] },
      { name: 'project_id', type: 'uuid', constraints: ['FK (projects.id)'] },
      { name: 'status', type: 'text', constraints: ['DEFAULT "PENDING"'] },
    ],
    policies: [
      'ALL: auth.role() IN ("admin", "manager")',
      'SELECT: auth.uid() = assignee_id',
    ]
  }
];

export const CRITICAL_RISKS = [
  {
    id: 'R1',
    impactLevel: 'Critical',
    title: 'Data Loss (Race Condition)',
    scenario: 'Two users update the same task status simultaneously.',
    technicalSolution: 'Optimistic Concurrency Control (OCC) using "updated_at" versioning.'
  },
  {
    id: 'R2',
    impactLevel: 'High',
    title: 'Role Escalation',
    scenario: 'Malicious user modifies local storage role to "ADMIN".',
    technicalSolution: 'Server-side session validation + JWT signature verification.'
  },
  {
    id: 'R3',
    impactLevel: 'Medium',
    title: 'Orphaned Data',
    scenario: 'Deleting a project leaves tasks in limbo.',
    technicalSolution: 'Foreign Key ON DELETE CASCADE constraints.'
  }
];

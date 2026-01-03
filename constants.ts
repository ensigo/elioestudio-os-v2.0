import { UserProfile, UserRole } from './types';

// Configuración de roles (referencia)
export const ROLES: UserRole[] = ['SUPERADMIN', 'ADMIN', 'MANAGER', 'DEV', 'DESIGNER', 'SEO'];

// Roadmap del proyecto (documentación interna)
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

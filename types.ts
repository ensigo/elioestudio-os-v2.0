import React from 'react';

// --- ENUMS (Single Source of Truth) ---

export type UserRole = 
  | 'ADMIN' 
  | 'MANAGER' 
  | 'SEO' 
  | 'DESIGNER' 
  | 'DEV' 
  | 'COPY' 
  | 'CLIENT';

export type TaskStatus = 
  | 'PENDING' 
  | 'IN_PROGRESS' 
  | 'IN_REVIEW' 
  | 'CORRECTION' 
  | 'APPROVED' 
  | 'CLOSED'
  | 'BREACHED';

export type TaskPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export type TaskType = 'STRATEGIC' | 'OPERATIONAL' | 'URGENT' | 'MEETING';

export type ClientStatus = 'ACTIVE' | 'PAUSED' | 'RISK' | 'CHURNED';

export type ProjectStatus = 'ACTIVE' | 'BLOCKED' | 'PENDING' | 'COMPLETED';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// --- ENTITIES ---

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  position: string;
  hourlyCost?: number; // Restricted access
  joinDate: string;
  deletedAt?: string | null;
}

export type ServiceType = 'SEO' | 'SEM' | 'SOCIAL' | 'WEB' | 'MAINTENANCE';

export interface ClientCredential {
  id: string;
  platform: string; // e.g. WordPress
  url?: string;
  username: string;
  passwordEncrypted: string;
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  fiscalData: Record<string, any>; // JSONB
  status: ClientStatus;
  responsibleId: string; // Internal User ID
  projects?: Project[];
  lastActivity?: string;
  // Enhanced Fields
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  contract?: {
    startDate: string;
    endDate: string;
    services: ServiceType[];
    monthlyHours: number;
    hourlyRate: number;
  };
  credentials?: ClientCredential[];
}

export interface Contract {
  id: string;
  clientId: string;
  hoursBought: number;
  monthlyFee: number;
  startDate: string;
  endDate: string;
}

export interface Project {
  id: string;
  title: string;
  clientId: string;
  status: ProjectStatus;
  budget: number;
  deadline: string;
  isArchived: boolean;
  tags?: string[];
}

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType; // Added for categorization
  projectId: string;
  assigneeId?: string;
  estimatedHours?: number;
  dueDate?: string;
  subtasks?: SubTask[]; // Simplified subtask structure for UI
}

export interface TimeEntry {
  id: string;
  userId: string;
  taskId?: string;
  projectId?: string;
  startTime: string; // ISO Date
  endTime?: string; // ISO Date
  durationSeconds: number; // Calculated on save
  description?: string;
  isManual: boolean; // AUDIT: True if not tracked via timer
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  type: 'VACATION' | 'SICK_LEAVE' | 'OTHER';
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  approverId?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';
  entity: string; // e.g., 'Task', 'Client'
  entityId: string;
  details: {
    previous?: any;
    current?: any;
    reason?: string;
  };
  timestamp: string;
}

// --- CALENDAR TYPES ---
export type CalendarEventType = 'MEETING' | 'DEADLINE' | 'VACATION' | 'REMINDER';

export interface CalendarEvent {
  id: string;
  title: string;
  type: CalendarEventType;
  startDate: string; // ISO Date "YYYY-MM-DD"
  endDate?: string; // For ranges
  startTime?: string; // "14:00"
  attendees?: string[]; // User IDs
  relatedTaskId?: string;
  description?: string;
}

// --- UI HELPERS ---

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  roles?: UserRole[]; 
  isBottom?: boolean; 
}

export interface DashboardWidgetProps {
  className?: string;
}
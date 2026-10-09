export type TaskStage = 'backlog' | 'relevamiento' | 'qa' | 'produccion';

export type TaskStatus = 'pendiente' | 'en_progreso' | 'en_revision' | 'bloqueado' | 'completado';

export type TaskSize = 'XS' | 'S' | 'M' | 'L' | 'XL';

export type TaskType = 'Epica' | 'Historia' | 'Tarea' | 'Bug' | 'Hito';

export type TimeAperture = 'week' | 'sprint' | 'month' | 'quarter';

export interface Subtask {
  id: string;
  title: string;
  type: TaskType;
  stage: TaskStage;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  assignee: string;
  assigneeAvatar?: string;
  status: TaskStatus;
  progress: number; // 0 - 100
  size: TaskSize;
  commitment: string; // e.g. "Sprint 1", "Sprint 2"
  dependencies?: string[];
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  initiative: string;
  epic: string;
  stage: TaskStage;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  assignee: string;
  assigneeAvatar?: string;
  status: TaskStatus;
  progress: number; // 0 - 100
  size: TaskSize;
  commitment: string;
  color?: string;
  notes?: string;
  dependencies?: string[];
  subtasks: Subtask[];
}

export type InitiativeType = 'negocio' | 'interna';

export interface Project {
  id: string;
  name: string;
  code: string;
  projectLead: string; // Responsable del proyecto
  leadAvatar?: string;
  description: string;
  color: string;
  size?: TaskSize; // Talle de camiseta del proyecto: S, M, L, XL
  initiativeType?: InitiativeType; // 'negocio' o 'interna'
  quarter?: string; // e.g. "Q4 2026", "Q1 2027", or undefined/"Sin Asignar"
  quarterObjective?: string; // Objetivo del proyecto para el Q en curso
  targetStageForQuarter?: TaskStage; // Etapa comprometida para el final del Q (relevamiento, backlog, qa, produccion)
  tasks: Task[];
}

export interface GanttFilterState {
  search: string;
  assignee: string;
  status: string;
  stage: string;
  projectId: string;
  quarter: string; // Filter by Q (defaults to current Q)
  initiativeType?: string; // Filter by Negocio / Interna
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  email?: string;
  active: boolean;
}

export interface JiraConfig {
  domain: string;
  email: string;
  apiToken: string;
  projectKeys: string;
  connected: boolean;
  lastSync?: string;
}

export interface TimelineColumn {
  id: string;
  label: string;
  subLabel?: string;
  groupLabel?: string;
  startDate: Date;
  endDate: Date;
  isToday?: boolean;
}

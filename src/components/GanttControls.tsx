import React from 'react';
import {
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  Calendar,
  Layers,
  ChevronDown,
  RotateCcw,
  Plus,
  FolderPlus,
  ChevronsUpDown,
} from 'lucide-react';
import { TimeAperture, GanttFilterState, Project } from '../types/gantt';
import { STAGE_CONFIG, STATUS_CONFIG } from '../data/initialData';

interface GanttControlsProps {
  aperture: TimeAperture;
  onApertureChange: (aperture: TimeAperture) => void;
  zoomLevel: number;
  onZoomChange: (delta: number) => void;
  onScrollToToday: () => void;
  filters: GanttFilterState;
  onFilterChange: (filters: Partial<GanttFilterState>) => void;
  onResetFilters: () => void;
  projects: Project[];
  allAssignees: string[];
  availableQuarters: string[];
  currentQuarter: string;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onNewProject: () => void;
  onNewTask: () => void;
}

export const GanttControls: React.FC<GanttControlsProps> = ({
  aperture,
  onApertureChange,
  zoomLevel,
  onZoomChange,
  onScrollToToday,
  filters,
  onFilterChange,
  onResetFilters,
  projects,
  allAssignees,
  availableQuarters,
  currentQuarter,
  onExpandAll,
  onCollapseAll,
  onNewProject,
  onNewTask,
}) => {
  const hasActiveFilters = Boolean(
    filters.search ||
      filters.assignee ||
      filters.status ||
      filters.stage ||
      filters.projectId ||
      (filters.initiativeType && filters.initiativeType !== '') ||
      (filters.quarter && filters.quarter !== currentQuarter)
  );

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2.5 flex flex-col gap-2.5 transition-colors">
      {/* Top Toolbar Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Project Selector & Action additions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quarter Filter (Defaults to current Q) */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-lg px-2 py-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Q:</span>
            <select
              value={filters.quarter}
              onChange={(e) => onFilterChange({ quarter: e.target.value })}
              className="text-xs font-bold text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none cursor-pointer pr-1"
            >
              {availableQuarters.map((q) => (
                <option key={q} value={q} className="dark:bg-slate-800 dark:text-white">
                  {q} {q === currentQuarter ? '(En curso)' : ''}
                </option>
              ))}
              <option value="__UNASSIGNED__" className="dark:bg-slate-800 dark:text-white">Sin Asignar</option>
              <option value="__ALL__" className="dark:bg-slate-800 dark:text-white">Todos los Q</option>
            </select>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

          {/* Project Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mr-1">
            <Layers className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Proyecto:</span>
          </div>
          <select
            value={filters.projectId}
            onChange={(e) => onFilterChange({ projectId: e.target.value })}
            className="text-xs font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[200px]"
          >
            <option value="" className="dark:bg-slate-800 dark:text-white">Todos ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="dark:bg-slate-800 dark:text-white">
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={onNewProject}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-transparent dark:border-slate-700"
            title="Crear un nuevo proyecto"
          >
            <FolderPlus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>+ Proyecto</span>
          </button>

          <button
            onClick={onNewTask}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors border border-blue-100 dark:border-blue-900/40"
            title="Añadir una nueva tarea"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>+ Tarea</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-750 mx-1 hidden sm:block" />

          {/* Expand / Collapse All */}
          <div className="flex items-center gap-1">
            <button
              onClick={onExpandAll}
              className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
              title="Expandir todos los proyectos y etapas"
            >
              Expandir todo
            </button>
            <span className="text-slate-300 dark:text-slate-700 text-xs">/</span>
            <button
              onClick={onCollapseAll}
              className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
              title="Colapsar todos los proyectos y etapas"
            >
              Colapsar
            </button>
          </div>
        </div>

        {/* Right: Aperture Selector (Semana, Sprint 2 sem, Mes, Q) & Zoom */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Timescale Aperture Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-lg border border-slate-200/80 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 px-1.5 uppercase tracking-wider">
              Escala:
            </span>
            <button
              onClick={() => onApertureChange('week')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                aperture === 'week'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => onApertureChange('sprint')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                aperture === 'sprint'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sprint (2 sem)
            </button>
            <button
              onClick={() => onApertureChange('month')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                aperture === 'month'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => onApertureChange('quarter')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                aperture === 'quarter'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Quarter (Q)
            </button>
          </div>

          {/* Today Button */}
          <button
            onClick={onScrollToToday}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors shadow-xs"
            title="Ir al día de hoy en la línea de tiempo"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Hoy</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xs overflow-hidden">
            <button
              onClick={() => onZoomChange(-15)}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title="Reducir zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 px-1 select-none tabular-nums">
              {zoomLevel}px
            </span>
            <button
              onClick={() => onZoomChange(15)}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Row: Search, Responsable, Etapa, Estado */}
      <div className="flex items-center justify-between gap-3 flex-wrap pt-1 text-xs">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative min-w-[180px] max-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar tareas, épicas..."
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="w-full pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Filter Tipo de Iniciativa (Negocio vs Interna) */}
          <select
            value={filters.initiativeType || ''}
            onChange={(e) => onFilterChange({ initiativeType: e.target.value })}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-1 px-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            title="Filtrar por tipo de iniciativa"
          >
            <option value="" className="dark:bg-slate-800 dark:text-white">Todas las Iniciativas</option>
            <option value="negocio" className="dark:bg-slate-800 dark:text-white">💼 De Negocio</option>
            <option value="interna" className="dark:bg-slate-800 dark:text-white">⚙️ Internas</option>
          </select>

          {/* Filter Responsable */}
          <select
            value={filters.assignee}
            onChange={(e) => onFilterChange({ assignee: e.target.value })}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-1 px-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="" className="dark:bg-slate-800 dark:text-white">Cualquier Responsable</option>
            {allAssignees.map((person) => (
              <option key={person} value={person} className="dark:bg-slate-800 dark:text-white">
                {person}
              </option>
            ))}
          </select>

          {/* Filter Etapa (Backlog, Relevamiento, QA, Producción) */}
          <select
            value={filters.stage}
            onChange={(e) => onFilterChange({ stage: e.target.value })}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-1 px-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="" className="dark:bg-slate-800 dark:text-white">Todas las Etapas</option>
            {Object.entries(STAGE_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key} className="dark:bg-slate-800 dark:text-white">
                {cfg.name}
              </option>
            ))}
          </select>

          {/* Filter Estado */}
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-1 px-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="" className="dark:bg-slate-800 dark:text-white">Cualquier Estado</option>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key} className="dark:bg-slate-800 dark:text-white">
                {cfg.label}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 px-2 py-1 rounded bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors border border-transparent dark:border-rose-900/50"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          Mostrando por <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase">{aperture}</span>
        </div>
      </div>
    </div>
  );
};

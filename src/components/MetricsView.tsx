import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Target,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Folder,
  BarChart3,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
  Download,
  Check,
  ChevronLeft,
  ChevronRight,
  ScatterChart as ScatterIcon,
  Table as TableIcon,
  LayoutGrid,
  Info,
  Briefcase,
  Cpu,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Project, TaskStage, TaskSize, InitiativeType } from '../types/gantt';
import { STAGE_CONFIG, STATUS_CONFIG } from '../data/initialData';
import {
  STAGE_WEIGHTS,
  STAGE_PROGRESSION,
  getCurrentQuarterString,
  PROJECT_SIZE_RANGES,
  getProjectDurationInMonths,
  getDaysDifference,
} from '../utils/dateUtils';

interface MetricsViewProps {
  projects: Project[];
  selectedQuarter: string;
  onQuarterChange: (quarter: string) => void;
  availableQuarters: string[];
  onOpenTaskModal: (projectId: string) => void;
  onViewGantt?: () => void;
}

export const MetricsView: React.FC<MetricsViewProps> = ({
  projects,
  selectedQuarter,
  onQuarterChange,
  availableQuarters,
  onOpenTaskModal,
  onViewGantt,
}) => {
  const [search, setSearch] = useState('');
  const [downloadFeedback, setDownloadFeedback] = useState(false);
  // Default to scatter plot as requested for immediate visibility
  const [viewMode, setViewMode] = useState<'scatter' | 'table' | 'cards'>('scatter');
  const [typeFilter, setTypeFilter] = useState<'all' | 'negocio' | 'interna'>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);

  // Filter projects by quarter and initiative type
  const quarterProjects = useMemo(() => {
    return projects.filter((p) => {
      // Quarter match
      if (selectedQuarter === '__ALL__') {
        // all
      } else if (selectedQuarter === '__UNASSIGNED__') {
        if (p.quarter && p.quarter !== 'Sin Asignar') return false;
      } else {
        if ((p.quarter || 'Sin Asignar') !== selectedQuarter) return false;
      }

      // Type match
      if (typeFilter !== 'all' && (p.initiativeType || 'negocio') !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [projects, selectedQuarter, typeFilter]);

  // Search filter
  const displayedProjects = useMemo(() => {
    if (!search.trim()) return quarterProjects;
    const q = search.toLowerCase();
    return quarterProjects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.projectLead.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.quarterObjective?.toLowerCase().includes(q) ||
        p.size?.toLowerCase().includes(q) ||
        p.initiativeType?.toLowerCase().includes(q)
    );
  }, [quarterProjects, search]);

  // Compute metrics for each project
  const projectMetrics = useMemo(() => {
    return displayedProjects.map((project) => {
      const tasks = project.tasks || [];
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t) => t.status === 'completado').length;
      const inProgressTasks = tasks.filter((t) => t.status === 'en_progreso').length;

      // Group tasks by stage
      const tasksByStage: Record<TaskStage, number> = {
        relevamiento: tasks.filter((t) => t.stage === 'relevamiento').length,
        backlog: tasks.filter((t) => t.stage === 'backlog').length,
        qa: tasks.filter((t) => t.stage === 'qa').length,
        produccion: tasks.filter((t) => t.stage === 'produccion').length,
      };

      // Determine highest achieved stage in the project
      let highestAchievedStage: TaskStage = 'relevamiento';
      for (const stg of STAGE_PROGRESSION) {
        const hasTasksInStage = tasks.some((t) => t.stage === stg);
        if (hasTasksInStage) {
          highestAchievedStage = stg;
        }
      }

      for (const stg of STAGE_PROGRESSION) {
        const hasCompletedInStage = tasks.some(
          (t) => t.stage === stg && (t.status === 'completado' || t.progress >= 50)
        );
        if (hasCompletedInStage) {
          highestAchievedStage = stg;
        }
      }

      // Target stage committed for this Q (default is produccion)
      const targetStage: TaskStage = project.targetStageForQuarter || 'produccion';
      const targetPercent = STAGE_WEIGHTS[targetStage]?.percent || 100;
      const achievedPercent = STAGE_WEIGHTS[highestAchievedStage]?.percent || 25;

      // Compliance ratio: e.g. target is produccion (100%) and reached QA (75%) -> 75%
      const complianceRatio = Math.min(100, Math.round((achievedPercent / targetPercent) * 100));

      // Dates and duration in months
      const allDates = tasks
        .flatMap((t) => [
          t.startDate,
          t.endDate,
          ...(t.subtasks?.flatMap((st) => [st.startDate, st.endDate]) || []),
        ])
        .filter(Boolean) as string[];

      const minDate = allDates.length > 0 ? [...allDates].sort()[0] : '2026-10-01';
      const maxDate = allDates.length > 0 ? [...allDates].sort()[allDates.length - 1] : '2026-11-15';
      const durationDays = getDaysDifference(minDate, maxDate);
      const durationMonths = getProjectDurationInMonths(minDate, maxDate);

      // Project T-Shirt size and expected ranges
      const size: TaskSize = (project.size || 'M').toUpperCase() as TaskSize;
      const sizeRange = PROJECT_SIZE_RANGES[size] || PROJECT_SIZE_RANGES['M'];
      const initiativeType: InitiativeType = project.initiativeType || 'negocio';

      // Duration diagnosis against size range
      const isWithinSizeRange =
        durationMonths >= sizeRange.minMonths && durationMonths <= sizeRange.maxMonths;
      const isOverSizeRange = durationMonths > sizeRange.maxMonths;
      const deviationMonths = isOverSizeRange
        ? Math.round((durationMonths - sizeRange.maxMonths) * 10) / 10
        : 0;

      // Task completion percentage
      const taskCompletionRatio =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Health status
      let health: 'cumplido' | 'en_progreso' | 'en_riesgo' = 'en_progreso';
      if (complianceRatio >= 100) health = 'cumplido';
      else if (complianceRatio < 75) health = 'en_riesgo';

      return {
        project,
        size,
        sizeRange,
        initiativeType,
        totalTasks,
        completedTasks,
        inProgressTasks,
        tasksByStage,
        highestAchievedStage,
        targetStage,
        targetPercent,
        achievedPercent,
        complianceRatio,
        taskCompletionRatio,
        durationDays,
        durationMonths,
        minDate,
        maxDate,
        isWithinSizeRange,
        isOverSizeRange,
        deviationMonths,
        health,
      };
    });
  }, [displayedProjects]);

  // Overall Global Statistics
  const globalStats = useMemo(() => {
    if (projectMetrics.length === 0) {
      return {
        avgCompliance: 0,
        totalProjects: 0,
        completedProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        atRiskProjects: 0,
        negocioCount: 0,
        internaCount: 0,
        inRangeCount: 0,
        overRangeCount: 0,
      };
    }

    const totalProjects = projectMetrics.length;
    const avgCompliance = Math.round(
      projectMetrics.reduce((acc, m) => acc + m.complianceRatio, 0) / totalProjects
    );
    const completedProjects = projectMetrics.filter((m) => m.complianceRatio >= 100).length;
    const atRiskProjects = projectMetrics.filter((m) => m.complianceRatio < 75).length;
    const totalTasks = projectMetrics.reduce((acc, m) => acc + m.totalTasks, 0);
    const completedTasks = projectMetrics.reduce((acc, m) => acc + m.completedTasks, 0);
    const negocioCount = projectMetrics.filter((m) => m.initiativeType === 'negocio').length;
    const internaCount = projectMetrics.filter((m) => m.initiativeType === 'interna').length;
    const inRangeCount = projectMetrics.filter((m) => m.isWithinSizeRange).length;
    const overRangeCount = projectMetrics.filter((m) => !m.isWithinSizeRange).length;

    return {
      avgCompliance,
      totalProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      atRiskProjects,
      negocioCount,
      internaCount,
      inRangeCount,
      overRangeCount,
    };
  }, [projectMetrics]);

  // View cycle helpers
  const viewOrder: Array<'scatter' | 'table' | 'cards'> = ['scatter', 'table', 'cards'];
  const handlePrevView = () => {
    const idx = viewOrder.indexOf(viewMode);
    const nextIdx = (idx - 1 + viewOrder.length) % viewOrder.length;
    setViewMode(viewOrder[nextIdx]);
  };
  const handleNextView = () => {
    const idx = viewOrder.indexOf(viewMode);
    const nextIdx = (idx + 1) % viewOrder.length;
    setViewMode(viewOrder[nextIdx]);
  };

  const handleDownloadReport = () => {
    const reportData = {
      quarter: selectedQuarter,
      generatedAt: new Date().toISOString(),
      globalStats,
      projects: projectMetrics.map((m) => ({
        id: m.project.id,
        nombre: m.project.name,
        codigo: m.project.code,
        talleCamiseta: m.size,
        rangoEstipuladoMeses: m.sizeRange.desc,
        duracionRealMeses: m.durationMonths,
        tipoIniciativa: m.initiativeType,
        responsable: m.project.projectLead,
        objetivoQ: m.project.quarterObjective || 'Sin objetivo registrado',
        etapaComprometida: m.targetStage,
        etapaEntregadaAlcanzada: m.highestAchievedStage,
        porcentajeCompromisoCumplido: `${m.complianceRatio}%`,
        estadoCalibracionTalle: m.isWithinSizeRange ? 'En Rango' : 'Excedido de Talle',
        tareasTotales: m.totalTasks,
        tareasCompletadas: m.completedTasks,
        estado: m.health,
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_metricas_${selectedQuarter.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadFeedback(true);
    setTimeout(() => setDownloadFeedback(false), 2000);
  };

  const currentQ = getCurrentQuarterString();

  // Active active item details for modal/card
  const activeDetailItem = useMemo(() => {
    const id = selectedProjectId || hoveredProjectId;
    if (!id) return projectMetrics[0] || null;
    return projectMetrics.find((p) => p.project.id === id) || projectMetrics[0] || null;
  }, [selectedProjectId, hoveredProjectId, projectMetrics]);

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto p-6 flex flex-col gap-6">
      {/* Top Header & Quarter Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Métricas del Trimestre: Comprometido vs Entregado
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Auditoría de compromiso por etapa, tipos de iniciativa, talles de camiseta y análisis de dispersión temporal.
          </p>
        </div>

        {/* Quarter Selector Dropdown & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-slate-700">Trimestre:</span>
            <select
              value={selectedQuarter}
              onChange={(e) => onQuarterChange(e.target.value)}
              className="text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
            >
              {availableQuarters.map((q) => (
                <option key={q} value={q}>
                  {q} {q === currentQ ? '(En curso)' : ''}
                </option>
              ))}
              <option value="__UNASSIGNED__">Sin Asignar a un Q</option>
              <option value="__ALL__">Todos los Trimestres</option>
            </select>
          </div>

          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
            title="Descargar reporte del Q"
          >
            {downloadFeedback ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Descargado</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Exportar Informe</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Global Compliance */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Cumplimiento del Compromiso</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {globalStats.avgCompliance}%
            </span>
            <span className="text-[11px] text-slate-500">promedio del Q</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                globalStats.avgCompliance >= 80
                  ? 'bg-emerald-500'
                  : globalStats.avgCompliance >= 60
                  ? 'bg-blue-600'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${globalStats.avgCompliance}%` }}
            />
          </div>
        </div>

        {/* Card 2: Total Projects & Breakdown by Initiative Type */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Iniciativas Asignadas</span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {globalStats.totalProjects}
            </span>
            <span className="text-[11px] text-slate-500">proyectos activos</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-blue-700 font-semibold">
              <Briefcase className="w-3 h-3" /> {globalStats.negocioCount} Negocio
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-purple-700 font-semibold">
              <Cpu className="w-3 h-3" /> {globalStats.internaCount} Internas
            </span>
          </div>
        </div>

        {/* Card 3: Calibration in T-Shirt Range */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Calibración de Talles</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {globalStats.inRangeCount}{' '}
              <span className="text-base font-normal text-slate-400">/ {globalStats.totalProjects}</span>
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold">en tiempo</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-2">
            <span className="text-emerald-700 font-medium">
              {globalStats.inRangeCount} en rango
            </span>
            <span>·</span>
            <span className="text-rose-600 font-medium">
              {globalStats.overRangeCount} excedidos
            </span>
          </div>
        </div>

        {/* Card 4: T-Shirt Size Bounds Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Reglas de Talles de Camiseta</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Target className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1 text-[10px] text-center font-mono font-semibold">
            <div className="bg-emerald-50 text-emerald-800 py-1 rounded" title="0 a 1 mes">
              S: ≤1m
            </div>
            <div className="bg-blue-50 text-blue-800 py-1 rounded" title="> 1 mes hasta 2 meses">
              M: 1-2m
            </div>
            <div className="bg-amber-50 text-amber-800 py-1 rounded" title="> 2 meses hasta 3 meses">
              L: 2-3m
            </div>
            <div className="bg-purple-50 text-purple-800 py-1 rounded" title="> 3 meses hasta 4.5 meses">
              XL: 3-4.5m
            </div>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 text-center">
            Umbrales de estimación teórica
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Interactive Detail Box with Prominent View Switcher                       */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
        {/* Detail Box Header Toolbar with Switcher Buttons and Arrow Navigation */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <h2 className="text-base font-bold text-slate-900">
                Auditoría de Iniciativas: Comprometido vs Entregado
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {viewMode === 'scatter'
                ? 'Gráfico de dispersión interactivo: Duración real en meses vs Talle de camiseta estipulado (S, M, L, XL)'
                : viewMode === 'table'
                ? 'Vista tabular comparativa con tamaño de camiseta, meta del Q y brecha de entrega'
                : 'Tarjetas detalladas con objetivo del Q, meta comprometida y desglose de tareas'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter by Initiative Type (Negocio vs Interna) */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 text-xs shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 pl-2 pr-1">Tipo:</span>
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas ({quarterProjects.length})
              </button>
              <button
                onClick={() => setTypeFilter('negocio')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  typeFilter === 'negocio'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                💼 Negocio
              </button>
              <button
                onClick={() => setTypeFilter('interna')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  typeFilter === 'interna'
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⚙️ Internas
              </button>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('scatter')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'scatter'
                    ? 'bg-white text-blue-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Gráfico de Dispersión (Talle vs Tiempo en Meses)"
              >
                <ScatterIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Dispersión</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vista de Tabla Comparativa"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Tabla</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vista de Tarjetas Detalladas"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Tarjetas</span>
              </button>
            </div>

            {/* Arrow Navigator buttons */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-xs">
              <button
                onClick={handlePrevView}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                title="Vista anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextView}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors border-l border-slate-100"
                title="Siguiente vista"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Empty state if no projects match */}
        {projectMetrics.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No hay iniciativas para mostrar</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              No se encontraron proyectos para el trimestre <strong>{selectedQuarter}</strong> con los filtros actuales.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setTypeFilter('all');
                  setSearch('');
                  onQuarterChange('__ALL__');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                Mostrar todos los trimestres
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: SCATTER PLOT (Dispersión: Tiempo en Meses vs Talle de Camiseta)   */}
        {/* ========================================================================= */}
        {viewMode === 'scatter' && projectMetrics.length > 0 && (
          <div className="p-6 flex flex-col gap-6 bg-white">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ScatterIcon className="w-4 h-4 text-blue-600" />
                  <span>Matriz de Dispersión: Tiempo Real (Meses) vs Talle de Camiseta Estipulado</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Las bandas verdes representan la ventana de tiempo esperada para cada talle. Puntos en rojo indican proyectos que excedieron el plazo de su camiseta. Haz clic en un punto para ver su detalle.
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-xs flex-wrap bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-xs" />
                  <span className="text-slate-700 font-medium">En Tiempo (Calibrado)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-xs" />
                  <span className="text-slate-700 font-medium">Excedido de Talle</span>
                </div>
                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-blue-600 inline-block" />
                  <span className="text-slate-600">Negocio</span>
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-purple-600 inline-block ml-1" />
                  <span className="text-slate-600">Interna</span>
                </div>
              </div>
            </div>

            {/* SVG Scatter Plot Canvas */}
            <div className="w-full bg-slate-50/60 border border-slate-200 rounded-xl p-4 overflow-x-auto relative">
              <div className="min-w-[760px] h-[400px] relative select-none">
                <svg viewBox="0 0 800 400" className="w-full h-full">
                  {/* Grid Defs */}
                  <defs>
                    <linearGradient id="safeZoneGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.06" />
                    </linearGradient>
                    <linearGradient id="dangerZoneGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.10" />
                      <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  {/* Axis Coordinate mapping:
                      X categories:
                      S:  x = 90 to 240 (center 165)
                      M:  x = 260 to 410 (center 335)
                      L:  x = 430 to 580 (center 505)
                      XL: x = 600 to 750 (center 675)

                      Y mapping: 0 to 5.0 meses.
                      Y = 0m -> y = 340
                      Y = 5m -> y = 40
                      height range = 300px -> 60px per month
                      y(m) = 340 - (m * 60)
                  */}

                  {/* Y-Axis Horizontal Grid Lines and Labels (0 to 5 meses) */}
                  {[0, 1, 2, 3, 4, 4.5, 5].map((months) => {
                    const y = 340 - months * 60;
                    const isTargetThreshold = [1, 2, 3, 4.5].includes(months);

                    return (
                      <g key={`y-axis-${months}`}>
                        <line
                          x1="70"
                          y1={y}
                          x2="760"
                          y2={y}
                          stroke={isTargetThreshold ? '#94A3B8' : '#E2E8F0'}
                          strokeDasharray={isTargetThreshold ? '4 3' : 'none'}
                          strokeWidth={isTargetThreshold ? 1.5 : 1}
                        />
                        <text
                          x="60"
                          y={y + 4}
                          textAnchor="end"
                          fontSize="11"
                          fontFamily="monospace"
                          fill={isTargetThreshold ? '#334155' : '#94A3B8'}
                          fontWeight={isTargetThreshold ? 'bold' : 'normal'}
                        >
                          {months}m
                        </text>
                      </g>
                    );
                  })}

                  {/* Y-Axis Title */}
                  <text
                    x="18"
                    y="190"
                    textAnchor="middle"
                    transform="rotate(-90 18 190)"
                    fontSize="11"
                    fontWeight="bold"
                    fill="#64748B"
                  >
                    Tiempo Real del Proyecto (Meses)
                  </text>

                  {/* Columns Definition */}
                  {[
                    { size: 'S', x1: 90, x2: 240, cx: 165, minM: 0, maxM: 1, label: 'Camiseta S', rule: '0 a 1 mes' },
                    { size: 'M', x1: 260, x2: 410, cx: 335, minM: 1, maxM: 2, label: 'Camiseta M', rule: '> 1 a 2 meses' },
                    { size: 'L', x1: 430, x2: 580, cx: 505, minM: 2, maxM: 3, label: 'Camiseta L', rule: '> 2 a 3 meses' },
                    { size: 'XL', x1: 600, x2: 750, cx: 675, minM: 3, maxM: 4.5, label: 'Camiseta XL', rule: '> 3 a 4.5 meses' },
                  ].map((col) => {
                    // Safe Zone Rectangle (Green)
                    const safeYTop = 340 - col.maxM * 60;
                    const safeHeight = (col.maxM - col.minM) * 60;

                    // Danger Zone Rectangle (Above safe limit)
                    const dangerYTop = 40;
                    const dangerHeight = safeYTop - dangerYTop;

                    return (
                      <g key={`col-${col.size}`}>
                        {/* Over-delay warning area above safe boundary */}
                        <rect
                          x={col.x1}
                          y={dangerYTop}
                          width={col.x2 - col.x1}
                          height={dangerHeight}
                          fill="url(#dangerZoneGrad)"
                          rx="4"
                        />

                        {/* Safe Expected Window */}
                        <rect
                          x={col.x1}
                          y={safeYTop}
                          width={col.x2 - col.x1}
                          height={safeHeight}
                          fill="url(#safeZoneGrad)"
                          stroke="#10B981"
                          strokeWidth="1.5"
                          strokeDasharray="4 3"
                          rx="6"
                        />

                        {/* Column X Labels */}
                        <text
                          x={col.cx}
                          y="364"
                          textAnchor="middle"
                          fontSize="13"
                          fontWeight="bold"
                          fill="#0F172A"
                        >
                          {col.label}
                        </text>
                        <text
                          x={col.cx}
                          y="380"
                          textAnchor="middle"
                          fontSize="10"
                          fontFamily="monospace"
                          fill="#64748B"
                        >
                          [{col.rule}]
                        </text>

                        {/* Safe watermark label inside box */}
                        <text
                          x={col.cx}
                          y={safeYTop + safeHeight / 2 + 4}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="600"
                          fill="#059669"
                          opacity="0.6"
                        >
                          Rango Estipulado
                        </text>
                      </g>
                    );
                  })}

                  {/* Scatter Data Points with Smart Horizontal Distribution per Column */}
                  {projectMetrics.map((m) => {
                    // Map Size to Center X
                    let cxBase = 165;
                    if (m.size === 'M') cxBase = 335;
                    else if (m.size === 'L') cxBase = 505;
                    else if (m.size === 'XL') cxBase = 675;

                    // Group projects with same size to distribute evenly horizontally so they never collide!
                    const sameSizeProjects = projectMetrics.filter(
                      (p) => (p.size || 'M').toUpperCase() === m.size
                    );
                    const indexInGroup = sameSizeProjects.findIndex(
                      (p) => p.project.id === m.project.id
                    );
                    const totalInGroup = sameSizeProjects.length;

                    // Distribute across available column span (width ~130px)
                    let offset = 0;
                    if (totalInGroup > 1) {
                      const spread = 90;
                      offset = (indexInGroup / (totalInGroup - 1) - 0.5) * spread;
                    }
                    const cx = cxBase + offset;

                    // Map months to Y coordinate (clamped between 0 and 5m)
                    const durationVal = isNaN(m.durationMonths) ? 1 : m.durationMonths;
                    const clampedMonths = Math.min(5, Math.max(0, durationVal));
                    const cy = 340 - clampedMonths * 60;

                    const isHovered = hoveredProjectId === m.project.id;
                    const isSelected = selectedProjectId === m.project.id;
                    const pointColor = m.isWithinSizeRange ? '#10B981' : '#F43F5E';
                    const ringColor = m.initiativeType === 'negocio' ? '#2563EB' : '#9333EA';

                    return (
                      <g
                        key={`scatter-point-${m.project.id}`}
                        className="cursor-pointer transition-transform"
                        onMouseEnter={() => setHoveredProjectId(m.project.id)}
                        onMouseLeave={() => setHoveredProjectId(null)}
                        onClick={() => setSelectedProjectId(m.project.id)}
                      >
                        {/* Outer Pulse/Glow when hovered or selected */}
                        {(isHovered || isSelected) && (
                          <circle
                            cx={cx}
                            cy={cy}
                            r="22"
                            fill={pointColor}
                            opacity="0.3"
                          />
                        )}

                        {/* Initiative Type Ring (Blue for Negocio, Purple for Interna) */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isHovered || isSelected ? '15' : '11'}
                          fill="none"
                          stroke={ringColor}
                          strokeWidth="2.5"
                        />

                        {/* Core Point Circle */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isHovered || isSelected ? '9' : '7'}
                          fill={pointColor}
                          stroke="#FFFFFF"
                          strokeWidth="2"
                        />

                        {/* Project Code Label next to point */}
                        <text
                          x={cx + 14}
                          y={cy + 4}
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight={isSelected ? 'bold' : '600'}
                          fill={isSelected ? '#0F172A' : '#334155'}
                          className="pointer-events-none select-none"
                        >
                          {m.project.code} ({m.durationMonths}m)
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Floating Tooltip for Hovered Project */}
                {hoveredProjectId && (() => {
                  const item = projectMetrics.find((p) => p.project.id === hoveredProjectId);
                  if (!item) return null;

                  return (
                    <div className="absolute top-3 right-3 z-20 bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 max-w-xs pointer-events-none animate-in fade-in duration-100">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-2 mb-2">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400">[{item.project.code}]</span>
                          <h4 className="text-xs font-bold text-white leading-tight">{item.project.name}</h4>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                            item.initiativeType === 'negocio' ? 'bg-blue-600' : 'bg-purple-600'
                          }`}
                        >
                          {item.initiativeType}
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Talle Estipulado:</span>
                          <strong className="text-slate-200 font-mono">
                            Camiseta {item.size} ({item.sizeRange.desc})
                          </strong>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-slate-400">Tiempo Real:</span>
                          <strong className="text-slate-200 font-mono tabular-nums">
                            {item.durationMonths} meses ({item.durationDays} días)
                          </strong>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-slate-400">Diagnóstico:</span>
                          <strong className={item.isWithinSizeRange ? 'text-emerald-400' : 'text-rose-400'}>
                            {item.isWithinSizeRange
                              ? '✓ En Tiempo'
                              : `⚠️ Excedido (+${item.deviationMonths}m)`}
                          </strong>
                        </div>

                        <div className="flex justify-between pt-1 border-t border-slate-800">
                          <span className="text-slate-400">Compromiso:</span>
                          <strong className="text-blue-300">
                            Meta: {STAGE_CONFIG[item.targetStage]?.name} · {item.complianceRatio}%
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Quick Filter/Distribution Summary per Shirt Size */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['S', 'M', 'L', 'XL'] as TaskSize[]).map((sz) => {
                const list = projectMetrics.filter((m) => m.size === sz);
                const inRange = list.filter((m) => m.isWithinSizeRange).length;
                const overRange = list.filter((m) => !m.isWithinSizeRange).length;
                const rangeCfg = PROJECT_SIZE_RANGES[sz];

                return (
                  <div
                    key={sz}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-800 text-xs">
                        Camiseta {sz}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {rangeCfg?.desc}
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-lg font-bold font-mono text-slate-900">
                        {list.length}
                      </span>
                      <span className="text-[11px] text-slate-500">iniciativas</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10px]">
                      <span className="text-emerald-600 font-semibold">
                        {inRange} en tiempo
                      </span>
                      {overRange > 0 && (
                        <span className="text-rose-600 font-semibold">
                          · {overRange} excedidos
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Project Full Detail Card */}
            {activeDetailItem && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      [{activeDetailItem.project.code}]
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      {activeDetailItem.project.name}
                    </h4>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        activeDetailItem.initiativeType === 'negocio'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {activeDetailItem.initiativeType === 'negocio' ? '💼 Negocio' : '⚙️ Interna'}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        activeDetailItem.isWithinSizeRange
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {activeDetailItem.isWithinSizeRange
                        ? '✓ Calibrado en Talle'
                        : `⚠️ Excedió ${activeDetailItem.deviationMonths} meses`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    <strong>Objetivo del Q:</strong> {activeDetailItem.project.quarterObjective || 'Sin objetivo fijado'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Responsable: <strong>{activeDetailItem.project.projectLead}</strong> · Tiempo real:{' '}
                    <strong>{activeDetailItem.durationMonths} meses</strong> ({activeDetailItem.durationDays} días) · Talle: <strong>Camiseta {activeDetailItem.size}</strong> ({activeDetailItem.sizeRange.desc})
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onOpenTaskModal(activeDetailItem.project.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors shadow-xs"
                  >
                    + Agregar Tarea
                  </button>
                  {onViewGantt && (
                    <button
                      onClick={onViewGantt}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-xs flex items-center gap-1"
                    >
                      <span>Ver en Gantt</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: TABLE AUDIT (Detalle Comprometido vs Entregado en Formato Tabla) */}
        {/* ========================================================================= */}
        {viewMode === 'table' && projectMetrics.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Iniciativa / Proyecto</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3 text-center">Camiseta</th>
                  <th className="py-3 px-3">Comprometido (Meta Q)</th>
                  <th className="py-3 px-3">Entregado (Alcanzado)</th>
                  <th className="py-3 px-3 text-center">% Cumplimiento</th>
                  <th className="py-3 px-3">Tiempo Real</th>
                  <th className="py-3 px-3">Responsable</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {projectMetrics.map((m) => {
                  const targetCfg = STAGE_CONFIG[m.targetStage];
                  const reachedCfg = STAGE_CONFIG[m.highestAchievedStage];

                  return (
                    <tr
                      key={m.project.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        selectedProjectId === m.project.id ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => setSelectedProjectId(m.project.id)}
                    >
                      {/* Name & Code */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{m.project.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">[{m.project.code}]</div>
                      </td>

                      {/* Initiative Type */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            m.initiativeType === 'negocio'
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : 'bg-purple-50 text-purple-700 border border-purple-100'
                          }`}
                        >
                          {m.initiativeType === 'negocio' ? (
                            <Briefcase className="w-2.5 h-2.5" />
                          ) : (
                            <Cpu className="w-2.5 h-2.5" />
                          )}
                          <span className="capitalize">{m.initiativeType}</span>
                        </span>
                      </td>

                      {/* T-Shirt Size */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                          {m.size}
                        </span>
                        <div className="text-[9px] text-slate-400 mt-0.5">{m.sizeRange.desc}</div>
                      </td>

                      {/* Comprometido (Target) */}
                      <td className="py-3.5 px-3 font-semibold">
                        <span
                          className="px-2 py-1 rounded inline-block text-[11px]"
                          style={{
                            backgroundColor: targetCfg.badgeBg.replace('bg-', ''),
                            color: targetCfg.color,
                          }}
                        >
                          {targetCfg.name} ({m.targetPercent}%)
                        </span>
                      </td>

                      {/* Entregado (Reached) */}
                      <td className="py-3.5 px-3 font-semibold">
                        <span
                          className="px-2 py-1 rounded inline-block text-[11px]"
                          style={{
                            backgroundColor: reachedCfg.badgeBg.replace('bg-', ''),
                            color: reachedCfg.color,
                          }}
                        >
                          {reachedCfg.name} ({m.achievedPercent}%)
                        </span>
                      </td>

                      {/* % Cumplimiento */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                          {m.complianceRatio}%
                        </span>
                        <div className="w-16 bg-slate-100 rounded-full h-1 mx-auto mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              m.complianceRatio >= 100
                                ? 'bg-emerald-500'
                                : m.complianceRatio >= 75
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${m.complianceRatio}%` }}
                          />
                        </div>
                      </td>

                      {/* Tiempo Real vs Talle */}
                      <td className="py-3.5 px-3 font-mono text-[11px]">
                        <div>{m.durationMonths} meses</div>
                        <div
                          className={
                            m.isWithinSizeRange
                              ? 'text-emerald-600 font-semibold'
                              : 'text-rose-600 font-semibold'
                          }
                        >
                          {m.isWithinSizeRange ? '✓ En Rango' : `⚠️ +${m.deviationMonths}m`}
                        </div>
                      </td>

                      {/* Responsable */}
                      <td className="py-3.5 px-3 truncate max-w-[140px] text-slate-700">
                        {m.project.projectLead}
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                            m.complianceRatio >= 100
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : m.complianceRatio >= 75
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {m.complianceRatio >= 100 ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Cumplido
                            </>
                          ) : m.complianceRatio >= 75 ? (
                            <>
                              <Clock className="w-3 h-3 text-blue-600" /> Parcial
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> En Riesgo
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: CARDS VIEW (Tarjetas Detalladas)                                   */}
        {/* ========================================================================= */}
        {viewMode === 'cards' && projectMetrics.length > 0 && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/50">
            {projectMetrics.map((m) => {
              const targetCfg = STAGE_CONFIG[m.targetStage];
              const reachedCfg = STAGE_CONFIG[m.highestAchievedStage];

              return (
                <div
                  key={m.project.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          [{m.project.code}]
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {m.project.name}
                        </h4>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {m.size}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {m.project.quarterObjective || m.project.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Tipo de Iniciativa:</span>
                      <span
                        className={`font-semibold capitalize ${
                          m.initiativeType === 'negocio' ? 'text-blue-600' : 'text-purple-600'
                        }`}
                      >
                        {m.initiativeType}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Comprometido:</span>
                      <span className="font-semibold text-slate-800">
                        {targetCfg?.name} ({m.targetPercent}%)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Entregado:</span>
                      <span className="font-semibold text-emerald-700">
                        {reachedCfg?.name} ({m.achievedPercent}%)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Tiempo Real vs Talle:</span>
                      <span
                        className={`font-mono font-semibold ${
                          m.isWithinSizeRange ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {m.durationMonths}m ({m.isWithinSizeRange ? 'En rango' : `+${m.deviationMonths}m`})
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full ${
                          m.complianceRatio >= 100
                            ? 'bg-emerald-500'
                            : m.complianceRatio >= 75
                            ? 'bg-blue-600'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${m.complianceRatio}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

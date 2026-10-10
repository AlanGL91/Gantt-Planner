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
        if (p.quarter !== selectedQuarter) return false;
      }

      // Initiative type match
      if (typeFilter !== 'all') {
        const pType = p.initiativeType || 'negocio';
        if (pType !== typeFilter) return false;
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
      const isWithinSizeRange = durationMonths <= sizeRange.maxMonths;
      const isOverSizeRange = durationMonths > sizeRange.maxMonths;
      const deviationMonths = Number((durationMonths - sizeRange.maxMonths).toFixed(2));

      // Health status based on compliance ratio & duration
      let health: 'ok' | 'warning' | 'danger' = 'ok';
      if (complianceRatio < 50 || isOverSizeRange) {
        health = 'danger';
      } else if (complianceRatio < 80) {
        health = 'warning';
      }

      // Real task progress
      const taskCompletionRatio =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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

  // Download report as JSON/CSV
  const handleDownloadReport = () => {
    const reportData = {
      quarter: selectedQuarter,
      generatedAt: new Date().toISOString(),
      globalStats,
      projects: projectMetrics.map((m) => ({
        nombre: m.project.name,
        codigo: m.project.code,
        tipoIniciativa: m.initiativeType,
        talleCamiseta: m.size,
        duracionMeses: m.durationMonths,
        rangoEstimado: m.sizeRange.desc,
        cumplePlazoCamiseta: m.isWithinSizeRange,
        desvioMeses: m.deviationMonths,
        objetivoQuarter: m.project.quarterObjective || 'Producción',
        etapaComprometida: m.targetStage,
        etapaEntregada: m.highestAchievedStage,
        porcentajeCumplimiento: `${m.complianceRatio}%`,
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
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 overflow-y-auto p-6 flex flex-col gap-6 transition-colors">
      {/* Top Header & Quarter Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Métricas del Trimestre: Comprometido vs Entregado
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Auditoría de compromiso por etapa, tipos de iniciativa, talles de camiseta y análisis de dispersión temporal.
          </p>
        </div>

        {/* Quarter Selector Dropdown & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Trimestre:</span>
            <select
              value={selectedQuarter}
              onChange={(e) => onQuarterChange(e.target.value)}
              className="text-xs font-bold text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none cursor-pointer"
            >
              {availableQuarters.map((q) => (
                <option key={q} value={q} className="dark:bg-slate-800 dark:text-white">
                  {q} {q === currentQ ? '(En curso)' : ''}
                </option>
              ))}
              <option value="__UNASSIGNED__" className="dark:bg-slate-800 dark:text-white">Sin Asignar a un Q</option>
              <option value="__ALL__" className="dark:bg-slate-800 dark:text-white">Todos los Trimestres</option>
            </select>
          </div>

          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors shadow-xs"
            title="Descargar reporte del Q"
          >
            {downloadFeedback ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-300 font-semibold">Descargado</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Exportar Informe</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Global Compliance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Cumplimiento del Compromiso</span>
            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {globalStats.avgCompliance}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">promedio ponderado</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                globalStats.avgCompliance >= 80
                  ? 'bg-emerald-500'
                  : globalStats.avgCompliance >= 50
                  ? 'bg-blue-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${globalStats.avgCompliance}%` }}
            />
          </div>
          <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 flex justify-between">
            <span>Objetivo al 100%</span>
            <span>{globalStats.completedProjects} completados</span>
          </div>
        </div>

        {/* Card 2: Initiatives breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Iniciativas Activas</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Folder className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {globalStats.totalProjects}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">proyectos en el Q</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md text-[11px]">
              <Briefcase className="w-3 h-3" />
              {globalStats.negocioCount} Negocio
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md text-[11px]">
              <Cpu className="w-3 h-3" />
              {globalStats.internaCount} Internas
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
            {globalStats.totalTasks} tareas operativas mapeadas
          </div>
        </div>

        {/* Card 3: Calibration by T-Shirt Size */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Calibración de Camisetas</span>
            <span
              className={`p-1.5 rounded-lg ${
                globalStats.overRangeCount === 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
              }`}
            >
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {globalStats.inRangeCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">en plazo estipulado</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Proyectos excedidos:</span>
            <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded text-[11px]">
              {globalStats.overRangeCount} iniciativas
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
            Reglas S(0-1m), M(1-2m), L(2-3m), XL(3-4.5m)
          </div>
        </div>

        {/* Card 4: Rules Reference */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Reglas de Camiseta Oficiales</span>
            <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Target className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1 text-[10px] text-center font-mono font-semibold">
            <div className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 py-1 rounded" title="0 a 1 mes">
              S: ≤1m
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 py-1 rounded" title="> 1 mes hasta 2 meses">
              M: 1-2m
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 py-1 rounded" title="> 2 meses hasta 3 meses">
              L: 2-3m
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 py-1 rounded" title="> 3 meses hasta 4.5 meses">
              XL: 3-4.5m
            </div>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 dark:text-slate-500 text-center">
            Umbrales de estimación teórica
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Interactive Detail Box with Prominent View Switcher                       */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col transition-colors">
        {/* Detail Box Header Toolbar with Switcher Buttons and Arrow Navigation */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-850/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Auditoría de Iniciativas: Comprometido vs Entregado
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {viewMode === 'scatter'
                ? 'Gráfico de dispersión interactivo: Duración real en meses vs Talle de camiseta estipulado (S, M, L, XL)'
                : viewMode === 'table'
                ? 'Vista tabular comparativa con tamaño de camiseta, meta del Q y brecha de entrega'
                : 'Tarjetas detalladas con objetivo del Q, meta comprometida y desglose de tareas'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter by Initiative Type (Negocio vs Interna) */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 text-xs shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 pl-2 pr-1">Tipo:</span>
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-slate-900 dark:bg-blue-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todas ({quarterProjects.length})
              </button>
              <button
                onClick={() => setTypeFilter('negocio')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  typeFilter === 'negocio'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                💼 Negocio
              </button>
              <button
                onClick={() => setTypeFilter('interna')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  typeFilter === 'interna'
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ⚙️ Internas
              </button>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('scatter')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'scatter'
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Gráfico de Dispersión (Talle vs Tiempo en Meses)"
              >
                <ScatterIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Dispersión</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Vista de Tarjetas Detalladas"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Tarjetas</span>
              </button>
            </div>

            {/* Arrow Navigator buttons */}
            <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xs">
              <button
                onClick={handlePrevView}
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                title="Vista anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextView}
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-l border-slate-100 dark:border-slate-700"
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
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No hay iniciativas para mostrar</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              No se encontraron proyectos para el trimestre <strong>{selectedQuarter}</strong> con los filtros actuales.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setTypeFilter('all');
                  setSearch('');
                  onQuarterChange('__ALL__');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors"
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
          <div className="p-6 flex flex-col gap-6 bg-white dark:bg-slate-900 transition-colors">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ScatterIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Matriz de Dispersión: Tiempo Real (Meses) vs Talle de Camiseta Estipulado</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Las bandas verdes representan la ventana de tiempo esperada para cada talle. Puntos en rojo indican proyectos que excedieron el plazo de su camiseta. Haz clic en un punto para ver su detalle.
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-xs flex-wrap bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-xs" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">En Tiempo (Calibrado)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-xs" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Excedió Camiseta</span>
                </div>
                <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  <span>💼 = Negocio</span>
                  <span>|</span>
                  <span>⚙️ = Interna</span>
                </div>
              </div>
            </div>

            {/* Scatter SVG Canvas */}
            <div className="w-full bg-slate-50/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 overflow-x-auto shadow-inner">
              <div className="min-w-[760px] relative">
                <svg
                  viewBox="0 0 920 480"
                  className="w-full h-auto overflow-visible select-none"
                >
                  <defs>
                    <linearGradient id="safeGrad" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.10" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.22" />
                    </linearGradient>
                    <linearGradient id="exceedGrad" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity="0.04" />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity="0.12" />
                    </linearGradient>
                    <filter id="shadowPoint" x="-30%" y="-30%" width="160%" height="160%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25" />
                    </filter>
                  </defs>

                  {/* Axis lines & Grid: Y Axis from 0 to 5.0 months */}
                  {/* Origin: x=80, y=410. Max: y=50 corresponds to 5.0 months. (scale: (410-50)/5.0 = 72px per month) */}
                  {[0, 1, 2, 3, 4, 5].map((month) => {
                    const y = 410 - month * 72;
                    return (
                      <g key={`y-grid-${month}`}>
                        <line
                          x1="80"
                          y1={y}
                          x2="880"
                          y2={y}
                          className="stroke-slate-200 dark:stroke-slate-800"
                          strokeWidth={month === 0 ? 2 : 1}
                          strokeDasharray={month === 0 ? '' : '4,4'}
                        />
                        <text
                          x="70"
                          y={y + 4}
                          textAnchor="end"
                          className="text-[11px] font-mono fill-slate-500 dark:fill-slate-400"
                        >
                          {month}.0m
                        </text>
                      </g>
                    );
                  })}

                  {/* Half-month subtle grid marks */}
                  {[0.5, 1.5, 2.5, 3.5, 4.5].map((half) => {
                    const y = 410 - half * 72;
                    return (
                      <line
                        key={`half-${half}`}
                        x1="80"
                        y1={y}
                        x2="880"
                        y2={y}
                        className="stroke-slate-200 dark:stroke-slate-800"
                        strokeWidth="0.8"
                        strokeDasharray="2,3"
                      />
                    );
                  })}

                  {/* Y Axis Label */}
                  <text
                    x="20"
                    y="230"
                    transform="rotate(-90 20 230)"
                    textAnchor="middle"
                    className="text-xs font-bold fill-slate-600 dark:fill-slate-400 tracking-wider"
                  >
                    DURACIÓN REAL DEL PROYECTO (MESES)
                  </text>

                  {/* Columns for T-Shirt Sizes: S, M, L, XL */}
                  {/* S: x=100..280, M: x=290..470, L: x=480..660, XL: x=670..850 */}
                  {[
                    { key: 'S', minM: 0, maxM: 1.0, x1: 95, x2: 275, cx: 185, label: 'Camiseta S', desc: '0 a 1 mes' },
                    { key: 'M', minM: 1.0, maxM: 2.0, x1: 290, x2: 470, cx: 380, label: 'Camiseta M', desc: '> 1 a 2 meses' },
                    { key: 'L', minM: 2.0, maxM: 3.0, x1: 485, x2: 665, cx: 575, label: 'Camiseta L', desc: '> 2 a 3 meses' },
                    { key: 'XL', minM: 3.0, maxM: 4.5, x1: 680, x2: 860, cx: 770, label: 'Camiseta XL', desc: '> 3 a 4.5 meses' },
                  ].map((col) => {
                    const topAllowedY = 410 - col.maxM * 72;
                    const bottomAllowedY = 410 - col.minM * 72;
                    const heightAllowed = bottomAllowedY - topAllowedY;

                    return (
                      <g key={col.key}>
                        {/* Exceeded zone upper background */}
                        <rect
                          x={col.x1}
                          y={50}
                          width={col.x2 - col.x1}
                          height={topAllowedY - 50}
                          fill="url(#exceedGrad)"
                          rx="4"
                        />

                        {/* Allowed Safe Zone for this Size */}
                        <rect
                          x={col.x1}
                          y={topAllowedY}
                          width={col.x2 - col.x1}
                          height={heightAllowed}
                          fill="url(#safeGrad)"
                          className="stroke-emerald-400 dark:stroke-emerald-500/60"
                          strokeWidth="1.5"
                          strokeDasharray="3,3"
                          rx="4"
                        />

                        {/* Top threshold boundary line for this size */}
                        <line
                          x1={col.x1}
                          y1={topAllowedY}
                          x2={col.x2}
                          y2={topAllowedY}
                          stroke="#10B981"
                          strokeWidth="2.5"
                        />
                        <rect
                          x={col.cx - 36}
                          y={topAllowedY - 11}
                          width="72"
                          height="18"
                          rx="4"
                          fill="#10B981"
                        />
                        <text
                          x={col.cx}
                          y={topAllowedY + 2}
                          textAnchor="middle"
                          fill="#FFFFFF"
                          className="text-[9.5px] font-bold font-mono"
                        >
                          Máx {col.maxM}m
                        </text>

                        {/* Column Header at X bottom */}
                        <rect
                          x={col.x1}
                          y="420"
                          width={col.x2 - col.x1}
                          height="42"
                          rx="8"
                          className="fill-white dark:fill-slate-850 stroke-slate-200 dark:stroke-slate-700"
                        />
                        <text
                          x={col.cx}
                          y="437"
                          textAnchor="middle"
                          className="text-xs font-bold fill-slate-800 dark:fill-slate-200"
                        >
                          {col.label}
                        </text>
                        <text
                          x={col.cx}
                          y="452"
                          textAnchor="middle"
                          className="text-[10px] font-mono fill-slate-500 dark:fill-slate-400"
                        >
                          Banda: {col.desc}
                        </text>
                      </g>
                    );
                  })}

                  {/* DATA POINTS PLACEMENT */}
                  {/* Points distributed with intelligent horizontal offset to never overlap */}
                  {projectMetrics.map((m) => {
                    const sizeKey = m.size;
                    const colConfig: Record<TaskSize, { x1: number; x2: number; cx: number }> = {
                      XS: { x1: 95, x2: 275, cx: 185 },
                      S: { x1: 95, x2: 275, cx: 185 },
                      M: { x1: 290, x2: 470, cx: 380 },
                      L: { x1: 485, x2: 665, cx: 575 },
                      XL: { x1: 680, x2: 860, cx: 770 },
                    };
                    const colCoords = colConfig[sizeKey] || colConfig.M;

                    // Y position based on durationMonths (clamped between 0 and 5.0)
                    const clampedMonths = Math.min(5.0, Math.max(0.1, m.durationMonths));
                    const y = 410 - clampedMonths * 72;

                    // Stagger horizontally based on index of same size to prevent stacking
                    const sameSizeProjects = projectMetrics.filter((p) => p.size === sizeKey);
                    const idxInSize = sameSizeProjects.findIndex((p) => p.project.id === m.project.id);
                    const countInSize = sameSizeProjects.length;

                    // Safe span inside column: 130px width
                    const offsetStep = countInSize > 1 ? (130 / (countInSize - 1)) : 0;
                    const xOffset = countInSize > 1 ? -65 + idxInSize * offsetStep : 0;
                    const cx = colCoords.cx + xOffset;

                    const isSelected = selectedProjectId === m.project.id;
                    const isHovered = hoveredProjectId === m.project.id;
                    const isOver = !m.isWithinSizeRange;

                    return (
                      <g
                        key={`point-${m.project.id}`}
                        className="cursor-pointer group/dot transition-transform"
                        onClick={() => setSelectedProjectId(m.project.id)}
                        onMouseEnter={() => setHoveredProjectId(m.project.id)}
                        onMouseLeave={() => setHoveredProjectId(null)}
                      >
                        {/* Hover/Selection Halo */}
                        {(isSelected || isHovered) && (
                          <circle
                            cx={cx}
                            cy={y}
                            r="20"
                            className={
                              isOver
                                ? 'fill-rose-500/20 stroke-rose-400 stroke-2 animate-pulse'
                                : 'fill-emerald-500/20 stroke-emerald-400 stroke-2 animate-pulse'
                            }
                          />
                        )}

                        {/* Drop line to X axis on hover/selection */}
                        {(isSelected || isHovered) && (
                          <line
                            x1={cx}
                            y1={y}
                            x2={cx}
                            y2={410}
                            className="stroke-slate-400 dark:stroke-slate-500 stroke-1"
                            strokeDasharray="2,2"
                          />
                        )}

                        {/* Main Dot */}
                        <circle
                          cx={cx}
                          cy={y}
                          r={isSelected ? 11 : isHovered ? 10 : 8}
                          fill={isOver ? '#EF4444' : '#10B981'}
                          className="stroke-white dark:stroke-slate-900 transition-all"
                          strokeWidth="2.5"
                          filter="url(#shadowPoint)"
                        />

                        {/* Label Badge above point */}
                        <g transform={`translate(${cx}, ${y - 14})`}>
                          <rect
                            x="-32"
                            y="-14"
                            width="64"
                            height="16"
                            rx="4"
                            className={`${
                              isOver
                                ? 'fill-rose-900/90 dark:fill-rose-950/90'
                                : 'fill-slate-900/90 dark:fill-slate-800/90'
                            }`}
                          />
                          <text
                            x="0"
                            y="-3"
                            textAnchor="middle"
                            fill="#FFFFFF"
                            className="text-[9px] font-mono font-bold"
                          >
                            {m.durationMonths}m · {m.project.code}
                          </text>
                        </g>

                        {/* Warning exclamation badge if over */}
                        {isOver && (
                          <g transform={`translate(${cx + 8}, ${y - 8})`}>
                            <circle cx="0" cy="0" r="6" fill="#DC2626" />
                            <text
                              x="0"
                              y="3"
                              textAnchor="middle"
                              fill="#FFFFFF"
                              className="text-[8px] font-bold"
                            >
                              !
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Selected Project Card & Diagnosis (Click on any dot to see) */}
            {activeDetailItem && (
              <div
                className={`p-4 rounded-xl border transition-all ${
                  activeDetailItem.isWithinSizeRange
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-sm ${
                        activeDetailItem.isWithinSizeRange ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    >
                      {activeDetailItem.size}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {activeDetailItem.project.name}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          [{activeDetailItem.project.code}]
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            activeDetailItem.initiativeType === 'negocio'
                              ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300'
                              : 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300'
                          }`}
                        >
                          {activeDetailItem.initiativeType === 'negocio' ? '💼 Negocio' : '⚙️ Interna'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            activeDetailItem.isWithinSizeRange
                              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          {activeDetailItem.isWithinSizeRange ? '✓ En plazo estipulado' : '⚠ Plazo Excedido'}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
                        <span>
                          <strong>Objetivo del Q:</strong>{' '}
                          <span className="italic">
                            {activeDetailItem.project.quarterObjective || 'Poner en producción el módulo'}
                          </span>
                        </span>
                        <span>
                          <strong>Duración calculada:</strong>{' '}
                          <span className="font-mono font-bold">{activeDetailItem.durationMonths} meses</span> (
                          {activeDetailItem.durationDays} días)
                        </span>
                        <span>
                          <strong>Ventana de la camiseta:</strong>{' '}
                          <span className="font-mono">{activeDetailItem.sizeRange.desc}</span>
                        </span>
                        {!activeDetailItem.isWithinSizeRange && (
                          <span className="text-rose-700 dark:text-rose-400 font-bold font-mono">
                            Desvío: +{activeDetailItem.deviationMonths} meses
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        Cumplimiento del Q
                      </div>
                      <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                        {activeDetailItem.complianceRatio}%
                      </div>
                    </div>
                    {onViewGantt && (
                      <button
                        onClick={onViewGantt}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
                      >
                        <span>Ver en Gantt</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: COMPARATIVE TABLE (Comprometido vs Entregado + Camisetas)         */}
        {/* ========================================================================= */}
        {viewMode === 'table' && projectMetrics.length > 0 && (
          <div className="overflow-x-auto bg-white dark:bg-slate-900 transition-colors">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/90 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                  <th className="py-3 px-4">Iniciativa / Proyecto</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3 text-center">Talle</th>
                  <th className="py-3 px-3">Comprometido (Meta)</th>
                  <th className="py-3 px-3">Entregado (Alcanzado)</th>
                  <th className="py-3 px-3 text-center">% Cumplido</th>
                  <th className="py-3 px-3 text-right">Duración Real</th>
                  <th className="py-3 px-3 text-center">Diagnóstico Plazo</th>
                  <th className="py-3 px-4">Objetivo Específico del Q</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {projectMetrics.map((m) => {
                  const targetCfg = STAGE_CONFIG[m.targetStage];
                  const reachedCfg = STAGE_CONFIG[m.highestAchievedStage];

                  return (
                    <tr
                      key={m.project.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors ${
                        selectedProjectId === m.project.id ? 'bg-blue-50/50 dark:bg-blue-950/40' : ''
                      }`}
                      onClick={() => setSelectedProjectId(m.project.id)}
                    >
                      {/* Name & Code */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{m.project.name}</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">[{m.project.code}]</div>
                      </td>

                      {/* Initiative Type */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            m.initiativeType === 'negocio'
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900'
                              : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900'
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
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">
                          {m.size}
                        </span>
                        <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">{m.sizeRange.desc}</div>
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
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                          {m.complianceRatio}%
                        </span>
                        <div className="w-16 mx-auto bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              m.complianceRatio >= 100
                                ? 'bg-emerald-500'
                                : m.complianceRatio >= 75
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${m.complianceRatio}%` }}
                          />
                        </div>
                      </td>

                      {/* Duración Real (Meses) */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        {m.durationMonths} meses
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                          {m.durationDays} días
                        </div>
                      </td>

                      {/* Diagnóstico Plazo Camiseta */}
                      <td className="py-3.5 px-3 text-center">
                        {m.isWithinSizeRange ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>En plazo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                            <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                            <span>+{m.deviationMonths}m exceso</span>
                          </span>
                        )}
                      </td>

                      {/* Objetivo del Q */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 italic max-w-xs">
                        {m.project.quarterObjective || 'Objetivo general de entrega de valor al cliente.'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: DETAILED CARDS GRID                                               */}
        {/* ========================================================================= */}
        {viewMode === 'cards' && projectMetrics.length > 0 && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 bg-white dark:bg-slate-900 transition-colors">
            {projectMetrics.map((m) => {
              const targetCfg = STAGE_CONFIG[m.targetStage];
              const reachedCfg = STAGE_CONFIG[m.highestAchievedStage];

              return (
                <div
                  key={m.project.id}
                  className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div>
                    {/* Header card */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {m.project.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                            [{m.project.code}]
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Lead: {m.project.projectLead}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded">
                          Talle {m.size}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            m.initiativeType === 'negocio'
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                              : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                          }`}
                        >
                          {m.initiativeType === 'negocio' ? 'Negocio' : 'Interna'}
                        </span>
                      </div>
                    </div>

                    {/* Quarter Objective Box */}
                    <div className="mt-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-lg p-2.5">
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Objetivo para este Quarter
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 italic">
                        "{m.project.quarterObjective || 'Poner en producción las capacidades del módulo.'}"
                      </div>
                    </div>

                    {/* Target vs Delivered Stage comparison */}
                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold block">
                          Comprometido
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 inline-block">
                          {targetCfg.name} ({m.targetPercent}%)
                        </span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold block">
                          Entregado Real
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 inline-block">
                          {reachedCfg.name} ({m.achievedPercent}%)
                        </span>
                      </div>
                    </div>

                    {/* Duration diagnosis */}
                    <div className="mt-3.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg">
                      <span>Duración: <strong className="text-slate-800 dark:text-slate-200">{m.durationMonths}m</strong></span>
                      <span>Teórica: <strong className="text-slate-800 dark:text-slate-200">{m.sizeRange.desc}</strong></span>
                      {m.isWithinSizeRange ? (
                        <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">✓ En plazo</span>
                      ) : (
                        <span className="text-rose-700 dark:text-rose-400 font-bold text-[11px]">+{m.deviationMonths}m</span>
                      )}
                    </div>
                  </div>

                  {/* Footer with Compliance Percentage */}
                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">
                        Cumplimiento
                      </div>
                      <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                        {m.complianceRatio}%
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenTaskModal(m.project.id)}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      + Añadir Tarea
                    </button>
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

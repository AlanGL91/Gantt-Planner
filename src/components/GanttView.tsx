import React, { useRef, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Calendar,
  Layers,
  Folder,
  Diamond,
  User,
  Clock,
  ExternalLink,
} from 'lucide-react';
import {
  Project,
  Task,
  Subtask,
  TaskStage,
  TimeAperture,
  TimelineColumn,
} from '../types/gantt';
import { STAGE_CONFIG, STATUS_CONFIG } from '../data/initialData';
import {
  formatDateFriendly,
  formatDateRange,
  getDaysDifference,
  calculateBarPosition,
  calculateTodayPosition,
} from '../utils/dateUtils';

interface GanttViewProps {
  projects: Project[];
  aperture: TimeAperture;
  timelineColumns: TimelineColumn[];
  columnWidth: number;
  expandedProjects: Set<string>;
  expandedStages: Set<string>; // format: `${projectId}_${stage}`
  expandedTasks: Set<string>;
  onToggleProject: (projectId: string) => void;
  onToggleStage: (projectId: string, stage: TaskStage) => void;
  onToggleTask: (taskId: string) => void;
  onEditTask: (projectId: string, task: Task | Subtask, isSubtask?: boolean, parentTaskId?: string) => void;
  onAddTaskToStage: (projectId: string, stage: TaskStage) => void;
  onAddSubtask: (projectId: string, parentTaskId: string) => void;
  onEditProject: (project: Project) => void;
}

export const GanttView: React.FC<GanttViewProps> = ({
  projects,
  aperture,
  timelineColumns,
  columnWidth,
  expandedProjects,
  expandedStages,
  expandedTasks,
  onToggleProject,
  onToggleStage,
  onToggleTask,
  onEditTask,
  onAddTaskToStage,
  onAddSubtask,
  onEditProject,
}) => {
  const leftTableRef = useRef<HTMLDivElement>(null);
  const rightCanvasRef = useRef<HTMLDivElement>(null);

  // Sync vertical scrolling
  const handleLeftScroll = () => {
    if (leftTableRef.current && rightCanvasRef.current) {
      rightCanvasRef.current.scrollTop = leftTableRef.current.scrollTop;
    }
  };

  const handleRightScroll = () => {
    if (leftTableRef.current && rightCanvasRef.current) {
      leftTableRef.current.scrollTop = rightCanvasRef.current.scrollTop;
    }
  };

  const todayX = calculateTodayPosition(timelineColumns, columnWidth);
  const totalTimelineWidth = timelineColumns.length * columnWidth;

  const STAGES_ORDER: TaskStage[] = ['backlog', 'relevamiento', 'qa', 'produccion'];

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-hidden select-none transition-colors">
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================= */}
        {/* LEFT PANE: Hierarchical Table Tree (Accordion) */}
        {/* ========================================================= */}
        <div
          ref={leftTableRef}
          onScroll={handleLeftScroll}
          className="w-[480px] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-y-auto overflow-x-hidden shadow-xs z-10"
        >
          {/* Header Row */}
          <div className="h-[58px] bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>Proyecto / Etapa / Tareas</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500 font-medium">
              <span className="w-20 text-right">Fechas</span>
              <span className="w-20 text-left">Responsable</span>
            </div>
          </div>

          {/* Rows Tree */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {projects.map((project) => {
              const isProjectExpanded = expandedProjects.has(project.id);
              const totalTasksCount = project.tasks.length;

              return (
                <div key={project.id} className="group/proj">
                  {/* PROJECT ROW */}
                  <div
                    className="h-11 px-3 bg-slate-50/80 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-700 flex items-center justify-between cursor-pointer border-l-4 transition-colors"
                    style={{ borderLeftColor: project.color }}
                    onClick={() => onToggleProject(project.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleProject(project.id);
                        }}
                        className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors"
                      >
                        {isProjectExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      <Folder
                        className="w-4 h-4 shrink-0"
                        style={{ color: project.color }}
                      />

                      <div className="truncate flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {project.name}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono shrink-0">
                          [{project.code}]
                        </span>
                        <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 px-1.5 py-0.2 rounded-full shrink-0">
                          {project.quarter || 'Sin Q'}
                        </span>
                        {project.size && (
                          <span className="text-[10px] font-bold font-mono text-slate-700 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.2 rounded shrink-0">
                            {project.size}
                          </span>
                        )}
                        {project.initiativeType && (
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full shrink-0 ${
                              project.initiativeType === 'negocio'
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900'
                                : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900'
                            }`}
                          >
                            {project.initiativeType === 'negocio' ? 'Negocio' : 'Interna'}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono shrink-0">
                          ({totalTasksCount})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-xs">
                      {/* Project Lead */}
                      <div
                        className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 truncate max-w-[140px]"
                        title={`Responsable del Proyecto: ${project.projectLead}`}
                      >
                        <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold text-[10px] flex items-center justify-center shrink-0">
                          {project.leadAvatar || 'PL'}
                        </div>
                        <span className="truncate text-[11px] font-medium">
                          {project.projectLead.split(' ')[0]}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditProject(project);
                        }}
                        className="opacity-0 group-hover/proj:opacity-100 p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-opacity"
                        title="Configurar Proyecto"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* STAGES ACCORDION */}
                  {isProjectExpanded && (
                    <div className="bg-white dark:bg-slate-900">
                      {STAGES_ORDER.map((stageKey) => {
                        const stageConfig = STAGE_CONFIG[stageKey];
                        const stageKeyId = `${project.id}_${stageKey}`;
                        const isStageExpanded = expandedStages.has(stageKeyId);
                        const stageTasks = project.tasks.filter(
                          (t) => t.stage === stageKey
                        );

                        return (
                          <div key={stageKeyId}>
                            {/* STAGE HEADER ROW */}
                            <div
                              className="h-10 px-6 bg-slate-50/40 dark:bg-slate-800/60 hover:bg-slate-100/50 dark:hover:bg-slate-800 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 cursor-pointer transition-colors"
                              onClick={() => onToggleStage(project.id, stageKey)}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleStage(project.id, stageKey);
                                  }}
                                  className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors"
                                >
                                  {isStageExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: stageConfig.color }}
                                />

                                <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                                  {stageConfig.name}
                                </span>

                                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono tabular-nums">
                                  ({stageTasks.length})
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAddTaskToStage(project.id, stageKey);
                                  }}
                                  className="flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-2 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                                  title={`Agregar tarea a ${stageConfig.name}`}
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Tarea</span>
                                </button>
                              </div>
                            </div>

                            {/* TASKS IN THIS STAGE */}
                            {isStageExpanded && (
                              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {stageTasks.length === 0 ? (
                                  <div className="h-9 px-10 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 italic bg-white dark:bg-slate-900">
                                    <span>No hay tareas en esta etapa</span>
                                    <button
                                      onClick={() => onAddTaskToStage(project.id, stageKey)}
                                      className="text-blue-600 dark:text-blue-400 hover:underline not-italic font-normal"
                                    >
                                      + Agregar
                                    </button>
                                  </div>
                                ) : (
                                  stageTasks.map((task) => {
                                    const isTaskExpanded = expandedTasks.has(task.id);
                                    const subtasksCount = task.subtasks?.length || 0;
                                    const statusCfg = STATUS_CONFIG[task.status];

                                    return (
                                      <div key={task.id}>
                                        {/* TASK ROW */}
                                        <div
                                          className="h-10 pl-9 pr-3 hover:bg-blue-50/30 dark:hover:bg-slate-800/70 flex items-center justify-between cursor-pointer transition-colors group/task"
                                          onClick={() =>
                                            onEditTask(project.id, task, false)
                                          }
                                        >
                                          <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                                            {subtasksCount > 0 ? (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  onToggleTask(task.id);
                                                }}
                                                className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors"
                                              >
                                                {isTaskExpanded ? (
                                                  <ChevronDown className="w-3.5 h-3.5" />
                                                ) : (
                                                  <ChevronRight className="w-3.5 h-3.5" />
                                                )}
                                              </button>
                                            ) : (
                                              <span className="w-4" />
                                            )}

                                            <div
                                              className="w-2 h-2 rounded-xs shrink-0"
                                              style={{ backgroundColor: task.color || project.color }}
                                            />

                                            <span className="truncate text-xs text-slate-800 dark:text-slate-200 font-medium">
                                              {task.title}
                                            </span>

                                            {task.epic && (
                                              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[100px] shrink-0">
                                                [{task.epic}]
                                              </span>
                                            )}
                                          </div>

                                          {/* Right metadata for task */}
                                          <div className="flex items-center gap-4 text-xs shrink-0 text-slate-500 dark:text-slate-400 font-mono">
                                            <span className="text-[11px] tabular-nums w-20 text-right">
                                              {formatDateFriendly(task.startDate)}
                                            </span>

                                            {/* Assignee Avatar */}
                                            <div
                                              className="flex items-center gap-1.5 w-20 truncate"
                                              title={`Responsable: ${task.assignee}`}
                                            >
                                              <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 font-medium text-[8px] flex items-center justify-center shrink-0">
                                                {task.assigneeAvatar || task.assignee.substring(0, 2).toUpperCase()}
                                              </div>
                                              <span className="truncate text-[11px] text-slate-700 dark:text-slate-300">
                                                {task.assignee.split(' ')[0]}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* SUBTASKS ACCORDION */}
                                        {isTaskExpanded &&
                                          task.subtasks &&
                                          task.subtasks.map((subtask) => (
                                            <div
                                              key={subtask.id}
                                              className="h-8 pl-16 pr-3 bg-slate-50/30 dark:bg-slate-900/40 hover:bg-slate-100/40 dark:hover:bg-slate-800/50 flex items-center justify-between cursor-pointer border-t border-slate-50 dark:border-slate-850 transition-colors"
                                              onClick={() =>
                                                onEditTask(
                                                  project.id,
                                                  subtask,
                                                  true,
                                                  task.id
                                                )
                                              }
                                            >
                                              <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                                                <span className="text-slate-300 dark:text-slate-600 text-xs">↳</span>
                                                <span className="truncate text-[11px] text-slate-600 dark:text-slate-300">
                                                  {subtask.title}
                                                </span>
                                              </div>

                                              <div className="flex items-center gap-4 text-[10px] shrink-0 text-slate-400 dark:text-slate-500 font-mono">
                                                <span className="tabular-nums w-20 text-right">
                                                  {formatDateFriendly(subtask.startDate)}
                                                </span>

                                                {/* Subtask distinct assignee */}
                                                <div
                                                  className="flex items-center gap-1.5 w-20 truncate"
                                                  title={`Responsable Subtarea: ${subtask.assignee}`}
                                                >
                                                  <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-[8px] flex items-center justify-center shrink-0">
                                                    {subtask.assigneeAvatar || subtask.assignee.substring(0, 2).toUpperCase()}
                                                  </div>
                                                  <span className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                                                    {subtask.assignee.split(' ')[0]}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT PANE: Interactive Gantt Canvas & Timeline */}
        {/* ========================================================= */}
        <div
          ref={rightCanvasRef}
          onScroll={handleRightScroll}
          className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-950 relative"
        >
          <div
            style={{ width: `${totalTimelineWidth}px` }}
            className="min-w-full relative"
          >
            {/* TIMELINE HEADER (Two-tier) */}
            <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              {/* Group Tier (Months or Years) */}
              <div className="h-7 border-b border-slate-100 dark:border-slate-800 flex divide-x divide-slate-100 dark:divide-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                {timelineColumns.map((col, idx) => {
                  const prevCol = timelineColumns[idx - 1];
                  const showGroupLabel =
                    !prevCol || prevCol.groupLabel !== col.groupLabel;

                  return (
                    <div
                      key={`grp-${col.id}`}
                      style={{ width: `${columnWidth}px` }}
                      className="shrink-0 px-2 flex items-center text-slate-500 dark:text-slate-400 overflow-hidden"
                    >
                      {showGroupLabel && (
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {col.groupLabel}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Ticks Tier (Weeks, Sprints, Months, Quarters) */}
              <div className="h-7 flex divide-x divide-slate-200/80 dark:divide-slate-800 text-[11px] font-mono">
                {timelineColumns.map((col) => (
                  <div
                    key={col.id}
                    style={{ width: `${columnWidth}px` }}
                    className={`shrink-0 px-1.5 flex flex-col justify-center items-center overflow-hidden transition-colors ${
                      col.isToday
                        ? 'bg-blue-50/70 dark:bg-blue-950/50 font-semibold text-blue-700 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="truncate">{col.label}</span>
                    {col.subLabel && (
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate">
                        {col.subLabel}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Vertical grid lines background */}
            <div className="absolute inset-0 top-[58px] pointer-events-none flex divide-x divide-slate-200/60 dark:divide-slate-800/50 z-0">
              {timelineColumns.map((col) => (
                <div
                  key={`grid-${col.id}`}
                  style={{ width: `${columnWidth}px` }}
                  className={`shrink-0 h-full ${
                    col.isToday ? 'bg-blue-50/20 dark:bg-blue-950/20' : ''
                  }`}
                />
              ))}
            </div>

            {/* "HOY" (Today) Vertical Line */}
            {todayX !== null && (
              <div
                id="today-marker-line"
                style={{ left: `${todayX}px` }}
                className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10 pointer-events-none shadow-xs"
              >
                <div className="sticky top-7 -translate-x-1/2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                  Hoy
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* GANTT BARS: Exactly aligned with left-side table rows */}
            {/* ========================================================= */}
            <div className="relative z-5">
              {projects.map((project) => {
                const isProjectExpanded = expandedProjects.has(project.id);

                // Project span dates
                const allProjectDates = (project.tasks || [])
                  .flatMap((t) => [
                    t.startDate,
                    t.endDate,
                    ...(t.subtasks?.flatMap((st) => [st.startDate, st.endDate]) || []),
                  ])
                  .filter(Boolean) as string[];
                const minProjDate = allProjectDates.length > 0 ? [...allProjectDates].sort()[0] : '';
                const maxProjDate = allProjectDates.length > 0 ? [...allProjectDates].sort()[allProjectDates.length - 1] : '';
                const projPos = calculateBarPosition(
                  minProjDate,
                  maxProjDate,
                  timelineColumns,
                  columnWidth
                );

                return (
                  <div key={`gantt-proj-${project.id}`}>
                    {/* PROJECT SUMMARY BAR ROW (Height: 44px) */}
                    <div className="h-11 flex items-center relative border-b border-transparent">
                      {projPos.isVisible && (
                        <div
                          style={{
                            left: `${projPos.left}px`,
                            width: `${projPos.width}px`,
                          }}
                          className="absolute h-5 rounded-md flex items-center px-2 cursor-pointer shadow-xs transition-transform hover:scale-[1.01]"
                          onClick={() => onToggleProject(project.id)}
                        >
                          <div
                            className="absolute inset-0 rounded-md opacity-25 dark:opacity-40"
                            style={{ backgroundColor: project.color }}
                          />
                          <div
                            className="absolute top-0 left-0 bottom-0 w-1.5 rounded-l-md"
                            style={{ backgroundColor: project.color }}
                          />
                          <div
                            className="absolute top-0 right-0 bottom-0 w-1.5 rounded-r-md"
                            style={{ backgroundColor: project.color }}
                          />
                          <span
                            className="relative text-[11px] font-bold truncate z-1 text-slate-900 dark:text-white"
                          >
                            {project.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* STAGES ACCORDION BARS */}
                    {isProjectExpanded &&
                      STAGES_ORDER.map((stageKey) => {
                        const stageConfig = STAGE_CONFIG[stageKey];
                        const stageKeyId = `${project.id}_${stageKey}`;
                        const isStageExpanded = expandedStages.has(stageKeyId);
                        const stageTasks = project.tasks.filter(
                          (t) => t.stage === stageKey
                        );

                        // Stage date bounds
                        const stageDates = (stageTasks || [])
                          .flatMap((t) => [
                            t.startDate,
                            t.endDate,
                            ...(t.subtasks?.flatMap((st) => [st.startDate, st.endDate]) || []),
                          ])
                          .filter(Boolean) as string[];
                        const minStageDate = stageDates.length > 0 ? [...stageDates].sort()[0] : '';
                        const maxStageDate = stageDates.length > 0 ? [...stageDates].sort()[stageDates.length - 1] : '';
                        const stagePos = calculateBarPosition(
                          minStageDate,
                          maxStageDate,
                          timelineColumns,
                          columnWidth
                        );

                        return (
                          <div key={`gantt-stage-${stageKeyId}`}>
                            {/* STAGE HEADER ROW (Height: 40px) */}
                            <div className="h-10 flex items-center relative border-t border-slate-100 dark:border-slate-800">
                              {stagePos.isVisible && (
                                <div
                                  style={{
                                    left: `${stagePos.left}px`,
                                    width: `${stagePos.width}px`,
                                    backgroundColor: stageConfig.color,
                                  }}
                                  className="absolute h-2.5 rounded-full opacity-60 dark:opacity-80 shadow-xs cursor-pointer hover:opacity-100 transition-opacity"
                                  onClick={() => onToggleStage(project.id, stageKey)}
                                  title={`${stageConfig.name}: ${formatDateRange(minStageDate, maxStageDate)}`}
                                />
                              )}
                            </div>

                            {/* TASKS BARS */}
                            {isStageExpanded &&
                              stageTasks.map((task) => {
                                const isTaskExpanded = expandedTasks.has(task.id);
                                const taskPos = calculateBarPosition(
                                  task.startDate,
                                  task.endDate,
                                  timelineColumns,
                                  columnWidth
                                );

                                return (
                                  <div key={`gantt-task-${task.id}`}>
                                    {/* TASK ROW BAR (Height: 40px) */}
                                    <div className="h-10 flex items-center relative border-b border-transparent">
                                      {taskPos.isVisible && (
                                        <div
                                          style={{
                                            left: `${taskPos.left}px`,
                                            width: `${taskPos.width}px`,
                                          }}
                                          className="absolute h-6 rounded-md flex items-center px-2 cursor-pointer shadow-xs group/bar transition-all hover:ring-2 hover:ring-blue-400"
                                          onClick={() =>
                                            onEditTask(project.id, task, false)
                                          }
                                        >
                                          {/* Main colored task background bar */}
                                          <div
                                            className="absolute inset-0 rounded-md opacity-90 shadow-xs"
                                            style={{
                                              backgroundColor: task.color || project.color,
                                            }}
                                          />

                                          {/* Progress overlay */}
                                          {task.progress > 0 && (
                                            <div
                                              style={{ width: `${task.progress}%` }}
                                              className="absolute top-0 bottom-0 left-0 bg-black/15 dark:bg-white/20 rounded-l-md pointer-events-none"
                                            />
                                          )}

                                          {/* Label inside bar */}
                                          <span className="relative text-[11px] font-semibold text-white truncate z-1 drop-shadow-xs">
                                            {task.title}
                                          </span>

                                          {/* Progress tag if wide enough */}
                                          {taskPos.width > 80 && (
                                            <span className="relative ml-auto text-[9px] font-mono font-medium text-white/90 z-1 tabular-nums">
                                              {task.progress}%
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {/* SUBTASK BARS (Height: 32px each) */}
                                    {isTaskExpanded &&
                                      task.subtasks &&
                                      task.subtasks.map((subtask) => {
                                        const subtaskPos = calculateBarPosition(
                                          subtask.startDate,
                                          subtask.endDate,
                                          timelineColumns,
                                          columnWidth
                                        );

                                        return (
                                          <div
                                            key={`gantt-sub-${subtask.id}`}
                                            className="h-8 flex items-center relative border-b border-transparent"
                                          >
                                            {subtaskPos.isVisible && (
                                              <div
                                                style={{
                                                  left: `${subtaskPos.left}px`,
                                                  width: `${subtaskPos.width}px`,
                                                }}
                                                className="absolute h-4 rounded flex items-center px-1.5 cursor-pointer shadow-2xs hover:brightness-110 transition-all"
                                                onClick={() =>
                                                  onEditTask(
                                                    project.id,
                                                    subtask,
                                                    true,
                                                    task.id
                                                  )
                                                }
                                              >
                                                <div
                                                  className="absolute inset-0 rounded opacity-75 dark:opacity-85"
                                                  style={{
                                                    backgroundColor:
                                                      task.color || project.color,
                                                  }}
                                                />
                                                <span className="relative text-[10px] text-white truncate z-1">
                                                  {subtask.title}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                  </div>
                                );
                              })}
                          </div>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

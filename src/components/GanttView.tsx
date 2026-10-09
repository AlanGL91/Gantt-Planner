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
    <div className="flex-1 flex flex-col bg-white overflow-hidden select-none">
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================= */}
        {/* LEFT PANE: Hierarchical Table Tree (Accordion) */}
        {/* ========================================================= */}
        <div
          ref={leftTableRef}
          onScroll={handleLeftScroll}
          className="w-[480px] shrink-0 border-r border-slate-200 bg-white flex flex-col overflow-y-auto overflow-x-hidden shadow-xs z-10"
        >
          {/* Header Row */}
          <div className="h-[58px] bg-slate-50 border-b border-slate-200 px-4 flex items-center justify-between text-xs font-semibold text-slate-600 sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Proyecto / Etapa / Tareas</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400 font-medium">
              <span className="w-20 text-right">Fechas</span>
              <span className="w-20 text-left">Responsable</span>
            </div>
          </div>

          {/* Rows Tree */}
          <div className="divide-y divide-slate-100">
            {projects.map((project) => {
              const isProjectExpanded = expandedProjects.has(project.id);
              const totalTasksCount = project.tasks.length;

              return (
                <div key={project.id} className="group/proj">
                  {/* PROJECT ROW */}
                  <div
                    className="h-11 px-3 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between cursor-pointer border-l-4 transition-colors"
                    style={{ borderLeftColor: project.color }}
                    onClick={() => onToggleProject(project.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleProject(project.id);
                        }}
                        className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
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

                      <div className="truncate">
                        <span className="font-bold text-xs text-slate-900 mr-2">
                          {project.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          [{project.code}]
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-xs">
                      {/* Project Lead */}
                      <div
                        className="flex items-center gap-1.5 text-slate-600 truncate max-w-[140px]"
                        title={`Responsable del Proyecto: ${project.projectLead}`}
                      >
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-semibold text-[10px] flex items-center justify-center shrink-0">
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
                        className="opacity-0 group-hover/proj:opacity-100 p-1 text-slate-400 hover:text-slate-800 transition-opacity"
                        title="Configurar Proyecto"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* STAGES ACCORDION */}
                  {isProjectExpanded && (
                    <div className="bg-white">
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
                              className="h-10 px-6 bg-slate-50/40 hover:bg-slate-100/50 flex items-center justify-between border-t border-slate-100 cursor-pointer transition-colors"
                              onClick={() => onToggleStage(project.id, stageKey)}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleStage(project.id, stageKey);
                                  }}
                                  className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
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

                                <span className="font-semibold text-xs text-slate-800">
                                  {stageConfig.name}
                                </span>

                                <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                                  ({stageTasks.length})
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAddTaskToStage(project.id, stageKey);
                                  }}
                                  className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 px-2 py-0.5 rounded hover:bg-blue-50 transition-colors"
                                  title={`Agregar tarea a ${stageConfig.name}`}
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Tarea</span>
                                </button>
                              </div>
                            </div>

                            {/* TASKS IN THIS STAGE */}
                            {isStageExpanded && (
                              <div className="divide-y divide-slate-100">
                                {stageTasks.length === 0 ? (
                                  <div className="h-9 px-10 flex items-center justify-between text-xs text-slate-400 italic bg-white">
                                    <span>No hay tareas en esta etapa</span>
                                    <button
                                      onClick={() => onAddTaskToStage(project.id, stageKey)}
                                      className="text-blue-600 hover:underline not-italic font-normal"
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
                                          className="h-10 pl-9 pr-3 hover:bg-blue-50/30 flex items-center justify-between cursor-pointer transition-colors group/task"
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
                                                className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
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

                                            <span
                                              className="w-1.5 h-1.5 rounded-full shrink-0"
                                              style={{ backgroundColor: stageConfig.color }}
                                            />

                                            <span className="text-xs font-medium text-slate-800 truncate">
                                              {task.title}
                                            </span>

                                            {task.type === 'Hito' && (
                                              <Diamond className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                                            )}
                                          </div>

                                          <div className="flex items-center gap-3 shrink-0 text-xs">
                                            {/* Subtask addition button */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onAddSubtask(project.id, task.id);
                                              }}
                                              className="opacity-0 group-hover/task:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition-opacity"
                                              title="Añadir subtarea"
                                            >
                                              <Plus className="w-3 h-3" />
                                            </button>

                                            {/* Date */}
                                            <span className="text-[11px] text-slate-500 font-mono tabular-nums w-18 text-right">
                                              {formatDateFriendly(task.startDate)}
                                            </span>

                                            {/* Assignee */}
                                            <div
                                              className="flex items-center gap-1.5 w-24 truncate"
                                              title={`Responsable: ${task.assignee}`}
                                            >
                                              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-medium text-[9px] flex items-center justify-center shrink-0">
                                                {task.assigneeAvatar || task.assignee.substring(0, 2).toUpperCase()}
                                              </div>
                                              <span className="truncate text-[11px] text-slate-600">
                                                {task.assignee.split(' ')[0]}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* SUBTASKS ROWS */}
                                        {isTaskExpanded &&
                                          task.subtasks?.map((subtask) => (
                                            <div
                                              key={subtask.id}
                                              className="h-9 pl-14 pr-3 hover:bg-slate-50 flex items-center justify-between cursor-pointer border-t border-slate-50 transition-colors"
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
                                                <span className="text-slate-300">↳</span>
                                                <span className="text-xs text-slate-700 truncate">
                                                  {subtask.title}
                                                </span>
                                              </div>

                                              <div className="flex items-center gap-3 shrink-0 text-xs">
                                                <span className="text-[11px] text-slate-400 font-mono tabular-nums w-18 text-right">
                                                  {formatDateFriendly(subtask.startDate)}
                                                </span>

                                                {/* Subtask distinct assignee */}
                                                <div
                                                  className="flex items-center gap-1.5 w-24 truncate"
                                                  title={`Responsable Subtarea: ${subtask.assignee}`}
                                                >
                                                  <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 font-medium text-[8px] flex items-center justify-center shrink-0">
                                                    {subtask.assigneeAvatar || subtask.assignee.substring(0, 2).toUpperCase()}
                                                  </div>
                                                  <span className="truncate text-[10px] text-slate-500">
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
          className="flex-1 overflow-auto bg-slate-50/50 relative"
        >
          <div
            style={{ width: `${totalTimelineWidth}px` }}
            className="min-w-full relative"
          >
            {/* TIMELINE HEADER (Two-tier) */}
            <div className="sticky top-0 z-20 bg-white border-b border-slate-200">
              {/* Group Tier (Months or Years) */}
              <div className="h-7 border-b border-slate-100 flex divide-x divide-slate-100 text-[11px] font-semibold text-slate-700">
                {timelineColumns.map((col, idx) => {
                  // Only render group header if label changes or at start
                  const prevCol = timelineColumns[idx - 1];
                  const showGroupLabel =
                    !prevCol || prevCol.groupLabel !== col.groupLabel;

                  return (
                    <div
                      key={`grp-${col.id}`}
                      style={{ width: `${columnWidth}px` }}
                      className="shrink-0 px-2 flex items-center text-slate-500 overflow-hidden"
                    >
                      {showGroupLabel && (
                        <span className="font-semibold text-slate-800 truncate">
                          {col.groupLabel}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Ticks Tier (Weeks, Sprints, Months, Quarters) */}
              <div className="h-7 flex divide-x divide-slate-200/80 text-[11px] font-mono">
                {timelineColumns.map((col) => (
                  <div
                    key={col.id}
                    style={{ width: `${columnWidth}px` }}
                    className={`shrink-0 px-1.5 flex flex-col justify-center items-center overflow-hidden transition-colors ${
                      col.isToday ? 'bg-blue-50/70 font-semibold text-blue-700' : 'text-slate-600'
                    }`}
                  >
                    <span className="truncate">{col.label}</span>
                    {col.subLabel && (
                      <span className="text-[9px] text-slate-400 truncate">
                        {col.subLabel}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Vertical grid lines background */}
            <div className="absolute inset-0 top-[58px] pointer-events-none flex divide-x divide-slate-200/60 z-0">
              {timelineColumns.map((col) => (
                <div
                  key={`grid-${col.id}`}
                  style={{ width: `${columnWidth}px` }}
                  className={`shrink-0 h-full ${
                    col.isToday ? 'bg-blue-50/20' : ''
                  }`}
                />
              ))}
            </div>

            {/* "HOY" (Today) Vertical Line */}
            {todayX !== null && (
              <div
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
                            className="absolute inset-0 rounded-md opacity-20"
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
                            className="relative text-[11px] font-bold truncate z-1"
                            style={{ color: project.color }}
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
                            <div className="h-10 flex items-center relative border-t border-slate-100">
                              {stagePos.isVisible && (
                                <div
                                  style={{
                                    left: `${stagePos.left}px`,
                                    width: `${stagePos.width}px`,
                                    backgroundColor: stageConfig.color,
                                  }}
                                  className="absolute h-2.5 rounded-full opacity-60 shadow-xs cursor-pointer hover:opacity-100 transition-opacity"
                                  onClick={() => onToggleStage(project.id, stageKey)}
                                  title={`${stageConfig.name}: ${formatDateRange(minStageDate, maxStageDate)}`}
                                />
                              )}
                            </div>

                            {/* TASKS IN THIS STAGE */}
                            {isStageExpanded && (
                              <div>
                                {stageTasks.length === 0 ? (
                                  <div className="h-9" />
                                ) : (
                                  stageTasks.map((task) => {
                                    const isTaskExpanded = expandedTasks.has(task.id);
                                    const taskPos = calculateBarPosition(
                                      task.startDate,
                                      task.endDate,
                                      timelineColumns,
                                      columnWidth
                                    );
                                    const daysCount = getDaysDifference(
                                      task.startDate,
                                      task.endDate
                                    );

                                    return (
                                      <div key={`gantt-task-${task.id}`}>
                                        {/* TASK BAR ROW (Height: 40px) */}
                                        <div className="h-10 flex items-center relative group/bar">
                                          {taskPos.isVisible && (
                                            <>
                                              {task.type === 'Hito' ? (
                                                /* Milestone Diamond */
                                                <div
                                                  style={{
                                                    left: `${taskPos.left}px`,
                                                  }}
                                                  className="absolute flex items-center cursor-pointer group-hover/bar:scale-110 transition-transform"
                                                  onClick={() =>
                                                    onEditTask(project.id, task, false)
                                                  }
                                                  title={`Hito: ${task.title} (${task.startDate})`}
                                                >
                                                  <div className="w-5 h-5 bg-amber-500 rotate-45 rounded-xs shadow-md border-2 border-white flex items-center justify-center -ml-2.5" />
                                                  <span className="ml-2 text-xs font-semibold text-slate-800 whitespace-nowrap bg-white/80 px-1 rounded">
                                                    {task.title}
                                                  </span>
                                                </div>
                                              ) : (
                                                /* Standard Gantt Bar */
                                                <div
                                                  style={{
                                                    left: `${taskPos.left}px`,
                                                    width: `${taskPos.width}px`,
                                                  }}
                                                  className="absolute h-7 rounded-lg flex items-center px-2.5 cursor-pointer shadow-xs transition-all hover:shadow-md hover:brightness-105 overflow-hidden"
                                                  onClick={() =>
                                                    onEditTask(project.id, task, false)
                                                  }
                                                >
                                                  {/* Base background */}
                                                  <div
                                                    className="absolute inset-0 rounded-lg opacity-85"
                                                    style={{
                                                      backgroundColor:
                                                        task.color || stageConfig.color,
                                                    }}
                                                  />

                                                  {/* Progress fill */}
                                                  {task.progress > 0 && (
                                                    <div
                                                      style={{
                                                        width: `${task.progress}%`,
                                                      }}
                                                      className="absolute inset-y-0 left-0 bg-black/25 rounded-l-lg pointer-events-none"
                                                    />
                                                  )}

                                                  {/* Label */}
                                                  <div className="relative z-1 flex items-center justify-between w-full text-white text-[11px] font-medium drop-shadow-xs">
                                                    <span className="truncate pr-1">
                                                      {task.title}
                                                    </span>
                                                    <span className="shrink-0 font-mono text-[10px] opacity-90 tabular-nums">
                                                      {daysCount}d
                                                    </span>
                                                  </div>
                                                </div>
                                              )}
                                            </>
                                          )}
                                        </div>

                                        {/* SUBTASK BARS (Height: 36px) */}
                                        {isTaskExpanded &&
                                          task.subtasks?.map((subtask) => {
                                            const subPos = calculateBarPosition(
                                              subtask.startDate,
                                              subtask.endDate,
                                              timelineColumns,
                                              columnWidth
                                            );
                                            const subDays = getDaysDifference(
                                              subtask.startDate,
                                              subtask.endDate
                                            );

                                            return (
                                              <div
                                                key={`gantt-sub-${subtask.id}`}
                                                className="h-9 flex items-center relative group/subbar"
                                              >
                                                {subPos.isVisible && (
                                                  <div
                                                    style={{
                                                      left: `${subPos.left}px`,
                                                      width: `${subPos.width}px`,
                                                    }}
                                                    className="absolute h-5 rounded-md flex items-center px-2 cursor-pointer shadow-2xs hover:shadow-xs transition-all overflow-hidden"
                                                    onClick={() =>
                                                      onEditTask(
                                                        project.id,
                                                        subtask,
                                                        true,
                                                        task.id
                                                      )
                                                    }
                                                    title={`${subtask.title} (${subtask.assignee}) · ${subtask.progress}%`}
                                                  >
                                                    <div
                                                      className="absolute inset-0 rounded-md opacity-75"
                                                      style={{
                                                        backgroundColor: stageConfig.color,
                                                      }}
                                                    />
                                                    {subtask.progress > 0 && (
                                                      <div
                                                        style={{
                                                          width: `${subtask.progress}%`,
                                                        }}
                                                        className="absolute inset-y-0 left-0 bg-black/30 rounded-l-md pointer-events-none"
                                                      />
                                                    )}
                                                    <span className="relative z-1 text-white text-[10px] font-medium truncate">
                                                      {subtask.title}
                                                    </span>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
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
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

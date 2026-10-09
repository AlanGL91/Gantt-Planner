import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  Diamond,
  User,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import {
  Project,
  Task,
  Subtask,
  TaskStage,
  TaskStatus,
  TaskSize,
  TaskType,
} from '../types/gantt';
import { STAGE_CONFIG, STATUS_CONFIG, SIZE_CONFIG } from '../data/initialData';
import { formatDateFriendly, getDaysDifference } from '../utils/dateUtils';

interface TableViewProps {
  projects: Project[];
  expandedProjects: Set<string>;
  expandedStages: Set<string>;
  expandedTasks: Set<string>;
  onToggleProject: (projectId: string) => void;
  onToggleStage: (projectId: string, stage: TaskStage) => void;
  onToggleTask: (taskId: string) => void;
  onEditTask: (projectId: string, task: Task | Subtask, isSubtask?: boolean, parentTaskId?: string) => void;
  onQuickUpdateStatus: (projectId: string, taskId: string, newStatus: TaskStatus, isSubtask?: boolean, parentTaskId?: string) => void;
  onAddTaskToStage: (projectId: string, stage: TaskStage) => void;
  onAddSubtask: (projectId: string, parentTaskId: string) => void;
  onDeleteTask: (projectId: string, taskId: string, isSubtask?: boolean, parentTaskId?: string) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  projects,
  expandedProjects,
  expandedStages,
  expandedTasks,
  onToggleProject,
  onToggleStage,
  onToggleTask,
  onEditTask,
  onQuickUpdateStatus,
  onAddTaskToStage,
  onAddSubtask,
  onDeleteTask,
}) => {
  const STAGES_ORDER: TaskStage[] = ['backlog', 'relevamiento', 'qa', 'produccion'];

  return (
    <div className="flex-1 bg-white overflow-auto">
      <div className="min-w-[1280px]">
        {/* TABLE HEADER (Directly inspired by image 1 and Monday.com grid) */}
        <div className="h-10 bg-slate-900 text-white font-medium text-xs grid grid-cols-12 items-center px-4 sticky top-0 z-20 select-none shadow-sm">
          <div className="col-span-3 flex items-center gap-1.5 pl-2 font-semibold">
            <span>Nombre / Tarea</span>
          </div>
          <div className="col-span-1 flex items-center justify-between px-1">
            <span>Tipo</span>
          </div>
          <div className="col-span-1 px-1">
            <span>Épica</span>
          </div>
          <div className="col-span-1 px-1">
            <span>Iniciativa</span>
          </div>
          <div className="col-span-1 px-1">
            <span>Estado</span>
          </div>
          <div className="col-span-1 px-1">
            <span>Compromiso</span>
          </div>
          <div className="col-span-1 text-center px-1">
            <span>Talle</span>
          </div>
          <div className="col-span-1 px-1">
            <span>Analista / Resp.</span>
          </div>
          <div className="col-span-1 px-1 text-right">
            <span>Fechas</span>
          </div>
          <div className="col-span-1 text-right pr-2">
            <span>Progreso</span>
          </div>
        </div>

        {/* TABLE BODY (Accordion Tree) */}
        <div className="divide-y divide-slate-100">
          {projects.map((project) => {
            const isProjectExpanded = expandedProjects.has(project.id);

            return (
              <div key={project.id} className="group/proj">
                {/* PROJECT ROW */}
                <div
                  className="h-11 bg-slate-100/90 hover:bg-slate-200/80 px-4 flex items-center justify-between cursor-pointer border-l-4 transition-colors"
                  style={{ borderLeftColor: project.color }}
                  onClick={() => onToggleProject(project.id)}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleProject(project.id);
                      }}
                      className="p-0.5 text-slate-500 hover:text-slate-800"
                    >
                      {isProjectExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <Folder
                      className="w-4 h-4"
                      style={{ color: project.color }}
                    />
                    <span className="font-bold text-xs text-slate-900">
                      {project.name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      ({project.code})
                    </span>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">
                      {project.quarter || 'Sin Q'}
                    </span>
                    {project.size && (
                      <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-200/80 px-1.5 py-0.5 rounded">
                        Camiseta {project.size}
                      </span>
                    )}
                    {project.initiativeType && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          project.initiativeType === 'negocio'
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : 'bg-purple-50 text-purple-700 border border-purple-100'
                        }`}
                      >
                        {project.initiativeType === 'negocio' ? 'Negocio' : 'Interna'}
                      </span>
                    )}
                    {project.quarterObjective && (
                      <span className="text-[11px] text-slate-500 italic max-w-sm truncate hidden md:inline" title={project.quarterObjective}>
                        · Meta {project.quarter}: {project.quarterObjective}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400">Project Lead:</span>
                      <strong className="text-slate-700 font-medium">
                        {project.projectLead}
                      </strong>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px] tabular-nums">
                      {project.tasks.length} tareas
                    </span>
                  </div>
                </div>

                {/* STAGES ACCORDION */}
                {isProjectExpanded && (
                  <div>
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
                            className="h-9 px-6 bg-slate-50/70 hover:bg-slate-100/80 flex items-center justify-between border-t border-slate-100 cursor-pointer transition-colors"
                            onClick={() => onToggleStage(project.id, stageKey)}
                          >
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleStage(project.id, stageKey);
                                }}
                                className="p-0.5 text-slate-400 hover:text-slate-700"
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
                                ({stageTasks.length} ítems)
                              </span>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddTaskToStage(project.id, stageKey);
                              }}
                              className="text-[11px] text-blue-600 hover:text-blue-700 font-medium px-2 py-0.5 rounded hover:bg-blue-50 transition-colors flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Agregar a {stageConfig.name}</span>
                            </button>
                          </div>

                          {/* TASKS IN THIS STAGE */}
                          {isStageExpanded && (
                            <div className="divide-y divide-slate-100">
                              {stageTasks.length === 0 ? (
                                <div className="h-9 px-12 flex items-center text-xs text-slate-400 italic">
                                  No hay tareas registradas en esta etapa.
                                </div>
                              ) : (
                                stageTasks.map((task) => {
                                  const isTaskExpanded = expandedTasks.has(task.id);
                                  const subtasksCount = task.subtasks?.length || 0;
                                  const statusCfg = STATUS_CONFIG[task.status];
                                  const days = getDaysDifference(
                                    task.startDate,
                                    task.endDate
                                  );

                                  return (
                                    <div key={task.id}>
                                      {/* TASK ROW */}
                                      <div className="h-10 px-4 hover:bg-blue-50/20 grid grid-cols-12 items-center text-xs transition-colors group/row">
                                        {/* Name & Hierarchy */}
                                        <div className="col-span-3 flex items-center gap-2 pl-6 pr-2 min-w-0">
                                          {subtasksCount > 0 ? (
                                            <button
                                              onClick={() => onToggleTask(task.id)}
                                              className="p-0.5 text-slate-400 hover:text-slate-700"
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

                                          <span className="font-medium text-slate-900 truncate">
                                            {task.title}
                                          </span>

                                          {task.type === 'Hito' && (
                                            <Diamond className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                                          )}
                                        </div>

                                        {/* Tipo */}
                                        <div className="col-span-1 px-1 truncate text-slate-600 font-medium">
                                          {task.type}
                                        </div>

                                        {/* Épica */}
                                        <div className="col-span-1 px-1 truncate text-slate-500">
                                          {task.epic || '-'}
                                        </div>

                                        {/* Iniciativa */}
                                        <div className="col-span-1 px-1 truncate text-slate-500">
                                          {task.initiative || '-'}
                                        </div>

                                        {/* Estado (Quick select) */}
                                        <div className="col-span-1 px-1">
                                          <select
                                            value={task.status}
                                            onChange={(e) =>
                                              onQuickUpdateStatus(
                                                project.id,
                                                task.id,
                                                e.target.value as TaskStatus,
                                                false
                                              )
                                            }
                                            className={`w-full py-0.5 px-1 rounded text-[11px] font-semibold border-0 cursor-pointer ${statusCfg.bg} ${statusCfg.text}`}
                                          >
                                            {Object.entries(STATUS_CONFIG).map(
                                              ([sK, sC]) => (
                                                <option key={sK} value={sK}>
                                                  {sC.label}
                                                </option>
                                              )
                                            )}
                                          </select>
                                        </div>

                                        {/* Compromiso */}
                                        <div className="col-span-1 px-1 truncate font-mono text-[11px] text-slate-600">
                                          {task.commitment || '-'}
                                        </div>

                                        {/* Talle */}
                                        <div className="col-span-1 px-1 text-center font-bold text-slate-700">
                                          <span className="font-mono">{task.size}</span>
                                        </div>

                                        {/* Analista / Responsable */}
                                        <div
                                          className="col-span-1 px-1 flex items-center gap-1.5 truncate"
                                          title={`Responsable: ${task.assignee}`}
                                        >
                                          <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-medium text-[8px] flex items-center justify-center shrink-0">
                                            {task.assigneeAvatar || task.assignee.substring(0, 2).toUpperCase()}
                                          </div>
                                          <span className="truncate text-slate-700">
                                            {task.assignee}
                                          </span>
                                        </div>

                                        {/* Fechas */}
                                        <div className="col-span-1 px-1 text-right font-mono text-[11px] text-slate-500 tabular-nums">
                                          {formatDateFriendly(task.startDate)} ({days}d)
                                        </div>

                                        {/* Progreso & Acciones */}
                                        <div className="col-span-1 pr-2 flex items-center justify-end gap-2">
                                          <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                            <div
                                              className="bg-blue-600 h-full rounded-full"
                                              style={{ width: `${task.progress}%` }}
                                            />
                                          </div>
                                          <span className="text-[10px] font-mono text-slate-500 w-7 text-right tabular-nums">
                                            {task.progress}%
                                          </span>

                                          {/* Quick buttons */}
                                          <div className="opacity-0 group-hover/row:opacity-100 flex items-center gap-1 ml-1 transition-opacity">
                                            <button
                                              onClick={() =>
                                                onEditTask(project.id, task, false)
                                              }
                                              className="p-1 text-slate-400 hover:text-blue-600 rounded"
                                              title="Editar tarea"
                                            >
                                              <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={() =>
                                                onAddSubtask(project.id, task.id)
                                              }
                                              className="p-1 text-slate-400 hover:text-emerald-600 rounded"
                                              title="Añadir subtarea"
                                            >
                                              <Plus className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={() =>
                                                onDeleteTask(project.id, task.id, false)
                                              }
                                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                              title="Eliminar tarea"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>

                                      {/* SUBTASKS */}
                                      {isTaskExpanded &&
                                        task.subtasks?.map((subtask) => {
                                          const subStatusCfg =
                                            STATUS_CONFIG[subtask.status];
                                          const subDays = getDaysDifference(
                                            subtask.startDate,
                                            subtask.endDate
                                          );

                                          return (
                                            <div
                                              key={subtask.id}
                                              className="h-9 px-4 bg-slate-50/50 hover:bg-slate-100/60 grid grid-cols-12 items-center text-xs transition-colors group/subrow border-t border-slate-100"
                                            >
                                              {/* Subtask Title */}
                                              <div className="col-span-3 flex items-center gap-1.5 pl-12 pr-2 min-w-0">
                                                <span className="text-slate-300">↳</span>
                                                <span className="text-slate-700 truncate">
                                                  {subtask.title}
                                                </span>
                                              </div>

                                              {/* Tipo */}
                                              <div className="col-span-1 px-1 text-slate-400 text-[11px]">
                                                {subtask.type}
                                              </div>

                                              {/* Inherited parent fields */}
                                              <div className="col-span-1 px-1 text-slate-400 text-[11px] truncate">
                                                -
                                              </div>
                                              <div className="col-span-1 px-1 text-slate-400 text-[11px] truncate">
                                                -
                                              </div>

                                              {/* Estado */}
                                              <div className="col-span-1 px-1">
                                                <select
                                                  value={subtask.status}
                                                  onChange={(e) =>
                                                    onQuickUpdateStatus(
                                                      project.id,
                                                      subtask.id,
                                                      e.target.value as TaskStatus,
                                                      true,
                                                      task.id
                                                    )
                                                  }
                                                  className={`w-full py-0.5 px-1 rounded text-[10px] font-medium border-0 cursor-pointer ${subStatusCfg.bg} ${subStatusCfg.text}`}
                                                >
                                                  {Object.entries(
                                                    STATUS_CONFIG
                                                  ).map(([sK, sC]) => (
                                                    <option key={sK} value={sK}>
                                                      {sC.label}
                                                    </option>
                                                  ))}
                                                </select>
                                              </div>

                                              {/* Compromiso */}
                                              <div className="col-span-1 px-1 font-mono text-[10px] text-slate-500">
                                                {subtask.commitment}
                                              </div>

                                              {/* Talle */}
                                              <div className="col-span-1 px-1 text-center font-mono text-slate-500 text-[11px]">
                                                {subtask.size}
                                              </div>

                                              {/* Responsable de Subtarea (puede ser persona distinta!) */}
                                              <div
                                                className="col-span-1 px-1 flex items-center gap-1.5 truncate"
                                                title={`Responsable: ${subtask.assignee}`}
                                              >
                                                <div className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-600 font-medium text-[8px] flex items-center justify-center shrink-0">
                                                  {subtask.assigneeAvatar || subtask.assignee.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="truncate text-slate-600 text-[11px]">
                                                  {subtask.assignee}
                                                </span>
                                              </div>

                                              {/* Fechas */}
                                              <div className="col-span-1 px-1 text-right font-mono text-[10px] text-slate-400 tabular-nums">
                                                {formatDateFriendly(subtask.startDate)} ({subDays}d)
                                              </div>

                                              {/* Progreso & Acciones */}
                                              <div className="col-span-1 pr-2 flex items-center justify-end gap-2">
                                                <div className="w-12 bg-slate-200/80 rounded-full h-1 overflow-hidden">
                                                  <div
                                                    className="bg-blue-500 h-full rounded-full"
                                                    style={{
                                                      width: `${subtask.progress}%`,
                                                    }}
                                                  />
                                                </div>
                                                <span className="text-[10px] font-mono text-slate-400 w-7 text-right tabular-nums">
                                                  {subtask.progress}%
                                                </span>

                                                <div className="opacity-0 group-hover/subrow:opacity-100 flex items-center gap-1 ml-1 transition-opacity">
                                                  <button
                                                    onClick={() =>
                                                      onEditTask(
                                                        project.id,
                                                        subtask,
                                                        true,
                                                        task.id
                                                      )
                                                    }
                                                    className="p-1 text-slate-400 hover:text-blue-600 rounded"
                                                    title="Editar subtarea"
                                                  >
                                                    <Edit2 className="w-3 h-3" />
                                                  </button>
                                                  <button
                                                    onClick={() =>
                                                      onDeleteTask(
                                                        project.id,
                                                        subtask.id,
                                                        true,
                                                        task.id
                                                      )
                                                    }
                                                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                                    title="Eliminar subtarea"
                                                  >
                                                    <Trash2 className="w-3 h-3" />
                                                  </button>
                                                </div>
                                              </div>
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
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

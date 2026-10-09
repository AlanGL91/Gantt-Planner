import React, { useState, useEffect } from 'react';
import { X, Calendar, User, CheckCircle2, Trash2, ArrowRight } from 'lucide-react';
import {
  Task,
  Subtask,
  Project,
  TaskStage,
  TaskStatus,
  TaskSize,
  TaskType,
} from '../types/gantt';
import { STAGE_CONFIG, STATUS_CONFIG, SIZE_CONFIG } from '../data/initialData';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (
    projectId: string,
    taskData: Partial<Task>,
    parentTaskId?: string,
    isSubtask?: boolean
  ) => void;
  onDeleteTask?: (projectId: string, taskId: string, isSubtask?: boolean, parentTaskId?: string) => void;
  projects: Project[];
  allAssignees: string[];
  initialData?: {
    projectId?: string;
    parentTaskId?: string;
    task?: Task | Subtask;
    isSubtask?: boolean;
    defaultStage?: TaskStage;
  };
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSaveTask,
  onDeleteTask,
  projects,
  allAssignees,
  initialData,
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(initialData?.task);
  const isSubtask = Boolean(initialData?.isSubtask || initialData?.parentTaskId);

  const [projectId, setProjectId] = useState<string>(
    initialData?.projectId || (projects[0]?.id || '')
  );
  const [parentTaskId, setParentTaskId] = useState<string>(
    initialData?.parentTaskId || ''
  );
  const [title, setTitle] = useState<string>(initialData?.task?.title || '');
  const [type, setType] = useState<TaskType>(
    initialData?.task?.type || (isSubtask ? 'Tarea' : 'Historia')
  );
  const [stage, setStage] = useState<TaskStage>(
    initialData?.task?.stage || initialData?.defaultStage || 'backlog'
  );
  const [initiative, setInitiative] = useState<string>(
    ('initiative' in (initialData?.task || {})
      ? (initialData?.task as Task).initiative
      : '') || ''
  );
  const [epic, setEpic] = useState<string>(
    ('epic' in (initialData?.task || {})
      ? (initialData?.task as Task).epic
      : '') || ''
  );
  const [startDate, setStartDate] = useState<string>(
    initialData?.task?.startDate || '2026-10-12'
  );
  const [endDate, setEndDate] = useState<string>(
    initialData?.task?.endDate || '2026-10-26'
  );
  const [assignee, setAssignee] = useState<string>(
    initialData?.task?.assignee || 'Carlos Benítez'
  );
  const [customAssignee, setCustomAssignee] = useState<string>('');
  const [status, setStatus] = useState<TaskStatus>(
    initialData?.task?.status || 'pendiente'
  );
  const [progress, setProgress] = useState<number>(
    initialData?.task?.progress ?? 0
  );
  const [size, setSize] = useState<TaskSize>(initialData?.task?.size || 'M');
  const [commitment, setCommitment] = useState<string>(
    initialData?.task?.commitment || 'Sprint 3'
  );
  const [notes, setNotes] = useState<string>(initialData?.task?.notes || '');
  const [error, setError] = useState<string>('');

  const selectedProject = projects.find((p) => p.id === projectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor ingresa un título para la tarea');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('La fecha de fin no puede ser anterior a la fecha de inicio');
      return;
    }

    const finalAssignee = customAssignee.trim() || assignee;

    const taskPayload: Partial<Task> = {
      ...(initialData?.task?.id ? { id: initialData.task.id } : {}),
      title: title.trim(),
      type,
      stage,
      startDate,
      endDate,
      assignee: finalAssignee,
      status,
      progress: Number(progress),
      size,
      commitment: commitment.trim(),
      notes: notes.trim(),
      ...(!isSubtask
        ? {
            initiative: initiative.trim() || 'Transformación General',
            epic: epic.trim() || 'Desarrollo de Solución',
          }
        : {}),
    };

    onSaveTask(projectId, taskPayload, parentTaskId, isSubtask);
    onClose();
  };

  const handleDelete = () => {
    if (!initialData?.task?.id || !onDeleteTask) return;
    if (confirm('¿Estás seguro de que deseas eliminar este ítem?')) {
      onDeleteTask(projectId, initialData.task.id, isSubtask, parentTaskId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{isEditing ? 'Editar' : 'Nueva'}</span>
              <span>{isSubtask ? 'Subtarea' : 'Tarea del Planificador'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configura los detalles cronológicos, responsables y estado para el diagrama Gantt
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Project & Parent Task */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Proyecto Asignado *
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={isEditing}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.projectLead})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Etapa / Categoría *
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as TaskStage)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                {Object.entries(STAGE_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.name} - {cfg.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre de la {isSubtask ? 'Subtarea' : 'Tarea'} *
            </label>
            <input
              type="text"
              placeholder="Ej: Implementación de API Gateway, Conector Buró..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* Type & Talle & Commitment */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:ring-1 focus:ring-blue-500"
              >
                <option value="Epica">Épica</option>
                <option value="Historia">Historia</option>
                <option value="Tarea">Tarea</option>
                <option value="Bug">Bug</option>
                <option value="Hito">Hito / Milestone</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Talle (T-Shirt Size)
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value as TaskSize)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
              >
                {Object.entries(SIZE_CONFIG).map(([sKey, sCfg]) => (
                  <option key={sKey} value={sKey}>
                    {sCfg.label} ({sCfg.desc})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Compromiso / Sprint
              </label>
              <input
                type="text"
                placeholder="Ej: Sprint 1, Sprint 2"
                value={commitment}
                onChange={(e) => setCommitment(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Epic and Initiative (if not subtask) */}
          {!isSubtask && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Épica
                </label>
                <input
                  type="text"
                  placeholder="Ej: Infraestructura Cloud, Módulo de Pagos"
                  value={epic}
                  onChange={(e) => setEpic(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Iniciativa
                </label>
                <input
                  type="text"
                  placeholder="Ej: Modernización Core, Experiencia Móvil"
                  value={initiative}
                  onChange={(e) => setInitiative(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Dates: Start & End */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Fecha de Inicio *</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Fecha Fin *</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                required
              />
            </div>
          </div>

          {/* Assignee & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Responsable / Analista Asignado *</span>
              </label>
              <select
                value={assignee}
                onChange={(e) => {
                  setAssignee(e.target.value);
                  setCustomAssignee('');
                }}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:ring-1 focus:ring-blue-500 mb-1.5"
              >
                {allAssignees.map((person) => (
                  <option key={person} value={person}>
                    {person}
                  </option>
                ))}
                <option value="__custom__">+ Otro responsable...</option>
              </select>

              {assignee === '__custom__' && (
                <input
                  type="text"
                  placeholder="Nombre y apellido del nuevo responsable"
                  value={customAssignee}
                  onChange={(e) => setCustomAssignee(e.target.value)}
                  className="w-full text-xs border border-blue-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Estado Actual</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:ring-1 focus:ring-blue-500 font-medium"
              >
                {Object.entries(STATUS_CONFIG).map(([sKey, sCfg]) => (
                  <option key={sKey} value={sKey}>
                    {sCfg.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Progress Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
              <span>Progreso Real</span>
              <span className="font-mono text-blue-600 tabular-nums">{progress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notas y Criterios de Aceptación
            </label>
            <textarea
              rows={2}
              placeholder="Detalles técnicos, dependencias o criterios de entrega..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            {isEditing && onDeleteTask && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors"
            >
              {isEditing ? 'Guardar Cambios' : 'Crear Tarea'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

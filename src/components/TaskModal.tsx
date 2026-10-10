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
  const [status, setStatus] = useState<TaskStatus>(
    initialData?.task?.status || 'pendiente'
  );
  const [size, setSize] = useState<TaskSize>(
    initialData?.task?.size || 'M'
  );
  const [startDate, setStartDate] = useState<string>(
    initialData?.task?.startDate || new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    initialData?.task?.endDate ||
      new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [progress, setProgress] = useState<number>(
    initialData?.task?.progress ?? 0
  );
  const [assignee, setAssignee] = useState<string>(
    initialData?.task?.assignee || allAssignees[0] || 'Equipo Core'
  );
  const [initiative, setInitiative] = useState<string>(
    (initialData?.task as Task)?.initiative || 'Transformación General'
  );
  const [epic, setEpic] = useState<string>(
    (initialData?.task as Task)?.epic || 'Desarrollo de Solución'
  );
  const [commitment, setCommitment] = useState<string>(
    initialData?.task?.commitment || 'Q4 2026'
  );
  const [notes, setNotes] = useState<string>(
    initialData?.task?.notes || ''
  );
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialData?.projectId) setProjectId(initialData.projectId);
    if (initialData?.parentTaskId) setParentTaskId(initialData.parentTaskId);
    if (initialData?.defaultStage) setStage(initialData.defaultStage);
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor indica un título para la tarea');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('La fecha de inicio no puede ser posterior a la fecha de finalización');
      return;
    }

    const initials = assignee
      .trim()
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const selectedProj = projects.find((p) => p.id === projectId);
    const color = selectedProj?.color || '#2563EB';

    const taskPayload: Partial<Task> = {
      ...(initialData?.task?.id ? { id: initialData.task.id } : {}),
      title: title.trim(),
      type,
      stage,
      status,
      startDate,
      endDate,
      progress: Number(progress),
      assignee: assignee.trim(),
      assigneeAvatar: initials || 'EQ',
      color,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{isEditing ? 'Editar' : 'Nueva'}</span>
              <span>{isSubtask ? 'Subtarea' : 'Tarea del Planificador'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configura los detalles cronológicos, responsables y estado para el diagrama Gantt
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Project and Parent Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Proyecto Contenedor *
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={isEditing}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} [{p.code}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Ítem
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Historia">Historia</option>
                <option value="Tarea">Tarea</option>
                <option value="Mejora">Mejora</option>
                <option value="Bug">Bug</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Título / Descripción Corta *
            </label>
            <input
              type="text"
              placeholder="Ej: Análisis de requerimientos funcionales, Integración API..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* Stage & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Etapa Operativa *
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as TaskStage)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {Object.entries(STAGE_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Estado Actual *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fecha de Inicio *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fecha de Finalización *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Assignee & Size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Responsable Asignado *
              </label>
              <input
                type="text"
                list="assignees-list"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Nombre del analista o dev"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              <datalist id="assignees-list">
                {allAssignees.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Talle de Camiseta Estimado
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value as TaskSize)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-semibold"
              >
                {Object.entries(SIZE_CONFIG).map(([k, cfg]) => (
                  <option key={k} value={k}>
                    {cfg.label} ({cfg.desc})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Progress Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Progreso Real
              </label>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {progress}%
              </span>
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

          {/* Initiative, Epic, Commitment (only for parent tasks) */}
          {!isSubtask && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Iniciativa
                </label>
                <input
                  type="text"
                  placeholder="Ej: Core Banking"
                  value={initiative}
                  onChange={(e) => setInitiative(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Épica
                </label>
                <input
                  type="text"
                  placeholder="Ej: Arquitectura"
                  value={epic}
                  onChange={(e) => setEpic(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Compromiso
                </label>
                <input
                  type="text"
                  placeholder="Ej: Q4 2026"
                  value={commitment}
                  onChange={(e) => setCommitment(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notas / Bloqueos / Observaciones
            </label>
            <textarea
              rows={2}
              placeholder="Detalles técnicos, links o dependencias de Jira..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Actions Bar */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            {isEditing && onDeleteTask ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors flex items-center gap-1 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
              >
                {isEditing ? 'Guardar Cambios' : 'Crear Tarea'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

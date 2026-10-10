import React, { useState } from 'react';
import { X, FolderPlus, Calendar, Target } from 'lucide-react';
import { Project, TaskStage, TaskSize, InitiativeType } from '../types/gantt';
import { STAGE_CONFIG } from '../data/initialData';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProject: (projectData: Partial<Project>) => void;
  initialProject?: Project;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSaveProject,
  initialProject,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(initialProject?.name || '');
  const [code, setCode] = useState(initialProject?.code || '');
  const [projectLead, setProjectLead] = useState(
    initialProject?.projectLead || ''
  );
  const [size, setSize] = useState<TaskSize>(
    initialProject?.size || 'M'
  );
  const [initiativeType, setInitiativeType] = useState<InitiativeType>(
    initialProject?.initiativeType || 'negocio'
  );
  const [quarter, setQuarter] = useState(
    initialProject?.quarter || 'Q4 2026'
  );
  const [targetStageForQuarter, setTargetStageForQuarter] = useState<TaskStage>(
    initialProject?.targetStageForQuarter || 'produccion'
  );
  const [quarterObjective, setQuarterObjective] = useState(
    initialProject?.quarterObjective || ''
  );
  const [description, setDescription] = useState(
    initialProject?.description || ''
  );
  const [color, setColor] = useState(initialProject?.color || '#2563EB');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor indica un nombre de proyecto');
      return;
    }
    if (!projectLead.trim()) {
      setError('Por favor asigna un responsable general del proyecto');
      return;
    }

    const payload: Partial<Project> = {
      ...(initialProject?.id ? { id: initialProject.id } : { id: `proj-${Date.now()}` }),
      name: name.trim(),
      code: code.trim().toUpperCase() || 'PRJ',
      projectLead: projectLead.trim(),
      leadAvatar: projectLead
        .trim()
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase(),
      size,
      initiativeType,
      quarter: quarter.trim() || undefined,
      targetStageForQuarter,
      quarterObjective: quarterObjective.trim(),
      description: description.trim(),
      color,
      tasks: initialProject?.tasks || [],
    };

    onSaveProject(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {initialProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre del Proyecto *
            </label>
            <input
              type="text"
              placeholder="Ej: Migración Cloud, Portal de Pagos..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Código / Clave
              </label>
              <input
                type="text"
                placeholder="Ej: PRJ-01"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Color Identificador
              </label>
              <div className="flex items-center gap-2 h-9">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent"
                />
                <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{color}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Líder / Responsable General *
              </label>
              <input
                type="text"
                placeholder="Ej: Laura Gómez"
                value={projectLead}
                onChange={(e) => setProjectLead(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Iniciativa
              </label>
              <select
                value={initiativeType}
                onChange={(e) => setInitiativeType(e.target.value as InitiativeType)}
                className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="negocio">💼 Negocio</option>
                <option value="interna">⚙️ Interna</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Talle de Camiseta Estimado
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value as TaskSize)}
                className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
              >
                <option value="S">Camiseta S (0 a 1 mes)</option>
                <option value="M">Camiseta M (&gt; 1 mes a 2 meses)</option>
                <option value="L">Camiseta L (&gt; 2 meses a 3 meses)</option>
                <option value="XL">Camiseta XL (&gt; 3 meses a 4.5 meses)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Trimestre Asignado (Quarter)
              </label>
              <input
                type="text"
                placeholder="Ej: Q4 2026 (o vacío si no tiene)"
                value={quarter}
                onChange={(e) => setQuarter(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Etapa Comprometida para el Quarter
            </label>
            <select
              value={targetStageForQuarter}
              onChange={(e) => setTargetStageForQuarter(e.target.value as TaskStage)}
              className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              {Object.entries(STAGE_CONFIG).map(([k, cfg]) => (
                <option key={k} value={k}>
                  {cfg.name} (Meta de cumplimiento al 100%)
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
              Si comprometes 'Producción' y al finalizar el Q queda en 'QA', el cumplimiento será del 75%.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Objetivo para este Quarter
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Poner en producción el módulo de transferencias y onboarding móvil"
              value={quarterObjective}
              onChange={(e) => setQuarterObjective(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              {initialProject ? 'Guardar Cambios' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

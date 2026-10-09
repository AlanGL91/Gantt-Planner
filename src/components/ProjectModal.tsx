import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { Project } from '../types/gantt';

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
      code: code.trim() || name.substring(0, 4).toUpperCase(),
      projectLead: projectLead.trim(),
      description: description.trim(),
      color,
      tasks: initialProject?.tasks || [],
    };

    onSaveProject(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              {initialProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre del Proyecto *
            </label>
            <input
              type="text"
              placeholder="Ej: Migración Cloud, Portal de Pagos..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código / Clave
              </label>
              <input
                type="text"
                placeholder="Ej: PRJ-01"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 uppercase focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Color Identificador
              </label>
              <div className="flex items-center gap-2 h-9">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5"
                />
                <span className="text-xs font-mono text-slate-600">{color}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Responsable General del Proyecto (Project Owner / Lead) *
            </label>
            <input
              type="text"
              placeholder="Ej: Ing. Laura Gómez, Carlos Benítez..."
              value={projectLead}
              onChange={(e) => setProjectLead(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descripción y Alcance
            </label>
            <textarea
              rows={3}
              placeholder="Objetivos estratégicos del proyecto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              {initialProject ? 'Guardar Cambios' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

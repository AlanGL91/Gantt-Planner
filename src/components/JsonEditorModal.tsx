import React, { useState, useEffect } from 'react';
import {
  X,
  Code2,
  Copy,
  Download,
  Upload,
  RotateCcw,
  Check,
  AlertCircle,
  FileJson,
  Sparkles,
} from 'lucide-react';
import { Project } from '../types/gantt';

interface JsonEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onApplyJson: (newProjects: Project[]) => void;
  onResetDefault: () => void;
}

export const JsonEditorModal: React.FC<JsonEditorModalProps> = ({
  isOpen,
  onClose,
  projects,
  onApplyJson,
  onResetDefault,
}) => {
  if (!isOpen) return null;

  const [rawText, setRawText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setRawText(JSON.stringify(projects, null, 2));
    setParseError(null);
  }, [projects, isOpen]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawText(val);
    setSuccessMsg(null);
    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) {
        setParseError('El JSON raíz debe ser un arreglo de proyectos [ { ... } ]');
      } else {
        setParseError(null);
      }
    } catch (err: any) {
      setParseError(err.message || 'Error de sintaxis JSON');
    }
  };

  const handleApply = () => {
    try {
      const parsed = JSON.parse(rawText);
      if (!Array.isArray(parsed)) {
        setParseError('El JSON raíz debe ser un arreglo de proyectos [ { ... } ]');
        return;
      }
      onApplyJson(parsed);
      setSuccessMsg('¡Datos JSON aplicados correctamente al Gantt y la tabla!');
      setParseError(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setParseError('No se pudo aplicar: ' + (err.message || 'JSON inválido'));
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([rawText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planificador_gantt_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          setRawText(JSON.stringify(parsed, null, 2));
          setParseError(null);
          setSuccessMsg('Archivo JSON cargado. Presiona "Aplicar Cambios" para guardar.');
        } else {
          setParseError('El archivo debe contener un array de proyectos');
        }
      } catch (err: any) {
        setParseError('El archivo no contiene un JSON válido: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const totalTasks = projects.reduce((acc, p) => acc + (p.tasks?.length || 0), 0);
  const totalSubtasks = projects.reduce(
    (acc, p) =>
      acc +
      (p.tasks?.reduce((tAcc, t) => tAcc + (t.subtasks?.length || 0), 0) || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-slate-900 text-slate-100 rounded-xl shadow-2xl border border-slate-700 w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="px-6 py-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Estructura de Datos JSON en Tiempo Real</span>
              </h2>
              <p className="text-xs text-slate-400">
                Todo el planificador está respaldado por este esquema JSON. Modifícalo libremente para sincronizar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
              title="Copiar contenido"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
              title="Descargar archivo JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Importar</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Metrics bar */}
        <div className="px-6 py-2 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>
              Proyectos: <strong className="text-slate-200 font-mono tabular-nums">{projects.length}</strong>
            </span>
            <span>·</span>
            <span>
              Tareas totales: <strong className="text-slate-200 font-mono tabular-nums">{totalTasks}</strong>
            </span>
            <span>·</span>
            <span>
              Subtareas: <strong className="text-slate-200 font-mono tabular-nums">{totalSubtasks}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {parseError ? (
              <span className="flex items-center gap-1.5 text-rose-400 text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-sm">{parseError}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
                <Check className="w-3.5 h-3.5" />
                <span>JSON Válido y Sintaxis Correcta</span>
              </span>
            )}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 relative bg-slate-950 font-mono text-xs overflow-hidden">
          <textarea
            value={rawText}
            onChange={handleTextChange}
            spellCheck={false}
            className="w-full h-full p-4 bg-transparent text-slate-200 font-mono text-xs resize-none focus:outline-none leading-relaxed selection:bg-blue-600/40"
          />
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onResetDefault}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              title="Restaurar datos iniciales de demostración"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar datos de ejemplo</span>
            </button>
            {successMsg && (
              <span className="text-xs text-emerald-400 font-medium">
                {successMsg}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs text-slate-300 hover:text-white rounded-lg transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleApply}
              disabled={Boolean(parseError)}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Aplicar Cambios al Gantt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

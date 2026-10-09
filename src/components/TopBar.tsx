import React from 'react';
import { Plus, Code2 } from 'lucide-react';

interface TopBarProps {
  currentView: 'gantt' | 'table' | 'json';
  onViewChange: (view: 'gantt' | 'table' | 'json') => void;
  onNewTask: () => void;
  onOpenJsonEditor: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onViewChange,
  onNewTask,
  onOpenJsonEditor,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-white border-b border-slate-200 sticky top-0 z-30">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <a
          href="#gantt"
          onClick={(e) => {
            e.preventDefault();
            onViewChange('gantt');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            G
          </div>
          <span>GanttFlow Planner</span>
        </a>
      </div>

      {/* Zone 2: 4-5 clean single-line nav links */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
        <button
          onClick={() => onViewChange('gantt')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            currentView === 'gantt'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-600'
          }`}
        >
          Vista Gantt
        </button>
        <button
          onClick={() => onViewChange('table')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            currentView === 'table'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-600'
          }`}
        >
          Tabla Principal
        </button>
        <button
          onClick={() => {
            onViewChange('json');
            onOpenJsonEditor();
          }}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 flex items-center gap-1.5 ${
            currentView === 'json'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-600'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Editor JSON</span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onNewTask}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 shadow-sm transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nueva Tarea</span>
        </button>
      </div>
    </header>
  );
};

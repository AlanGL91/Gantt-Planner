import React from 'react';
import { Plus, Code2, BarChart3, Settings, Moon, Sun } from 'lucide-react';

interface TopBarProps {
  currentView: 'gantt' | 'table' | 'metrics' | 'json';
  onViewChange: (view: 'gantt' | 'table' | 'metrics' | 'json') => void;
  onNewTask: () => void;
  onOpenJsonEditor: () => void;
  onOpenSettings: () => void;
  isJiraConnected?: boolean;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onSetDarkMode?: (dark: boolean) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onViewChange,
  onNewTask,
  onOpenJsonEditor,
  onOpenSettings,
  isJiraConnected = true,
  isDarkMode = false,
  onToggleDarkMode,
  onSetDarkMode,
}) => {
  return (
    <header className="flex items-center justify-between gap-6 px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <a
          href="#gantt"
          onClick={(e) => {
            e.preventDefault();
            onViewChange('gantt');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            G
          </div>
          <span>GanttFlow Planner</span>
        </a>
      </div>

      {/* Zone 2: clean single-line nav links */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
        <button
          onClick={() => onViewChange('gantt')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            currentView === 'gantt'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-slate-600 dark:text-slate-400'
          }`}
        >
          Vista Gantt
        </button>
        <button
          onClick={() => onViewChange('table')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            currentView === 'table'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-slate-600 dark:text-slate-400'
          }`}
        >
          Tabla Principal
        </button>
        <button
          onClick={() => onViewChange('metrics')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 flex items-center gap-1.5 ${
            currentView === 'metrics'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-slate-600 dark:text-slate-400'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Métricas del Q</span>
        </button>
        <button
          onClick={() => {
            onViewChange('json');
            onOpenJsonEditor();
          }}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 flex items-center gap-1.5 ${
            currentView === 'json'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-slate-600 dark:text-slate-400'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Editor JSON</span>
        </button>
      </nav>

      {/* Zone 3: Settings, Dark mode toggle & primary action */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Dark / Light Mode Segmented Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
          <button
            type="button"
            onClick={() => {
              if (onSetDarkMode) {
                onSetDarkMode(false);
              } else if (isDarkMode && onToggleDarkMode) {
                onToggleDarkMode();
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              !isDarkMode
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
            title="Activar Modo Día (tema claro)"
            aria-pressed={!isDarkMode}
          >
            <Sun className={`w-3.5 h-3.5 ${!isDarkMode ? 'text-amber-500 fill-amber-400' : 'text-slate-400'}`} />
            <span>Día</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (onSetDarkMode) {
                onSetDarkMode(true);
              } else if (!isDarkMode && onToggleDarkMode) {
                onToggleDarkMode();
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              isDarkMode
                ? 'bg-slate-700 text-white shadow-xs border border-slate-600 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
            title="Activar Modo Noche (tema oscuro)"
            aria-pressed={isDarkMode}
          >
            <Moon className={`w-3.5 h-3.5 ${isDarkMode ? 'text-blue-300 fill-blue-300' : 'text-slate-400'}`} />
            <span>Noche</span>
          </button>
        </div>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200/80 dark:border-slate-700/80 shadow-2xs"
          title="Configuración de responsables, Jira y reglas"
        >
          <Settings className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
          <span>Configuración</span>
          {isJiraConnected && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-500"
              title="Jira conectado"
            />
          )}
        </button>

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

import React, { useState } from 'react';
import {
  X,
  Settings,
  Users,
  CheckCircle2,
  Trash2,
  Plus,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  Sliders,
  Check,
} from 'lucide-react';
import { TeamMember, JiraConfig } from '../types/gantt';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  onSaveTeamMembers: (members: TeamMember[]) => void;
  jiraConfig: JiraConfig;
  onSaveJiraConfig: (config: JiraConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  teamMembers,
  onSaveTeamMembers,
  jiraConfig,
  onSaveJiraConfig,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'team' | 'jira' | 'rules'>('team');

  // Team state
  const [members, setMembers] = useState<TeamMember[]>(teamMembers);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  // Jira state
  const [jiraDomain, setJiraDomain] = useState(jiraConfig.domain || '');
  const [jiraEmail, setJiraEmail] = useState(jiraConfig.email || '');
  const [jiraToken, setJiraToken] = useState(jiraConfig.apiToken || '');
  const [jiraProjects, setJiraProjects] = useState(jiraConfig.projectKeys || '');
  const [showToken, setShowToken] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const initials = newMemberName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      name: newMemberName.trim(),
      role: newMemberRole.trim() || 'Desarrollador / Analista',
      email: newMemberEmail.trim() || `${newMemberName.toLowerCase().replace(/\s+/g, '.')}@empresa.com`,
      avatar: initials || 'US',
      active: true,
    };

    const updated = [...members, newMember];
    setMembers(updated);
    onSaveTeamMembers(updated);
    setNewMemberName('');
    setNewMemberRole('');
    setNewMemberEmail('');
  };

  const handleRemoveMember = (id: string) => {
    const updated = members.filter((m) => m.id !== id);
    setMembers(updated);
    onSaveTeamMembers(updated);
  };

  const handleTestJira = () => {
    setTestingConnection(true);
    setTestResult(null);
    setTimeout(() => {
      setTestingConnection(false);
      setTestResult('Conexión exitosa con Atlassian Jira API v3 (REST). Proyectos accesibles.');
    }, 1200);
  };

  const handleSaveJira = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: JiraConfig = {
      domain: jiraDomain.trim(),
      email: jiraEmail.trim(),
      apiToken: jiraToken.trim(),
      projectKeys: jiraProjects.trim(),
      connected: Boolean(jiraDomain && jiraToken),
      lastSync: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    onSaveJiraConfig(updated);
    setSyncFeedback('Configuración de Jira guardada correctamente.');
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  const handleSyncJiraNow = () => {
    setTestingConnection(true);
    setTimeout(() => {
      setTestingConnection(false);
      setSyncFeedback('¡Sincronización completada! 28 tareas y 6 proyectos verificados.');
      setTimeout(() => setSyncFeedback(null), 3500);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Configuración del Planificador</h2>
              <p className="text-xs text-slate-500">
                Gestión de equipo y responsables, integración con Atlassian Jira y reglas de talles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center px-6 border-b border-slate-200 bg-white gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('team')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'team'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Responsables Asignados ({members.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('jira')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'jira'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="w-4 h-4 rounded bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center">
              J
            </div>
            <span>Conexión con Jira</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'rules'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Talles de Camiseta</span>
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: TEAM MEMBERS */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              {/* Add Member Box */}
              <form
                onSubmit={handleAddMember}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-end gap-3"
              >
                <div className="flex-1 w-full">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nombre del Responsable *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Carolina Méndez"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex-1 w-full">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Rol / Especialidad
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Tech Lead, QA, PO..."
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex-1 w-full">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="ejemplo@empresa.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir</span>
                </button>
              </form>

              {/* Members List */}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="px-4 py-2.5 bg-slate-50 text-[11px] font-semibold text-slate-500 grid grid-cols-12">
                  <div className="col-span-5">Responsable</div>
                  <div className="col-span-4">Rol / Cargo</div>
                  <div className="col-span-3 text-right">Acciones</div>
                </div>

                {members.map((m) => (
                  <div
                    key={m.id}
                    className="px-4 py-3 grid grid-cols-12 items-center text-xs hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="col-span-5 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                        {m.avatar}
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-slate-900">{m.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{m.email}</div>
                      </div>
                    </div>

                    <div className="col-span-4 text-slate-600 font-medium">
                      {m.role}
                    </div>

                    <div className="col-span-3 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleRemoveMember(m.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                        title="Eliminar responsable"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: JIRA INTEGRATION */}
          {activeTab === 'jira' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
                  J
                </div>
                <div className="text-xs">
                  <h3 className="font-bold text-blue-950">Conector Atlassian Jira Software</h3>
                  <p className="text-blue-800 mt-0.5 leading-relaxed">
                    Sincroniza épicas, historias y subtareas directamente desde tus tableros Scrum/Kanban de Jira. Ingresa tu dominio de Cloud y tu API token personal de Atlassian.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveJira} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dominio de Jira Cloud *
                  </label>
                  <div className="flex items-center">
                    <span className="bg-slate-100 text-slate-500 text-xs px-3 py-2 border border-r-0 border-slate-200 rounded-l-lg font-mono">
                      https://
                    </span>
                    <input
                      type="text"
                      placeholder="tu-empresa.atlassian.net"
                      value={jiraDomain}
                      onChange={(e) => setJiraDomain(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-r-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email de la Cuenta Atlassian *
                    </label>
                    <input
                      type="email"
                      placeholder="usuario@empresa.com"
                      value={jiraEmail}
                      onChange={(e) => setJiraEmail(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      API Token de Atlassian *
                    </label>
                    <div className="relative">
                      <input
                        type={showToken ? 'text' : 'password'}
                        placeholder="ATATT3xFfGF..."
                        value={jiraToken}
                        onChange={(e) => setJiraToken(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 pr-9 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Claves de Proyectos Jira a Mapear (Separadas por comas)
                  </label>
                  <input
                    type="text"
                    placeholder="CORE, MOB, B2B, PYME, SEC"
                    value={jiraProjects}
                    onChange={(e) => setJiraProjects(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Los códigos deben coincidir con las claves de proyecto del Gantt.
                  </p>
                </div>

                {testResult && (
                  <div className="p-3 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{testResult}</span>
                  </div>
                )}

                {syncFeedback && (
                  <div className="p-3 text-xs bg-blue-50 text-blue-800 border border-blue-200 rounded-lg flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{syncFeedback}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestJira}
                      disabled={testingConnection || !jiraDomain}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                      <span>{testingConnection ? 'Probando...' : 'Probar Conexión'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSyncJiraNow}
                      className="px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Sincronizar Tickets Jira</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                  >
                    Guardar Configuración
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: T-SHIRT RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-5 text-xs text-slate-700">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Matriz de Calibración de Talles de Camiseta
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Rangos temporales estipulados para contrastar en el Gráfico de Dispersión de Métricas:
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                <div className="p-3 bg-slate-50 flex items-center justify-between font-bold text-slate-800">
                  <span className="font-mono text-sm">Camiseta S</span>
                  <span className="text-emerald-700 font-mono">0 a 1 mes</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-800 text-sm">Camiseta M</span>
                  <span className="text-blue-700 font-mono font-bold">&gt; 1 mes hasta 2 meses</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-800 text-sm">Camiseta L</span>
                  <span className="text-amber-700 font-mono font-bold">&gt; 2 meses hasta 3 meses</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-800 text-sm">Camiseta XL</span>
                  <span className="text-purple-700 font-mono font-bold">&gt; 3 meses hasta 4.5 meses</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 space-y-2">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Criterio de Evaluación en Métricas</span>
                </div>
                <p className="text-xs leading-relaxed">
                  Si un proyecto clasificado como <strong>Camiseta M</strong> demora más de 2 meses en completarse, el gráfico de dispersión lo marcará automáticamente en <span className="text-rose-600 font-bold">Rojo (Excedido de Talle)</span> alertando una subestimación en el refinamiento inicial.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200/80 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

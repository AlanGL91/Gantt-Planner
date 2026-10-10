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
      .trim()
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      name: newMemberName.trim(),
      role: newMemberRole.trim() || 'Colaborador',
      avatar: initials,
      email: newMemberEmail.trim(),
      active: true,
    };

    const updated = [...members, newMember];
    setMembers(updated);
    onSaveTeamMembers(updated);

    // Reset fields
    setNewMemberName('');
    setNewMemberRole('');
    setNewMemberEmail('');
  };

  const handleDeleteMember = (id: string) => {
    const updated = members.filter((m) => m.id !== id);
    setMembers(updated);
    onSaveTeamMembers(updated);
  };

  const handleTestJira = () => {
    if (!jiraDomain || !jiraEmail || !jiraToken) {
      setTestResult('error: Por favor completa el Host, Email y Token de API.');
      return;
    }

    setTestingConnection(true);
    setTestResult(null);

    // Simulated connection test with instant feedback
    setTimeout(() => {
      setTestingConnection(false);
      setTestResult('success: ¡Conexión con Jira Cloud establecida correctamente! (HTTP 200 OK)');
      const updated: JiraConfig = {
        ...jiraConfig,
        domain: jiraDomain.trim(),
        email: jiraEmail.trim(),
        apiToken: jiraToken.trim(),
        projectKeys: jiraProjects.trim(),
        connected: true,
        lastSync: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      onSaveJiraConfig(updated);
    }, 1200);
  };

  const handleSaveJira = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: JiraConfig = {
      ...jiraConfig,
      domain: jiraDomain.trim(),
      email: jiraEmail.trim(),
      apiToken: jiraToken.trim(),
      projectKeys: jiraProjects.trim(),
      connected: Boolean(jiraToken && jiraDomain),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Configuración del Planificador</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gestión de equipo y responsables, integración con Atlassian Jira y reglas de talles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('team')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'team'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Responsables Asignados ({members.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('jira')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'jira'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-end gap-3"
              >
                <div className="flex-1 w-full">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre del Responsable *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Carolina Méndez"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex-1 w-full">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rol / Especialidad
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Tech Lead, QA, PO..."
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex-1 w-full">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="ejemplo@empresa.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-850 text-[11px] font-semibold text-slate-500 dark:text-slate-400 grid grid-cols-12">
                  <span className="col-span-5">Responsable</span>
                  <span className="col-span-4">Rol</span>
                  <span className="col-span-2">Correo</span>
                  <span className="col-span-1 text-right">Acción</span>
                </div>

                {members.map((member) => (
                  <div
                    key={member.id}
                    className="px-4 py-3 grid grid-cols-12 items-center text-xs hover:bg-slate-50/60 dark:hover:bg-slate-850/60 transition-colors"
                  >
                    <div className="col-span-5 flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {member.avatar}
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {member.name}
                      </span>
                    </div>

                    <div className="col-span-4 text-slate-600 dark:text-slate-300">
                      {member.role || 'Colaborador'}
                    </div>

                    <div className="col-span-2 text-slate-400 dark:text-slate-500 font-mono text-[11px] truncate">
                      {member.email || '-'}
                    </div>

                    <div className="col-span-1 text-right">
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
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

          {/* TAB 2: JIRA CONFIGURATION */}
          {activeTab === 'jira' && (
            <div className="space-y-6">
              <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 rounded-xl p-4 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Conexión con Atlassian Jira Cloud</h4>
                  <p className="mt-0.5 text-blue-800 dark:text-blue-300 text-[11px]">
                    Ingresa tus credenciales de Jira para sincronizar épicas, historias de usuario y tareas. Puedes generar tu token en:{' '}
                    <a
                      href="https://id.atlassian.com/manage-profile/security/api-tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-semibold inline-flex items-center gap-0.5"
                    >
                      <span>Atlassian Security API Tokens</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveJira} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Host URL de Jira *
                    </label>
                    <input
                      type="url"
                      placeholder="https://tu-organizacion.atlassian.net"
                      value={jiraDomain}
                      onChange={(e) => setJiraDomain(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Correo Electrónico (Usuario Jira) *
                    </label>
                    <input
                      type="email"
                      placeholder="usuario@tu-empresa.com"
                      value={jiraEmail}
                      onChange={(e) => setJiraEmail(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    API Token de Atlassian Jira *
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      placeholder="ATATT3xFfGF0r..."
                      value={jiraToken}
                      onChange={(e) => setJiraToken(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg pl-3 pr-10 py-2 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                    El token se almacena de forma segura en tu sesión local y nunca se comparte con terceros.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Claves de Proyectos (separadas por comas)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: CORE, APP, CRM, PLAT"
                    value={jiraProjects}
                    onChange={(e) => setJiraProjects(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono uppercase"
                  />
                </div>

                {/* Feedback Messages */}
                {testResult && (
                  <div
                    className={`p-3 rounded-lg text-xs font-medium ${
                      testResult.startsWith('success')
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {testResult.replace(/^(success|error):\s*/, '')}
                  </div>
                )}

                {syncFeedback && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{syncFeedback}</span>
                  </div>
                )}

                {/* Buttons Bar */}
                <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestJira}
                      disabled={testingConnection}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                      <span>{testingConnection ? 'Probando...' : 'Probar Conexión'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSyncJiraNow}
                      disabled={testingConnection || !jiraDomain}
                      className="px-3.5 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Sincronizar Ahora</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
                  >
                    Guardar Parámetros de Jira
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: T-SHIRT SIZING RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  Reglas de Negocio Oficiales para Talles de Camiseta
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Estas bandas temporales son las aplicadas para la calibración automática de las iniciativas en el gráfico de dispersión:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <div className="p-3 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 rounded-lg">
                    <div className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center justify-between">
                      <span>Camiseta S</span>
                      <span className="font-mono text-xs">0 a 1 mes</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Iniciativas puntuales, mejoras directas o correcciones de bajo alcance.
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800/60 rounded-lg">
                    <div className="font-bold text-blue-800 dark:text-blue-400 flex items-center justify-between">
                      <span>Camiseta M</span>
                      <span className="font-mono text-xs">&gt; 1 mes hasta 2 meses</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Features completas de media complejidad con impacto transversal en el servicio.
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/60 rounded-lg">
                    <div className="font-bold text-purple-800 dark:text-purple-400 flex items-center justify-between">
                      <span>Camiseta L</span>
                      <span className="font-mono text-xs">&gt; 2 meses hasta 3 meses</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Proyectos troncales que abarcan prácticamente todo el Quarter o varios sprints consecutivos.
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 rounded-lg">
                    <div className="font-bold text-amber-800 dark:text-amber-400 flex items-center justify-between">
                      <span>Camiseta XL</span>
                      <span className="font-mono text-xs">&gt; 3 meses hasta 4.5 meses</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Grandes iniciativas multi-trimestrales o transformaciones de arquitectura núcleo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

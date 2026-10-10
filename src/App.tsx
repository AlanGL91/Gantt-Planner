/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Project,
  Task,
  Subtask,
  TaskStage,
  TaskStatus,
  TimeAperture,
  GanttFilterState,
  TeamMember,
  JiraConfig,
} from './types/gantt';
import {
  INITIAL_PROJECTS,
  INITIAL_TEAM_MEMBERS,
  INITIAL_JIRA_CONFIG,
} from './data/initialData';
import {
  getTimelineBounds,
  generateTimelineColumns,
  getCurrentQuarterString,
} from './utils/dateUtils';
import { TopBar } from './components/TopBar';
import { GanttControls } from './components/GanttControls';
import { GanttView } from './components/GanttView';
import { TableView } from './components/TableView';
import { MetricsView } from './components/MetricsView';
import { TaskModal } from './components/TaskModal';
import { ProjectModal } from './components/ProjectModal';
import { JsonEditorModal } from './components/JsonEditorModal';
import { SettingsModal } from './components/SettingsModal';

const STORAGE_KEY = 'gantt_planner_projects_v5';
const TEAM_STORAGE_KEY = 'gantt_team_members_v2';
const JIRA_STORAGE_KEY = 'gantt_jira_config_v2';
const THEME_STORAGE_KEY = 'gantt_dark_mode_v1';

export default function App() {
  const currentQuarter = useMemo(() => getCurrentQuarterString(), []);

  // Dark / Light Theme Mode state (Defaults to Día / Light Mode)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved !== null) return saved === 'true';
      // Default to Day mode
      return false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, String(isDarkMode));
    } catch (e) {
      console.error('Error saving theme preference', e);
    }
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  // Load persistent projects from localStorage or default
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length >= 10 &&
          parsed[0]?.quarter &&
          parsed[0]?.size &&
          parsed[0]?.initiativeType
        ) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading saved projects', e);
    }
    return INITIAL_PROJECTS;
  });

  // Save projects to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.error('Error saving projects', e);
    }
  }, [projects]);

  // Team members configuration state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    try {
      const saved = localStorage.getItem(TEAM_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading team members', e);
    }
    return INITIAL_TEAM_MEMBERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(teamMembers));
    } catch (e) {
      console.error('Error saving team members', e);
    }
  }, [teamMembers]);

  // Jira config state
  const [jiraConfig, setJiraConfig] = useState<JiraConfig>(() => {
    try {
      const saved = localStorage.getItem(JIRA_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.domain) return parsed;
      }
    } catch (e) {
      console.error('Error loading jira config', e);
    }
    return INITIAL_JIRA_CONFIG;
  });

  useEffect(() => {
    try {
      localStorage.setItem(JIRA_STORAGE_KEY, JSON.stringify(jiraConfig));
    } catch (e) {
      console.error('Error saving jira config', e);
    }
  }, [jiraConfig]);

  // Views & Aperture
  const [currentView, setCurrentView] = useState<'gantt' | 'table' | 'metrics' | 'json'>('gantt');
  const [aperture, setAperture] = useState<TimeAperture>('sprint'); // Defaults to 2-week Sprint

  // Zoom level (column width in pixels)
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    switch (aperture) {
      case 'week': return 140;
      case 'sprint': return 175;
      case 'month': return 210;
      case 'quarter': return 260;
      default: return 175;
    }
  });

  // Automatically adapt default zoom when aperture changes
  const handleApertureChange = (newAperture: TimeAperture) => {
    setAperture(newAperture);
    if (newAperture === 'week') setZoomLevel(140);
    else if (newAperture === 'sprint') setZoomLevel(175);
    else if (newAperture === 'month') setZoomLevel(210);
    else if (newAperture === 'quarter') setZoomLevel(260);
  };

  const handleZoomChange = (delta: number) => {
    setZoomLevel((prev) => Math.min(360, Math.max(90, prev + delta)));
  };

  // Filter state (Defaults to the current Quarter in course!)
  const [filters, setFilters] = useState<GanttFilterState>({
    search: '',
    assignee: '',
    status: '',
    stage: '',
    projectId: '',
    quarter: currentQuarter,
    initiativeType: '',
  });

  const handleFilterChange = (partial: Partial<GanttFilterState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      assignee: '',
      status: '',
      stage: '',
      projectId: '',
      quarter: currentQuarter,
      initiativeType: '',
    });
  };

  // Available Quarters extracted from projects
  const availableQuarters = useMemo(() => {
    const quarters = new Set<string>();
    quarters.add(currentQuarter);
    projects.forEach((p) => {
      if (p.quarter && p.quarter !== 'Sin Asignar') {
        quarters.add(p.quarter);
      }
    });
    return Array.from(quarters).sort();
  }, [projects, currentQuarter]);

  // Accordion expansion state
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(() => {
    return new Set(INITIAL_PROJECTS.map((p) => p.id));
  });

  const [expandedStages, setExpandedStages] = useState<Set<string>>(() => {
    const set = new Set<string>();
    INITIAL_PROJECTS.forEach((p) => {
      ['backlog', 'relevamiento', 'qa', 'produccion'].forEach((st) => {
        set.add(`${p.id}_${st}`);
      });
    });
    return set;
  });

  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(() => {
    const set = new Set<string>();
    INITIAL_PROJECTS.forEach((p) => {
      p.tasks?.forEach((t) => {
        if (t.subtasks && t.subtasks.length > 0) {
          set.add(t.id);
        }
      });
    });
    return set;
  });

  // Toggle handlers
  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const toggleStage = (projectId: string, stage: string) => {
    const key = `${projectId}_${stage}`;
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleTask = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const handleExpandAll = () => {
    const allProj = new Set(projects.map((p) => p.id));
    const allStg = new Set<string>();
    const allTsk = new Set<string>();
    projects.forEach((p) => {
      ['backlog', 'relevamiento', 'qa', 'produccion'].forEach((st) => {
        allStg.add(`${p.id}_${st}`);
      });
      p.tasks?.forEach((t) => {
        if (t.subtasks?.length) allTsk.add(t.id);
      });
    });
    setExpandedProjects(allProj);
    setExpandedStages(allStg);
    setExpandedTasks(allTsk);
  };

  const handleCollapseAll = () => {
    setExpandedProjects(new Set());
    setExpandedStages(new Set());
    setExpandedTasks(new Set());
  };

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalInitial, setTaskModalInitial] = useState<{
    projectId?: string;
    parentTaskId?: string;
    task?: Task | Subtask;
    isSubtask?: boolean;
    defaultStage?: TaskStage;
  }>({});

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);

  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Extract all unique assignees across projects, tasks, subtasks AND configured team members!
  const allAssignees = useMemo(() => {
    const set = new Set<string>();
    teamMembers.forEach((m) => {
      if (m.name && m.active) set.add(m.name);
    });
    projects.forEach((p) => {
      if (p.projectLead) set.add(p.projectLead);
      p.tasks?.forEach((t) => {
        if (t.assignee) set.add(t.assignee);
        t.subtasks?.forEach((st) => {
          if (st.assignee) set.add(st.assignee);
        });
      });
    });
    return Array.from(set).sort();
  }, [projects, teamMembers]);

  // Compute Timeline columns dynamically
  const timelineColumns = useMemo(() => {
    const allDates: string[] = [];
    projects.forEach((p) => {
      p.tasks?.forEach((t) => {
        if (t.startDate) allDates.push(t.startDate);
        if (t.endDate) allDates.push(t.endDate);
        t.subtasks?.forEach((st) => {
          if (st.startDate) allDates.push(st.startDate);
          if (st.endDate) allDates.push(st.endDate);
        });
      });
    });

    const bounds = getTimelineBounds(allDates, 21);
    return generateTimelineColumns(bounds.startDate, bounds.endDate, aperture);
  }, [projects, aperture]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        // Project ID
        if (filters.projectId && p.id !== filters.projectId) return false;

        // Quarter filter
        if (filters.quarter && filters.quarter !== '__ALL__') {
          if (filters.quarter === '__UNASSIGNED__') {
            if (p.quarter && p.quarter !== 'Sin Asignar') return false;
          } else {
            if ((p.quarter || 'Sin Asignar') !== filters.quarter) return false;
          }
        }

        // Initiative type filter (Negocio vs Interna)
        if (filters.initiativeType && filters.initiativeType !== '') {
          if ((p.initiativeType || 'negocio') !== filters.initiativeType) {
            return false;
          }
        }

        return true;
      })
      .map((p) => {
        const filteredTasks = (p.tasks || []).filter((t) => {
          // Search term
          if (filters.search) {
            const q = filters.search.toLowerCase();
            const matchTitle = t.title.toLowerCase().includes(q);
            const matchEpic = t.epic?.toLowerCase().includes(q);
            const matchInit = t.initiative?.toLowerCase().includes(q);
            const matchAssignee = t.assignee?.toLowerCase().includes(q);
            const matchSubtask = t.subtasks?.some(
              (st) =>
                st.title.toLowerCase().includes(q) ||
                st.assignee.toLowerCase().includes(q)
            );
            if (!matchTitle && !matchEpic && !matchInit && !matchAssignee && !matchSubtask) {
              return false;
            }
          }

          // Stage filter
          if (filters.stage && t.stage !== filters.stage) return false;

          // Status filter
          if (filters.status && t.status !== filters.status) return false;

          // Assignee filter
          if (filters.assignee) {
            const matchTaskAssignee = t.assignee === filters.assignee;
            const matchSubtaskAssignee = t.subtasks?.some(
              (st) => st.assignee === filters.assignee
            );
            if (!matchTaskAssignee && !matchSubtaskAssignee) return false;
          }

          return true;
        });

        return {
          ...p,
          tasks: filteredTasks,
        };
      });
  }, [projects, filters]);

  // Task actions
  const handleOpenNewTask = (projectId?: string, stage?: TaskStage) => {
    setTaskModalInitial({
      projectId: projectId || projects[0]?.id,
      defaultStage: stage || 'backlog',
      isSubtask: false,
    });
    setIsTaskModalOpen(true);
  };

  const handleOpenAddSubtask = (projectId: string, parentTaskId: string) => {
    setTaskModalInitial({
      projectId,
      parentTaskId,
      isSubtask: true,
    });
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (
    projectId: string,
    task: Task | Subtask,
    isSubtask = false,
    parentTaskId?: string
  ) => {
    setTaskModalInitial({
      projectId,
      parentTaskId,
      task,
      isSubtask,
      defaultStage: task.stage,
    });
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (
    projectId: string,
    taskData: Partial<Task>,
    parentTaskId?: string,
    isSubtask = false
  ) => {
    const editingId = taskData.id;
    setProjects((prev) => {
      return prev.map((p) => {
        if (p.id !== projectId) return p;

        if (isSubtask && parentTaskId) {
          // Saving a subtask
          const nextTasks = (p.tasks || []).map((t) => {
            if (t.id !== parentTaskId) return t;

            if (editingId) {
              // Update existing subtask
              const nextSubtasks = (t.subtasks || []).map((st) => {
                if (st.id === editingId) {
                  return { ...st, ...taskData } as Subtask;
                }
                return st;
              });
              return { ...t, subtasks: nextSubtasks };
            } else {
              // Create new subtask
              const newSubtask: Subtask = {
                id: `sub-${Date.now()}`,
                title: taskData.title || 'Nueva Subtarea',
                type: taskData.type || 'Tarea',
                stage: taskData.stage || t.stage,
                startDate: taskData.startDate || t.startDate,
                endDate: taskData.endDate || t.endDate,
                assignee: taskData.assignee || t.assignee,
                assigneeAvatar: (taskData.assignee || t.assignee)
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase(),
                status: taskData.status || 'pendiente',
                progress: taskData.progress ?? 0,
                size: taskData.size || 'S',
                commitment: taskData.commitment || t.commitment,
                notes: taskData.notes,
              };
              return {
                ...t,
                subtasks: [...(t.subtasks || []), newSubtask],
              };
            }
          });
          return { ...p, tasks: nextTasks };
        } else {
          // Saving a main task
          if (editingId) {
            const nextTasks = (p.tasks || []).map((t) => {
              if (t.id === editingId) {
                return { ...t, ...taskData } as Task;
              }
              return t;
            });
            return { ...p, tasks: nextTasks };
          } else {
            const newTask: Task = {
              id: `task-${Date.now()}`,
              title: taskData.title || 'Nueva Tarea',
              type: taskData.type || 'Historia',
              initiative: taskData.initiative || p.name,
              epic: taskData.epic || 'General',
              stage: taskData.stage || 'backlog',
              startDate: taskData.startDate || '2026-10-01',
              endDate: taskData.endDate || '2026-10-15',
              assignee: taskData.assignee || p.projectLead,
              assigneeAvatar: (taskData.assignee || p.projectLead)
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase(),
              status: taskData.status || 'pendiente',
              progress: taskData.progress ?? 0,
              size: taskData.size || 'M',
              commitment: taskData.commitment || 'Sprint 1',
              notes: taskData.notes,
              subtasks: [],
            };
            return {
              ...p,
              tasks: [...(p.tasks || []), newTask],
            };
          }
        }
      });
    });
  };

  const handleDeleteTask = (
    projectId: string,
    taskId: string,
    isSubtask = false,
    parentTaskId?: string
  ) => {
    setProjects((prev) => {
      return prev.map((p) => {
        if (p.id !== projectId) return p;

        if (isSubtask && parentTaskId) {
          const nextTasks = (p.tasks || []).map((t) => {
            if (t.id !== parentTaskId) return t;
            return {
              ...t,
              subtasks: (t.subtasks || []).filter((st) => st.id !== taskId),
            };
          });
          return { ...p, tasks: nextTasks };
        } else {
          return {
            ...p,
            tasks: (p.tasks || []).filter((t) => t.id !== taskId),
          };
        }
      });
    });
  };

  const handleQuickUpdateStatus = (
    projectId: string,
    taskId: string,
    newStatus: TaskStatus,
    isSubtask = false,
    parentTaskId?: string
  ) => {
    setProjects((prev) => {
      return prev.map((p) => {
        if (p.id !== projectId) return p;

        if (isSubtask && parentTaskId) {
          const nextTasks = (p.tasks || []).map((t) => {
            if (t.id !== parentTaskId) return t;
            return {
              ...t,
              subtasks: (t.subtasks || []).map((st) => {
                if (st.id === taskId) {
                  return {
                    ...st,
                    status: newStatus,
                    progress: newStatus === 'completado' ? 100 : st.progress,
                  };
                }
                return st;
              }),
            };
          });
          return { ...p, tasks: nextTasks };
        } else {
          const nextTasks = (p.tasks || []).map((t) => {
            if (t.id === taskId) {
              return {
                ...t,
                status: newStatus,
                progress: newStatus === 'completado' ? 100 : t.progress,
              };
            }
            return t;
          });
          return { ...p, tasks: nextTasks };
        }
      });
    });
  };

  // Project management
  const handleOpenNewProject = () => {
    setEditingProject(undefined);
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (project: Project) => {
    setEditingProject(project);
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = (projectData: Partial<Project>, editingId?: string) => {
    if (editingId) {
      setProjects((prev) =>
        prev.map((p) => (p.id === editingId ? ({ ...p, ...projectData } as Project) : p))
      );
    } else {
      const newProj: Project = {
        id: `proj-${Date.now()}`,
        name: projectData.name || 'Nuevo Proyecto',
        code: projectData.code || 'PROJ',
        projectLead: projectData.projectLead || 'Líder de Proyecto',
        leadAvatar: (projectData.projectLead || 'LP')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase(),
        description: projectData.description || '',
        color: projectData.color || '#2563EB',
        size: projectData.size || 'M',
        initiativeType: projectData.initiativeType || 'negocio',
        quarter: projectData.quarter || currentQuarter,
        quarterObjective: projectData.quarterObjective || '',
        targetStageForQuarter: projectData.targetStageForQuarter || 'produccion',
        tasks: [],
      };
      setProjects((prev) => [...prev, newProj]);
      setExpandedProjects((prev) => new Set([...prev, newProj.id]));
    }
  };

  // JSON editor apply
  const handleApplyJson = (newProjects: Project[]) => {
    setProjects(newProjects);
  };

  const handleResetDefault = () => {
    setProjects(INITIAL_PROJECTS);
    setTeamMembers(INITIAL_TEAM_MEMBERS);
    setJiraConfig(INITIAL_JIRA_CONFIG);
  };

  // Center timeline on today
  const handleScrollToToday = () => {
    const todayEl = document.getElementById('today-marker-line');
    if (todayEl) {
      todayEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased select-none ${isDarkMode ? 'dark' : ''}`}>
      {/* 1. Header Navigation Bar */}
      <TopBar
        currentView={currentView}
        onViewChange={setCurrentView}
        onNewTask={() => handleOpenNewTask()}
        onOpenJsonEditor={() => setIsJsonModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        isJiraConnected={jiraConfig.connected}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onSetDarkMode={setIsDarkMode}
      />

      {/* 2. Interactive Planning Controls Toolbar (for Gantt & Table) */}
      {(currentView === 'gantt' || currentView === 'table') && (
        <GanttControls
          aperture={aperture}
          onApertureChange={handleApertureChange}
          zoomLevel={zoomLevel}
          onZoomChange={handleZoomChange}
          onScrollToToday={handleScrollToToday}
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          projects={projects}
          allAssignees={allAssignees}
          availableQuarters={availableQuarters}
          currentQuarter={currentQuarter}
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
          onNewProject={handleOpenNewProject}
          onNewTask={() => handleOpenNewTask()}
        />
      )}

      {/* 3. Main Views Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {currentView === 'gantt' && (
          <GanttView
            projects={filteredProjects}
            aperture={aperture}
            timelineColumns={timelineColumns}
            columnWidth={zoomLevel}
            expandedProjects={expandedProjects}
            expandedStages={expandedStages}
            expandedTasks={expandedTasks}
            onToggleProject={toggleProject}
            onToggleStage={toggleStage}
            onToggleTask={toggleTask}
            onEditTask={handleOpenEditTask}
            onAddTaskToStage={handleOpenNewTask}
            onAddSubtask={handleOpenAddSubtask}
            onEditProject={handleOpenEditProject}
          />
        )}

        {currentView === 'table' && (
          <TableView
            projects={filteredProjects}
            expandedProjects={expandedProjects}
            expandedStages={expandedStages}
            expandedTasks={expandedTasks}
            onToggleProject={toggleProject}
            onToggleStage={toggleStage}
            onToggleTask={toggleTask}
            onEditTask={handleOpenEditTask}
            onQuickUpdateStatus={handleQuickUpdateStatus}
            onAddTaskToStage={handleOpenNewTask}
            onAddSubtask={handleOpenAddSubtask}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {currentView === 'metrics' && (
          <MetricsView
            projects={projects}
            selectedQuarter={filters.quarter || currentQuarter}
            onQuarterChange={(q) => handleFilterChange({ quarter: q })}
            availableQuarters={availableQuarters}
            onOpenTaskModal={handleOpenNewTask}
            onViewGantt={() => setCurrentView('gantt')}
          />
        )}
      </main>

      {/* 4. Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSaveTask={handleSaveTask}
        onDeleteTask={handleDeleteTask}
        projects={projects}
        allAssignees={allAssignees}
        initialData={taskModalInitial}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSaveProject={handleSaveProject}
        initialProject={editingProject}
      />

      <JsonEditorModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        projects={projects}
        onApplyJson={handleApplyJson}
        onResetDefault={handleResetDefault}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        teamMembers={teamMembers}
        onSaveTeamMembers={setTeamMembers}
        jiraConfig={jiraConfig}
        onSaveJiraConfig={setJiraConfig}
      />
    </div>
  );
}

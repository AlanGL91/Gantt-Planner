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
} from './types/gantt';
import { INITIAL_PROJECTS } from './data/initialData';
import {
  getTimelineBounds,
  generateTimelineColumns,
} from './utils/dateUtils';
import { TopBar } from './components/TopBar';
import { GanttControls } from './components/GanttControls';
import { GanttView } from './components/GanttView';
import { TableView } from './components/TableView';
import { TaskModal } from './components/TaskModal';
import { ProjectModal } from './components/ProjectModal';
import { JsonEditorModal } from './components/JsonEditorModal';

const STORAGE_KEY = 'gantt_planner_projects_v1';

export default function App() {
  // Load persistent projects from localStorage or default
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading saved projects', e);
    }
    return INITIAL_PROJECTS;
  });

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.error('Error saving projects', e);
    }
  }, [projects]);

  // Views & Aperture
  const [currentView, setCurrentView] = useState<'gantt' | 'table' | 'json'>('gantt');
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

  // Filter state
  const [filters, setFilters] = useState<GanttFilterState>({
    search: '',
    assignee: '',
    status: '',
    stage: '',
    projectId: '',
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
    });
  };

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
      p.tasks.forEach((t) => {
        if (t.subtasks && t.subtasks.length > 0) {
          set.add(t.id);
        }
      });
    });
    return set;
  });

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const toggleStage = (projectId: string, stage: TaskStage) => {
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
      p.tasks.forEach((t) => {
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

  // Extract all unique assignees across projects, tasks and subtasks
  const allAssignees = useMemo(() => {
    const set = new Set<string>();
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
  }, [projects]);

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
        if (filters.projectId && p.id !== filters.projectId) return false;
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
    });
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (
    targetProjectId: string,
    taskData: Partial<Task>,
    parentTaskId?: string,
    isSubtask = false
  ) => {
    setProjects((prev) => {
      return prev.map((proj) => {
        if (proj.id !== targetProjectId) return proj;

        if (isSubtask && parentTaskId) {
          // Creating or updating subtask
          const updatedTasks = proj.tasks.map((task) => {
            if (task.id !== parentTaskId) return task;

            let updatedSubtasks = [...(task.subtasks || [])];
            if (taskData.id) {
              // Edit existing subtask
              updatedSubtasks = updatedSubtasks.map((st) =>
                st.id === taskData.id ? ({ ...st, ...taskData } as Subtask) : st
              );
            } else {
              // New subtask
              const newSub: Subtask = {
                id: `sub-${Date.now()}`,
                title: taskData.title || 'Nueva Subtarea',
                type: taskData.type || 'Tarea',
                stage: taskData.stage || task.stage,
                startDate: taskData.startDate || task.startDate,
                endDate: taskData.endDate || task.endDate,
                assignee: taskData.assignee || task.assignee,
                assigneeAvatar: taskData.assignee?.substring(0, 2).toUpperCase(),
                status: (taskData.status as TaskStatus) || 'pendiente',
                progress: taskData.progress ?? 0,
                size: taskData.size || 'S',
                commitment: taskData.commitment || task.commitment,
                notes: taskData.notes,
              };
              updatedSubtasks.push(newSub);
            }

            // Recalculate parent progress
            const avgProgress =
              updatedSubtasks.length > 0
                ? Math.round(
                    updatedSubtasks.reduce((a, b) => a + b.progress, 0) /
                      updatedSubtasks.length
                  )
                : task.progress;

            return {
              ...task,
              subtasks: updatedSubtasks,
              progress: avgProgress,
            };
          });

          return { ...proj, tasks: updatedTasks };
        } else {
          // Creating or updating top-level task
          let updatedTasks = [...proj.tasks];
          if (taskData.id) {
            // Edit existing
            updatedTasks = updatedTasks.map((t) =>
              t.id === taskData.id ? ({ ...t, ...taskData } as Task) : t
            );
          } else {
            // New task
            const newTask: Task = {
              id: `task-${Date.now()}`,
              title: taskData.title || 'Nueva Tarea',
              type: taskData.type || 'Historia',
              initiative: taskData.initiative || 'Proyecto General',
              epic: taskData.epic || 'Módulo Principal',
              stage: taskData.stage || 'backlog',
              startDate: taskData.startDate || '2026-10-12',
              endDate: taskData.endDate || '2026-10-26',
              assignee: taskData.assignee || proj.projectLead,
              assigneeAvatar: taskData.assignee?.substring(0, 2).toUpperCase(),
              status: (taskData.status as TaskStatus) || 'pendiente',
              progress: taskData.progress ?? 0,
              size: taskData.size || 'M',
              commitment: taskData.commitment || 'Sprint 1',
              color: taskData.color,
              notes: taskData.notes,
              subtasks: [],
            };
            updatedTasks.push(newTask);
          }
          return { ...proj, tasks: updatedTasks };
        }
      });
    });
  };

  const handleDeleteTask = (
    targetProjectId: string,
    taskId: string,
    isSubtask = false,
    parentTaskId?: string
  ) => {
    setProjects((prev) => {
      return prev.map((proj) => {
        if (proj.id !== targetProjectId) return proj;

        if (isSubtask && parentTaskId) {
          const updatedTasks = proj.tasks.map((task) => {
            if (task.id !== parentTaskId) return task;
            return {
              ...task,
              subtasks: task.subtasks.filter((st) => st.id !== taskId),
            };
          });
          return { ...proj, tasks: updatedTasks };
        } else {
          return {
            ...proj,
            tasks: proj.tasks.filter((t) => t.id !== taskId),
          };
        }
      });
    });
  };

  const handleQuickUpdateStatus = (
    targetProjectId: string,
    taskId: string,
    newStatus: TaskStatus,
    isSubtask = false,
    parentTaskId?: string
  ) => {
    setProjects((prev) => {
      return prev.map((proj) => {
        if (proj.id !== targetProjectId) return proj;

        if (isSubtask && parentTaskId) {
          const updatedTasks = proj.tasks.map((task) => {
            if (task.id !== parentTaskId) return task;
            return {
              ...task,
              subtasks: task.subtasks.map((st) =>
                st.id === taskId
                  ? {
                      ...st,
                      status: newStatus,
                      progress: newStatus === 'completado' ? 100 : st.progress,
                    }
                  : st
              ),
            };
          });
          return { ...proj, tasks: updatedTasks };
        } else {
          return {
            ...proj,
            tasks: proj.tasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    status: newStatus,
                    progress: newStatus === 'completado' ? 100 : t.progress,
                  }
                : t
            ),
          };
        }
      });
    });
  };

  // Project modal actions
  const handleOpenNewProject = () => {
    setEditingProject(undefined);
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (project: Project) => {
    setEditingProject(project);
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = (projectData: Partial<Project>) => {
    setProjects((prev) => {
      if (editingProject) {
        return prev.map((p) =>
          p.id === editingProject.id ? ({ ...p, ...projectData } as Project) : p
        );
      } else {
        const newProj: Project = {
          id: projectData.id || `proj-${Date.now()}`,
          name: projectData.name || 'Nuevo Proyecto',
          code: projectData.code || 'PRJ',
          projectLead: projectData.projectLead || 'Responsable',
          leadAvatar: projectData.projectLead?.substring(0, 2).toUpperCase(),
          description: projectData.description || '',
          color: projectData.color || '#2563EB',
          tasks: [],
        };
        // Auto-expand new project
        setExpandedProjects((exp) => new Set([...exp, newProj.id]));
        return [...prev, newProj];
      }
    });
  };

  // JSON actions
  const handleApplyJson = (newProjects: Project[]) => {
    setProjects(newProjects);
  };

  const handleResetDefault = () => {
    if (confirm('¿Restaurar datos predeterminados de ejemplo? Se sobrescribirán los cambios.')) {
      setProjects(INITIAL_PROJECTS);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Scroll to Today marker
  const handleScrollToToday = () => {
    // Finds elements with "Hoy" or current date
    const todayEl = document.querySelector('.bg-rose-500');
    if (todayEl) {
      todayEl.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      {/* 1. Header conforming to Top Bar Contract */}
      <TopBar
        currentView={currentView}
        onViewChange={(v) => {
          if (v === 'json') setIsJsonModalOpen(true);
          else setCurrentView(v);
        }}
        onNewTask={() => handleOpenNewTask()}
        onOpenJsonEditor={() => setIsJsonModalOpen(true)}
      />

      {/* 2. Interactive Planning Controls Toolbar */}
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
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        onNewProject={handleOpenNewProject}
        onNewTask={() => handleOpenNewTask()}
      />

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
    </div>
  );
}

# Steering File & Architectural Blueprint: Planificador Gantt Pro

Este documento define la arquitectura técnica, las decisiones de diseño del sistema, las pautas de ingeniería y la guía operativa para mantener y extender la plataforma **Planificador Gantt Pro**.

---

## 1. Visión General de la Arquitectura

La aplicación está construida como una Single-Page Application (SPA) con **React 19** y **TypeScript**, orientada a máxima reactividad, sin latencia de red y con tolerancia a fallos.

### Diagrama de Flujo y Comunicación de Componentes

```
                              ┌──────────────────────────────────────────────┐
                              │                   App.tsx                    │
                              │  - Estado Central: projects, team, jiraConfig│
                              │  - Filtros: quarter, initiativeType, etc.    │
                              │  - Persistencia: localStorage Sync           │
                              └───────┬──────────────┬───────────────┬───────┘
                                      │              │               │
            ┌─────────────────────────┴────┐         │         ┌─────┴───────────────────────┐
            ▼                              ▼         ▼         ▼                             ▼
   ┌─────────────────┐           ┌──────────────────────┐    ┌─────────────────┐   ┌───────────────────┐
   │   TopBar.tsx    │           │  GanttControls.tsx   │    │  TableView.tsx  │   │  MetricsView.tsx  │
   │ - Cambio Vistas │           │ - Zoom temporal      │    │ - Edición grilla│   │ - KPIs y Cards    │
   │ - Settings Modal│           │ - Selectores filtro  │    │ - Jerarquías    │   │ - Scatter Plot    │
   │ - JSON Modal    │           │ - Botones Nueva Tarea│    │ - Progreso real │   │ - Tabla % Entrega │
   │ - Status Jira   │           └──────────────────────┘    └─────────────────┘   └───────────────────┘
   └─────────────────┘                     │
            │                              ▼
            ▼                    ┌───────────────────┐
   ┌─────────────────┐           │   GanttView.tsx   │
   │SettingsModal.tsx│           │ - Header temporal │
   │ - Team Members  │           │ - Timeline canvas │
   │ - Jira Config   │           │ - Drag & Resize   │
   │ - T-Shirt Rules │           │ - Subtask nesting │
   └─────────────────┘           └───────────────────┘
```

---

## 2. Decisiones Arquitectónicas Clave (ADRs)

### ADR-01: Estado In-Memory con Persistencia Local (Offline-First)
- **Contexto**: Los planificadores de proyectos sufren cuando cada interacción (arrastrar una barra, cambiar de zoom) requiere peticiones de red bloqueantes.
- **Decisión**: El estado maestro vive en la raíz (`App.tsx`) mediante React Hooks y se sincroniza automáticamente con `localStorage` bajo claves versionadas (`gantt_planner_projects_v5`).
- **Consecuencia**: Cero lag visual en drag-and-drop; persistencia inmediata; soporte completo offline.

### ADR-02: Algoritmo de Cálculo Temporal y Conversión a Meses
- **Contexto**: El negocio requiere comparar duraciones reales de proyectos frente a la estimación por camisetas (S: 0-1m, M: >1-2m, L: >2-3m, XL: >3-4.5m).
- **Decisión**: Centralizado en `src/utils/dateUtils.ts`. Las duraciones de los proyectos se calculan dinámicamente como la envolvente temporal mínima (fecha de inicio de la primera tarea) y máxima (fecha de fin de la última tarea o del proyecto).
- **Fórmula de Meses**:
  $$\text{Meses} = \frac{\text{Días de diferencia entre inicio y fin}}{30.4375}$$
  Esto provee exactitud calendárica evitando distorsiones por meses de 28, 30 o 31 días.

### ADR-03: Scatter Plot Personalizado con Distribución Libre de Colisiones
- **Contexto**: Las librerías de gráficos genéricas generaban solapamiento ilegible cuando múltiples proyectos compartían el mismo talle o duraciones similares.
- **Decisión**: Implementación de un Scatter Plot SVG interactivo nativo en `MetricsView.tsx` que:
  1. Define las bandas objetivo según reglas S, M, L, XL.
  2. Dibuja la línea de umbral límite (1.0m, 2.0m, 3.0m, 4.5m) con marcadores visuales.
  3. Divide las columnas de talle y aplica un algoritmo de offset horizontal proporcional al índice del proyecto en cada talle, garantizando que **ningún punto quede oculto detrás de otro**.
  4. Pinta el punto en verde si está dentro de la banda y en carmesí/rojo con alerta si excede el plazo estipulado.

### ADR-04: Cálculo de Cumplimiento de Compromiso (% Entregado)
- **Contexto**: Un proyecto puede comprometerse a llegar a *Producción* al final del Quarter, pero haber alcanzado sólo *QA*.
- **Ponderación de Etapas**:
  - `Backlog`: 10%
  - `Relevamiento`: 25%
  - `Desarrollo`: 50%
  - `QA`: 75%
  - `Producción`: 100%
- **Fórmula de Desempeño**:
  $$\text{Porcentaje de Cumplimiento} = \min\left(100, \frac{\text{Puntaje Etapa Entregada}}{\text{Puntaje Etapa Comprometida}} \times 100\right)$$

---

## 3. Modelo de Datos y Tipado

Los modelos se ubican en `src/types/gantt.ts`:

- **`Project`**:
  - `id`: Identificador único.
  - `name`: Nombre descriptivo.
  - `quarter`: Quarter asignado (`'Q1'`, `'Q2'`, `'Q3'`, `'Q4'`, o `null`/`undefined`).
  - `quarterObjective`: Hito u objetivo concreto a lograr al finalizar el Quarter.
  - `size`: Talle de camiseta (`'S' | 'M' | 'L' | 'XL'`).
  - `initiativeType`: Naturaleza de la iniciativa (`'business'` o `'internal'`).
  - `targetStage`: Etapa comprometida para el Quarter (`'Backlog' | 'Relevamiento' | 'Desarrollo' | 'QA' | 'Producción'`).
  - `deliveredStage`: Etapa real alcanzada al corte.
  - `tasks`: Array de tareas de nivel 1.

- **`Task` & `Subtask`**:
  - Jerarquía de 2 niveles (Tareas y Subtareas).
  - Fechas ISO (`startDate`, `endDate`), `status`, `stage`, `progress`, `assignee`, `color`, `epic`.

- **`JiraConfig`**:
  - Configuración del puente con Jira Cloud (URL de instancia, email, token API, prefijos de proyecto, auto-sync y mapeo de estados).

- **`TeamMember`**:
  - Catálogo de responsables disponibles para asignación con avatar, rol y correo.

---

## 4. Guía de Convenciones y Calidad de Código

1. **Inmutabilidad del Estado**: Toda mutación en `projects` o `teamMembers` se realiza mediante clonación estructural o funciones puras (`map`, `filter`, `spread operator`).
2. **Componentes Modulares**:
   - Componentes no deben exceder responsabilidades únicas.
   - Las vistas principales (`GanttView`, `TableView`, `MetricsView`) reciben datos filtrados y handlers de acción.
3. **Manejo de Errores**:
   - `ErrorBoundary.tsx` envuelve la aplicación para aislar fallos de renderizado sin congelar la pestaña del usuario.
   - Fallbacks seguros para parsing de fechas inválidas o proyectos sin tareas.
4. **Accesibilidad y UX**:
   - Contrastes WCAG AA en badges de estado y talles.
   - Tooltips y estados vacíos informativos en todas las vistas y gráficos.

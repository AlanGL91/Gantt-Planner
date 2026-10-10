# Planificador Gantt Pro

Aplicación web integral para la gestión y seguimiento estratégico de iniciativas tecnológicas, planificador temporal interactivo (Diagrama de Gantt), hoja analítica de métricas de entrega vs. compromiso por Quarter (Q), análisis de dispersión por talles de camiseta (S, M, L, XL) e integración con Jira.

---

## 🚀 Resumen del Funcionamiento

**Planificador Gantt Pro** está diseñado para líderes de entrega, PMOs, Engineering Managers y Tech Leads que necesitan:
1. **Planificar y calendarizar proyectos y tareas** en múltiples aperturas temporales: Semanas, Sprints de 2 semanas, Meses y Trimestres (Quarters).
2. **Definir y monitorear objetivos de Quarter (Q)** específicos por iniciativa (ej. Q4 en curso), distinguiendo el objetivo final del proyecto del hito comprometido para el período.
3. **Control de Compromiso vs. Entrega**: Monitoreo cuantitativo del porcentaje de cumplimiento por proyecto según la etapa comprometida (ej. *Producción*) frente a la etapa real alcanzada (ej. *QA* = 75%, *Producción* = 100%).
4. **Análisis de Dispersión y Desvío por Talles de Camiseta**:
   - **S**: 0 a 1 mes
   - **M**: >1 mes y hasta 2 meses
   - **L**: >2 meses y hasta 3 meses
   - **XL**: >3 meses y hasta 4.5 meses
   - Detecta de forma gráfica e interactiva proyectos que excedieron la banda estipulada para su dimensión.
5. **Filtrado Dinámico Multi-criterio**:
   - Quarter activo (con auto-selección del Q en curso y soporte para proyectos sin Q asignado).
   - Tipo de iniciativa: **De Negocio (💼)** vs. **Interna (⚙️)**.
   - Estado de tarea (*Planificado, En Progreso, En Pausa, Bloqueado, Completado*).
   - Etapa operativa (*Backlog, Relevamiento, Desarrollo, QA, Producción*).
   - Responsable asignado y búsqueda por texto libre.
6. **Centro de Configuración y Gestión**:
   - Administración de miembros del equipo y responsables asignables.
   - Parámetros de conexión a Jira Cloud (Host URL, Usuario/Email, API Token, Projects Keys, Mapeo de Estados y Sincronización).
   - Reglas de estimación por talle de camiseta.
7. **Portabilidad y Respaldo de Datos**:
   - Visualizador y editor JSON bidireccional en tiempo real con validación sintáctica.
   - Exportación de métricas a formato CSV.
   - Persistencia local automática en el navegador con soporte para restaurar datos demo iniciales.

---

## 🛠️ Arquitectura Técnica

### Stack Tecnológico
- **Frontend Core**: React 19 + TypeScript (Strict Type Safety).
- **Build Tool & Bundler**: Vite con Hot Module Replacement optimizado.
- **Estilos**: Tailwind CSS 4 con utilidades modernas y esquema de color accesible.
- **Iconografía**: `lucide-react`.
- **Persistencia**: LocalStorage de alta resiliencia (`gantt_planner_projects_v5`, `gantt_jira_config`, `gantt_team_members`).

### Estructura de Directorios

```
/
├── index.html                   # Entry point HTML y viewport responsive
├── metadata.json                # Metadatos del applet y permisos
├── package.json                 # Dependencias y scripts de construcción
├── tsconfig.json                # Configuración de TypeScript
├── vite.config.ts               # Configuración de compilación Vite
├── STEERING.md                  # Reglas de arquitectura, directrices y gobernanza
├── CONSTITUTION.md              # Principios no negociables del producto
├── SPECS.md                     # Especificaciones funcionales y técnicas detalladas
├── PLAN.md                      # Hoja de ruta, etapas implementadas y backlog
└── src/
    ├── main.tsx                 # Montaje de la aplicación React
    ├── App.tsx                  # Estado global, orquestación de vistas y filtros
    ├── index.css                # Directivas de Tailwind CSS
    ├── types/
    │   └── gantt.ts             # Modelos de datos TypeScript (Projects, Tasks, Jira, Metrics)
    ├── utils/
    │   └── dateUtils.ts         # Cálculo de fechas, trimestres, meses, duración y talles
    ├── data/
    │   └── initialData.ts       # Dataset representativo con 16 proyectos S/M/L/XL y tareas
    └── components/
        ├── TopBar.tsx           # Navegación principal, selector de vistas, status Jira
        ├── GanttControls.tsx    # Controles de filtrado, zoom temporal y acciones rápidas
        ├── GanttView.tsx        # Diagrama de Gantt interactivo con drag/resize visual
        ├── TableView.tsx        # Grilla detallada tipo spreadsheet con jerarquías y avance
        ├── MetricsView.tsx      # Dashboard analítico: KPIs, Dispersión y Comparativa Q
        ├── SettingsModal.tsx    # Configuración de equipo, Jira API y bandas de talle
        ├── ProjectModal.tsx     # Alta y edición de proyectos (Q, Objetivos, Talle, Tipo)
        ├── TaskModal.tsx        # Alta y edición de tareas y subtareas
        ├── JsonEditorModal.tsx  # Editor y validador JSON bidireccional
        └── ErrorBoundary.tsx    # Captura y resiliencia ante errores de renderizado
```

---

## ⚙️ Instalación y Ejecución Local

1. **Clonar o descargar el proyecto**:
   ```bash
   git clone <repo-url>
   cd gantt-planner-pro
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Ejecutar servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   La aplicación se iniciará en `http://localhost:3000`.

4. **Compilar para producción**:
   ```bash
   npm run build
   ```

---

## 📖 Documentación Complementaria

- [**STEERING.md**](./STEERING.md): Arquitectura detallada, convenciones de código y guía operativa.
- [**CONSTITUTION.md**](./CONSTITUTION.md): Principios fundamentales y reglas de calidad.
- [**SPECS.md**](./SPECS.md): Especificación funcional, fórmulas analíticas y esquemas de datos.
- [**PLAN.md**](./PLAN.md): Roadmap técnico, estado del proyecto y próximos pasos.

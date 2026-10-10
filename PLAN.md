# Plan de Desarrollo y Hoja de Ruta (PLAN.md)

Este documento registra el historial de iteraciones, los entregables completados y el plan futuro de evolución de **Planificador Gantt Pro**.

---

## 🏁 Estado de Cumplimiento de Requerimientos

| Requerimiento | Estado | Implementación |
|---|---|---|
| **Asignación de Proyectos a Quarter o Sin Quarter** | ✅ Completado | Campo `quarter` opcional en `Project`. Soporte para `Q1`, `Q2`, `Q3`, `Q4` y `Sin Quarter`. |
| **Filtro con Quarter en curso por defecto** | ✅ Completado | Auto-detección mediante fecha actual con fallback controlado; conmutable dinámicamente en `GanttControls`. |
| **Objetivo específico para el Quarter** | ✅ Completado | Campo `quarterObjective` diferenciado del objetivo final del proyecto. |
| **Hoja de Métricas (Comprometido vs. Entregado)** | ✅ Completado | `MetricsView.tsx` con matriz analítica, porcentajes ponderados por etapa y exportación a CSV. |
| **Talles de Camiseta (S, M, L, XL)** | ✅ Completado | Tipado en `gantt.ts`, inputs en `ProjectModal`, visualización en `TableView` y cálculo en `dateUtils.ts`. |
| **Tipo de Iniciativa (Negocio vs. Interna)** | ✅ Completado | Campo `initiativeType` ('business' \| 'internal') con filtros en barra superior y badges visuales. |
| **Dataset Enriquecido de Ejemplo** | ✅ Completado | 16 proyectos reales distribuidos en S, M, L, XL, Negocio e Interna, en plazo y con desvíos. |
| **Gráfico de Dispersión (Scatter Plot)** | ✅ Completado | Gráfico interactivo con ejes de talles y meses (0-1m, >1-2m, >2-3m, >3-4.5m), zonas de seguridad/exceso y navegación. |
| **Filtro por Tipo de Iniciativa en Controles** | ✅ Completado | Selector directo en `GanttControls.tsx` sincronizado con Gantt, Tabla y Métricas. |
| **Módulo de Configuración Integral** | ✅ Completado | `SettingsModal.tsx` accesible desde la barra superior (`TopBar.tsx`). |
| **Configuración de Responsables** | ✅ Completado | CRUD de miembros de equipo en configuración y disponibilidad en asignaciones. |
| **Configuración de Conexión a Jira** | ✅ Completado | Credenciales, API Token, Host, Project Keys, Mapeo de Estados y simulación de conectividad. |
| **Documentación Formal de Arquitectura** | ✅ Completado | Creación de `README.md`, `STEERING.md`, `CONSTITUTION.md`, `SPECS.md` y `PLAN.md`. |

---

## 🗺️ Roadmap de Evolución Futura

### Fase 1: Sincronización Jira Bidireccional Activa (Próximo Sprint)
- [ ] Implementar cliente proxy REST para interactuar con la API v3 de Jira Software.
- [ ] Importar issues reales tipo *Epic* y *Story* mapeados automáticamente a Proyectos y Tareas.
- [ ] Exportar fechas modificadas en el Gantt hacia las fechas de inicio y vencimiento de Jira (*Due Date*).

### Fase 2: Alertas Tempranas y Proyecciones Predictivas
- [ ] Detección algorítmica de camino crítico (Critical Path Method - CPM).
- [ ] Indicador de cuello de botella por sobrecarga de responsables (capacidad vs. demanda).
- [ ] Alerta predictiva cuando la velocidad de avance de un proyecto indique riesgo de sobrepasar la banda de su talle de camiseta.

### Fase 3: Colaboración y Reportes Ejecutivos
- [ ] Generación de informe PDF ejecutivo con resumen de Quarters para comités de dirección.
- [ ] Snapshots históricos para comparar la planificación al inicio del Quarter contra el cierre real.

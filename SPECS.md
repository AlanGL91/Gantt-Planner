# Especificaciones del Sistema (SPECS.md)

Este documento describe con precisión técnica y funcional todos los requerimientos, fórmulas, comportamientos y contratos de datos implementados en **Planificador Gantt Pro**.

---

## 1. Módulos y Especificaciones Funcionales

### 1.1 Filtros y Contexto de Visualización (`GanttControls.tsx`)
- **Filtro de Quarter (Q)**:
  - Opciones: `Todos los Quarters`, `Q1`, `Q2`, `Q3`, `Q4`, y `Sin Quarter`.
  - **Comportamiento por Defecto**: Detecta automáticamente el Quarter en curso según la fecha del sistema (`getQuarterFromDate(new Date())`) y lo selecciona por defecto.
- **Filtro de Tipo de Iniciativa**:
  - Opciones:
    - *Todas las iniciativas* (`''`)
    - *💼 Negocio* (`'business'`)
    - *⚙️ Internas* (`'internal'`)
- **Filtro de Responsable**:
  - Unifica de manera reactiva todos los asignados detectados en las tareas junto con el catálogo de miembros de equipo configurados en el módulo de Ajustes.
- **Filtros Adicionales**:
  - Estado: *Planificado*, *En Progreso*, *En Pausa*, *Bloqueado*, *Completado*.
  - Etapa: *Backlog*, *Relevamiento*, *Desarrollo*, *QA*, *Producción*.
  - Búsqueda textual: Coincidencia insensible a mayúsculas sobre nombres de proyecto, tareas, epics y responsables.

---

### 1.2 Vista de Diagrama de Gantt (`GanttView.tsx`)
- **Aperturas Temporales (Zoom)**:
  - `Semanas`: Columnas por semana calendárica.
  - `Sprints`: Bloques de 2 semanas ágiles (S1, S2, etc.).
  - `Meses`: Encabezados mensuales con días proporcionales.
  - `Quarters`: Bloques de 3 meses (Q1 a Q4).
- **Línea de Tiempo y Cursor "Hoy"**: Marcador vertical rojo con badge destacando la fecha actual.
- **Interacciones**:
  - Colapso y expansión jerárquica por proyecto y tarea.
  - Arrastre horizontal para desplazar fechas (*Drag & Drop*).
  - Redimensionamiento lateral para extender o contraer plazos (*Resize Handles*).
  - Clic en barra para edición modal rápida.

---

### 1.3 Vista de Tabla Jerárquica (`TableView.tsx`)
- Grilla completa con columnas:
  - Proyecto / Tarea / Subtarea (con sangría visual y árbol desplegable).
  - Talle de Camiseta (`S`, `M`, `L`, `XL`).
  - Tipo de Iniciativa (`Negocio` vs. `Interna`).
  - Objetivo del Quarter.
  - Etapa Comprometida vs. Etapa Entregada.
  - % Cumplimiento del Objetivo.
  - Estado, Fechas de Inicio/Fin, Duración calculada en meses y Responsable.

---

### 1.4 Hoja de Métricas y Estadísticas (`MetricsView.tsx`)

#### A. Tarjetas Resumen de KPIs
1. **Total de Proyectos**: Filtrados por el contexto actual.
2. **Promedio de Compromiso Entregado**: Promedio ponderado del % de cumplimiento del Quarter.
3. **Proyectos en Plazo de Camiseta**: Cantidad y porcentaje de iniciativas dentro de la banda de duración máxima permitida.
4. **Proyectos Excedidos**: Cantidad de iniciativas que sobrepasaron el tiempo estipulado para su talle.

#### B. Gráfico de Dispersión (Scatter Plot)
- **Eje Y (Duración en Meses)**:
  - Escala continua de 0 a 5.0+ meses con cuadrícula graduada en meses y medios meses.
  - Líneas guía de umbral:
    - **1.0 mes** (Límite Talle S)
    - **2.0 meses** (Límite Talle M)
    - **3.0 meses** (Límite Talle L)
    - **4.5 meses** (Límite Talle XL)
- **Eje X (Talles de Camiseta)**:
  - Columnas dedicadas para: `S`, `M`, `L`, `XL`.
  - Fondo sombreado verde para el área objetivo permitida.
  - Fondo sombreado rojo/ámbar para el área excedida.
- **Distribución de Puntos**:
  - Algoritmo que calcula el offset horizontal en base al índice del proyecto dentro de su talle para evitar solapamientos (`staggered distribution`).
  - Color del punto: Verde si está en tiempo, Rojo si está excedido.
  - Clic interactivo: Despliega una tarjeta detallada al pie del gráfico con el diagnóstico específico del proyecto seleccionado.
- **Controles de Navegación del Gráfico**:
  - Botones `<` y `>` para alternar vistas:
    - *Dispersión (Scatter Plot)*
    - *Tabla Comparativa de Entrega*
    - *Tarjetas Resumen por Talle*

#### C. Detalle de Proyectos Comprometidos vs. Entregados
- Matriz tabular que exhibe:
  - Nombre e Iniciativa.
  - Objetivo pactado para el Quarter.
  - Etapa Comprometida (`targetStage`) vs. Etapa Entregada (`deliveredStage`).
  - Barra de progreso del cumplimiento (%) con código cromático.
  - Desvío de duración en meses respecto al talle.

---

### 1.5 Módulo de Configuración (`SettingsModal.tsx`)
- **Pestaña 1: Responsables del Equipo**:
  - Lista de miembros configurados (Avatar, Nombre, Rol, Correo).
  - Formulario de alta y eliminación de miembros.
  - Disponibilidad inmediata en selectores de asignación de tareas.
- **Pestaña 2: Conexión con Jira**:
  - Campos:
    - `Jira Host URL` (ej. `https://mi-empresa.atlassian.net`)
    - `Usuario / Email`
    - `API Token de Atlassian` (campo seguro tipo contraseña con alternancia de visibilidad)
    - `Project Keys` (ej. `CORE, APP, PAY`)
    - Interruptor de auto-sincronización periódica.
  - Botón de prueba de conexión simulada con feedback visual.
  - Mapeo de estados de Jira a etapas de Gantt (`To Do -> Backlog`, `In Progress -> Desarrollo`, `Testing -> QA`, `Done -> Producción`).
- **Pestaña 3: Reglas de Camiseta**:
  - Visualización explicativa de las bandas S (0-1m), M (>1-2m), L (>2-3m), XL (>3-4.5m).

---

## 2. Definiciones Matemáticas y Reglas de Negocio

### Bandas de Talle de Camiseta
| Talle | Mínimo (Meses) | Máximo (Meses) | Criterio de Estado |
|---|---|---|---|
| **S** | 0.0 | 1.0 | $\le 1.0 \to \text{En Plazo}$, $> 1.0 \to \text{Excedido}$ |
| **M** | > 1.0 | 2.0 | $\le 2.0 \to \text{En Plazo}$, $> 2.0 \to \text{Excedido}$ |
| **L** | > 2.0 | 3.0 | $\le 3.0 \to \text{En Plazo}$, $> 3.0 \to \text{Excedido}$ |
| **XL** | > 3.0 | 4.5 | $\le 4.5 \to \text{En Plazo}$, $> 4.5 \to \text{Excedido}$ |

### Cálculo de Duración en Meses
$$\text{Duración (Meses)} = \max\left(0.1, \frac{\text{Días de calendario entre Inicio y Fin}}{30.4375}\right)$$

### Ponderación de Cumplimiento de Objetivo
$$\text{Puntaje Etapa} = \begin{cases}
10 & \text{si Backlog} \\
25 & \text{si Relevamiento} \\
50 & \text{si Desarrollo} \\
75 & \text{si QA} \\
100 & \text{si Producción}
\end{cases}$$

$$\text{Cumplimiento} = \min\left(100\%, \frac{\text{Puntaje Etapa Entregada}}{\text{Puntaje Etapa Comprometida}} \times 100\right)$$

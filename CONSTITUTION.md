# Constitución del Proyecto (CONSTITUTION.md)

Este documento establece los principios de ingeniería no negociables, las normas éticas del código y las directrices fundamentales de diseño que rigen **Planificador Gantt Pro**.

---

## 1. Principios Fundamentales (The Core Tenets)

### I. Cero Pérdida de Datos (Zero Data Loss)
Toda modificación realizada por el usuario (creación de tarea, reajuste de fechas, cambio de talle, edición de responsable o configuración de Jira) debe quedar persistida de inmediato. Ante recargas de página o cierres inesperados de pestaña, el usuario jamás debe perder su trabajo.

### II. Claridad Cuantitativa sobre la Ambigüedad
Las métricas del proyecto deben reflejar hechos matemáticos objetivos:
- Si una iniciativa comprometió *Producción* y quedó en *QA*, el cumplimiento es exactamente del **75%**.
- Si una iniciativa de talle **M** tomó 2.4 meses, se clasifica rigurosamente como **Excedida** (banda máxima permitida: 2.0 meses).
- Los gráficos no deben esconder dispersiones ni maquillar desvíos de plazos.

### III. Rendimiento y Cero Fricción (Instantaneous UX)
- Ninguna acción del usuario en el Gantt o en la Tabla debe tardar más de 16ms (60 FPS).
- El filtrado por Quarter, Tipo de Iniciativa o Responsable debe ejecutarse de manera sincrónica y fluida sobre el estado local memoizado (`useMemo`).

### IV. Transparencia y Portabilidad
Los datos del usuario pertenecen al usuario. La plataforma debe proveer siempre:
- Acceso al modelo de datos completo en JSON editable.
- Exportación analítica en CSV.
- Restauración limpia a datos iniciales de referencia ante pruebas destructivas.

---

## 2. Reglas de Interfaz y Diseño Visual

1. **Jerarquía Tipográfica Coherente**:
   - Títulos claros, con contraste alto (`text-slate-900` / `text-slate-800`).
   - Textos de apoyo concisos (`text-slate-500` / `text-slate-600`).
2. **Convención Semántica de Talles de Camiseta**:
   - `S`: Esmeralda / Verde menta (`emerald-600` / `emerald-100`).
   - `M`: Azul cielo / Zafiro (`blue-600` / `blue-100`).
   - `L`: Violeta / Púrpura (`purple-600` / `purple-100`).
   - `XL`: Ámbar / Naranja (`amber-600` / `amber-100`).
3. **Distinción Visual de Iniciativas**:
   - **De Negocio (💼)**: Tinte azul índigo corporativo.
   - **Interna (⚙️)**: Tinte pizarra / técnico.
4. **Semántica de Desvíos**:
   - Todo proyecto que se encuentre en tiempo y forma utilizará indicadores positivos (verde/azul).
   - Todo proyecto excedido en duración o con porcentaje de compromiso menor al 80% debe presentar indicador de advertencia (`amber-500` / `rose-600`) para alertar al líder de entrega.

---

## 3. Estándares de Código y Resiliencia

1. **TypeScript Riguroso**:
   - Prohibido el uso indiscriminado de `any`.
   - Todos los tipos y enums deben coincidir exactamente con los contratos de `src/types/gantt.ts`.
2. **Defensividad en Cálculos de Fechas**:
   - Siempre verificar la existencia de fechas válidas antes de calcular duraciones.
   - En caso de fechas ausentes o corruptas, recurrir a los valores seguros por defecto provistos en `dateUtils.ts`.
3. **Aislamiento de Errores**:
   - Componentes analíticos o modales deben estar contenidos dentro de boundaries seguros.

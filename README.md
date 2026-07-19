# Control de Gastos — v3.6

## 📊 Control de Gastos Personales – Aplicación Web

### ¿Qué es?

Es una **aplicación web de finanzas personales** que funciona 100% en el navegador, sin necesidad de backend. Permite gestionar ingresos, gastos, presupuestos y metas de ahorro de forma intuitiva y visual, guardando todos los datos en localStorage.

### ¿Para qué sirve?

Ayuda a cualquier persona a **mantener el control de su dinero** de forma sencilla y clara:
- Llevar un registro diario de gastos e ingresos.
- Detectar en qué categorías se gasta más.
- Establecer límites de gasto con alertas visuales.
- Crear metas de ahorro y darles seguimiento.
- Analizar tendencias con gráficos y reportes exportables.

### Funcionalidades principales

#### 📋 Dashboard
- Cuatro tarjetas: **saldo actual**, **dinero disponible del mes**, **ingresos del mes** y **gastos del mes**.
- **Gráfico de dona** con distribución de gastos por categoría.
- **Alertas visuales** al 80 % (amarillo) y 100 % (rojo) del presupuesto.

#### 💵 Registro de ingresos
- Formulario con fecha, monto, descripción y fuente (salario, negocio, regalo, otros).
- Validación de campos obligatorios.

#### 💸 Registro de gastos
- Formulario con monto, categoría, fecha, método de pago (efectivo, tarjeta, QR, transferencia), descripción y foto del recibo (opcional).
- Carga de imagen con vista previa y almacenamiento en base64 comprimido.

#### 🏷️ Categorías personalizables
- 9 categorías predefinidas con emoji (Alimentación, Transporte, Vivienda, Salud, Educación, Entretenimiento, Tecnología, Ropa, Otros).
- Posibilidad de añadir o eliminar categorías (excepto las básicas).

#### 🎯 Presupuestos mensuales
- Límite de gasto mensual por categoría.
- Barra de progreso con colores (verde, amarillo, rojo) y alertas configurables.

#### 🏆 Metas de ahorro
- Metas con nombre, monto objetivo, ahorro actual y fecha límite opcional.
- Añadir fondos desde el saldo disponible (con validación de saldo suficiente).
- Sugerencia automática de ahorro mensual.

#### 📜 Historial de transacciones
- Lista ordenada por fecha (más reciente primero).
- **Filtros avanzados**: rango de fechas, tipo, categoría, método de pago, monto y búsqueda por texto.
- **Paginación**, edición y eliminación de transacciones.
- Miniaturas de recibos guardados.

#### 📈 Reportes y gráficos
- Cinco gráficos interactivos (Chart.js):
  - Gastos por día (barras).
  - Gastos por semana (línea).
  - Gastos por mes (barras).
  - Ingresos vs gastos mensuales (línea doble).
  - Top 5 categorías (barras horizontales).
- Selector de mes/año y exportación a CSV.

#### 📤 Exportación de datos
- Exportación de transacciones a **CSV** con todos los campos.

#### 📱 Diseño responsive y offline
- Menú lateral en escritorio, barra inferior en móviles.
- Animaciones suaves y paleta de colores profesional.
- **Funciona offline** (datos en localStorage + service worker).

### Tecnología utilizada
- **HTML5, CSS3 y JavaScript vanilla** (ES Modules) con **Vite 8**.
- **Chart.js ^4.4** para gráficos (dependencia npm).
- **localStorage** para persistencia de datos.
- **Service Worker** (cache `control-gastos-v3.6`) para funcionamiento offline.
- Arquitectura modular con componentes, routing en memoria y pub/sub para estado.

## Stack técnico

| Capa          | Tecnología                        |
|---------------|-----------------------------------|
| Bundler       | Vite 8                            |
| UI            | Vanilla JS (sin frameworks)       |
| Charts        | Chart.js 4 (npm)                  |
| Persistencia  | localStorage (clave `fp_*`)       |
| Routing       | En memoria (sin URL/hash)         |
| Estado        | Pub/sub propio                    |
| Offline       | Service Worker (`control-gastos-v3.2`) |

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

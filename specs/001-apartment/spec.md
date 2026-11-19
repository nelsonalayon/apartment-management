# Spec 001 — Página independiente por apartamento

## Contexto y objetivo

Hoy todo vive en un solo dashboard: el avance global, las tarjetas de los dos apartamentos (101 y 202), el resumen por usuario y la lista de cuotas con filtros. Para consultar cómo va un apartamento hay que mirar la vista completa y filtrar a mano los datos entre los del otro apartamento.

**Objetivo:** crear una página propia para cada apartamento que muestre solo sus datos — avance, cuotas, pagos adicionales y quiénes han pagado en él —, a la que se llega desde la tarjeta del dashboard o escribiendo la dirección directamente. Como parte de este cambio, **las cuotas y sus filtros dejan de mostrarse en el dashboard** (quedan únicamente en la página de cada apartamento); el dashboard conserva la vista global: resumen, tarjetas y usuarios.

## Usuarios

Los mismos 4 usuarios con PIN del proyecto. Todos tienen el mismo acceso: cualquiera puede abrir la página de los dos apartamentos. No hay roles ni permisos distintos (decisión confirmada).

## Historias de usuario

- **HU-1:** Como usuario, quiero abrir la página de un apartamento desde su tarjeta en el dashboard, para ver solo su información sin la del otro apartamento.
- **HU-2:** Como usuario, quiero llegar a la página de un apartamento haciendo click en su tarjeta del dashboard o escribiendo su dirección con sesión iniciada; si escribo la dirección sin sesión, me lleven al login sin mostrar ningún dato.
- **HU-3:** Como usuario, quiero ver el avance, las cuotas, los pagos adicionales y quiénes han pagado en el apartamento, para saber en qué estado está de un vistazo.
- **HU-4:** Como usuario, quiero filtrar las cuotas por estado, para revisar rápido las pendientes.
- **HU-5:** Como usuario, quiero que si la dirección no corresponde a un apartamento me lo digan claramente y pueda volver, para no quedarme en una pantalla perdida.
- **HU-6:** Como usuario, quiero que un apartamento sin cuotas o sin pagos se vea como "vacío" y no como error, para entender que aún no hay datos registrados.
- **HU-7:** Como usuario, quiero un mensaje claro con opción de reintentar si la base de datos falla, para no creer erróneamente que el apartamento está en cero.
- **HU-8:** Como usuario, quiero que al vencer mi sesión me lleven al inicio de sesión, para que los datos no queden expuestos.
- **HU-9:** Como usuario, quiero un enlace "Volver" para regresar al dashboard desde la página del apartamento o desde la de no encontrado, para no perderme.

## Requisitos funcionales

**RF-1 — Acceso protegido**
- CA-1.1 (evento): Cuando un usuario sin sesión válida intente abrir la página de un apartamento, entonces el sistema deberá redirigirlo al inicio de sesión sin mostrar ningún dato del apartamento y sin consultar la BD de apartamentos (funciona incluso si la BD no responde).
- CA-1.2 (no deseado): Si la sesión está expirada o la cookie fue manipulada, entonces el sistema deberá tratarla como ausente (mismo resultado que CA-1.1).
- CA-1.3 (evento): Después de iniciar sesión, el sistema deberá llevar al usuario al apartamento que pidió si su dirección era válida, o al dashboard si no lo era.

**RF-2 — Llegada desde el dashboard y cambios en él**
- CA-2.1 (evento): Cuando el usuario haga click en cualquier punto de la tarjeta de un apartamento, entonces el sistema deberá abrir la página de ese apartamento (la tarjeta entera es clicable; ver RNF-8 para teclado).
- CA-2.2 (ubicuo): El dashboard deberá conservar el resumen global, las tarjetas (ahora seleccionables) y el resumen de usuarios; la sección de cuotas —con sus filtros— se retira del dashboard y queda solo en la página de cada apartamento.

**RF-3 — Llegada por URL directa**
- CA-3.1 (evento): Cuando el usuario acceda directamente a la dirección de un apartamento existente **con sesión válida**, entonces el sistema deberá mostrar su página con los datos de ese apartamento, sin necesidad de pasar por el dashboard. Sin sesión válida se aplica RF-1 (redirigir al login, sin mostrar datos).

**RF-4 — Contenido: solo este apartamento**
- CA-4.1 (estado): Mientras se muestre la página de un apartamento, el sistema deberá presentar únicamente la **información financiera** de ese apartamento; la navegación y los datos de sesión (nombre de usuario, Salir, Volver, tema) sí están permitidos porque no son datos financieros.
- CA-4.2 (no deseado): Si un usuario tiene actividad en ambos apartamentos, entonces en la página de uno solo se mostrará lo pagado en ese apartamento; nunca montos del otro apartamento ni del avance global.

**RF-5 — Resumen del apartamento**
- CA-5.1 (ubicuo): El resumen del apartamento deberá mostrar tres datos: **avance** (porcentaje con barra, con las reglas: pagado = cuotas pagadas + pagos adicionales; pendiente = cuota inicial − pagado con mínimo 0; tope de 100%), **pagado en dinero** y **pendiente en dinero**. Sin contador de cuotas.
- CA-5.2 (no deseado): Si la cuota inicial del apartamento es 0, entonces el sistema deberá mostrar avance 0 sin errores de cálculo.

**RF-6 — Cuotas del apartamento**
- CA-6.1 (ubicuo): El sistema deberá listar las cuotas con su **número fijo de la BD** (la cuota #12 siempre es #12, también con filtro activo), en **orden ascendente** (#1 → #12), con estado visible (pagada o pendiente; las vencidas se presentan como pendientes), su valor y quién la pagó.
- CA-6.2 (ubicuo): La página del apartamento deberá ofrecer un único filtro, de Estado, con las opciones "Todas" (vista inicial), "Pagadas" y "Pendientes"; al llegar se mostrarán todas las cuotas. Las vencidas cuentan como "Pendientes" (ver caso límite 9).
- CA-6.3 (no deseado): Si el apartamento no tiene cuotas en la BD, entonces el sistema deberá mostrar el mensaje "Sin cuotas registradas" (estado de defensa, ver Decisiones 7; ver RF-10).
- CA-6.4 (no deseado): Si el filtro deja 0 cuotas visibles habiendo cuotas en la BD, entonces el sistema deberá mostrar "No hay cuotas con este filtro" **debajo de la tabla**, sin confundirlo con CA-6.3; los pagos adicionales siguen visibles arriba.

**RF-7 — Usuarios del apartamento**
- CA-7.1 (ubicuo): El sistema deberá mostrar solo los usuarios con pagos en ese apartamento y su total = **sus cuotas pagadas + sus pagos adicionales** (un usuario que solo tenga extras también aparece).
- CA-7.2 (no deseado): Si un usuario no tiene pagos en el apartamento, entonces no deberá aparecer en su lista.
- CA-7.3 (no deseado): Si ningún usuario tiene pagos en el apartamento, entonces el sistema deberá mostrar "Sin pagos registrados en este apartamento" (estado de defensa).

**RF-8 — Pagos adicionales del apartamento**
- CA-8.1 (ubicuo): El sistema deberá mostrar los pagos adicionales **al principio de la tabla** (antes que las cuotas), en **orden de fecha de pago ascendente** y **sin número**: en la columna "Cuota" se verá su concepto (ej: "Separación"); "Estado" y "Fecha programada" mostrarán "—"; sí se verán Valor, Usuario y Fecha de pago.
- CA-8.2 (no deseado): Si el apartamento no tiene pagos adicionales, entonces el sistema deberá mostrar el mensaje "Sin pagos adicionales registrados"; esta situación no deberá tratarse como error (estado de defensa).
- CA-8.3 (ubicuo): Sin importar el filtro de Estado activo, el sistema deberá mantener visibles los pagos adicionales; el filtro solo afecta a las cuotas.

**RF-9 — Apartamento no encontrado**
- CA-9.1 (no deseado): Si la dirección **no es exactamente uno de los códigos de apartamento existentes** (hoy: 101 y 202 — cualquier otro valor: inexistente, con letras, vacío o con espacios) **y la BD respondió**, entonces el sistema deberá mostrar una página "Apartamento no encontrado" con un enlace para volver al dashboard.
- CA-9.2 (no deseado): En este caso, el sistema no deberá mostrar datos parciales ni mensajes técnicos internos.

**RF-10 — Apartamento sin datos**
- CA-10.1 (no deseado): Si el apartamento existe pero **no tiene ningún pago** (ni cuotas ni pagos adicionales), entonces la página deberá cargarse con éxito mostrando avance 0 y los mensajes de vacío de cada lista; no es error. Si tiene pagos adicionales pero no cuotas, se mostrarán los extras con avance > 0 y "Sin cuotas registradas" debajo de la tabla. Estos estados son de defensa (hoy imposibles; ver Decisiones 7).

**RF-11 — Error al cargar los datos**
- CA-11.1 (no deseado): Si la base de datos no responde al abrir la página, entonces el sistema deberá mostrar el mensaje "No se pudieron cargar los datos" con una opción para reintentar; el reintento es **manual y libre** (sin límite ni reintentos automáticos) y si vuelve a fallar se muestra el mismo mensaje.
- CA-11.2 (no deseado): En ningún caso de error el sistema deberá presentar datos vacíos o inventados como si fueran reales.
- CA-11.3 (no deseado): Si la BD falla al verificar la dirección, entonces el sistema deberá aplicar RF-11 y **nunca** mostrar "Apartamento no encontrado".
- CA-11.4 (no deseado): Si alguna consulta falla, entonces el sistema deberá mostrar RF-11 completo (**todo o nada**); nunca mezclar datos ya cargados con secciones en error.

**RF-12 — Vuelta al dashboard**
- CA-12.1 (ubicuo): La página del apartamento y la página de no encontrado deberán mostrar un enlace visible **"← Volver"** que regresa al dashboard.

## Requisitos no funcionales

- **RNF-1 — Cálculos idénticos:** los valores de la página deben coincidir con los del dashboard ante los mismos datos; la lógica debe poder probarse con tests unitarios sin tocar la interfaz (constitución 3 y 4).
- **RNF-2 — Datos vigentes:** al abrir la página se deben ver los datos actuales: un pago registrado en el dashboard debe reflejarse al volver a abrir la página del apartamento.
- **RNF-3 — Responsive medible:** la página debe usarse en móvil y escritorio **sin scroll horizontal ni textos encimados en pantalla angosta**, verificado en la comprobación final.
- **RNF-4 — Consistencia por componentes existentes:** la página deberá usar los **mismos componentes y estilos ya existentes en el proyecto** (tarjetas, badges, tabla, formato de dinero y fechas), verificable por comparación visual lado a lado; además, respeto del tema claro/oscuro y de la preferencia de movimiento reducido.
- **RNF-5 — Idioma:** todos los textos visibles en español; nombres técnicos y de archivo en inglés (constitución 6).
- **RNF-6 — Dependencias alineadas con el principio 1:** si es posible, no se agrega nada nuevo; si una tarea lo necesita, el agente propone la dependencia (para qué sirve y por qué) antes de instalarla (constitución 1 y 4).
- **RNF-7 — Seguridad:** sin sesión no se ve ningún dato; no exponer en la interfaz errores técnicos ni información interna (constitución 5).
- **RNF-8 — Accesibilidad:** la tarjeta clicable se opera con Tab + Enter como cualquier enlace y el filtro de estado indica cuál opción está activa; verificación manual en el recorrido final.
- **RNF-9 — Separación lógica/interfaz (interpretación del principio 3):** los cálculos financieros (avance, totales) viven puros en la lógica de cálculo con sus tests; el estado de la interfaz (filtro, reintento) puede vivir en el componente, como ya hace el dashboard actual.

## Casos límite

1. **Dirección distinta de 101/202** (inexistente, letras, vacío, espacios) → RF-9, solo si la BD respondió.
2. **Sin sesión o sesión vencida/manipulada al abrir** (con o sin BD caída) → RF-1 (login sin consultar datos); tras login → al apartamento si la dirección era válida, si no al dashboard.
3. **BD caída al abrir** (total, parcial o al verificar la dirección) → RF-11, nunca "no encontrado".
4. **Sesión expira mientras el usuario mira la página** → los datos quedan visibles hasta navegar o recargar; entonces → login.
5. **Usuario que paga en ambos apartamentos** → solo sus montos en la página de cada uno (CA-4.2).
6. **Avance al 100%** → se muestra 100% y pendiente 0 (topes de la regla existente).
7. **Pagos que superan la cuota inicial** → avance tope 100%, pendiente mínimo 0.
8. **Cuota inicial en 0** → avance 0 sin división por cero (CA-5.2).
9. **Cuota con estado "vencida"** → se presenta como pendiente en el badge **y** en el filtro (incluida en "Pendientes").
10. **Apartamento sin pagos adicionales** → mensaje de vacío, no error (CA-8.2, defensa).
11. **Filtro que deja 0 cuotas** → "No hay cuotas con este filtro" debajo de la tabla; los extras siguen visibles (CA-6.4).
12. **Sin cuotas pero con pagos adicionales** → avance > 0, extras arriba, "Sin cuotas registradas" debajo (CA-10.1, defensa).
13. **Apartamento sin ningún pago** → avance 0 + mensajes de vacío, no error (CA-10.1, defensa).
14. **Reintento que vuelve a fallar** → mismo mensaje, reintento libre (CA-11.1).

## Fuera de alcance (esta versión)

- Crear, editar o eliminar cuotas, pagos, usuarios o apartamentos (la página es de solo lectura; tampoco se contemplan nuevos pagos adicionales por ahora).
- Registrar pagos desde esta página (formularios de pago).
- Comparación entre apartamentos o avance global dentro de la página.
- Exportaciones, notificaciones, gráficas nuevas o reportes.
- Registro o autenticación nueva (se reutiliza la existente).
- Otros cambios en el dashboard más allá de lo acordado (volver clicable la tarjeta y retirar la sección de cuotas con sus filtros).
- Permisos distintos por usuario o por apartamento (decisión confirmada: mismo acceso para todos).
- Agregar nuevos apartamentos (solo existirán 101 y 202).

## Criterios de finalización

- Spec aprobada por el usuario, con las decisiones de la revisión QA del 19 nov 2026 reflejadas en el documento (constitución 2).
- **Lectura previa obligatoria** de `AGENTS.md`, `docs/constitution.md` y esta spec antes de tocar código (principio 2 + sección Reglas de AGENTS).
- Cada RF con sus CA verificados sobre la página real (recorrido manual o E2E) y **todos los casos límite de la lista (14)** verificados.
- El dashboard conserva sus bloques sin la sección de cuotas (ni sus filtros) y sus tarjetas llevan a la página del apartamento.
- `pnpm test` en verde, build sin errores de TypeScript y lint sin errores.
- Comprobación en móvil y escritorio según RNF-3 (sin scroll horizontal ni textos encimados) y RNF-8 (tarjeta con teclado, filtro con estado activo).
- `MEMORY.md` actualizado al cerrar la tarea.

## Decisiones de diseño (revisión QA — 19 nov 2026)

No quedan dudas abiertas; el formato `[NECESITA ACLARACIÓN]` se reservará para lo que surja. Resumen de lo decidido en esta revisión:

1. **Dirección:** código corto exacto (101, 202); cualquier otro valor → "no encontrado".
2. **Numeración:** número fijo de la BD, orden ascendente (no se renumera con filtros).
3. **Extras:** al **principio** de la tabla, fecha ascendente, concepto en la columna "Cuota", celdas "—" donde no aplica; siempre visibles (el filtro solo toca cuotas).
4. **Filtro:** único de Estado — Todas (inicial) / Pagadas / Pendientes; vencida = pendiente; 0 visibles → "No hay cuotas con este filtro" debajo.
5. **Resumen:** avance % + pagado + pendiente (sin contador de cuotas).
6. **Usuario:** total = sus cuotas + sus extras; vacío → "Sin pagos registrados en este apartamento".
7. **Estados vacíos:** se mantienen como defensa — hoy imposibles (solo 101 y 202, ambos con datos; no habrá más apartamentos); no se exige verificarlos a mano.
8. **Navegación:** toda la tarjeta clicable (con teclado); enlace "← Volver" en ambas páginas.
9. **Precedencias:** sin sesión → siempre login (aunque la dirección sea mala o la BD caiga); BD caída → RF-11, nunca "no encontrado"; login → a la URL pedida si era válida, si no al dashboard.
10. **Sesión expira en uso:** visible hasta navegar/recargar (sin vigilancia automática).
11. **RF-11:** todo o nada; reintento manual libre.
12. **CA-4.1:** solo información financiera (navegación y sesión permitidas).
13. **HU:** HU-2 ampliada (click + URL con sesión) y HU-9 nueva (volver); **RNF-8** de accesibilidad; **RNF-6** alineada con el principio 1; **RNF-3/RNF-4** medibles por comparación con los componentes existentes.
14. **Principio 3 interpretado:** cálculos financieros puros con test; el estado de UI (filtro, reintento) vive en el componente (RNF-9).
15. **Criterios:** verificar todos los casos límite y la lectura previa obligatoria de AGENTS/constitución/spec.

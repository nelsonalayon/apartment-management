# Spec 001 — Página independiente por apartamento

## Contexto y objetivo

Hoy todo vive en un solo dashboard: el avance global, las tarjetas de los dos apartamentos (101 y 202), el resumen por usuario y la lista de cuotas con filtros. Para consultar cómo va un apartamento hay que mirar la vista completa y filtrar a mano los datos entre los del otro apartamento.

**Objetivo:** crear una página propia para cada apartamento que muestre exactamente los mismos valores que el dashboard, pero solo con los datos de ese apartamento: su avance, sus cuotas, quiénes han pagado en él y sus pagos. Se llega desde la tarjeta del dashboard o escribiendo la dirección directamente. El dashboard sigue siendo la vista global.

## Usuarios

Los mismos 4 usuarios con PIN del proyecto, con el mismo acceso que hoy al dashboard. No hay roles distintos en esta versión (ver dudas abiertas).

## Historias de usuario

- **HU-1:** Como usuario, quiero abrir la página de un apartamento desde su tarjeta en el dashboard, para ver solo su información sin la del otro apartamento.
- **HU-2:** Como usuario, quiero escribir la dirección (URL) de un apartamento, para llegar directo a ella sin pasar por el dashboard (y poder compartirla).
- **HU-3:** Como usuario, quiero ver el avance, las cuotas y quiénes han pagado en el apartamento, para saber en qué estado está de un vistazo.
- **HU-4:** Como usuario, quiero filtrar las cuotas por estado, para revisar rápido las pendientes.
- **HU-5:** Como usuario, quiero que si la dirección no corresponde a un apartamento me lo digan claramente y pueda volver, para no quedarme en una pantalla perdida.
- **HU-6:** Como usuario, quiero que un apartamento sin cuotas se vea como "vacío" y no como error, para entender que aún no hay datos registrados.
- **HU-7:** Como usuario, quiero un mensaje claro con opción de reintentar si la base de datos falla, para no creer erróneamente que el apartamento está en cero.
- **HU-8:** Como usuario, quiero que al vencer mi sesión me lleven al inicio de sesión, para que los datos no queden expuestos.

## Requisitos funcionales

**RF-1 — Acceso protegido**
- CA-1.1 (evento): Cuando un usuario sin sesión válida intente abrir la página de un apartamento, entonces el sistema deberá redirigirlo al inicio de sesión sin mostrar ningún dato del apartamento.
- CA-1.2 (no deseado): Si la sesión está expirada o la cookie fue manipulada, entonces el sistema deberá tratarla como ausente (mismo resultado que CA-1.1).

**RF-2 — Llegada desde el dashboard**
- CA-2.1 (evento): Cuando el usuario seleccione la tarjeta de un apartamento en el dashboard, entonces el sistema deberá abrir la página de ese apartamento.
- CA-2.2 (ubicuo): El dashboard deberá seguir mostrando la misma información que hoy; el único cambio en él es que la tarjeta se vuelve seleccionable.

**RF-3 — Llegada por URL directa**
- CA-3.1 (evento): Cuando el usuario acceda directamente a la dirección de un apartamento existente, entonces el sistema deberá mostrar su página con los datos de ese apartamento, sin necesidad de pasar por el dashboard.

**RF-4 — Contenido: solo este apartamento**
- CA-4.1 (estado): Mientras se muestre la página de un apartamento, el sistema deberá presentar únicamente información de ese apartamento.
- CA-4.2 (no deseado): Si un usuario tiene actividad en ambos apartamentos, entonces en la página de uno solo se mostrará lo pagado en ese apartamento; nunca montos del otro apartamento ni del avance global.

**RF-5 — Resumen del apartamento**
- CA-5.1 (ubicuo): El sistema deberá mostrar el avance del apartamento con las mismas reglas que el dashboard: pagado = cuotas pagadas + pagos adicionales; pendiente = cuota inicial − pagado con mínimo 0; avance con tope de 100%.
- CA-5.2 (no deseado): Si la cuota inicial del apartamento es 0, entonces el sistema deberá mostrar avance 0 sin errores de cálculo.

**RF-6 — Cuotas del apartamento**
- CA-6.1 (ubicuo): El sistema deberá listar las cuotas de ese apartamento con su estado visible (pagada o pendiente), su valor y quién la pagó.
- CA-6.2 (opcional): Donde el dashboard ofrece filtrar cuotas por estado, la página del apartamento deberá ofrecer el mismo filtro sobre sus cuotas.
- CA-6.3 (no deseado): Si el apartamento no tiene cuotas, entonces el sistema deberá mostrar el mensaje "Sin cuotas registradas" en lugar de una lista vacía (ver RF-9).

**RF-7 — Usuarios del apartamento**
- CA-7.1 (ubicuo): El sistema deberá mostrar solo los usuarios con pagos en ese apartamento y el total que cada uno ha pagado en él.
- CA-7.2 (no deseado): Si un usuario no tiene pagos en el apartamento, entonces no deberá aparecer en su lista.

**RF-8 — Apartamento no encontrado**
- CA-8.1 (no deseado): Si la dirección corresponde a un apartamento que no existe o está mal escrita, entonces el sistema deberá mostrar una página "Apartamento no encontrado" con un enlace para volver al dashboard.
- CA-8.2 (no deseado): En este caso, el sistema no deberá mostrar datos parciales ni mensajes técnicos internos.

**RF-9 — Apartamento sin datos**
- CA-9.1 (no deseado): Si el apartamento existe pero no tiene cuotas ni pagos, entonces la página deberá cargarse con éxito mostrando avance 0 y los mensajes de vacío de cada lista; esta situación no deberá tratarse como error.

**RF-10 — Error al cargar los datos**
- CA-10.1 (no deseado): Si la base de datos no responde al abrir la página, entonces el sistema deberá mostrar el mensaje "No se pudieron cargar los datos" con una opción para reintentar.
- CA-10.2 (no deseado): En ningún caso de error el sistema deberá presentar datos vacíos o inventados como si fueran reales.

**RF-11 — Vuelta al dashboard**
- CA-11.1 (evento): Cuando el usuario elija volver, entonces el sistema deberá regresarlo al dashboard (en la página de no encontrado, el enlace de vuelta es obligatorio).

## Requisitos no funcionales

- **RNF-1 — Cálculos idénticos:** los valores de la página deben coincidir con los del dashboard ante los mismos datos; la lógica debe poder probarse con tests unitarios sin tocar la interfaz (constitución 3 y 4).
- **RNF-2 — Datos vigentes:** al abrir la página se deben ver los datos actuales: un pago registrado en el dashboard debe reflejarse al volver a abrir la página del apartamento.
- **RNF-3 — Responsive:** la página debe usarse bien en móvil y escritorio, como el dashboard.
- **RNF-4 — Consistencia visual:** misma apariencia que el dashboard (tarjetas, estados, formato de dinero y fechas) y respeto del tema claro/oscuro y de la preferencia de movimiento reducido.
- **RNF-5 — Idioma:** todos los textos visibles en español; nombres técnicos y de archivo en inglés (constitución 6).
- **RNF-6 — Sin dependencias nuevas:** si alguna dependencia fuera imprescindible, se propone antes de instalarla (constitución 1 y 4).
- **RNF-7 — Seguridad:** sin sesión no se ve ningún dato; no exponer en la interfaz errores técnicos ni información interna (constitución 5).

## Casos límite

1. **URL con apartamento inexistente o mal escrito** → RF-8 (página "no encontrado" + enlace de vuelta).
2. **Apartamento sin cuotas ni pagos** → RF-9 (avance 0 + mensajes de vacío, no es error).
3. **Base de datos no responde** → RF-10 (mensaje + reintentar; nunca datos inventados).
4. **Sesión vencida o manipulada** → RF-1 (redirigir al login).
5. **Usuario que paga en ambos apartamentos** → solo sus montos en la página de cada uno (CA-4.2).
6. **Avance al 100%** → se muestra 100% y pendiente 0 (topes de la regla existente).
7. **Pagos que superan la cuota inicial** → avance tope 100%, pendiente mínimo 0.
8. **Cuota inicial en 0** → avance 0 sin división por cero (CA-5.2).
9. **Cuota con estado "vencida"** → se presenta como pendiente (convención ya acordada en el proyecto).

## Fuera de alcance (esta versión)

- Crear, editar o eliminar cuotas, pagos, usuarios o apartamentos (la página es de solo lectura).
- Registrar pagos desde esta página (formularios de pago).
- Comparación entre apartamentos o avance global dentro de la página.
- Exportaciones, notificaciones, gráficas nuevas o reportes.
- Registro o autenticación nueva (se reutiliza la existente).
- Cambios en el dashboard más allá de volver clicable la tarjeta.
- Permisos distintos por usuario o por apartamento (ver dudas abiertas).

## Criterios de finalización

- Dudas abiertas resueltas y spec aprobada por el usuario antes de tocar código (constitución 2).
- Cada RF con sus CA verificados sobre la página real (recorrido manual o E2E), incluidos los casos límite 1-4.
- `pnpm test` en verde, build sin errores de TypeScript y lint sin errores.
- Comprobación en móvil y escritorio.
- `MEMORY.md` actualizado al cerrar la tarea.

## Dudas abiertas

- [NECESITA ACLARACIÓN] ¿Debe la página listar los pagos adicionales del apartamento? El dashboard hoy solo los suma en los totales, no los muestra como lista.
- [NECESITA ACLARACIÓN] ¿El dashboard conserva todos sus bloques tal cual (solo las tarjetas se vuelven clicables), o se retira algún dato de ahí?
- [NECESITA ACLARACIÓN] ¿Todos los usuarios ven las páginas de los dos apartamentos sin restricciones (mismo acceso que hoy), o algún usuario debería ver solo "su" apartamento?

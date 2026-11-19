# Constitución del proyecto

1. **Stack simple, sin rigidez:** el stack es Next.js + React + Tailwind + mysql2; si es posible no se agrega nada nuevo, pero si una tarea lo necesita, el agente propone la dependencia (para qué sirve y por qué) antes de instalarla. Verificable: `pnpm list --depth 0` solo crece con una propuesta aceptada.
2. **Spec antes que código:** AGENTS.md manda; todo cambio empieza por leerlo y termina con MEMORY.md actualizado. Verificable: el diff cumple sus reglas y la memoria refleja la decisión.
3. **Lógica separada de la interfaz:** todo cálculo vive puro en `lib/*.ts` con su test; los componentes solo pintan props. Verificable: `pnpm test` pasa sin renderizar ni tocar la BD.
4. **Tests antes que dependencias:** `pnpm test` verde es condición para cerrar tarea; si una regla merece test y no hay forma razonable sin librería nueva, se propone (eso es válido, solo no se instala sin decirlo).
5. **Datos del usuario protegidos:** credenciales solo en `.env.local`, PINs hasheados, cookies firmadas; nunca secretos, PINs ni correos en git, docs ni logs. Verificable: `git status` sin archivos sensibles.
6. **Español en lo visible, inglés en lo técnico:** UI, comentarios y documentación en español; identificadores y nombres de archivo en inglés. Verificable: `git ls-files | grep "[áéíóú]"` → 0 (ningún archivo ni identificador con acentos).

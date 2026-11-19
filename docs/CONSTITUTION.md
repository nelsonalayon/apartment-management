# Constitución del proyecto

1. **Stack simple:** el stack es Next.js + React + Tailwind + mysql2 y nada más; una dependencia nueva solo entra justificada y aprobada. Verificable: `pnpm list --depth 0` no crece sin decisión explícita.
2. **Spec antes que código:** AGENTS.md manda; todo cambio empieza por leerlo y termina con MEMORY.md actualizado. Verificable: el diff cumple sus reglas y la memoria refleja la decisión.
3. **Lógica separada de la interfaz:** todo cálculo vive puro en `lib/*.ts` con su test; los componentes solo pintan props. Verificable: `pnpm test` pasa sin renderizar ni tocar la BD.
4. **Tests antes que dependencias:** `pnpm test` verde es condición para cerrar tarea; si una regla merece test y no hay forma sin librería nueva, se propone la instalación antes de hacerla.
5. **Datos del usuario protegidos:** credenciales solo en `.env.local`, PINs hasheados, cookies firmadas; nunca secretos, PINs ni correos en git, docs ni logs. Verificable: `git status` sin archivos sensibles.
6. **Español en lo visible, inglés en lo técnico:** UI, comentarios y documentación en español; identificadores y nombres de archivo en inglés. Verificable: `git ls-files | grep "[áéíóú]"` → 0 (ningún archivo ni identificador con acentos).

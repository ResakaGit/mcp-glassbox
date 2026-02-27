# mcp-glassbox (Caja de Cristal) v3

MCP que expone tools para ejecutar tests y obtener telemetría filtrada (resumen liviano + consulta bajo demanda), evitando token overflow en el LLM.

## Tools (V3 recomendado)

### run_test_and_get_summary

Ejecuta el comando de test y devuelve un **resumen corto** (pocos KB) con:

- **run_id** — usar en `query_telemetry` para pedir detalle.
- **summary:** status, exit_code, execution_time_ms, **counts** (network_failures, console_errors, page_errors, backend_warn_error_lines), **accessibility_tree** (árbol de accesibilidad en texto), **resolved_errors** (errores de consola/página resueltos a fuente vía source map si está configurado), y telemetría ya **filtrada/truncada** (solo 4xx/5xx en red, bodies truncados, logs solo WARN/ERROR).

**Entrada:** sandbox_id, entry_command, target_containers; opcional: source_map_base_path, truncate_body_chars, backend_log_levels.

### query_telemetry

Consulta telemetría de un run por **run_id**. Tipos de query:

- `network_by_status` (opcional status: 403) — requests que fallaron o con ese status. Los `response_body` se truncan por defecto.
- `network_request_full` (opcional request_url) — un request/response completo (body truncado por defecto).
- `console_errors` — errores de consola del navegador.
- `backend_logs` — logs de contenedores. Por defecto se filtran por nivel (WARN/ERROR); usar `backend_log_levels: "full"` para raw.
- `full_telemetry` — todo lo guardado del run (evitar salvo necesidad explícita; puede ser muy grande).

**Entrada:** run_id, query: { type, status?, request_url?, truncate_body_chars?, backend_log_levels? }.

### execute_with_telemetry (legacy)

Devuelve todo el JSON de telemetría en una sola respuesta. Útil para compatibilidad; para ahorro de tokens preferir **run_test_and_get_summary** + **query_telemetry**.

## Flujo recomendado para desarrollo

Para que el LLM use el MCP sin inflar contexto (token-safe):

1. **Ejecutar:** Llamar `run_test_and_get_summary` con el comando de test (ej. `npx playwright test`).
2. **Leer resumen:** Revisar `run_id` y `summary.counts`, `summary.resolved_errors`, `summary.accessibility_tree` y la telemetría ya filtrada (red solo fallos, logs WARN/ERROR).
3. **Detalle bajo demanda:** Si hace falta más información: para un 4xx/5xx concreto usar `query_telemetry` con `type: "network_request_full"` y `request_url`; para logs del backend usar `type: "backend_logs"` (por defecto filtrado; `backend_log_levels: "full"` si se necesita todo).
4. **Iterar:** Corregir código según el resumen y los detalles consultados; volver a ejecutar `run_test_and_get_summary`.

No pedir `full_telemetry` salvo que sea estrictamente necesario; el resumen + consultas puntuales mantienen el contexto liviano.

## Variables de entorno

- `DOCKER_HOST` — opcional; socket o host del daemon Docker.
- `GLASSBOX_EXECUTE_TIMEOUT_MS` — timeout del proceso de test en ms (default 120000). 0 = sin timeout de proceso; el adapter de Playwright aplica una cota interna para evitar leak de browser. Valores negativos se normalizan al default.
- `GLASSBOX_TRUNCATE_BODY_CHARS` — máximo caracteres en response_body en el resumen (default 500).
- `GLASSBOX_RUN_STORE_MAX_ENTRIES` — máximo runs en memoria para query_telemetry (default 50). Evicción FIFO.
- `GLASSBOX_BACKEND_LOG_LEVELS` — niveles a mantener en logs, separados por coma (default "WARN,ERROR").
- `GLASSBOX_SOURCE_MAP_BASE_PATH` — directorio base donde buscar archivos .map para resolver errores de bundle a fuente.
- `GLASSBOX_SAVEPOINT_CONTAINER` — (V3 True) nombre del contenedor para savepoints; si no se define, las tools de savepoint no se registran.

## Requisitos

- **Docker** accesible (el MCP hace `docker.ping()` al arranque).
- **Playwright** instalado (`npx playwright install` si usas browsers).
- **source-map** (dependency) para resolución de source maps en V3.

## Límites

- El almacén de runs es en memoria y está acotado a `RUN_STORE_MAX_ENTRIES`; los runs más antiguos se evictan en FIFO.
- La telemetría de red/consola se captura en un navegador que lanza el MCP mientras corre el comando. Si el test de Playwright abre su propio navegador, ese tráfico no se ve aquí.

## Modo dual

- **Standalone:** `node dist/index.js` (valida Docker y arranca con puertos V3).
- **Orquestador:** importar `registerGlassboxTools` desde `mcp-glassbox/server` y `createGlassboxPortsV3` (o `createGlassboxPorts`) desde `mcp-glassbox/ports-factory`.

## Cursor: uso standalone (repo por separado)

Si este repo se usa solo (sin orquestador):

```bash
npm install && npm run build
```

En `.cursor/mcp.json` del workspace:

```json
"mcp-glassbox": {
  "command": "node",
  "args": ["mcp-glassbox/dist/index.js"],
  "env": {}
}
```

Docker debe estar en ejecución. Opcionales en `env`: `DOCKER_HOST`, `GLASSBOX_EXECUTE_TIMEOUT_MS`, `GLASSBOX_SAVEPOINT_CONTAINER`, etc. Ajustá `args` si el MCP está en otra ruta. Reiniciar Cursor tras cambiar `mcp.json`.

## Calidad / Estándar

- **Arquitectura hexagonal:** domain, ports, application, adapters; errores vía `toolErrorResult` (contrato MCP).
- **Validación:** Zod en todos los inputs de tools; validación de Docker al arranque.
- **Recursos:** timeout global en el adapter de Playwright para que el browser siempre se cierre; validación defensiva del tipo de salida de `container.logs()`.
- **Tipos:** TypeScript strict; tipos explícitos en handlers y callbacks.
- **Tests:** `npm test` (vitest); unit por capa con mocks.

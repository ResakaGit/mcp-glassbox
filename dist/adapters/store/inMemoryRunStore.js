const DEFAULT_MAX_ENTRIES = 50;
/** Evicción FIFO: orden de inserción en un array; el Map guarda los datos. */
export function createInMemoryRunStore(maxEntries = DEFAULT_MAX_ENTRIES) {
    const map = new Map();
    const order = [];
    function evictIfNeeded() {
        while (order.length >= maxEntries && order.length > 0) {
            const id = order.shift();
            map.delete(id);
        }
    }
    return {
        put(runId, data) {
            evictIfNeeded();
            if (!map.has(runId))
                order.push(runId);
            map.set(runId, data);
        },
        get(runId) {
            return map.get(runId) ?? null;
        },
        query(runId, query) {
            const run = map.get(runId);
            if (!run)
                return { ok: false, error: "run not found" };
            switch (query.type) {
                case "full_telemetry":
                    return { ok: true, data: run };
                case "network_by_status": {
                    const status = query.status;
                    const list = status != null
                        ? run.network_failures.filter((r) => r.status === status)
                        : run.network_failures;
                    return { ok: true, data: { network_failures: list } };
                }
                case "network_request_full": {
                    const url = query.request_url;
                    const match = url != null
                        ? run.network_failures.find((r) => r.url === url)
                        : run.network_failures[0];
                    return { ok: true, data: match ?? null };
                }
                case "console_errors":
                    return { ok: true, data: { console_errors: run.browser_console_errors } };
                case "backend_logs":
                    return { ok: true, data: { backend_logs: run.backend_container_logs } };
                default:
                    return { ok: true, data: run };
            }
        },
    };
}
//# sourceMappingURL=inMemoryRunStore.js.map
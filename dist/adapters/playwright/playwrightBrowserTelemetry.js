import { chromium } from "playwright";
function serializeAccessibilityTree(node, depth) {
    const indent = "  ".repeat(depth);
    const role = node.role ?? "unknown";
    const name = node.name ? ` "${node.name}"` : "";
    const value = node.value != null ? ` [value=${String(node.value)}]` : "";
    const line = `${indent}[${role}${name}${value}]`;
    const childLines = (node.children ?? []).map((c) => serializeAccessibilityTree(c, depth + 1));
    return [line, ...childLines].filter(Boolean).join("\n");
}
/** Cota máxima por defecto cuando el caller no pasa maxRunMs; evita leak de browser si runFn() no resuelve. */
const DEFAULT_MAX_RUN_MS = 300_000; // 5 min
function runWithTimeout(runFn, maxRunMs) {
    return Promise.race([
        runFn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`runAndCollect timeout after ${maxRunMs}ms`)), maxRunMs)),
    ]);
}
async function collectTelemetryFromPage(runFn, options) {
    const consoleErrors = [];
    const networkFailures = [];
    const pageErrors = [];
    const maxRunMs = options?.maxRunMs ?? 0;
    const effectiveTimeoutMs = maxRunMs > 0 ? maxRunMs : DEFAULT_MAX_RUN_MS;
    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        if (options?.traceId) {
            await page.route("**/*", (route) => {
                const headers = route.request().headers();
                route.continue({
                    headers: { ...headers, "X-Agent-Trace-Id": options.traceId },
                });
            });
        }
        if (options?.tracePath) {
            await context.tracing.start({
                screenshots: true,
                snapshots: true,
            });
        }
        page.on("requestfailed", (request) => {
            const failure = request.failure();
            networkFailures.push({
                url: request.url(),
                method: request.method(),
                response_body: failure?.errorText ?? undefined,
            });
        });
        page.on("response", async (response) => {
            const status = response.status();
            if (status >= 400) {
                let body;
                try {
                    body = await response.text();
                }
                catch {
                    body = undefined;
                }
                networkFailures.push({
                    url: response.url(),
                    method: response.request().method(),
                    status,
                    response_body: body,
                });
            }
        });
        page.on("console", (msg) => {
            const type = msg.type();
            if (type === "error" || type === "warning") {
                consoleErrors.push(`[${type}] ${msg.text()}`);
            }
        });
        page.on("pageerror", (err) => {
            pageErrors.push(err.message);
        });
        const runResult = await runWithTimeout(runFn, effectiveTimeoutMs);
        if (options?.tracePath) {
            await context.tracing.stop({ path: options.tracePath });
        }
        let accessibility_tree;
        try {
            const a11y = await page.accessibility.snapshot();
            accessibility_tree = a11y ? serializeAccessibilityTree(a11y, 0) : undefined;
        }
        catch {
            accessibility_tree = undefined;
        }
        const snapshot = {
            console_errors: consoleErrors,
            network_failures: networkFailures,
            page_errors: pageErrors,
            accessibility_tree,
        };
        return { snapshot, runResult };
    }
    finally {
        await browser.close();
    }
}
export function createPlaywrightBrowserTelemetry() {
    return {
        runAndCollect(runFn, options) {
            return collectTelemetryFromPage(runFn, options);
        },
    };
}
//# sourceMappingURL=playwrightBrowserTelemetry.js.map
import { describe, it, expect } from "vitest";
import { truncateBody, filterNetworkForSummary, filterBackendLogsByLevel, DEFAULT_BACKEND_LOG_LEVELS, } from "./filtering.js";
describe("truncateBody", () => {
    it("devuelve undefined para undefined o vacío", () => {
        expect(truncateBody(undefined)).toBeUndefined();
        expect(truncateBody("")).toBeUndefined();
    });
    it("devuelve el mismo string si no excede maxChars", () => {
        const s = "a".repeat(100);
        expect(truncateBody(s, 500)).toBe(s);
    });
    it("trunca y añade … si excede maxChars", () => {
        const s = "a".repeat(600);
        const out = truncateBody(s, 500);
        expect(out).toHaveLength(501);
        expect(out.endsWith("…")).toBe(true);
    });
});
describe("filterNetworkForSummary", () => {
    it("trunca response_body en cada request", () => {
        const requests = [
            { url: "https://a", method: "GET", response_body: "x".repeat(1000) },
        ];
        const out = filterNetworkForSummary(requests, 100);
        expect(out[0].response_body).toHaveLength(101);
        expect(out[0].response_body.endsWith("…")).toBe(true);
    });
    it("mantiene todos los campos y no modifica url/method", () => {
        const requests = [
            { url: "https://api/err", method: "POST", status: 500, response_body: "short" },
        ];
        const out = filterNetworkForSummary(requests, 500);
        expect(out).toHaveLength(1);
        expect(out[0].url).toBe("https://api/err");
        expect(out[0].method).toBe("POST");
        expect(out[0].status).toBe(500);
        expect(out[0].response_body).toBe("short");
    });
    it("excluye requests con status 2xx/3xx, mantiene solo 4xx/5xx o sin status", () => {
        const requests = [
            { url: "https://ok", method: "GET", status: 200, response_body: "ok" },
            { url: "https://api/err", method: "POST", status: 500, response_body: "short" },
            { url: "https://failed", method: "GET", response_body: "net error" },
        ];
        const out = filterNetworkForSummary(requests, 500);
        expect(out).toHaveLength(2);
        expect(out[0].status).toBe(500);
        expect(out[0].url).toBe("https://api/err");
        expect(out[1].status).toBeUndefined();
        expect(out[1].url).toBe("https://failed");
    });
});
describe("filterBackendLogsByLevel", () => {
    it("mantiene solo líneas que contienen WARN o ERROR", () => {
        const lines = [
            "[INFO] Started",
            "[WARN] Deprecation",
            "[DEBUG] foo",
            "[ERROR] Something failed",
        ];
        const out = filterBackendLogsByLevel(lines, DEFAULT_BACKEND_LOG_LEVELS);
        expect(out).toEqual(["[WARN] Deprecation", "[ERROR] Something failed"]);
    });
    it("devuelve [] si levels está vacío", () => {
        const lines = ["[WARN] x"];
        expect(filterBackendLogsByLevel(lines, [])).toEqual([]);
    });
    it("acepta niveles custom", () => {
        const lines = ["[INFO] a", "[CUSTOM] b"];
        expect(filterBackendLogsByLevel(lines, ["CUSTOM"])).toEqual(["[CUSTOM] b"]);
    });
});
//# sourceMappingURL=filtering.test.js.map
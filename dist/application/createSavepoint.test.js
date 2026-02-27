import { describe, it, expect } from "vitest";
import { createSavepoint } from "./createSavepoint.js";
describe("createSavepoint", () => {
    it("devuelve ok cuando savepoint.createSavepoint resuelve", async () => {
        const ports = {
            savepoint: {
                createSavepoint: async () => { },
            },
        };
        const result = await createSavepoint(ports, "db_clean");
        expect(result.isError).toBeFalsy();
        const data = JSON.parse(result.content[0].text);
        expect(data.ok).toBe(true);
        expect(data.message).toContain("db_clean");
    });
    it("devuelve error cuando savepoint.createSavepoint rechaza", async () => {
        const ports = {
            savepoint: {
                createSavepoint: async () => {
                    throw new Error("Docker unavailable");
                },
            },
        };
        const result = await createSavepoint(ports, "db_clean");
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("createSavepoint failed");
    });
});
//# sourceMappingURL=createSavepoint.test.js.map
import assert from "node:assert/strict";
import test from "node:test";
import { normalizeProgress } from "../src/renderer/data/progress.ts";
import { lessons } from "../src/renderer/data/curriculum.ts";

test("old checked progress survives while VM completions require their saved valid checkpoints", () => {
    const installation = lessons.find(item => item.id === "rhel-installation")!;
    const service = lessons.find(item => item.id === "services")!;
    const saved = normalizeProgress({
        completed: ["navigation", "navigation", "cloud-infrastructure", "rhel-installation", "services", "lvm"],
        installationCheckpoints: [...installation.steps.map(item => item.id), "unknown"],
        practiceCheckpoints: {
            services: [...service.steps.map(item => item.id), "other"],
            lvm: ["step-1"],
            unknown: ["step-1"],
        },
    });
    assert.deepEqual(saved.completed, ["navigation", "rhel-installation", "services"]);
    assert.deepEqual(
        saved.installationCheckpoints,
        installation.steps.map(item => item.id),
    );
    assert.deepEqual(
        saved.practiceCheckpoints.services,
        service.steps.map(item => item.id),
    );
    assert.equal(Object.hasOwn(saved.practiceCheckpoints, "unknown"), false);
    assert.throws(() => normalizeProgress({ completed: "not an array" }), /progress backup/);
    assert.deepEqual(normalizeProgress({ completed: ["lvm"], practiceCheckpoints: { lvm: "step-1" } }).completed, []);
});

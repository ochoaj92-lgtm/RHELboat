import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { quizQuestions } from "../src/renderer/data/quiz.ts";
import { paths } from "../src/renderer/data/curriculum.ts";

test("quiz question bank contains complete, valid, unique scenario questions", () => {
    assert.ok(quizQuestions.length >= 15, "Quiz bank should have at least 15 simulation questions");

    const ids = new Set<string>();
    const validPaths = new Set([...paths.map(p => p.id), "security", "services"]);
    const validDifficulties = new Set(["Foundation", "Advanced", "Specialist"]);

    for (const q of quizQuestions) {
        assert.ok(!ids.has(q.id), `Duplicate question ID: ${q.id}`);
        ids.add(q.id);

        assert.ok(q.pathId && validPaths.has(q.pathId), `Question ${q.id} has invalid pathId: ${q.pathId}`);
        assert.ok(q.topic && q.topicLabel, `Question ${q.id} missing topic/label`);
        assert.ok(validDifficulties.has(q.difficulty), `Invalid difficulty in ${q.id}`);

        assert.ok(q.scenario && q.scenario.length > 10, `Question ${q.id} missing scenario context`);
        assert.ok(q.question && q.question.length > 10, `Question ${q.id} missing clear question text`);

        assert.equal(q.options.length, 4, `Question ${q.id} must have exactly 4 options`);
        for (const opt of q.options) {
            assert.ok(opt && opt.trim().length > 0, `Question ${q.id} has empty option`);
        }

        assert.ok(
            Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < q.options.length,
            `Question ${q.id} has out-of-range correctIndex: ${q.correctIndex}`,
        );

        assert.ok(q.explanation && q.explanation.length > 20, `Question ${q.id} missing detailed explanation`);

        if (q.recommendedCommand) {
            const syntaxCheck = spawnSync("/bin/bash", ["-n", "-c", q.recommendedCommand], { encoding: "utf8" });
            assert.equal(
                syntaxCheck.status,
                0,
                `Question ${q.id} recommended command has invalid bash syntax: ${syntaxCheck.stderr}`,
            );
        }
    }
});


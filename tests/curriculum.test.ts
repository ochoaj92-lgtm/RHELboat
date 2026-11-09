import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { lessons, categories, workbooks } from "../src/renderer/data/curriculum.ts";
import { supportedCheckIds } from "../src/main/lab.ts";

const checkedIds = [
    "navigation",
    "documentation",
    "environment",
    "links",
    "archive",
    "text",
    "find-files",
    "edit-files",
    "users",
    "permissions",
    "shared-directory",
    "password-policy",
    "processes",
    "scripting",
    "shell-loops",
];

test("topic catalog has reachable lessons, valid workbook references and contextual help", () => {
    assert.equal(categories.length, 10);
    assert.equal(lessons.length, 40);
    assert.equal(new Set(categories.map(item => item.id)).size, categories.length);
    assert.equal(new Set(lessons.map(item => item.id)).size, lessons.length);
    assert.deepEqual(new Set(lessons.map(item => item.categoryId)), new Set(categories.map(item => item.id)));
    const referencedBooks = new Set<string>();
    for (const category of categories) {
        assert.ok(category.title && category.description && category.topics.length);
        assert.ok(category.lessonIds.length);
        assert.doesNotMatch(`${category.title} ${category.subtitle}`, /EX\d{3}|RHCSA|RHCE|RHCA/);
        assert.deepEqual(
            category.lessonIds,
            lessons.filter(item => item.categoryId === category.id).map(item => item.id),
        );
    }
    for (const lesson of lessons) {
        assert.ok(lesson.title && lesson.topic && lesson.objective && lesson.explanation && lesson.success);
        assert.ok(lesson.requirements.length && lesson.duration > 0);
        assert.ok(lesson.steps.length >= 3);
        assert.equal(new Set(lesson.steps.map(item => item.id)).size, lesson.steps.length);
        for (const step of lesson.steps) {
            assert.ok(step.id && step.title && step.instruction);
            assert.ok(
                step.help.feature.length >= 2 && step.help.why.length > 20,
                `${lesson.id}: help must explain the feature and its purpose`,
            );
        }
        assert.ok(lesson.references.length);
        for (const reference of lesson.references) {
            const source = workbooks[reference.workbookId];
            assert.ok(source && reference.section);
            assert.ok(Number.isInteger(reference.pages[0]) && Number.isInteger(reference.pages[1]));
            assert.ok(
                reference.pages[0] >= 1 &&
                    reference.pages[1] >= reference.pages[0] &&
                    reference.pages[1] <= source.pageCount,
            );
            referencedBooks.add(reference.workbookId);
        }
        if (lesson.checkId) {
            assert.equal(lesson.environment, "container");
            assert.equal(lesson.id, lesson.checkId);
        } else {
            assert.notEqual(lesson.environment, "container");
            assert.match(lesson.success, /^Self-review:/);
        }
    }
    assert.deepEqual([...referencedBooks].sort(), Object.keys(workbooks).sort());
    assert.deepEqual(
        lessons
            .filter(item => item.checkId)
            .map(item => item.checkId)
            .sort(),
        checkedIds.toSorted(),
    );
    assert.deepEqual(supportedCheckIds.toSorted(), checkedIds.toSorted());
});

test("installation retains stable checkpoints while its references come from workbooks", () => {
    const installation = lessons.find(item => item.id === "rhel-installation")!;
    assert.equal(categories[0].lessonIds[0], installation.id);
    assert.equal(installation.steps.length, 13);
    assert.equal(installation.steps[0].id, "download-iso");
    assert.equal(installation.steps.at(-1)?.id, "prove-persistence");
    assert.equal(installation.checkId, undefined);
    assert.ok(installation.references.some(reference => reference.workbookId === "rhel10"));
});

test("suggested commands parse as Bash and file labs produce the promised results", () => {
    for (const lesson of lessons)
        for (const step of lesson.steps) {
            if (!step.command) continue;
            const result = spawnSync("/bin/bash", ["-n", "-c", step.command], { encoding: "utf8" });
            assert.equal(result.status, 0, `${lesson.id}: ${result.stderr}`);
        }
    const directory = mkdtempSync(join(tmpdir(), "rhelboat-curriculum-"));
    try {
        const fileLabs = [
            "navigation",
            "documentation",
            "environment",
            "links",
            "archive",
            "text",
            "find-files",
            "edit-files",
            "permissions",
            "scripting",
            "shell-loops",
        ];
        for (const id of fileLabs)
            for (const step of lessons.find(item => item.id === id)!.steps) {
                if (!step.command) continue;
                const result = spawnSync("/bin/bash", ["-c", step.command.replaceAll("/root/lab", directory)], {
                    encoding: "utf8",
                });
                // diff exits 1 when the intended edit is present; the following cat still succeeds.
                assert.equal(result.status, 0, `${id}: ${result.stderr}`);
            }
        assert.equal(readFileSync(join(directory, "environment.txt"), "utf8"), "training shell\n");
        assert.equal(readFileSync(join(directory, "editor.conf"), "utf8"), "MODE=training\nOWNER=trainee\n");
        assert.equal(
            readFileSync(join(directory, "found-configs.txt"), "utf8"),
            `${directory}/search-lab/app.conf\n${directory}/search-lab/nested/db.conf\n`,
        );
        assert.equal(statSync(join(directory, "private.txt")).mode & 0o777, 0o600);
        assert.equal(spawnSync(join(directory, "names.sh"), [], { encoding: "utf8" }).stdout, "alpha\nbeta\n");
        assert.equal(
            spawnSync(join(directory, "hello.sh"), [], { encoding: "utf8" }).stdout,
            "hello enterprise linux\n",
        );
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
});

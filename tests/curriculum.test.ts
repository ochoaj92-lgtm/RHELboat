import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readlinkSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { lessons, paths } from "../src/renderer/data/curriculum.ts";
import { supportedCheckIds } from "../src/main/lab.ts";

const runnableIds = ["navigation", "permissions", "users", "processes", "archive", "links", "text", "scripting"];
const environments = new Set(["container", "vm", "multi-node"]);

function officialUrl(value: string) {
    const url = new URL(value);
    assert.equal(url.protocol, "https:");
    assert.ok(url.hostname === "redhat.com" || url.hostname.endsWith(".redhat.com"));
}

test("all paths reference complete, unique, source-linked lessons", () => {
    const lessonIds = new Set(lessons.map(lesson => lesson.id));
    assert.equal(lessonIds.size, lessons.length);
    assert.equal(new Set(paths.map(path => path.id)).size, paths.length);
    assert.equal(new Set(paths.map(path => path.code)).size, paths.length);
    const referenced = new Set<string>();

    for (const path of paths) {
        officialUrl(path.examUrl);
        assert.ok(environments.has(path.environment));
        assert.ok(path.title && path.description && path.subtitle);
        assert.ok(path.topics.length > 0);
        assert.ok(path.lessonIds.length > 0);
        assert.equal(new Set(path.lessonIds).size, path.lessonIds.length);
        for (const id of path.lessonIds) {
            assert.ok(lessonIds.has(id), `${path.code} references missing lesson ${id}`);
            referenced.add(id);
        }
    }

    for (const lesson of lessons) {
        assert.ok(referenced.has(lesson.id), `Unreachable lesson ${lesson.id}`);
        officialUrl(lesson.sourceUrl);
        assert.ok(environments.has(lesson.environment));
        assert.ok(lesson.title && lesson.topic && lesson.objective && lesson.explanation && lesson.success);
        assert.ok(lesson.duration > 0);
        assert.ok(lesson.steps.length >= 3);
        for (const step of lesson.steps) {
            assert.ok(step.title && step.instruction);
        }
        if (lesson.checkId) {
            assert.equal(lesson.environment, "container");
            assert.equal(lesson.id, lesson.checkId);
        } else {
            assert.notEqual(lesson.environment, "container", "Container exercises must have real checks");
            assert.match(lesson.success, /^Self-review:/);
        }
    }
    assert.deepEqual(
        lessons
            .filter(lesson => lesson.checkId)
            .map(lesson => lesson.checkId)
            .sort(),
        runnableIds.toSorted(),
    );
    assert.deepEqual(supportedCheckIds.toSorted(), runnableIds.toSorted());
});

test("Enterprise Linux catalog includes active exams and the current architect progression", () => {
    assert.deepEqual(
        paths.map(path => path.code).sort(),
        ["EX200", "EX210", "EX342", "EX358", "EX362", "EX403", "EX415", "EX436", "EX442", "RHCA"].sort(),
    );
    assert.ok(paths.find(path => path.code === "EX342")?.subtitle.includes("RHCE Enterprise Linux"));
    assert.ok(paths.find(path => path.code === "RHCA")?.description.includes("three eligible specialist"));
    const foundation = paths.find(path => path.code === "EX200");
    for (const id of runnableIds) assert.ok(foundation?.lessonIds.includes(id));
});

test("RHCSA starts with a source-linked installation guide and stable self-reported checkpoints", () => {
    const foundation = paths.find(path => path.code === "EX200")!;
    assert.equal(foundation.lessonIds[0], "rhel-installation");
    const installation = lessons[0];
    assert.equal(installation.id, "rhel-installation");
    assert.equal(installation.environment, "vm");
    assert.equal(installation.checkId, undefined);
    assert.match(installation.success, /^Self-review:/);
    assert.match(installation.explanation, /not explicitly listed in the current EX200 objectives/);
    officialUrl(installation.sourceUrl);
    assert.match(installation.sourceUrl, /interactively_installing_rhel_from_installation_media/);
    assert.ok(installation.steps.length >= 12);
    const ids = installation.steps.map(step => step.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) assert.match(id || "", /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);
    assert.deepEqual(ids, [
        "download-iso",
        "verify-iso",
        "configure-vm",
        "boot-install-media",
        "language-keyboard",
        "destination-storage",
        "software-source",
        "network-time",
        "administrator-account",
        "review-install",
        "boot-installed-system",
        "verify-installed-system",
        "prove-persistence",
    ]);
});

test("every suggested command is valid Bash syntax", () => {
    for (const lesson of lessons) {
        for (const step of lesson.steps) {
            if (!step.command) continue;
            const result = spawnSync("/bin/bash", ["-n", "-c", step.command], { encoding: "utf8" });
            assert.equal(result.status, 0, `${lesson.id}: ${result.stderr}`);
        }
    }
});

test("file exercise commands produce their promised results in a temporary workspace", () => {
    const directory = mkdtempSync(join(tmpdir(), "rhelboat-curriculum-"));
    try {
        for (const id of ["navigation", "permissions", "archive", "links", "text", "scripting"]) {
            const lesson = lessons.find(item => item.id === id)!;
            for (const step of lesson.steps) {
                if (!step.command) continue;
                const result = spawnSync("/bin/bash", ["-c", step.command.replaceAll("/root/lab", directory)], {
                    encoding: "utf8",
                });
                assert.equal(result.status, 0, `${id}: ${result.stderr}`);
            }
        }
        assert.equal(readFileSync(join(directory, "notes.txt"), "utf8"), "enterprise linux\n");
        assert.equal(statSync(join(directory, "private.txt")).mode & 0o777, 0o600);
        const archive = spawnSync("tar", ["-tzf", join(directory, "backup.tar.gz")], { encoding: "utf8" });
        assert.equal(archive.status, 0, archive.stderr);
        assert.ok(archive.stdout.split("\n").includes("notes.txt"));
        assert.equal(readlinkSync(join(directory, "latest")), join(directory, "notes.txt"));
        assert.equal(
            readFileSync(join(directory, "errors.log"), "utf8")
                .split("\n")
                .filter(line => line.includes("ERROR")).length,
            2,
        );
        assert.ok(statSync(join(directory, "hello.sh")).mode & 0o100);
        const script = spawnSync(join(directory, "hello.sh"), [], { encoding: "utf8" });
        assert.equal(script.status, 0, script.stderr);
        assert.equal(script.stdout, "hello enterprise linux\n");
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
});

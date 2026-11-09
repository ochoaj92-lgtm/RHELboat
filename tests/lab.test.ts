import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";
import { ContainerLab, supportedCheckIds, runtimeExecutable } from "../src/main/lab.ts";
import { lessons } from "../src/renderer/data/curriculum.ts";

test(
    "container lifecycle stays isolated and refuses foreign containers",
    { skip: process.platform === "win32" },
    async () => {
        const directory = await mkdtemp(join(tmpdir(), "rhelboat-test-"));
        const statePath = join(directory, "state.json");
        const logPath = join(directory, "calls.jsonl");
        const oldPath = process.env.PATH;
        const output: string[] = [];
        const lab = new ContainerLab(directory, chunk => output.push(chunk));
        try {
            await writeFile(
                join(directory, "podman"),
                `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2);
const print = value => fs.writeSync(1, value + '\\n');
const file = ${JSON.stringify(statePath)};
fs.appendFileSync(${JSON.stringify(logPath)}, JSON.stringify(args) + '\\n');
let state = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
const save = () => fs.writeFileSync(file, JSON.stringify(state));
if (args[0] === 'info') print('{}');
else if (args[0] === 'info') print('linux');
else if (args[0] === 'container' && args[1] === 'ls') print(state ? 'rhelboat-lab' : '');
else if (args[0] === 'container' && args[1] === 'inspect') print(JSON.stringify([state]));
else if (args[0] === 'build') print('Built fixture image');
else if (args[0] === 'run') { state = {Config: {Labels: {'io.rhelboat.lab': 'v1'}}, State: {Running: true}}; save(); }
else if (args[0] === 'start') { state.State.Running = true; save(); }
else if (args[0] === 'stop') { state.State.Running = false; save(); }
else if (args[0] === 'rm') { fs.unlinkSync(file); }
else if (args[0] === 'exec' && args.includes('--interactive')) {
    print('[root@rhelboat lab]# ');
    require('node:child_process').spawnSync('/bin/cat', {stdio: 'inherit'});
} else if (args[0] === 'exec') process.exit(state.failCheck ? 1 : 0);
else process.exit(2);
`,
                { mode: 0o755 },
            );
            process.env.PATH = `${directory}:${oldPath}`;

            assert.throws(() => lab.start("podman; echo unsafe" as never), /Choose Podman or Docker/);
            assert.throws(() => lab.write("id\n"), /Start the lab/);
            await assert.rejects(() => lab.check("toString"), /Unknown lab check/);
            assert.equal((await lab.status("podman")).state, "stopped");
            assert.equal((await lab.start("podman")).state, "running");
            assert.equal(JSON.parse(await readFile(statePath, "utf8")).State.Running, true);
            lab.write("pwd\n");
            assert.throws(() => lab.write("\0"), /null bytes/);
            assert.throws(() => lab.write("x".repeat(16_385)), /16384/);
            assert.deepEqual(supportedCheckIds.sort(), [
                "archive",
                "documentation",
                "edit-files",
                "environment",
                "find-files",
                "links",
                "navigation",
                "password-policy",
                "permissions",
                "processes",
                "scripting",
                "shared-directory",
                "shell-loops",
                "text",
                "users",
            ]);
            assert.equal((await lab.check("navigation")).passed, true);
            assert.equal((await lab.check("processes")).passed, true);
            const state = JSON.parse(await readFile(statePath, "utf8"));
            state.failCheck = true;
            await writeFile(statePath, JSON.stringify(state));
            assert.equal((await lab.check("navigation")).passed, false);

            assert.equal((await lab.stop()).state, "stopped");
            assert.equal(JSON.parse(await readFile(statePath, "utf8")).State.Running, false);
            assert.equal((await lab.start("podman")).state, "running");
            assert.equal((await lab.reset("podman")).state, "running");
            assert.equal((await lab.check("navigation")).passed, true);
            await lab.stop();

            const calls = (await readFile(logPath, "utf8"))
                .trim()
                .split("\n")
                .map(line => JSON.parse(line) as string[]);
            const run = calls.find(args => args[0] === "run")!;
            assert.equal(run[run.indexOf("--network") + 1], "none");
            assert.equal(run[run.indexOf("--cap-drop") + 1], "ALL");
            assert.equal(run.includes("--privileged"), false);
            assert.equal(
                run.some(arg => arg === "--volume" || arg === "-v" || arg === "--mount"),
                false,
            );
            assert.equal(run.includes("--memory"), true);
            assert.equal(
                calls.some(args => args.includes("pwd\n")),
                false,
                "shell input must never become a host command argument",
            );
            assert.equal(
                output.some(chunk => chunk.includes("Built fixture image")),
                true,
            );

            const processCheck = calls.find(args => args[0] === "exec" && args.at(-1)?.includes("pgrep"))!.at(-1)!;
            await writeFile(
                join(directory, "pgrep"),
                `#!${process.execPath}\nrequire('node:fs').writeSync(1, process.env.RHELBOAT_TEST_PIDS || '');\n`,
                { mode: 0o755 },
            );
            const execute = promisify(execFile);
            for (const pids of ["", "1\n"]) {
                await assert.rejects(
                    execute("/bin/bash", ["-c", processCheck], { env: { ...process.env, RHELBOAT_TEST_PIDS: pids } }),
                );
            }
            await execute("/bin/bash", ["-c", processCheck], {
                env: { ...process.env, RHELBOAT_TEST_PIDS: "1\n42\n" },
            });

            await writeFile(statePath, JSON.stringify({ Config: { Labels: {} }, State: { Running: true } }));
            const callCount = calls.length;
            assert.equal((await lab.start("podman")).state, "error");
            assert.match((await lab.reset("podman")).message, /belongs to another application/);
            assert.match((await lab.stop()).message, /belongs to another application/);
            const finalCalls = (await readFile(logPath, "utf8"))
                .trim()
                .split("\n")
                .slice(callCount)
                .map(line => JSON.parse(line) as string[]);
            assert.equal(
                finalCalls.some(args => ["rm", "stop", "start", "run"].includes(args[0])),
                false,
            );
        } finally {
            await lab.stop();
            process.env.PATH = oldPath;
            await rm(directory, { recursive: true, force: true });
        }
    },
);

test(
    "reset targets the selected runtime and protects an active lab on another runtime",
    { skip: process.platform === "win32" },
    async () => {
        const directory = await mkdtemp(join(tmpdir(), "rhelboat-runtime-test-"));
        const logPath = join(directory, "calls.jsonl");
        const oldPath = process.env.PATH;
        const lab = new ContainerLab(directory, () => undefined);
        const savedContainer = JSON.stringify({
            Config: { Labels: { "io.rhelboat.lab": "v1" } },
            State: { Running: false },
        });
        try {
            const fixture = `#!${process.execPath}
const fs = require('node:fs');
const runtime = require('node:path').basename(process.argv[1]);
const args = process.argv.slice(2);
const file = ${JSON.stringify(directory)} + '/' + runtime + '.json';
fs.appendFileSync(${JSON.stringify(logPath)}, JSON.stringify([runtime, ...args]) + '\\n');
let state = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
const save = () => fs.writeFileSync(file, JSON.stringify(state));
const print = value => fs.writeSync(1, value + '\\n');
if (args[0] === 'info') print('linux');
else if (args[0] === 'container' && args[1] === 'ls') print(state ? 'rhelboat-lab' : '');
else if (args[0] === 'container' && args[1] === 'inspect') print(JSON.stringify([state]));
else if (args[0] === 'rm') fs.unlinkSync(file);
else if (args[0] === 'run') { state = {Config: {Labels: {'io.rhelboat.lab': 'v1'}}, State: {Running: true}}; save(); }
else if (args[0] === 'stop') { state.State.Running = false; save(); }
else if (args[0] === 'exec') require('node:child_process').spawnSync('/bin/cat', {stdio: 'inherit'});
`;
            for (const runtime of ["podman", "docker"]) {
                await writeFile(join(directory, runtime), fixture, { mode: 0o755 });
                await writeFile(join(directory, `${runtime}.json`), savedContainer);
            }
            process.env.PATH = `${directory}:${oldPath}`;
            assert.throws(() => lab.reset("docker; echo unsafe" as never), /Choose Podman or Docker/);
            assert.equal((await lab.status("docker")).runtime, "docker");
            assert.equal((await lab.reset("docker")).state, "running");
            await assert.rejects(lab.reset("podman"), /Stop the current lab before changing runtime/);
            assert.equal(await readFile(join(directory, "podman.json"), "utf8"), savedContainer);
            const calls = (await readFile(logPath, "utf8"))
                .trim()
                .split("\n")
                .map(line => JSON.parse(line) as string[]);
            assert.equal(
                calls.every(args => args[0] === "docker"),
                true,
            );
            assert.equal(
                calls.some(args => args[1] === "rm"),
                true,
            );
        } finally {
            await lab.stop();
            process.env.PATH = oldPath;
            await rm(directory, { recursive: true, force: true });
        }
    },
);

test(
    "stop cancels an in-progress build before it can start a container",
    { timeout: 10_000, skip: process.platform === "win32" },
    async () => {
        const directory = await mkdtemp(join(tmpdir(), "rhelboat-cancel-test-"));
        const startedPath = join(directory, "building");
        const logPath = join(directory, "calls.jsonl");
        const oldPath = process.env.PATH;
        const lab = new ContainerLab(directory, () => undefined);
        try {
            await writeFile(
                join(directory, "podman"),
                `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(logPath)}, JSON.stringify(args) + '\\n');
if (args[0] === 'build') {
    fs.writeFileSync(${JSON.stringify(startedPath)}, 'building');
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 30000);
}
`,
                { mode: 0o755 },
            );
            process.env.PATH = `${directory}:${oldPath}`;
            const starting = lab.start("podman");
            let building = false;
            const deadline = Date.now() + 3000;
            while (!building && Date.now() < deadline) {
                building = await readFile(startedPath).then(
                    () => true,
                    () => false,
                );
                if (!building) await new Promise(resolve => setTimeout(resolve, 20));
            }
            assert.equal(building, true, "fixture build must be running before stop");
            const stoppedAt = Date.now();
            const stopping = lab.stop();
            assert.equal((await starting).message, "Lab start cancelled.");
            assert.equal((await stopping).state, "stopped");
            assert.ok(Date.now() - stoppedAt < 3000, "stop must not wait for the hanging build");
            const calls = (await readFile(logPath, "utf8"))
                .trim()
                .split("\n")
                .map(line => JSON.parse(line) as string[]);
            assert.equal(
                calls.some(args => args[0] === "run"),
                false,
            );

            const queuedStart = lab.start("podman");
            const queuedStop = lab.stop();
            assert.equal((await queuedStart).message, "Lab start cancelled.");
            await queuedStop;
            const finalCalls = (await readFile(logPath, "utf8"))
                .trim()
                .split("\n")
                .map(line => JSON.parse(line) as string[]);
            assert.equal(
                finalCalls.filter(args => args[0] === "build").length,
                1,
                "an already-cancelled queued start must not build",
            );
        } finally {
            await lab.stop();
            process.env.PATH = oldPath;
            await rm(directory, { recursive: true, force: true });
        }
    },
);

test(
    "live Podman shell and all checked workbook lesson objectives",
    { skip: process.env.RHELBOAT_LIVE_TEST !== "1", timeout: 180_000 },
    async () => {
        const execute = promisify(execFile);
        const existing = await execute("podman", ["container", "ls", "--all", "--format", "{{.Names}}"]);
        assert.equal(
            existing.stdout.split(/\r?\n/).includes("rhelboat-lab"),
            false,
            "Live test requires no existing rhelboat-lab; it must not replace your saved work.",
        );
        let output = "";
        const lab = new ContainerLab(join(import.meta.dirname, "../labs"), chunk => {
            output += chunk;
        });
        const command = async (text: string, sequence: number) => {
            const marker = `rhelboat-smoke:${sequence}`;
            lab.write(`${text}\nprintf 'rhelboat-smoke:%s\\n' ${sequence}\n`);
            const deadline = Date.now() + 10_000;
            while (!output.includes(marker) && Date.now() < deadline)
                await new Promise(resolve => setTimeout(resolve, 50));
            assert.equal(
                output.includes(marker),
                true,
                `Shell did not finish command ${sequence}: ${output.slice(-2000)}`,
            );
        };
        try {
            assert.equal((await lab.start("podman")).state, "running");
            for (const id of supportedCheckIds)
                assert.equal((await lab.check(id)).passed, false, `${id} must fail in a fresh lab`);
            let sequence = 0;
            for (const lesson of lessons.filter(lesson => lesson.checkId)) {
                for (const step of lesson.steps) if (step.command) await command(step.command, ++sequence);
                const result = await lab.check(lesson.checkId!);
                assert.equal(result.passed, true, `${lesson.id}: ${result.message}\n${output.slice(-2000)}`);
            }
            await command("cd /tmp", ++sequence);
            await command("pwd", ++sequence);
            assert.match(output, /\/tmp/);
        } finally {
            await lab.stop();
            const labels = await execute("podman", ["container", "inspect", "rhelboat-lab"]);
            const container = JSON.parse(labels.stdout)[0];
            if (container.Config.Labels["io.rhelboat.lab"] === "v1") await execute("podman", ["rm", "rhelboat-lab"]);
        }
    },
);

test("runtime launch uses Windows executables without a command shell", () => {
    assert.equal(runtimeExecutable("docker", "win32"), "docker.exe");
    assert.equal(runtimeExecutable("podman", "win32"), "podman.exe");
    assert.equal(runtimeExecutable("podman", "linux"), "podman");
    assert.throws(() => runtimeExecutable("docker & whoami" as never, "win32"), /Choose Podman or Docker/);
});

test(
    "a Windows container engine is rejected before building or changing a lab",
    { skip: process.platform === "win32" },
    async () => {
        const directory = await mkdtemp(join(tmpdir(), "rhelboat-windows-engine-"));
        const calls = join(directory, "calls.txt");
        const oldPath = process.env.PATH;
        try {
            await writeFile(
                join(directory, "docker"),
                `#!${process.execPath}
require('node:fs').appendFileSync(${JSON.stringify(calls)}, process.argv.slice(2).join(' ')+'\\n');
process.stdout.write('windows\\n');
`,
                { mode: 0o755 },
            );
            process.env.PATH = `${directory}:${oldPath}`;
            const lab = new ContainerLab(directory, () => {});
            assert.match((await lab.status("docker")).message, /Linux containers engine/);
            assert.equal((await lab.start("docker")).state, "error");
            const history = await readFile(calls, "utf8");
            assert.doesNotMatch(history, /^(?:build|run|rm|stop)(?:\s|$)/m);
        } finally {
            process.env.PATH = oldPath;
            await rm(directory, { recursive: true, force: true });
        }
    },
);

import { execFile, spawn, type ChildProcess, type ChildProcessWithoutNullStreams } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import type { CheckResult, LabStatus, Runtime } from "../shared/trainer.js";

const execute = promisify(execFile);
const CONTAINER = "rhelboat-lab";
const IMAGE = "localhost/rhelboat-lab:v1";
const LABEL_KEY = "io.rhelboat.lab";
const LABEL_VALUE = "v1";

const checks: Record<string, string> = {
    documentation:
        "test -s /root/lab/chmod-help.txt && grep -q -- --reference /root/lab/chmod-help.txt || { echo 'Save chmod help including its --reference option in chmod-help.txt.'; exit 1; }",
    environment:
        "test -f /root/lab/environment.txt && test \"$(cat /root/lab/environment.txt)\" = 'training shell' || { echo 'environment.txt must contain the exported child-shell value training shell.'; exit 1; }",
    "find-files":
        "test -f /root/lab/found-configs.txt && test \"$(cat /root/lab/found-configs.txt)\" = \"$(printf '%s\\n' /root/lab/search-lab/app.conf /root/lab/search-lab/nested/db.conf)\" || { echo 'Save exactly the two sorted configuration paths in found-configs.txt.'; exit 1; }",
    "edit-files":
        "test -f /root/lab/editor.conf && test \"$(cat /root/lab/editor.conf)\" = \"$(printf 'MODE=training\\nOWNER=trainee')\" || { echo 'editor.conf must have MODE=training followed by OWNER=trainee.'; exit 1; }",
    "shared-directory":
        "test -d /root/lab/team && test \"$(stat -c %a /root/lab/team)\" = 2770 && test -f /root/lab/team/team.txt && test \"$(stat -c '%a %G' /root/lab/team/team.txt)\" = '660 operators' || { echo 'Set team to mode 2770, then create team.txt with mode 660 and group operators.'; exit 1; }",
    "password-policy":
        "getent shadow trainee | awk -F: '$5 == 90 && $6 == 7 { found=1 } END { exit !found }' || { echo 'Set trainee password maximum age to 90 and warning interval to 7 with chage.'; exit 1; }",
    "shell-loops":
        "test -x /root/lab/names.sh && test \"$(/root/lab/names.sh)\" = \"$(printf 'alpha\\nbeta')\" || { echo 'names.sh must be executable and print alpha and beta on separate lines.'; exit 1; }",
    navigation:
        "if [ ! -f /root/lab/notes.txt ]; then echo 'Missing /root/lab/notes.txt file.'; exit 1; fi; grep -Fqx 'enterprise linux' /root/lab/notes.txt || { echo '/root/lab/notes.txt does not contain exact line \"enterprise linux\".'; exit 1; }",
    permissions:
        'if [ ! -f /root/lab/private.txt ]; then echo \'Missing /root/lab/private.txt file.\'; exit 1; fi; mode=$(stat -c %a /root/lab/private.txt); if [ "$mode" != "600" ]; then echo "File permissions are $mode, expected 600."; exit 1; fi',
    users: "if ! getent group operators >/dev/null; then echo \"Group 'operators' does not exist.\"; exit 1; fi; id -nG trainee 2>/dev/null | tr ' ' '\\n' | grep -qx operators || { echo \"User 'trainee' is not in group 'operators'.\"; exit 1; }",
    processes: "pgrep -x sleep | grep -qv '^1$' || { echo 'No background sleep process found.'; exit 1; }",
    archive:
        "if [ ! -f /root/lab/backup.tar.gz ]; then echo 'Missing /root/lab/backup.tar.gz file.'; exit 1; fi; tar -tzf /root/lab/backup.tar.gz 2>/dev/null | grep -Eq '^(\\./)?notes\\.txt$' || { echo 'Archive does not contain notes.txt.'; exit 1; }",
    links: "if [ ! -L /root/lab/latest ]; then echo '/root/lab/latest is not a symbolic link.'; exit 1; fi; target=$(readlink -f /root/lab/latest 2>/dev/null); if [ \"$target\" != \"/root/lab/notes.txt\" ]; then echo \"Link points to '$target', expected '/root/lab/notes.txt'.\"; exit 1; fi; test -f /root/lab/latest || { echo 'Link target does not exist.'; exit 1; }",
    text: 'if [ ! -f /root/lab/errors.log ]; then echo \'Missing /root/lab/errors.log file.\'; exit 1; fi; count=$(grep -c ERROR /root/lab/errors.log 2>/dev/null || true); if [ "$count" != "2" ]; then echo "Found $count lines matching ERROR, expected 2."; exit 1; fi',
    scripting:
        "if [ ! -f /root/lab/hello.sh ]; then echo 'Missing /root/lab/hello.sh script.'; exit 1; fi; if [ ! -x /root/lab/hello.sh ]; then echo '/root/lab/hello.sh is not executable (chmod +x).'; exit 1; fi; out=$(/root/lab/hello.sh 2>&1); if [ \"$out\" != \"hello enterprise linux\" ]; then echo \"Script output was '$out', expected 'hello enterprise linux'.\"; exit 1; fi",
};

export const supportedCheckIds = Object.keys(checks);

function requireRuntime(runtime: unknown): asserts runtime is Runtime {
    if (runtime !== "podman" && runtime !== "docker") throw new Error("Choose Podman or Docker.");
}

function errorMessage(error: unknown): string {
    const details = error as { code?: string; stderr?: string; message?: string };
    if (details.code === "ENOENT") return "Container runtime not found. Install Podman or Docker and restart RHELboat.";
    return String(details.stderr || details.message || error)
        .trim()
        .slice(-4000);
}

export class ContainerLab {
    private runtime: Runtime = "podman";
    private shell: ChildProcessWithoutNullStreams | null = null;
    private operations: Promise<unknown> = Promise.resolve();
    private startGeneration = 0;
    private activeBuild: ChildProcess | null = null;
    private current: LabStatus = { state: "stopped", runtime: "podman", message: "Start a lab to open a shell." };
    private contextDir: string;
    private emitOutput: (output: string) => void;

    constructor(contextDir: string, emitOutput: (output: string) => void) {
        this.contextDir = contextDir;
        this.emitOutput = emitOutput;
    }

    private enqueue<T>(operation: () => Promise<T>): Promise<T> {
        const next = this.operations.then(operation);
        this.operations = next.catch(() => undefined);
        return next;
    }

    private async run(runtime: Runtime, args: string[], timeout = 30_000): Promise<string> {
        const pending = execute(runtime, args, { timeout, maxBuffer: 2 * 1024 * 1024, encoding: "utf8" });
        if (args[0] === "build") this.activeBuild = pending.child;
        try {
            return (await pending).stdout;
        } finally {
            if (this.activeBuild === pending.child) this.activeBuild = null;
        }
    }

    private async inspect(runtime: Runtime): Promise<{ running: boolean } | null> {
        const names = await this.run(runtime, ["container", "ls", "--all", "--format", "{{.Names}}"]);
        if (!names.split(/\r?\n/).includes(CONTAINER)) return null;
        const result = JSON.parse(await this.run(runtime, ["container", "inspect", CONTAINER]));
        const container = result[0];
        if (container?.Config?.Labels?.[LABEL_KEY] !== LABEL_VALUE) {
            throw new Error(
                `A container named ${CONTAINER} belongs to another application. Rename it before starting this lab.`,
            );
        }
        return { running: container.State?.Running === true };
    }

    async status(runtime: Runtime): Promise<LabStatus> {
        requireRuntime(runtime);
        if (this.current.state === "starting") return { ...this.current };
        try {
            await this.run(runtime, ["info"], 15_000);
            const container = await this.inspect(runtime);
            if (runtime === this.runtime && this.shell && container?.running) return { ...this.current };
            return {
                state: "stopped",
                runtime,
                message: container
                    ? "Your lab is saved. Start to reconnect."
                    : "Runtime ready. Start your isolated lab.",
            };
        } catch (error) {
            return { state: "error", runtime, message: errorMessage(error) };
        }
    }

    start(runtime: Runtime): Promise<LabStatus> {
        requireRuntime(runtime);
        const generation = this.startGeneration;
        return this.enqueue(() => this.startLab(runtime, generation));
    }

    private assertStartActive(generation: number): void {
        if (generation !== this.startGeneration) throw new Error("Lab start cancelled.");
    }

    private async startLab(runtime: Runtime, generation: number): Promise<LabStatus> {
        if (generation !== this.startGeneration) return { state: "stopped", runtime, message: "Lab start cancelled." };
        if (this.shell) {
            if (runtime !== this.runtime) throw new Error("Stop the current lab before changing runtime.");
            return { ...this.current };
        }
        this.runtime = runtime;
        this.current = {
            state: "starting",
            runtime,
            message: "Preparing your UBI 10 lab. The first build downloads packages and may take several minutes.",
        };
        this.emitOutput(`${this.current.message}\n`);
        try {
            await this.run(runtime, ["info"], 15_000);
            this.assertStartActive(generation);
            const container = await this.inspect(runtime);
            this.assertStartActive(generation);
            if (!container) {
                const output = await this.run(
                    runtime,
                    ["build", "--tag", IMAGE, "--file", join(this.contextDir, "Containerfile"), this.contextDir],
                    600_000,
                );
                this.assertStartActive(generation);
                this.emitOutput(output.slice(-24_000));
                await this.run(runtime, [
                    "run",
                    "--detach",
                    "--name",
                    CONTAINER,
                    "--label",
                    `${LABEL_KEY}=${LABEL_VALUE}`,
                    "--hostname",
                    "rhelboat",
                    "--network",
                    "none",
                    "--pids-limit",
                    "128",
                    "--memory",
                    "768m",
                    "--cpus",
                    "1",
                    "--security-opt",
                    "no-new-privileges",
                    "--cap-drop",
                    "ALL",
                    "--cap-add",
                    "CHOWN",
                    "--cap-add",
                    "DAC_OVERRIDE",
                    "--cap-add",
                    "FOWNER",
                    "--cap-add",
                    "SETGID",
                    "--cap-add",
                    "SETUID",
                    IMAGE,
                ]);
            } else if (!container.running) {
                await this.run(runtime, ["start", CONTAINER]);
            }
            this.assertStartActive(generation);
            this.attachShell();
            this.current = {
                state: "running",
                runtime,
                message: "UBI 10 lab running · no host mounts · network isolated",
            };
        } catch (error) {
            this.current =
                generation === this.startGeneration
                    ? { state: "error", runtime, message: errorMessage(error) }
                    : { state: "stopped", runtime, message: "Lab start cancelled." };
            this.emitOutput(`\n${this.current.message}\n`);
        }
        return { ...this.current };
    }

    private attachShell(): void {
        const child = spawn(
            this.runtime,
            [
                "exec",
                "--interactive",
                "--env",
                "TERM=xterm-256color",
                "--env",
                "PS1=[root@rhelboat \\W]# ",
                "--workdir",
                "/root/lab",
                CONTAINER,
                "script",
                "--quiet",
                "--return",
                "--flush",
                "--command",
                "/bin/bash --noprofile --norc",
                "/dev/null",
            ],
            { stdio: ["pipe", "pipe", "pipe"] },
        );
        this.shell = child;
        child.stdout.on("data", chunk => this.emitOutput(chunk.toString().slice(-32_000)));
        child.stderr.on("data", chunk => this.emitOutput(chunk.toString().slice(-32_000)));
        child.stdin.on("error", error => this.emitOutput(`\n${errorMessage(error)}\n`));
        child.on("error", error => {
            this.emitOutput(`\n${errorMessage(error)}\n`);
            this.current = { state: "error", runtime: this.runtime, message: errorMessage(error) };
        });
        child.on("close", () => {
            if (this.shell !== child) return;
            this.shell = null;
            this.current = {
                state: "stopped",
                runtime: this.runtime,
                message: "Shell disconnected. Start the lab to reconnect.",
            };
            this.emitOutput("\nShell disconnected. Your files are saved until you reset the lab.\n");
        });
    }

    write(input: string): void {
        if (typeof input !== "string" || input.length === 0 || input.length > 16_384 || input.includes("\0")) {
            throw new Error("Shell input must contain 1–16384 characters and no null bytes.");
        }
        if (!this.shell || this.current.state !== "running") throw new Error("Start the lab before entering commands.");
        this.shell.stdin.write(input);
    }

    async check(checkId: string): Promise<CheckResult> {
        if (typeof checkId !== "string" || !Object.hasOwn(checks, checkId)) throw new Error("Unknown lab check.");
        if (!this.shell || this.current.state !== "running")
            throw new Error("Start the lab before checking your work.");
        try {
            const container = await this.inspect(this.runtime);
            if (!container?.running) throw new Error("Your lab is no longer running. Start it again.");
            await this.run(this.runtime, ["exec", CONTAINER, "/bin/bash", "-lc", checks[checkId]], 10_000);
            return { passed: true, message: "Objective verified in your container. Well done." };
        } catch (error) {
            const details = error as { code?: unknown; stdout?: string; stderr?: string };
            const hint = String(details.stdout || details.stderr || "").trim();
            if (typeof details.code === "number")
                return {
                    passed: false,
                    message:
                        hint ||
                        "The objective is not complete yet. Review the steps, inspect your result, then check again.",
                };
            throw error;
        }
    }

    private disconnect(): void {
        const child = this.shell;
        this.shell = null;
        child?.stdin.end();
        child?.kill();
    }

    stop(): Promise<LabStatus> {
        this.startGeneration++;
        this.activeBuild?.kill();
        return this.enqueue(async () => {
            this.disconnect();
            try {
                const container = await this.inspect(this.runtime);
                if (container?.running) await this.run(this.runtime, ["stop", "--time", "2", CONTAINER]);
                this.current = {
                    state: "stopped",
                    runtime: this.runtime,
                    message: "Lab stopped. Your files are saved.",
                };
            } catch (error) {
                this.current = { state: "error", runtime: this.runtime, message: errorMessage(error) };
            }
            return { ...this.current };
        });
    }

    reset(runtime: Runtime): Promise<LabStatus> {
        requireRuntime(runtime);
        const generation = this.startGeneration;
        return this.enqueue(async () => {
            if (this.shell && runtime !== this.runtime)
                throw new Error("Stop the current lab before changing runtime.");
            this.runtime = runtime;
            this.disconnect();
            try {
                if (await this.inspect(runtime)) await this.run(runtime, ["rm", "--force", CONTAINER]);
                return await this.startLab(runtime, generation);
            } catch (error) {
                this.current = { state: "error", runtime: this.runtime, message: errorMessage(error) };
                return { ...this.current };
            }
        });
    }
}

import { execFile, spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { access, chmod, lstat, mkdir, open, readFile, realpath, unlink, writeFile } from "node:fs/promises";
import { createConnection } from "node:net";
import { basename, extname, isAbsolute, join, resolve } from "node:path";
import { promisify } from "node:util";
import type { ISOInfo, VMCapabilities, VMOptions, VMStatus } from "../shared/installation.js";

const execute = promisify(execFile);
const OWNER = "RHELboat installation VM v1";
const NAME = "RHELboat-installation";
type Manifest = { owner: string; uuid: string; diskGiB: number };
type Stamp = { size: number; mtimeMs: number; ctimeMs: number; ino: number; dev: number };

function message(error: unknown): string {
    const details = error as { code?: string; stderr?: string; message?: string };
    if (details.code === "ENOENT") return "Install qemu-system-x86_64 and qemu-img, then try again.";
    return String(details.stderr || details.message || error).trim().slice(-4000);
}

function offline(error: unknown): boolean {
    return ["ENOENT", "ECONNREFUSED"].includes(String((error as { code?: string }).code));
}

function validate(options: VMOptions): void {
    if (!options || typeof options !== "object") throw new Error("Choose the VM configuration first.");
    for (const [key, min, max] of [["memoryMiB", 2048, 16384], ["cpus", 1, 8], ["diskGiB", 20, 200]] as const) {
        if (!Number.isInteger(options[key]) || options[key] < min || options[key] > max) {
            throw new Error(`${key} must be a whole number from ${min} to ${max}.`);
        }
    }
    if (options.acceleration !== "kvm" && options.acceleration !== "tcg") throw new Error("Choose KVM or software emulation.");
    if (options.boot !== "iso" && options.boot !== "disk") throw new Error("Choose installation ISO or installed disk.");
    if (options.boot === "iso" && (typeof options.expectedChecksum !== "string" || !/^[a-f\d]{64}$/i.test(options.expectedChecksum.trim()))) {
        throw new Error("Paste the 64-character SHA-256 checksum for your ISO from Red Hat's download page.");
    }
}

function sameFile(first: Stamp, second: Stamp): boolean {
    return first.size === second.size && first.mtimeMs === second.mtimeMs && first.ctimeMs === second.ctimeMs && first.ino === second.ino && first.dev === second.dev;
}

export function buildQEMUArguments(directory: string, manifest: Manifest, options: VMOptions, isoPath?: string, display: "gtk" | "none" = "gtk"): string[] {
    validate(options);
    const args = [
        "-name", NAME, "-uuid", manifest.uuid, "-machine", "q35",
        "-accel", options.acceleration, "-cpu", options.acceleration === "kvm" ? "host" : "max",
        "-m", String(options.memoryMiB), "-smp", String(options.cpus),
        "-display", display, "-monitor", "none", "-serial", "none", "-parallel", "none",
        "-qmp", `unix:${join(directory, "control.sock")},server=on,wait=off`,
        "-nic", "user,model=virtio-net-pci", "-boot", "menu=on",
        "-blockdev", JSON.stringify({ driver: "file", filename: join(directory, "disk.qcow2"), "node-name": "disk-file" }),
        "-blockdev", JSON.stringify({ driver: "qcow2", file: "disk-file", "node-name": "disk" }),
        "-device", `virtio-blk-pci,drive=disk,bootindex=${options.boot === "iso" ? "2" : "1"}`,
    ];
    if (options.boot === "iso") {
        if (!isoPath) throw new Error("Select a downloaded RHEL ISO first.");
        args.push(
            "-blockdev", JSON.stringify({ driver: "file", filename: isoPath, "node-name": "iso-file", "read-only": true }),
            "-blockdev", JSON.stringify({ driver: "raw", file: "iso-file", "node-name": "iso", "read-only": true }),
            "-device", "virtio-scsi-pci,id=scsi", "-device", "scsi-cd,drive=iso,bus=scsi.0,bootindex=1",
        );
    }
    return args;
}

export class InstallationVM {
    private directory: string;
    private iso: { info: ISOInfo; stamp: Stamp } | null = null;
    private operations: Promise<unknown> = Promise.resolve();
    private display: "gtk" | "none";
    // Headless display is used by the opt-in QEMU smoke test, never exposed through IPC.
    constructor(directory: string, display: "gtk" | "none" = "gtk") {
        this.directory = resolve(directory);
        this.display = display;
    }

    private enqueue<T>(operation: () => Promise<T>): Promise<T> {
        const next = this.operations.then(operation);
        this.operations = next.catch(() => undefined);
        return next;
    }

    private async checkDirectory(create = false): Promise<boolean> {
        // shortcut: QMP's Unix socket path is bounded; relocate user data for unusually long paths.
        if (this.directory.includes(",") || Buffer.byteLength(join(this.directory, "control.sock")) > 100) {
            throw new Error("The installation VM data path must be shorter than 100 bytes and contain no commas.");
        }
        if (create) await mkdir(this.directory, { recursive: true, mode: 0o700 });
        let info;
        try { info = await lstat(this.directory); } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return false; throw error; }
        if (!info.isDirectory() || info.isSymbolicLink() || (process.getuid && info.uid !== process.getuid())) {
            throw new Error("The installation VM directory must be a directory owned by your account, not a symbolic link.");
        }
        if (create) await chmod(this.directory, 0o700);
        return true;
    }

    private async disk(): Promise<Manifest | null> {
        if (!await this.checkDirectory()) return null;
        let info;
        try { info = await lstat(join(this.directory, "disk.qcow2")); } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
        if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1 || (process.getuid && info.uid !== process.getuid())) {
            throw new Error("Refusing a linked or non-regular training disk.");
        }
        const path = join(this.directory, "owner.json");
        const meta = await lstat(path).catch(() => null);
        if (!meta?.isFile() || meta.isSymbolicLink() || meta.size > 4096) throw new Error("This disk is not owned by the RHELboat installation lab.");
        const manifest = JSON.parse(await readFile(path, "utf8")) as Manifest;
        if (manifest.owner !== OWNER || !/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(manifest.uuid) || !Number.isInteger(manifest.diskGiB) || manifest.diskGiB < 20 || manifest.diskGiB > 200) {
            throw new Error("This disk is not owned by the RHELboat installation lab.");
        }
        return manifest;
    }

    async capabilities(): Promise<VMCapabilities> {
        if (process.platform !== "linux") return { available: false, kvm: false, message: "The installation VM currently requires a Linux host with QEMU." };
        const kvm = process.arch === "x64" && await access("/dev/kvm", constants.R_OK | constants.W_OK).then(() => true, () => false);
        try {
            await execute("qemu-img", ["--version"], { timeout: 5000 });
            const result = await execute("qemu-system-x86_64", ["-display", "help"], { timeout: 5000 });
            if (this.display === "gtk" && !/^gtk$/m.test(result.stdout)) throw new Error("Install QEMU's GTK display support to open the VM console.");
            return { available: true, kvm, message: kvm ? "QEMU and KVM are ready. RHEL 10 also requires an x86-64-v3-compatible host CPU." : "QEMU is ready. KVM is unavailable; software emulation is slower." };
        } catch (error) { return { available: false, kvm, message: message(error) }; }
    }

    selectISO(path: string): Promise<ISOInfo> {
        return this.enqueue(async () => {
            if (typeof path !== "string" || !isAbsolute(path) || path.includes("\0") || extname(path).toLowerCase() !== ".iso") throw new Error("Select a local .iso file.");
            const canonical = await realpath(path);
            const selected = await lstat(canonical);
            if (!selected.isFile() || selected.size < 1024 * 1024) throw new Error("Select a complete RHEL installation ISO, not a device or partial download.");
            const file = await open(canonical, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
            try {
                const before = await file.stat();
                if (!before.isFile() || before.size < 1024 * 1024) throw new Error("Select a complete RHEL installation ISO, not a device or partial download.");
                const header = Buffer.alloc(7);
                await file.read(header, 0, header.length, 16 * 2048);
                if (header.subarray(1, 6).toString() !== "CD001" || header[6] !== 1) throw new Error("The selected file is not an ISO9660 installation image.");
                const hash = createHash("sha256");
                for await (const chunk of file.createReadStream({ start: 0, autoClose: false })) hash.update(chunk);
                if (!sameFile(before, await file.stat())) throw new Error("The ISO changed while being checked. Wait for the download to finish, then select it again.");
                const info = { name: basename(canonical), path: canonical, sizeBytes: before.size, sha256: hash.digest("hex") };
                this.iso = { info, stamp: before };
                return { ...info };
            } finally { await file.close(); }
        });
    }

    private qmp(manifest: Manifest, command: "query-status" | "system_powerdown"): Promise<{ running?: boolean; status?: string }> {
        return new Promise((resolve, reject) => {
            const socket = createConnection(join(this.directory, "control.sock"));
            let buffer = "";
            let stage = "greeting";
            const finish = (error?: Error, result?: { running?: boolean; status?: string }) => {
                clearTimeout(timer);
                socket.removeAllListeners();
                socket.destroy();
                if (error) reject(error); else resolve(result || {});
            };
            const timer = setTimeout(() => finish(new Error("The VM control connection timed out. Use its console to check its state.")), 2500);
            const send = (execute: string) => { stage = execute; socket.write(JSON.stringify({ execute, id: execute }) + "\n"); };
            socket.on("error", error => finish(error));
            socket.on("end", () => finish(new Error("The VM control connection closed unexpectedly.")));
            socket.on("data", chunk => {
                buffer += chunk.toString();
                if (buffer.length > 65536) { finish(new Error("Invalid VM control response.")); return; }
                let boundary;
                while ((boundary = buffer.indexOf("\n")) !== -1) {
                    const line = buffer.slice(0, boundary).trim();
                    buffer = buffer.slice(boundary + 1);
                    if (!line) continue;
                    try {
                        const reply = JSON.parse(line);
                        if (stage === "greeting") {
                            if (!reply.QMP) throw new Error("Invalid VM control greeting.");
                            send("qmp_capabilities");
                        } else if (reply.id === stage) {
                            if (reply.error) throw new Error(reply.error.desc || "VM control command failed.");
                            if (stage === "qmp_capabilities") send("query-name");
                            else if (stage === "query-name") {
                                if (reply.return?.name !== NAME) throw new Error("Refusing to control a VM that is not owned by this installation lab.");
                                send("query-uuid");
                            } else if (stage === "query-uuid") {
                                if (reply.return?.UUID?.toLowerCase() !== manifest.uuid.toLowerCase()) throw new Error("Refusing to control a VM that is not owned by this installation lab.");
                                send(command);
                            } else { finish(undefined, reply.return); return; }
                        }
                    } catch (error) { finish(error as Error); return; }
                }
            });
        });
    }

    async status(): Promise<VMStatus> {
        let manifest: Manifest | null = null;
        try {
            manifest = await this.disk();
            if (!manifest) return { state: "stopped", diskExists: false, message: "Choose and verify a RHEL ISO to create your installation VM." };
            const response = await this.qmp(manifest, "query-status");
            return { state: "running", diskExists: true, diskGiB: manifest.diskGiB, message: response.running ? "The installation VM is running in its QEMU console." : `The VM console is open (${response.status || "paused"}).` };
        } catch (error) {
            if (offline(error)) return { state: "stopped", diskExists: !!manifest, diskGiB: manifest?.diskGiB, message: "VM stopped. Its training disk is saved." };
            return { state: "error", diskExists: !!manifest, diskGiB: manifest?.diskGiB, message: message(error) };
        }
    }

    private async prepareDisk(size: number): Promise<Manifest> {
        await this.checkDirectory(true);
        const existing = await this.disk();
        if (existing) return existing;
        const path = join(this.directory, "disk.qcow2");
        const marker = join(this.directory, "owner.json");
        await access(marker).then(() => { throw new Error("An existing installation VM record has no disk. Restore the disk before continuing."); }, error => { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; });
        const reservation = await open(path, "wx", 0o600);
        await reservation.close();
        try {
            await execute("qemu-img", ["create", "-f", "qcow2", path, `${size}G`], { timeout: 30_000, maxBuffer: 65536 });
            const manifest = { owner: OWNER, uuid: randomUUID(), diskGiB: size };
            await writeFile(marker, JSON.stringify(manifest), { flag: "wx", mode: 0o600 });
            return manifest;
        } catch (error) { await unlink(path); throw error; }
    }

    start(options: VMOptions): Promise<VMStatus> {
        return this.enqueue(async () => {
            validate(options);
            const current = await this.status();
            if (current.state === "running") return current;
            if (current.state === "error") throw new Error(current.message);
            const capability = await this.capabilities();
            if (!capability.available) throw new Error(capability.message);
            if (options.acceleration === "kvm" && !capability.kvm) throw new Error("KVM is unavailable. Enable host virtualization or explicitly choose slower software emulation.");
            if (options.boot === "iso") {
                if (!this.iso) throw new Error("Select a downloaded RHEL ISO first.");
                const info = await lstat(this.iso.info.path);
                if (!info.isFile() || info.isSymbolicLink() || !sameFile(info, this.iso.stamp)) throw new Error("The ISO changed. Select it again before booting.");
                if (this.iso.info.sha256 !== options.expectedChecksum.trim().toLowerCase()) throw new Error("The SHA-256 does not match Red Hat's checksum. Do not boot this ISO; check the download and release selection.");
            } else if (!current.diskExists) throw new Error("Install RHEL from an ISO before booting the training disk.");
            const manifest = await this.prepareDisk(options.diskGiB);
            const diskInfo = JSON.parse((await execute("qemu-img", ["info", "--output=json", join(this.directory, "disk.qcow2")], { timeout: 10_000, maxBuffer: 65536 })).stdout);
            if (diskInfo.format !== "qcow2" || diskInfo["virtual-size"] !== manifest.diskGiB * 1024 ** 3 || diskInfo["backing-filename"] || diskInfo["full-backing-filename"] || diskInfo["format-specific"]?.data?.["data-file"]) throw new Error("The training disk must be the original-size standalone qcow2 image without external files.");
            const socketPath = join(this.directory, "control.sock");
            const stale = await lstat(socketPath).catch(() => null);
            if (stale) {
                if (!stale.isSocket() || (process.getuid && stale.uid !== process.getuid())) throw new Error("Refusing to replace an unexpected VM control file.");
                try {
                    await this.qmp(manifest, "query-status");
                    throw new Error("The VM is already running. Use its existing console.");
                } catch (error) { if (!offline(error)) throw error; }
                await unlink(socketPath);
            }
            const logPath = join(this.directory, "qemu.log");
            const oldLog = await lstat(logPath).catch(() => null);
            if (oldLog && (!oldLog.isFile() || oldLog.nlink !== 1 || (process.getuid && oldLog.uid !== process.getuid()))) throw new Error("Refusing to overwrite a linked or non-regular VM log.");
            const log = await open(logPath, constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | constants.O_NOFOLLOW, 0o600);
            let child;
            try {
                child = spawn("qemu-system-x86_64", buildQEMUArguments(this.directory, manifest, options, options.boot === "iso" ? this.iso!.info.path : undefined, this.display), { detached: true, stdio: ["ignore", log.fd, log.fd] });
                let failure: Error | undefined;
                child.once("error", error => { failure = error; });
                child.unref();
                const deadline = Date.now() + 10_000;
                while (Date.now() < deadline) {
                    if (failure) throw failure;
                    if (child.exitCode !== null || child.signalCode !== null) {
                        const file = await open(logPath, "r");
                        let details = "";
                        try { const info = await file.stat(); const text = Buffer.alloc(Math.min(4000, info.size)); await file.read(text, 0, text.length, Math.max(0, info.size - text.length)); details = text.toString().trim(); } finally { await file.close(); }
                        throw new Error(details || "QEMU closed before opening its console. Check that a desktop display is available.");
                    }
                    try {
                        await this.qmp(manifest, "query-status");
                        return { state: "running", diskExists: true, diskGiB: manifest.diskGiB, message: "VM console opened. Follow the installation steps here; the VM remains open if you close RHELboat." };
                    } catch (error) { if (!offline(error)) throw error; }
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                throw new Error("QEMU did not open its control socket. Check its console and the VM log in the application data folder.");
            } catch (error) {
                // Only a process created by this failed start can be terminated here.
                child?.kill();
                throw error;
            } finally { await log.close(); }
        });
    }

    shutdown(): Promise<VMStatus> {
        return this.enqueue(async () => {
            const current = await this.status();
            if (current.state !== "running") return current;
            const manifest = (await this.disk())!;
            await this.qmp(manifest, "system_powerdown");
            return { ...current, message: "Shutdown requested. The installer may ignore ACPI; finish or shut down from the VM console. Your disk is kept." };
        });
    }
}

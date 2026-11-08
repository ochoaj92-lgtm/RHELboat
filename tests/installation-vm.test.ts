import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile, rm, symlink, rename, stat } from "node:fs/promises";
import { createConnection, createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { InstallationVM, buildQEMUArguments } from "../src/main/installation-vm.ts";
import type { VMOptions } from "../src/shared/installation.js";

const defaults: VMOptions = { memoryMiB: 4096, cpus: 2, diskGiB: 40, acceleration: "tcg", boot: "iso", expectedChecksum: "" };

async function createISO(directory: string): Promise<{ path: string; checksum: string }> {
    const bytes = Buffer.alloc(2 * 1024 * 1024);
    bytes[16 * 2048] = 1;
    bytes.write("CD001", 16 * 2048 + 1);
    bytes[16 * 2048 + 6] = 1;
    const path = join(directory, "training, boot.iso");
    await writeFile(path, bytes);
    return { path, checksum: createHash("sha256").update(bytes).digest("hex") };
}

async function waitStopped(vm: InstallationVM): Promise<void> {
    const deadline = Date.now() + 3000;
    while (Date.now() < deadline) {
        if ((await vm.status()).state === "stopped") return;
        await new Promise(resolve => setTimeout(resolve, 20));
    }
    assert.fail("Temporary test VM did not stop.");
}

test("ISO verification, explicit VM resources, persistent disks and graceful lifecycle", async () => {
    const directory = await mkdtemp(join(tmpdir(), "rhelboat-vm-"));
    const data = join(directory, "vm");
    const calls = join(directory, "calls.jsonl");
    const oldPath = process.env.PATH;
    const vm = new InstallationVM(data);
    try {
        await writeFile(join(directory, "qemu-img"), `#!${process.execPath}
const fs=require('node:fs'); const args=process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(calls)},JSON.stringify(['image',...args])+'\\n');
if(args[0]==='create')fs.writeFileSync(args[3],JSON.stringify({format:'qcow2','virtual-size':Number(args[4].slice(0,-1))*1024**3}));
else if(args[0]==='info')process.stdout.write(fs.readFileSync(args[2]));
else if(args[0]==='--version')process.stdout.write('QEMU fixture');
else process.exit(2);
`, { mode: 0o755 });
        await writeFile(join(directory, "qemu-system-x86_64"), `#!${process.execPath}
const fs=require('node:fs'); const net=require('node:net'); const args=process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(calls)},JSON.stringify(['qemu',...args])+'\\n');
if(args[0]==='-display'){process.stdout.write('Available display backend types:\\nnone\\ngtk\\n');process.exit();}
const name=args[args.indexOf('-name')+1]; const uuid=args[args.indexOf('-uuid')+1];
const socketPath=args[args.indexOf('-qmp')+1].slice(5).split(',')[0];
const server=net.createServer(socket=>{
 socket.write('{"QMP":'); setTimeout(()=>socket.write('{"version":{},"capabilities":[]}}\\r\\n'),2);
 let buffer=''; socket.on('data',chunk=>{
  buffer+=chunk; let boundary;
  while((boundary=buffer.indexOf('\\n'))!==-1){
   const request=JSON.parse(buffer.slice(0,boundary));buffer=buffer.slice(boundary+1);
   fs.appendFileSync(${JSON.stringify(calls)},JSON.stringify(['qmp',request.execute])+'\\n');
   let value={};
   if(request.execute==='query-name')value={name};
   if(request.execute==='query-uuid')value={UUID:uuid};
   if(request.execute==='query-status')value={running:true,status:'running'};
   socket.write(JSON.stringify({event:'FIXTURE'})+'\\r\\n'+JSON.stringify({return:value,id:request.id})+'\\r\\n');
   if(request.execute==='system_powerdown')setTimeout(()=>process.exit(),20);
  }
 });
});server.listen(socketPath);
`, { mode: 0o755 });
        process.env.PATH = `${directory}:${oldPath}`;
        const iso = await createISO(directory);
        await assert.rejects(vm.selectISO("/dev/sda"), /local .iso/);
        await writeFile(join(directory, "partial.iso"), "partial");
        await assert.rejects(vm.selectISO(join(directory, "partial.iso")), /complete RHEL/);
        const invalid = Buffer.alloc(2 * 1024 * 1024);
        await writeFile(join(directory, "invalid.iso"), invalid);
        await assert.rejects(vm.selectISO(join(directory, "invalid.iso")), /ISO9660/);
        const selected = await vm.selectISO(iso.path);
        assert.equal(selected.sha256, iso.checksum);
        assert.equal(selected.sizeBytes, 2 * 1024 * 1024);
        const capabilities = await vm.capabilities();
        assert.equal(capabilities.available, true, capabilities.message);
        await assert.rejects(vm.start({ ...defaults, cpus: 1.5 }), /whole number/);
        await assert.rejects(vm.start({ ...defaults, acceleration: "kvm; touch unsafe" as never }), /KVM or software/);
        await assert.rejects(vm.start({ ...defaults, expectedChecksum: "00" }), /64-character/);
        await assert.rejects(vm.start({ ...defaults, expectedChecksum: "0".repeat(64) }), /does not match/);
        assert.equal((await vm.status()).diskExists, false);

        const options = { ...defaults, expectedChecksum: iso.checksum };
        assert.equal((await vm.start(options)).state, "running");
        assert.equal((await stat(data)).mode & 0o777, 0o700);
        const diskBefore = await readFile(join(data, "disk.qcow2"), "utf8");
        const reconnected = new InstallationVM(data);
        assert.equal((await reconnected.status()).state, "running");
        assert.match((await reconnected.shutdown()).message, /Shutdown requested/);
        await waitStopped(vm);
        assert.equal((await vm.status()).diskExists, true);
        assert.equal(await readFile(join(data, "disk.qcow2"), "utf8"), diskBefore);
        assert.equal((await reconnected.start({ ...defaults, boot: "disk" })).state, "running");
        await reconnected.shutdown();
        await waitStopped(vm);

        const history = (await readFile(calls, "utf8")).trim().split("\n").map(line => JSON.parse(line) as string[]);
        const launches = history.filter(args => args[0] === "qemu" && args.includes("-name"));
        assert.equal(launches.length, 2);
        const first = launches[0];
        assert.equal(first[first.indexOf("-accel") + 1], "tcg");
        assert.equal(first[first.indexOf("-cpu") + 1], "max");
        assert.equal(first.some(arg => /hostfwd|virtfs|9p|\/dev\//.test(arg)), false);
        const blocks = first.flatMap((arg, index) => arg === "-blockdev" ? [JSON.parse(first[index + 1])] : []);
        assert.ok(blocks.some(block => block.filename === iso.path && block["read-only"] === true));
        assert.equal(launches[1].some(arg => arg.includes(iso.path)), false, "Booting the disk must detach installation media.");
        assert.equal(history.filter(args => args[0] === "image" && args[1] === "create").length, 1);

        await rename(join(data, "disk.qcow2"), join(directory, "saved.qcow2"));
        await symlink(join(directory, "saved.qcow2"), join(data, "disk.qcow2"));
        assert.match((await vm.status()).message, /linked or non-regular/);
        await assert.rejects(vm.start({ ...defaults, boot: "disk" }), /linked or non-regular/);
        assert.equal(await readFile(join(directory, "saved.qcow2"), "utf8"), diskBefore);
    } finally {
        await vm.shutdown();
        process.env.PATH = oldPath;
        await rm(directory, { recursive: true, force: true });
    }
});

test("VM control verifies both name and UUID before requesting shutdown", async () => {
    const directory = await mkdtemp(join(tmpdir(), "rhelboat-vm-owner-"));
    const uuid = randomUUID();
    await writeFile(join(directory, "disk.qcow2"), "owned test disk");
    await writeFile(join(directory, "owner.json"), JSON.stringify({ owner: "RHELboat installation VM v1", uuid, diskGiB: 40 }));
    const commands: string[] = [];
    const server = createServer(socket => {
        socket.write(JSON.stringify({ QMP: { version: {}, capabilities: [] } }) + "\r\n");
        let buffer = "";
        socket.on("data", chunk => {
            buffer += chunk;
            let boundary;
            while ((boundary = buffer.indexOf("\n")) !== -1) {
                const request = JSON.parse(buffer.slice(0, boundary));
                buffer = buffer.slice(boundary + 1);
                commands.push(request.execute);
                const value = request.execute === "query-name" ? { name: "RHELboat-installation" } : request.execute === "query-uuid" ? { UUID: randomUUID() } : {};
                socket.write(JSON.stringify({ return: value, id: request.id }) + "\r\n");
            }
        });
    });
    try {
        await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(join(directory, "control.sock"), resolve); });
        const vm = new InstallationVM(directory);
        assert.match((await vm.status()).message, /not owned/);
        assert.equal((await vm.shutdown()).state, "error");
        assert.equal(commands.includes("query-uuid"), true);
        assert.equal(commands.includes("system_powerdown"), false);
    } finally {
        await new Promise<void>(resolve => server.close(() => resolve()));
        await rm(directory, { recursive: true, force: true });
    }
});

test("argument construction keeps paths as JSON values and requires deliberate acceleration", () => {
    const manifest = { owner: "RHELboat installation VM v1", uuid: randomUUID(), diskGiB: 40 };
    const iso = '/tmp/disk,name with "quotes".iso';
    const args = buildQEMUArguments("/tmp/rhelboat", manifest, { ...defaults, expectedChecksum: "a".repeat(64), acceleration: "kvm" }, iso);
    assert.equal(args[args.indexOf("-cpu") + 1], "host");
    assert.equal(args[args.indexOf("-display") + 1], "gtk");
    assert.ok(args.some(arg => arg.startsWith("{") && JSON.parse(arg).filename === iso));
    assert.equal(args.includes("-enable-kvm"), false);
    assert.throws(() => buildQEMUArguments("/tmp/rhelboat", manifest, { ...defaults, memoryMiB: 1 }), /whole number/);
});

test("real headless QEMU starts a temporary disk and survives backend reconnection", { skip: process.env.RHELBOAT_QEMU_TEST !== "1", timeout: 30_000 }, async () => {
    const directory = await mkdtemp(join(tmpdir(), "rhelboat-real-vm-"));
    const vm = new InstallationVM(directory, "none");
    try {
        const iso = await createISO(directory);
        await vm.selectISO(iso.path);
        assert.equal((await vm.start({ ...defaults, memoryMiB: 2048, cpus: 1, expectedChecksum: iso.checksum })).state, "running");
        assert.equal((await new InstallationVM(directory, "none").status()).state, "running");
        assert.match((await vm.shutdown()).message, /Shutdown requested/);
    } finally {
        // This firmware-only smoke test has no guest OS to handle ACPI, so terminate only its private monitor.
        await new Promise<void>((resolve, reject) => {
            const socket = createConnection(join(directory, "control.sock"));
            let ready = false;
            let buffer = "";
            socket.on("error", error => { if ((error as NodeJS.ErrnoException).code === "ENOENT") resolve(); else reject(error); });
            socket.on("close", () => resolve());
            socket.on("data", chunk => {
                buffer += chunk;
                let boundary;
                while ((boundary = buffer.indexOf("\n")) !== -1) {
                    const reply = JSON.parse(buffer.slice(0, boundary));
                    buffer = buffer.slice(boundary + 1);
                    if (reply.QMP) socket.write('{"execute":"qmp_capabilities","id":"cap"}\n');
                    else if (reply.id === "cap" && !ready) { ready = true; socket.write('{"execute":"quit"}\n'); }
                }
            });
        });
        await rm(directory, { recursive: true, force: true });
    }
});

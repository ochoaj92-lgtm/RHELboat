import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

assert.equal(process.platform, "win32", "Run this smoke test on a Windows host.");
assert.ok(process.argv[2], "Pass the path to the installed RHELboat.exe.");
const profile = await mkdtemp(join(tmpdir(), "rhelboat-windows-smoke-"));
const server = createServer();
server.listen(0, "127.0.0.1");
await once(server, "listening");
const port = server.address().port;
await new Promise(resolve => server.close(resolve));
const child = spawn(
    resolve(process.argv[2]),
    [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--disable-gpu"],
    { stdio: "ignore" },
);
let launchError;
child.on("error", error => {
    launchError = error;
});
let socket;
try {
    let target;
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
        if (launchError) throw launchError;
        assert.equal(child.exitCode, null, "The installed app exited before loading.");
        const targets = await fetch(`http://127.0.0.1:${port}/json/list`)
            .then(r => r.json())
            .catch(() => []);
        target = targets.find(item => item.type === "page" && item.url.startsWith("file:"));
        if (target) break;
        await delay(150);
    }
    assert.ok(target, "The installed app did not expose a renderer.");
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await once(socket, "open");
    let id = 0;
    async function evaluate(expression) {
        const request = ++id;
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                socket.removeEventListener("message", listener);
                reject(new Error("Renderer evaluation timed out."));
            }, 10000);
            function listener(event) {
                const reply = JSON.parse(event.data);
                if (reply.id !== request) return;
                clearTimeout(timer);
                socket.removeEventListener("message", listener);
                if (reply.error || reply.result?.exceptionDetails) reject(new Error(JSON.stringify(reply)));
                else resolve(reply.result.result.value);
            }
            socket.addEventListener("message", listener);
            socket.send(
                JSON.stringify({
                    id: request,
                    method: "Runtime.evaluate",
                    params: { expression, returnByValue: true, awaitPromise: true },
                }),
            );
        });
    }
    let state;
    while (Date.now() < deadline) {
        state = await evaluate(
            `({ platform: window.trainer?.platform, categories: document.querySelectorAll('.path-nav button').length, workbook: typeof window.trainer?.openWorkbook, title: document.title })`,
        );
        if (state.categories === 10) break;
        await delay(100);
    }
    assert.equal(state.platform, "win32");
    assert.equal(state.categories, 10);
    assert.equal(state.workbook, "function");
    assert.match(state.title, /RHELboat/);
    await evaluate(
        `{ const select = document.querySelector('#lesson-select'); select.value = 'navigation'; select.dispatchEvent(new Event('change', { bubbles: true })); }`,
    );
    const runtime = await evaluate(
        `new Promise(resolve => setTimeout(() => resolve(document.querySelector('.runtime-select select')?.value), 100))`,
    );
    assert.equal(runtime, "docker", "Windows must default to Docker Desktop.");
    const rejected = await evaluate(`window.trainer.openWorkbook('../not-a-workbook').then(() => false, () => true)`);
    assert.equal(rejected, true);
    console.log("Installed Windows app loaded its lessons, native preload, Docker default and workbook validation.");
} finally {
    socket?.close();
    // The smoke app never starts a lab; terminate only this temporary-profile process.
    if (child.pid && child.exitCode === null) {
        const exited = once(child, "exit");
        child.kill();
        await exited.catch(() => {});
    }
    await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}

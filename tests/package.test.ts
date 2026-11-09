import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const asar = require("@electron/asar");
const verify = require("../scripts/verify-package.cjs");

test("package verification rejects repository metadata, personal PDFs and broken entry points", async () => {
    const directory = await mkdtemp(join(tmpdir(), "rhelboat-package-"));
    const input = join(directory, "input");
    const resources = join(directory, "output", "resources");
    const context = { appOutDir: join(directory, "output"), packager: { getResourcesDir: () => resources } };
    const archive = async () => {
        await asar.createPackage(input, join(resources, "app.asar"));
    };
    try {
        for (const folder of ["main", "renderer"]) await mkdir(join(input, folder), { recursive: true });
        await mkdir(join(resources, "labs"), { recursive: true });
        for (const file of ["main/main.js", "main/preload.cjs", "renderer/index.html"])
            await writeFile(join(input, file), "fixture");
        const metadata = join(input, "package.json");
        await writeFile(metadata, JSON.stringify({ main: "main/main.js" }));
        await writeFile(join(resources, "labs", "Containerfile"), "FROM fixture");
        await archive();
        await verify(context);
        for (const [folder, file] of [
            ["training", "personal.pdf"],
            [".git", "config"],
        ]) {
            await mkdir(join(input, folder));
            await writeFile(join(input, folder, file), "must stay local");
            await archive();
            await assert.rejects(verify(context), /local PDFs or repository files/);
            await rm(join(input, folder), { recursive: true });
        }
        await writeFile(metadata, JSON.stringify({ main: "build/main/main.js" }));
        await archive();
        await assert.rejects(verify(context), /packaged entry point/);
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});

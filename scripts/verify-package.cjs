const assert = require("node:assert/strict");
const { existsSync } = require("node:fs");
const { join } = require("node:path");
const asar = require("@electron/asar");

module.exports = async ({ appOutDir, packager }) => {
    const resources = packager.getResourcesDir(appOutDir);
    const archive = join(resources, "app.asar");
    asar.uncache(archive);
    const files = asar.listPackage(archive).map(file => file.replaceAll("\\", "/"));
    const forbidden = files.filter(
        file => /\.pdf$/i.test(file) || /^\/(?:\.git|training|src|scripts|tests|docs)(?:\/|$)/.test(file),
    );
    assert.deepEqual(forbidden, [], "The distributable must not include local PDFs or repository files.");
    const metadata = JSON.parse(asar.extractFile(archive, "package.json").toString());
    assert.equal(metadata.main, "main/main.js", "The packaged entry point must match the mapped main directory.");
    for (const file of [metadata.main, "main/preload.cjs", "renderer/index.html"]) {
        assert.ok(asar.statFile(archive, file).size > 0, `Missing packaged file: ${file}`);
    }
    assert.ok(
        existsSync(join(resources, "labs", "Containerfile")),
        "The installer must include its lab build context.",
    );
};

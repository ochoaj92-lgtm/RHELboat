import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { workbookPath } from "../src/main/workbooks.ts";
import { workbooks } from "../src/main/workbook-catalog.ts";

test("workbook requests only resolve registered local regular files", async () => {
    const directory = await mkdtemp(join(tmpdir(), "rhelboat-books-"));
    try {
        await assert.rejects(workbookPath(directory, "../other.pdf"), /Unknown workbook/);
        await assert.rejects(workbookPath(directory, "toString"), /Unknown workbook/);
        await assert.rejects(workbookPath(directory, "system1"), /local copy/);
        const expected = join(directory, workbooks.system1.filename);
        await writeFile(expected, "%PDF-1.4 fixture");
        assert.equal(await workbookPath(directory, "system1"), expected);
        await symlink(expected, join(directory, workbooks.diagnostics.filename));
        await assert.rejects(workbookPath(directory, "diagnostics"), /local copy/);
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});

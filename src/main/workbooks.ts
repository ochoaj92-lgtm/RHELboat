import { lstat } from "node:fs/promises";
import { join } from "node:path";
import { workbooks } from "./workbook-catalog.ts";

export async function workbookPath(directory: string, id: unknown): Promise<string> {
    if (typeof id !== "string" || !Object.hasOwn(workbooks, id)) throw new Error("Unknown workbook.");
    const workbook = workbooks[id as keyof typeof workbooks];
    const path = join(directory, workbook.filename);
    const info = await lstat(path).catch(() => null);
    if (!info?.isFile() || info.isSymbolicLink()) {
        throw new Error(
            `Add your local copy of ${workbook.filename} to ${directory}. The lesson works without the PDF.`,
        );
    }
    return path;
}

import { contextBridge, ipcRenderer } from "electron";
import type { TrainerAPI } from "../shared/trainer.js";

const trainer: TrainerAPI & { openSource: (url: string) => Promise<void> } = {
    openWorkbook: id => ipcRenderer.invoke("trainer:open-workbook", id),
    installation: {
        capabilities: () => ipcRenderer.invoke("installation:capabilities"),
        selectISO: () => ipcRenderer.invoke("installation:select-iso"),
        status: () => ipcRenderer.invoke("installation:status"),
        start: options => ipcRenderer.invoke("installation:start", options),
        shutdown: () => ipcRenderer.invoke("installation:shutdown"),
    },
    status: runtime => ipcRenderer.invoke("lab:status", runtime),
    start: runtime => ipcRenderer.invoke("lab:start", runtime),
    write: input => ipcRenderer.invoke("lab:write", input),
    check: id => ipcRenderer.invoke("lab:check", id),
    reset: runtime => ipcRenderer.invoke("lab:reset", runtime),
    stop: () => ipcRenderer.invoke("lab:stop"),
    onOutput: callback => {
        const listener = (_event: unknown, output: string) => callback(output);
        ipcRenderer.on("lab:output", listener);
        return () => ipcRenderer.removeListener("lab:output", listener);
    },
    openSource: url => ipcRenderer.invoke("trainer:open-source", url),
};
contextBridge.exposeInMainWorld("trainer", trainer);

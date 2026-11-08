import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ContainerLab } from "./lab.js";
import { InstallationVM } from "./installation-vm.js";
import type { VMOptions } from "../shared/installation.js";

app.setName("RHELboat");
if (process.platform === "linux") app.setDesktopName("rhelboat.desktop");
let mainWindow: BrowserWindow | null = null;
let lab: ContainerLab;
let closing = false;
const developmentUrl = "http://localhost:8080";

function createWindow() {
    mainWindow = new BrowserWindow({
        title: "RHELboat · Enterprise Linux Training Lab",
        icon: app.isPackaged
            ? join(app.getAppPath(), "renderer", "img", "rhelboat.png")
            : join(dirname(fileURLToPath(import.meta.url)), "../../src/renderer/public/img/rhelboat.png"),
        width: 1480,
        height: 940,
        minWidth: 1000,
        minHeight: 700,
        backgroundColor: "#f6f3ed",
        autoHideMenuBar: true,
        webPreferences: {
            preload: join(dirname(fileURLToPath(import.meta.url)), "preload.cjs"),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
        },
    });
    mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    mainWindow.webContents.on("will-navigate", event => event.preventDefault());
    mainWindow.on("close", event => {
        if (!closing) {
            event.preventDefault();
            closing = true;
            void lab.stop().finally(() => app.quit());
        }
    });
    if (!app.isPackaged && process.env.NODE_ENV === "development") {
        void mainWindow.loadURL(developmentUrl);
    } else {
        void mainWindow.loadFile(join(app.getAppPath(), "renderer", "index.html"));
    }
}

if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.whenReady().then(() => {
        const contextDir = app.isPackaged
            ? join(process.resourcesPath, "labs")
            : join(dirname(fileURLToPath(import.meta.url)), "../../labs");
        lab = new ContainerLab(contextDir, output => {
            if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("lab:output", output);
        });
        const installation = new InstallationVM(join(app.getPath("userData"), "installation-vm"));
        const handlers = {
            "installation:capabilities": () => installation.capabilities(),
            "installation:status": () => installation.status(),
            "installation:select-iso": async () => {
                const selection = await dialog.showOpenDialog(mainWindow!, {
                    title: "Select the RHEL ISO you downloaded from Red Hat",
                    properties: ["openFile"],
                    filters: [{ name: "ISO installation media", extensions: ["iso"] }],
                });
                if (selection.canceled || !selection.filePaths[0]) return null;
                return installation.selectISO(selection.filePaths[0]);
            },
            "installation:start": (options: unknown) => installation.start(options as VMOptions),
            "installation:shutdown": () => installation.shutdown(),
            "lab:status": (runtime: unknown) => lab.status(runtime as "podman" | "docker"),
            "lab:start": (runtime: unknown) => lab.start(runtime as "podman" | "docker"),
            "lab:write": (input: unknown) => lab.write(input as string),
            "lab:check": (id: unknown) => lab.check(id as string),
            "lab:reset": (runtime: unknown) => lab.reset(runtime as "podman" | "docker"),
            "lab:stop": () => lab.stop(),
            "trainer:open-source": (url: unknown) => {
                if (typeof url !== "string") throw new Error("Invalid source URL");
                const parsed = new URL(url);
                if (
                    parsed.protocol !== "https:" ||
                    !["www.redhat.com", "access.redhat.com", "docs.redhat.com", "developers.redhat.com"].includes(
                        parsed.hostname,
                    )
                ) {
                    throw new Error("Only official Red Hat sources may be opened");
                }
                return shell.openExternal(parsed.href);
            },
        };
        for (const [channel, handler] of Object.entries(handlers)) {
            ipcMain.handle(channel, (event, value) => {
                if (
                    !mainWindow ||
                    event.sender !== mainWindow.webContents ||
                    event.senderFrame !== mainWindow.webContents.mainFrame
                ) {
                    throw new Error("Untrusted sender");
                }
                return handler(value);
            });
        }
        createWindow();
    });
    app.on("second-instance", () => {
        if (mainWindow?.isMinimized()) mainWindow.restore();
        mainWindow?.focus();
    });
    app.on("window-all-closed", () => app.quit());
    app.on("before-quit", event => {
        if (lab && !closing) {
            event.preventDefault();
            closing = true;
            void lab.stop().finally(() => app.quit());
        }
    });
}

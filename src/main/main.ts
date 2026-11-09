import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ContainerLab } from "./lab.js";
import { InstallationVM } from "./installation-vm.js";
import { workbookPath } from "./workbooks.js";
import type { VMOptions } from "../shared/installation.js";

app.setName("RHELboat");
if (process.platform === "win32") app.setAppUserModelId("app.rhelboat.trainer");
if (process.platform === "linux") app.setDesktopName("rhelboat.desktop");
let mainWindow: BrowserWindow | null = null;
let lab: ContainerLab;
let closing = false;
const developmentUrl = process.argv[2] ? `http://localhost:${process.argv[2]}` : "http://localhost:8080";

function createWindow() {
    const appDir = app.getAppPath();
    const iconPath = existsSync(join(appDir, "renderer", "img", "rhelboat.png"))
        ? join(appDir, "renderer", "img", "rhelboat.png")
        : join(dirname(fileURLToPath(import.meta.url)), "../../src/renderer/public/img/rhelboat.png");

    const window = new BrowserWindow({
        title: "RHELboat · Enterprise Linux Training Lab",
        icon: iconPath,
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
    mainWindow = window;
    window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    window.webContents.on("will-navigate", event => event.preventDefault());
    window.webContents.on("did-finish-load", () => console.log("[main] Window finished loading"));
    window.webContents.on("did-fail-load", (_event, code, desc) =>
        console.error("[main] Window failed to load:", code, desc),
    );
    window.on("close", event => {
        console.log("[main] Window close requested, closing =", closing);
        if (!closing) {
            event.preventDefault();
            closing = true;
            void lab.stop().finally(() => app.quit());
        }
    });
    window.on("closed", () => console.log("[main] Window closed event emitted"));
    if (!app.isPackaged && process.env.NODE_ENV === "development") {
        console.log("[main] Loading dev URL:", developmentUrl);
        void window.loadURL(developmentUrl);
    } else {
        const indexPath = existsSync(join(appDir, "renderer", "index.html"))
            ? join(appDir, "renderer", "index.html")
            : join(dirname(fileURLToPath(import.meta.url)), "../renderer/index.html");
        console.log("[main] Loading file path:", indexPath);
        void window.loadFile(indexPath);
    }
}

if (!app.requestSingleInstanceLock()) {
    console.log("[main] Another instance is already running; quitting.");
    app.quit();
} else {
    console.log("[main] Acquired single instance lock, waiting for app.whenReady()...");
    app.whenReady().then(() => {
        console.log("[main] app.whenReady resolved");
        const appDir = app.getAppPath();
        const contextDir = existsSync(join(process.resourcesPath, "labs"))
            ? join(process.resourcesPath, "labs")
            : existsSync(join(appDir, "labs"))
              ? join(appDir, "labs")
              : join(dirname(fileURLToPath(import.meta.url)), "../../labs");
        lab = new ContainerLab(contextDir, output => {
            if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("lab:output", output);
        });
        const installation = new InstallationVM(join(app.getPath("userData"), "installation-vm"));
        const handlers = {
            "trainer:open-workbook": async (id: unknown) => {
                const directory =
                    process.platform === "win32"
                        ? join(app.getPath("documents"), "RHELboat", "training")
                        : existsSync(join(process.resourcesPath, "training"))
                          ? join(process.resourcesPath, "training")
                          : join(appDir, "training");
                const error = await shell.openPath(await workbookPath(directory, id));
                if (error) throw new Error(error);
            },
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
                    ![
                        "www.redhat.com",
                        "access.redhat.com",
                        "docs.redhat.com",
                        "developers.redhat.com",
                        "docs.docker.com",
                        "learn.microsoft.com",
                    ].includes(parsed.hostname)
                ) {
                    throw new Error("Only approved training and setup documentation may be opened");
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

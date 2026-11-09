export type Runtime = "podman" | "docker";

export interface LabStatus {
    state: "stopped" | "starting" | "running" | "error";
    runtime: Runtime;
    message: string;
}

export interface CheckResult {
    passed: boolean;
    message: string;
}

export interface TrainerAPI {
    installation: import("./installation.js").InstallationAPI;
    status(runtime: Runtime): Promise<LabStatus>;
    start(runtime: Runtime): Promise<LabStatus>;
    write(input: string): Promise<void>;
    check(checkId: string): Promise<CheckResult>;
    reset(runtime: Runtime): Promise<LabStatus>;
    stop(): Promise<LabStatus>;
    onOutput(callback: (output: string) => void): () => void;
}

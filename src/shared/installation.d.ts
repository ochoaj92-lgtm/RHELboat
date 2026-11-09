export interface ISOInfo {
    name: string;
    path: string;
    sizeBytes: number;
    sha256: string;
}

export interface VMOptions {
    memoryMiB: number;
    cpus: number;
    diskGiB: number;
    acceleration: "kvm" | "tcg";
    boot: "iso" | "disk";
    expectedChecksum: string;
}

export interface VMStatus {
    state: "stopped" | "running" | "error";
    message: string;
    diskExists: boolean;
    diskGiB?: number;
}

export interface VMCapabilities {
    available: boolean;
    kvm: boolean;
    message: string;
}

export interface InstallationAPI {
    capabilities(): Promise<VMCapabilities>;
    selectISO(): Promise<ISOInfo | null>;
    status(): Promise<VMStatus>;
    start(options: VMOptions): Promise<VMStatus>;
    shutdown(): Promise<VMStatus>;
}

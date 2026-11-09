<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import TrainerIcon from "./TrainerIcon.vue";
import type { ISOInfo, VMCapabilities, VMStatus } from "../../shared/installation.js";

withDefaults(defineProps<{ installing?: boolean }>(), { installing: true });
defineEmits<{ (event: "open-installation"): void }>();

const api = window.trainer;
const isWindows = api?.platform === "win32";
const vm = api?.installation;
const capabilities = ref<VMCapabilities>({ available: false, kvm: false, message: "Checking QEMU…" });
const status = ref<VMStatus>({ state: "stopped", diskExists: false, message: "Prepare your first installation." });
const iso = ref<ISOInfo | null>(null);
const expectedChecksum = ref("");
const memoryMiB = ref(4096);
const cpus = ref(2);
const diskGiB = ref(40);
const acceleration = ref<"kvm" | "tcg">("kvm");
const slowAcknowledged = ref(false);
const busy = ref(false);
const selecting = ref(false);
const error = ref("");
let timer: ReturnType<typeof setInterval> | undefined;
let polling = false;
let disposed = false;
const running = computed(() => status.value.state === "running");
const checksumMatches = computed(() =>
    Boolean(
        iso.value &&
        /^[a-f\d]{64}$/i.test(expectedChecksum.value.trim()) &&
        iso.value.sha256 === expectedChecksum.value.trim().toLowerCase(),
    ),
);
const canStart = computed(() =>
    Boolean(
        vm &&
        capabilities.value.available &&
        !running.value &&
        !busy.value &&
        (acceleration.value !== "tcg" || slowAcknowledged.value),
    ),
);

function showError(value: unknown) {
    error.value = value instanceof Error ? value.message : String(value);
}
function downloadISO() {
    const url = "https://developers.redhat.com/products/rhel/download";
    if (api) void api.openSource(url).catch(showError);
    else window.open(url, "_blank", "noopener,noreferrer");
}
onMounted(async () => {
    if (!vm) return;
    try {
        const [available, current] = await Promise.all([vm.capabilities(), vm.status()]);
        if (disposed) return;
        capabilities.value = available;
        status.value = current;
        acceleration.value = available.kvm ? "kvm" : "tcg";
    } catch (value) {
        showError(value);
    }
    if (disposed) return;
    timer = setInterval(async () => {
        if (busy.value || polling) return;
        polling = true;
        try {
            status.value = await vm.status();
        } catch (value) {
            showError(value);
        } finally {
            polling = false;
        }
    }, 3000);
});
onUnmounted(() => {
    disposed = true;
    clearInterval(timer);
});
async function selectISO() {
    if (!vm || busy.value) return;
    busy.value = true;
    selecting.value = true;
    error.value = "";
    try {
        const selection = await vm.selectISO();
        if (selection) {
            iso.value = selection;
            expectedChecksum.value = "";
        }
    } catch (value) {
        showError(value);
    } finally {
        busy.value = false;
        selecting.value = false;
    }
}
async function start(boot: "iso" | "disk") {
    if (!vm || !canStart.value || (boot === "iso" && !checksumMatches.value)) return;
    busy.value = true;
    error.value = "";
    try {
        status.value = await vm.start({
            memoryMiB: memoryMiB.value,
            cpus: cpus.value,
            diskGiB: diskGiB.value,
            acceleration: acceleration.value,
            boot,
            expectedChecksum: expectedChecksum.value.trim(),
        });
    } catch (value) {
        showError(value);
    } finally {
        busy.value = false;
    }
}
async function shutdown() {
    if (!vm || busy.value) return;
    busy.value = true;
    error.value = "";
    try {
        status.value = await vm.shutdown();
    } catch (value) {
        showError(value);
    } finally {
        busy.value = false;
    }
}
</script>

<template>
    <section class="terminal-pane installation-pane" aria-label="RHEL practice virtual machine">
        <div class="terminal-header">
            <div>
                <TrainerIcon name="package" /><strong>{{
                    isWindows ? "External RHEL VM" : installing ? "Installation VM" : "Practice VM"
                }}</strong
                ><span>{{ isWindows ? "Windows" : "QEMU" }}</span>
            </div>
            <span class="terminal-state"
                ><span class="status-dot" :class="{ online: running }"></span
                >{{ isWindows ? "External console" : running ? "Running" : "Stopped" }}</span
            >
        </div>
        <div class="installation-scroll">
            <div class="installation-intro">
                <span class="terminal-eyebrow">{{
                    installing ? "INSTALL THE REAL OPERATING SYSTEM" : "WORK IN YOUR RHEL GUEST"
                }}</span>
                <h3>
                    {{
                        isWindows
                            ? "Use your RHEL VM console."
                            : installing
                              ? "Your first RHEL machine."
                              : "Boot your practice system."
                    }}
                </h3>
                <p>
                    {{
                        isWindows
                            ? "Follow the lesson beside a disposable RHEL VM in your Windows virtualization tool. The built-in QEMU launcher is available on Linux hosts."
                            : "Follow the lesson here and work in the real QEMU console window beside RHELboat."
                    }}
                </p>
            </div>
            <div v-if="!vm" class="installation-notice">
                This is the lesson preview. Open the desktop app to select an ISO and launch the VM.
            </div>
            <div v-else-if="!capabilities.available && !isWindows" class="installation-notice">
                {{ capabilities.message }} Install QEMU with its GTK display module on your Linux host.
            </div>
            <div v-if="isWindows" class="installation-notice">
                Prepare a disposable x86_64 RHEL VM with a dedicated virtual disk. Suggested sizing: 2 vCPUs, 4 GiB RAM
                and 40 GiB disk. Attach the verified DVD ISO in your virtualization tool, then follow the installer
                steps. Detach the ISO before booting the installed disk. VM power and disk operations stay in that tool.
            </div>
            <section v-if="installing" class="installation-card">
                <h4><span>01</span> Get your installation media</h4>
                <p>
                    Download the DVD ISO for your target release and x86_64 architecture. Sign in and review Red Hat’s
                    terms in your browser.
                </p>
                <button class="button terminal-start" @click="downloadISO">
                    <TrainerIcon name="external" />Official RHEL downloads</button
                ><button class="button select-iso" :disabled="!vm || busy || running" @click="selectISO">
                    <TrainerIcon name="package" />{{
                        selecting ? "Reading ISO and calculating SHA-256…" : "Select downloaded ISO"
                    }}
                </button>
                <div v-if="iso" class="iso-details">
                    <strong>{{ iso.name }}</strong
                    ><span>{{ (iso.sizeBytes / 1024 ** 3).toFixed(2) }} GiB · calculated SHA-256</span
                    ><code>{{ iso.sha256 }}</code
                    ><label for="iso-checksum">Red Hat’s SHA-256 for this exact image</label
                    ><input
                        id="iso-checksum"
                        v-model="expectedChecksum"
                        placeholder="Paste the 64-character checksum"
                        maxlength="64"
                        autocomplete="off"
                        spellcheck="false"
                        :disabled="busy || running"
                    /><span
                        v-if="expectedChecksum"
                        class="checksum-result"
                        :class="{ matched: checksumMatches }"
                        role="status"
                        ><TrainerIcon :name="checksumMatches ? 'check' : 'info'" />{{
                            checksumMatches
                                ? isWindows
                                    ? "Checksum matches — ready to attach to your VM"
                                    : "Checksum matches — ready to boot"
                                : "Checksum does not match yet. Check the release and image."
                        }}</span
                    >
                </div>
            </section>
            <div v-if="!installing && !status.diskExists && !isWindows" class="installation-notice">
                Install a RHEL guest first, or use your own disposable VM. Extra disks and other machines must be
                prepared with your virtualization tools.
                <button class="button secondary" @click="$emit('open-installation')">Open installation practice</button>
            </div>
            <section v-if="!isWindows" class="installation-card">
                <h4><span>02</span> Configure your training VM</h4>
                <fieldset :disabled="busy || running">
                    <div class="vm-resources">
                        <label
                            >Memory (MiB)<input
                                v-model.number="memoryMiB"
                                type="number"
                                min="2048"
                                max="16384"
                                step="1024" /></label
                        ><label>vCPUs<input v-model.number="cpus" type="number" min="1" max="8" /></label
                        ><label v-if="!status.diskExists"
                            >Disk (GiB)<input v-model.number="diskGiB" type="number" min="20" max="200"
                        /></label>
                    </div>
                    <p v-if="status.diskExists" class="disk-preserved">
                        <TrainerIcon name="shield" />Your existing {{ status.diskGiB }} GiB training disk will be
                        reused.
                    </p>
                    <label class="vm-acceleration"
                        >Acceleration<select v-model="acceleration">
                            <option value="kvm" :disabled="!capabilities.kvm">KVM · hardware virtualization</option>
                            <option value="tcg">Software emulation · very slow</option>
                        </select></label
                    ><label v-if="acceleration === 'tcg'" class="slow-ack"
                        ><input v-model="slowAcknowledged" type="checkbox" />I understand software emulation may make
                        installation very slow.</label
                    >
                </fieldset>
                <p class="hardware-note">
                    Suggested lab sizing: 2 vCPUs, 4 GiB RAM, 40 GiB disk. RHEL 10 x86_64 needs x86-64-v3 CPU support.
                    Networking uses QEMU’s user-mode NAT; no host folders, raw disks, or forwarded ports are attached.
                </p>
            </section>
            <section v-if="!isWindows" class="installation-card">
                <h4>
                    <span>03</span> {{ installing ? "Practice in the installer" : "Continue in the guest console" }}
                </h4>
                <p v-if="installing">
                    After installation, use Ctrl+Alt+F1, then Ctrl+B followed by 2 to reach the installer shell and run
                    <code>poweroff</code>. Wait for the VM to stop, then boot the installed disk without the ISO.
                </p>
                <p v-else>
                    Boot the installed disk and perform the lesson in its QEMU console. Check the lesson prerequisites
                    before changing storage, network or security settings.
                </p>
                <div class="vm-actions">
                    <button
                        v-if="installing"
                        class="button terminal-start"
                        :disabled="!canStart || !checksumMatches"
                        @click="start('iso')"
                    >
                        <TrainerIcon name="play" />Start installer</button
                    ><button
                        class="button select-iso"
                        :disabled="!canStart || !status.diskExists"
                        @click="start('disk')"
                    >
                        Boot installed disk</button
                    ><button v-if="running" class="button select-iso" :disabled="busy" @click="shutdown">
                        Request shutdown
                    </button>
                </div>
                <p class="vm-power-status" role="status">
                    {{ busy && !selecting ? "Preparing the VM…" : status.message }}
                </p>
                <p class="vm-lifecycle">
                    The VM and its disk persist when RHELboat closes. Shut down from the guest console when finished.
                    The app’s shutdown button sends an ACPI request; it does not force power off.
                </p>
            </section>
            <div v-if="error || status.state === 'error'" class="installation-error" role="alert">
                {{ error || status.message }}
            </div>
        </div>
        <footer class="terminal-footer">
            <span
                ><TrainerIcon name="shield" />{{
                    isWindows
                        ? "Use a disposable guest and a dedicated virtual disk"
                        : "Dedicated virtual disk · installer choices stay yours"
                }}</span
            ><span>Guest steps are self-reported</span>
        </footer>
    </section>
</template>

<style scoped>
.installation-scroll {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding: 25px;
    scrollbar-width: thin;
    scrollbar-color: #3a4559 transparent;
}
.installation-intro h3 {
    font-size: 23px;
    line-height: 1.3;
    color: #f6f3ed;
    letter-spacing: -0.5px;
    margin: 10px 0;
}
.installation-intro > p,
.installation-card > p {
    font-size: 11px;
    line-height: 1.8;
    color: #98aab7;
}
.installation-card {
    margin-top: 22px;
    padding-top: 20px;
    border-top: 1px solid #2b3b47;
}
.installation-card h4 {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 12px;
    font-weight: 600;
    color: #e5e9e9;
    margin-bottom: 12px;
}
.installation-card h4 > span {
    color: #f08b82;
    font-family: monospace;
    font-size: 10px;
}
.installation-card .button {
    margin-top: 12px;
    max-width: 100%;
    white-space: normal;
    text-align: left;
}
.installation-card .terminal-start {
    margin-right: 7px;
}
.select-iso {
    color: #c7d3dc;
    background: #23313e;
    border-color: #354856;
}
.installation-notice,
.installation-error {
    font-size: 11px;
    line-height: 1.8;
    padding: 13px;
    margin-top: 18px;
    border: 1px solid #64573d;
    background: #302c24;
    color: #d6c294;
    border-radius: 5px;
    overflow-wrap: anywhere;
}
.installation-error {
    border-color: #784348;
    color: #f0b3b4;
    background: #39262d;
}
.iso-details {
    display: grid;
    gap: 8px;
    margin-top: 16px;
    font-size: 10px;
}
.iso-details strong {
    color: #dce6ec;
    overflow-wrap: anywhere;
}
.iso-details > span {
    color: #99a9b6;
}
.iso-details code {
    color: #9ec3b8;
    background: #14232a;
    padding: 10px;
    border-radius: 4px;
    overflow-wrap: anywhere;
    line-height: 1.7;
}
.iso-details label {
    margin-top: 5px;
    color: #b1bec9;
}
.installation-card input:not([type="checkbox"]),
.installation-card select {
    min-width: 0;
    width: 100%;
    background: #192934;
    border: 1px solid #3c4c58;
    border-radius: 4px;
    color: #edf1ed;
    padding: 9px;
    font-size: 11px;
}
.checksum-result {
    display: flex;
    gap: 6px;
    align-items: center;
    color: #e1a589 !important;
    font-size: 10px;
    line-height: 1.7;
}
.checksum-result.matched {
    color: #7ed4bb !important;
}
.checksum-result svg {
    width: 14px;
    height: 14px;
}
.installation-card fieldset {
    border: 0;
    padding: 0;
    margin: 0;
    min-width: 0;
}
.vm-resources {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
}
.vm-resources label {
    display: grid;
    gap: 7px;
    font-size: 10px;
    color: #a9bac7;
}
.vm-acceleration {
    display: grid;
    gap: 8px;
    font-size: 10px;
    color: #a9bac7;
    margin-top: 14px;
}
.slow-ack {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 10px;
    line-height: 1.7;
    color: #d8bf94;
    margin-top: 12px;
}
.slow-ack input {
    margin-top: 3px;
    accent-color: #e53635;
}
.installation-card .hardware-note,
.installation-card .vm-lifecycle {
    color: #8499a8;
    font-size: 10px;
    line-height: 1.8;
    margin-top: 13px;
}
.disk-preserved {
    display: flex;
    gap: 6px;
    align-items: center;
    color: #9ec3b8;
    font-size: 10px;
    margin-top: 12px;
}
.disk-preserved svg {
    width: 13px;
    height: 13px;
}
.vm-power-status {
    margin-top: 14px;
    color: #b3c5ce !important;
    overflow-wrap: anywhere;
}
.vm-actions {
    display: flex;
    flex-wrap: wrap;
}
</style>

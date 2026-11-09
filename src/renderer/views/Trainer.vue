<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import TrainerIcon from "../components/TrainerIcon.vue";
import InstallationLab from "../components/InstallationLab.vue";
import RapidQuiz from "../components/RapidQuiz.vue";
import { paths, lessons } from "../data/curriculum";
import type { LabStatus, Runtime, CheckResult } from "../../shared/trainer.js";

const api = window.trainer;
const pathIcons: Record<string, string> = {
    rhcsa: "terminal",
    rhce: "search",
    cloud: "cloud",
    services: "layers",
    identity: "key",
    deployment: "package",
    security: "shield",
    availability: "cluster",
    performance: "chart",
    rhca: "compass",
};
const section = ref("learn");
const isDark = ref(false);
const search = ref("");
const selectedPath = ref(paths[0].id);
const selectedLesson = ref(paths[0].lessonIds[0]);
const stepIndex = ref(0);
const hintVisible = ref(false);
const overviewVisible = ref(false);
const completed = ref<string[]>([]);
const installationCheckpoints = ref<string[]>([]);
const runtime = ref<Runtime>("podman");
const status = ref<LabStatus>({
    state: "stopped",
    runtime: "podman",
    message: "Ready when you are. Start a lab to open your Linux shell.",
});
const busy = ref(false);
const checking = ref(false);
const resetConfirm = ref(false);
const feedback = ref<CheckResult | null>(null);
const command = ref("");
const output = ref("");
const terminalOutput = ref<HTMLPreElement | null>(null);
const terminalMount = ref<HTMLDivElement | null>(null);
const commandInput = ref<HTMLInputElement | null>(null);
const history: string[] = [];
let historyIndex = 0;
let unsubscribe: (() => void) | undefined;
let statusTimer: ReturnType<typeof setInterval> | undefined;
let polling = false;
let term: Terminal | null = null;
let rawBuffer = "";
const path = computed(() => paths.find(item => item.id === selectedPath.value)!);
const pathLessons = computed(() => path.value.lessonIds.map(id => lessons.find(item => item.id === id)!));
const lesson = computed(() => lessons.find(item => item.id === selectedLesson.value)!);
const step = computed(() => lesson.value.steps[stepIndex.value]);
const filteredPaths = computed(() =>
    paths.filter(item =>
        `${item.code} ${item.title} ${item.topics.join(" ")}`.toLowerCase().includes(search.value.toLowerCase()),
    ),
);
const percent = computed(() =>
    Math.round(
        (pathLessons.value.filter(item => completed.value.includes(item.id)).length / pathLessons.value.length) * 100,
    ),
);
const totalComplete = computed(() => lessons.filter(item => completed.value.includes(item.id)).length);
const isRunning = computed(() => status.value.state === "running");
const isLastStep = computed(() => stepIndex.value === lesson.value.steps.length - 1);
const isInstallation = computed(() => lesson.value.id === "rhel-installation");
const installationComplete = computed(() =>
    lessons
        .find(item => item.id === "rhel-installation")!
        .steps.every(item => item.id && installationCheckpoints.value.includes(item.id)),
);
const currentInstallationStepDone = computed(() =>
    Boolean(step.value.id && installationCheckpoints.value.includes(step.value.id)),
);

function installationStepLocked(index: number) {
    return (
        isInstallation.value &&
        lesson.value.steps.slice(0, index).some(item => !item.id || !installationCheckpoints.value.includes(item.id))
    );
}

function selectPath(id: string) {
    selectedPath.value = id;
    selectedLesson.value = path.value.lessonIds[0];
    section.value = "learn";
    overviewVisible.value = false;
}
watch(selectedLesson, () => {
    stepIndex.value = 0;
    hintVisible.value = false;
    feedback.value = null;
});
watch(stepIndex, () => {
    hintVisible.value = false;
});
watch(isDark, dark => {
    if (term) {
        term.options.theme = dark
            ? { background: "#090e17", foreground: "#f1f5f9", cursor: "#e06c75", selectionBackground: "#3e4451" }
            : { background: "#101820", foreground: "#f8fafc", cursor: "#e06c75", selectionBackground: "#3e4451" };
    }
});
watch(section, val => {
    if (val === "learn" && isRunning.value) {
        void nextTick(() => setupTerminal());
    }
});
watch(
    completed,
    value => {
        try {
            localStorage.setItem("rhelboat.progress.v1", JSON.stringify(value));
        } catch {
            /* Progress remains available for this session. */
        }
    },
    { deep: true },
);

watch(
    installationCheckpoints,
    value => {
        if (!installationComplete.value) completed.value = completed.value.filter(id => id !== "rhel-installation");
        try {
            localStorage.setItem("rhelboat.installation.checkpoints.v1", JSON.stringify(value));
        } catch {
            /* Checkpoints remain available for this session. */
        }
    },
    { deep: true },
);

function setupTerminal() {
    if (term || !terminalMount.value) return;
    term = new Terminal({
        fontFamily: 'ui-monospace, SFMono-Regular, "Cascadia Code", "Fira Code", monospace',
        fontSize: 13,
        lineHeight: 1.25,
        cursorBlink: true,
        cursorStyle: "block",
        theme: isDark.value
            ? {
                  background: "#090e17",
                  foreground: "#f1f5f9",
                  cursor: "#e06c75",
                  selectionBackground: "#3e4451",
              }
            : {
                  background: "#101820",
                  foreground: "#f8fafc",
                  cursor: "#e06c75",
                  selectionBackground: "#3e4451",
              },
    });
    term.open(terminalMount.value);
    term.onData(data => {
        if (api && isRunning.value) {
            void api.write(data);
        }
    });
    if (rawBuffer) {
        term.write(rawBuffer);
    }
}

function clearTerminal() {
    output.value = "";
    rawBuffer = "";
    term?.reset();
}

function appendOutput(chunk: string) {
    rawBuffer = (rawBuffer + chunk).slice(-100000);
    if (term) {
        term.write(chunk);
    }
    const text = chunk
        .replace(/\x1b\][^\x07]*(?:\x07|\x1b\\)/g, "")
        .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "")
        .replace(/[\x00-\x08\x0b-\x1f\x7f]/g, "");
    output.value = (output.value + text).slice(-100000);
    void nextTick(() => {
        if (terminalOutput.value) terminalOutput.value.scrollTop = terminalOutput.value.scrollHeight;
    });
}
onMounted(async () => {
    try {
        const saved: unknown = JSON.parse(localStorage.getItem("rhelboat.progress.v1") || "[]");
        if (Array.isArray(saved))
            completed.value = saved.filter(
                (id): id is string => typeof id === "string" && lessons.some(item => item.id === id),
            );
        const checkpoints: unknown = JSON.parse(localStorage.getItem("rhelboat.installation.checkpoints.v1") || "[]");
        if (Array.isArray(checkpoints))
            installationCheckpoints.value = checkpoints.filter(
                (id): id is string =>
                    typeof id === "string" &&
                    lessons.find(item => item.id === "rhel-installation")!.steps.some(item => item.id === id),
            );
        const savedRuntime = localStorage.getItem("rhelboat.runtime");
        if (savedRuntime === "podman" || savedRuntime === "docker") runtime.value = savedRuntime;
        const savedTheme = localStorage.getItem("rhelboat.theme");
        if (savedTheme === "dark" || (!savedTheme && window.matchMedia?.("(prefers-color-scheme: dark)").matches)) {
            isDark.value = true;
        }
    } catch {
        /* Ignore invalid or unavailable local storage. */
    }
    if (api) {
        unsubscribe = api.onOutput(appendOutput);
        try {
            status.value = await api.status(runtime.value);
        } catch (error) {
            showError(error);
        }
        statusTimer = setInterval(async () => {
            if (busy.value || !isRunning.value || polling) return;
            polling = true;
            try {
                status.value = await api.status(runtime.value);
            } catch (error) {
                showError(error);
            } finally {
                polling = false;
            }
        }, 3000);
    }
});
onUnmounted(() => {
    unsubscribe?.();
    clearInterval(statusTimer);
    term?.dispose();
    term = null;
});
function showError(error: unknown) {
    status.value = {
        state: "error",
        runtime: runtime.value,
        message: error instanceof Error ? error.message : String(error),
    };
}
async function startLab() {
    if (!api || busy.value) return;
    busy.value = true;
    feedback.value = null;
    status.value = {
        state: "starting",
        runtime: runtime.value,
        message: "Preparing your UBI 10 container. The first start downloads and builds the lab image.",
    };
    try {
        status.value = await api.start(runtime.value);
        try {
            localStorage.setItem("rhelboat.runtime", runtime.value);
        } catch {
            /* Session choice still applies. */
        }
        if (isRunning.value) {
            void nextTick(() => {
                setupTerminal();
                commandInput.value?.focus();
            });
        }
    } catch (error) {
        showError(error);
    } finally {
        busy.value = false;
    }
}
async function stopLab() {
    if (!api || busy.value) return;
    busy.value = true;
    try {
        status.value = await api.stop();
    } catch (error) {
        showError(error);
    } finally {
        busy.value = false;
    }
}
async function resetLab() {
    if (!api || busy.value) return;
    resetConfirm.value = false;
    busy.value = true;
    feedback.value = null;
    clearTerminal();
    try {
        status.value = await api.reset(runtime.value);
    } catch (error) {
        showError(error);
    } finally {
        busy.value = false;
    }
}
async function sendCommand() {
    if (!api || !isRunning.value || !command.value.trim()) return;
    const input = command.value;
    command.value = "";
    history.push(input);
    historyIndex = history.length;
    try {
        await api.write(input + "\n");
    } catch (error) {
        showError(error);
    }
}
function commandKey(event: KeyboardEvent) {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        historyIndex = Math.max(0, Math.min(history.length, historyIndex + (event.key === "ArrowUp" ? -1 : 1)));
        command.value = history[historyIndex] || "";
    }
    if (event.key === "c" && event.ctrlKey && !command.value) {
        event.preventDefault();
        void interrupt();
    }
}
async function interrupt() {
    try {
        await api?.write("\x03");
    } catch (error) {
        showError(error);
    }
}
function useCommand() {
    command.value = step.value.command || "";
    void nextTick(() => commandInput.value?.focus());
}
function markComplete(id = lesson.value.id) {
    if (id === "rhel-installation" && !installationComplete.value) return;
    if (!completed.value.includes(id)) completed.value.push(id);
}
async function checkLab() {
    if (!api || !isRunning.value || !lesson.value.checkId || checking.value) return;
    const id = lesson.value.id;
    const checkId = lesson.value.checkId;
    checking.value = true;
    try {
        const result = await api.check(checkId);
        if (result.passed) markComplete(id);
        if (lesson.value.id === id) feedback.value = result;
    } catch (error) {
        if (lesson.value.id === id)
            feedback.value = { passed: false, message: error instanceof Error ? error.message : String(error) };
    } finally {
        checking.value = false;
    }
}
function nextLesson() {
    const index = pathLessons.value.findIndex(item => item.id === selectedLesson.value);
    if (index < pathLessons.value.length - 1) selectedLesson.value = pathLessons.value[index + 1].id;
}
function openSource(url: string) {
    if (api) void api.openSource(url).catch(showError);
    else window.open(url, "_blank", "noopener,noreferrer");
}
function handleCopyCommand(text: string) {
    if (navigator.clipboard) {
        void navigator.clipboard.writeText(text);
    }
    if (isRunning.value) {
        command.value = text;
        void nextTick(() => commandInput.value?.focus());
    }
}

function toggleTheme() {
    isDark.value = !isDark.value;
    try {
        localStorage.setItem("rhelboat.theme", isDark.value ? "dark" : "light");
    } catch {
        /* storage unavailable */
    }
}

const importInput = ref<HTMLInputElement | null>(null);
const progressFeedback = ref("");

function exportProgress() {
    const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        completed: completed.value,
        installationCheckpoints: installationCheckpoints.value,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rhelboat-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    progressFeedback.value = "Progress exported successfully.";
}

function triggerImport() {
    importInput.value?.click();
}

function handleImport(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const parsed = JSON.parse(String(e.target?.result || "{}"));
            if (Array.isArray(parsed.completed)) {
                completed.value = parsed.completed.filter(
                    (id: unknown): id is string => typeof id === "string" && lessons.some(l => l.id === id),
                );
            }
            if (Array.isArray(parsed.installationCheckpoints)) {
                installationCheckpoints.value = parsed.installationCheckpoints.filter(
                    (id: unknown): id is string => typeof id === "string",
                );
            }
            progressFeedback.value = "Progress imported successfully.";
        } catch {
            progressFeedback.value = "Failed to import progress file: Invalid JSON format.";
        }
    };
    reader.readAsText(file);
    input.value = "";
}

function resetAllProgress() {
    if (confirm("Are you sure you want to reset all completed lessons and checkpoints? This cannot be undone.")) {
        completed.value = [];
        installationCheckpoints.value = [];
        progressFeedback.value = "All progress has been reset.";
    }
}
</script>

<template>
    <div class="trainer-shell" :class="{ 'dark-theme': isDark }">
        <aside class="sidebar">
            <a class="brand" href="#" @click.prevent="section = 'learn'" aria-label="RHELboat home">
                <img class="brand-symbol" src="/img/rhelboat.svg" alt="" width="48" height="48" />
                <span>RHEL<span class="brand-light">boat</span><small>ENTERPRISE LINUX TRAINING LAB</small></span>
            </a>
            <div class="sidebar-section-label">YOUR WORKSPACE</div>
            <nav class="main-nav" aria-label="Workspace">
                <button :class="{ active: section === 'learn' }" @click="section = 'learn'">
                    <TrainerIcon name="book" />Learning paths<span class="nav-count">{{ paths.length }}</span>
                </button>
                <button :class="{ active: section === 'quiz' }" @click="section = 'quiz'">
                    <TrainerIcon name="shield" />Rapid Quiz<span class="nav-count">Sim</span>
                </button>
                <button :class="{ active: section === 'progress' }" @click="section = 'progress'">
                    <TrainerIcon name="chart" />My progress
                </button>
                <button :class="{ active: section === 'setup' }" @click="section = 'setup'">
                    <TrainerIcon name="settings" />Lab setup<span
                        class="status-dot"
                        :class="{ online: isRunning }"
                    ></span>
                </button>
            </nav>
            <div class="path-heading">
                <span class="sidebar-section-label">CERTIFICATION PATHS</span><span>{{ paths.length }}</span>
            </div>
            <label class="path-search"
                ><TrainerIcon name="search" /><input
                    v-model="search"
                    placeholder="Find a path or topic…"
                    aria-label="Find a certification path"
            /></label>
            <nav class="path-nav" aria-label="Certification paths">
                <button
                    v-for="item in filteredPaths"
                    :key="item.id"
                    :class="{ selected: selectedPath === item.id && section === 'learn' }"
                    @click="selectPath(item.id)"
                >
                    <span class="path-icon"><TrainerIcon :name="pathIcons[item.id] || 'book'" /></span>
                    <span class="path-code">{{ item.code }}</span
                    ><span class="path-name">{{ item.title }}</span
                    ><TrainerIcon name="chevron" />
                </button>
                <p v-if="!filteredPaths.length" class="empty-search">No matching paths.</p>
            </nav>
            <div class="sidebar-bottom">
                <span class="avatar"><TrainerIcon name="terminal" /></span>
                <div>
                    Local learner<small>{{ totalComplete }} of {{ lessons.length }} lessons complete</small>
                </div>
                <span class="local-dot"></span>
            </div>
        </aside>

        <main class="main-workspace">
            <header class="workspace-header">
                <div class="breadcrumb">
                    <span>RHELboat</span><TrainerIcon name="chevron" /><strong>{{
                        section === "learn"
                            ? "Learning paths"
                            : section === "quiz"
                              ? "Rapid Simulation Quiz"
                              : section === "progress"
                                ? "My progress"
                                : "Lab setup"
                    }}</strong>
                </div>
                <div class="header-right">
                    <button
                        v-if="section === 'learn'"
                        class="button subtle quick-quiz-launch"
                        title="Take a quick retention quiz on this topic"
                        @click="section = 'quiz'"
                    >
                        <TrainerIcon name="shield" />Quiz Topic
                    </button>
                    <button
                        class="button subtle theme-toggle-btn"
                        :title="isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'"
                        @click="toggleTheme"
                    >
                        <TrainerIcon name="compass" />{{ isDark ? "Light" : "Dark" }}
                    </button>
                    <span class="local-badge"
                        ><span class="status-dot" :class="{ online: isRunning }"></span
                        >{{ isRunning ? "Lab running" : "Local workspace" }}</span
                    ><span class="header-avatar"><TrainerIcon name="shield" /></span>
                </div>
            </header>

            <template v-if="section === 'learn'">
                <section class="course-header">
                    <div>
                        <div class="eyebrow"><span class="track-marker"></span>ENTERPRISE LINUX / {{ path.code }}</div>
                        <h1>{{ path.title }}</h1>
                        <p>{{ path.subtitle }}</p>
                        <div class="course-meta">
                            <span class="exam-badge">{{ path.code }}</span
                            ><span>{{ path.level }}</span
                            ><span class="meta-divider"></span><span>{{ pathLessons.length }} guided lessons</span
                            ><span v-if="path.version" class="version-label">{{ path.version }}</span>
                        </div>
                    </div>
                    <div class="course-progress">
                        <div class="progress-number">{{ percent }}<span>%</span></div>
                        <span>path progress</span>
                        <div class="progress-track"><div :style="{ width: percent + '%' }"></div></div>
                        <button class="text-button" @click="overviewVisible = !overviewVisible">
                            {{ overviewVisible ? "Hide" : "View" }} objectives <TrainerIcon name="chevron" />
                        </button>
                    </div>
                </section>
                <section v-if="overviewVisible" class="objectives-panel">
                    <div>
                        <h2>Your path to {{ path.code }}</h2>
                        <p>{{ path.description }}</p>
                        <p class="coverage-note">
                            These original practice lessons introduce the topics below. They do not cover every exam
                            objective.
                        </p>
                        <button class="text-button" @click="openSource(path.examUrl)">
                            Official objectives <TrainerIcon name="external" />
                        </button>
                    </div>
                    <ul>
                        <li v-for="topic in path.topics" :key="topic">{{ topic }}</li>
                    </ul>
                </section>
                <div class="lesson-toolbar">
                    <div>
                        <TrainerIcon name="book" /><label for="lesson-select">Your lesson</label
                        ><select id="lesson-select" v-model="selectedLesson">
                            <option v-for="(item, index) in pathLessons" :key="item.id" :value="item.id">
                                {{ String(index + 1).padStart(2, "0") }} · {{ item.title
                                }}{{ completed.includes(item.id) ? " ✓" : "" }}
                            </option>
                        </select>
                    </div>
                    <span class="lesson-duration"
                        ><TrainerIcon name="clock" />{{ lesson.duration }} min<span class="lesson-type">{{
                            isInstallation
                                ? "Installation lab"
                                : lesson.environment === "container"
                                  ? "Hands-on lab"
                                  : lesson.environment === "vm"
                                    ? "VM guide"
                                    : "Multi-node guide"
                        }}</span></span
                    >
                </div>

                <div class="split-workspace">
                    <section class="lesson-pane" aria-label="Step-by-step lesson">
                        <div class="pane-label">
                            <span class="red-dot"></span>GUIDED LESSON<span class="step-count"
                                >{{ stepIndex + 1 }} / {{ lesson.steps.length }} steps</span
                            >
                        </div>
                        <div class="lesson-scroll">
                            <span class="topic-label">{{ lesson.topic }}</span>
                            <h2>{{ lesson.title }}</h2>
                            <p class="lesson-explanation">{{ lesson.explanation }}</p>
                            <div class="objective">
                                <TrainerIcon name="shield" />
                                <div>
                                    <strong>Your objective</strong>
                                    <p>{{ lesson.objective }}</p>
                                </div>
                            </div>
                            <div v-if="isInstallation" class="vm-notice">
                                <TrainerIcon name="info" />
                                <p>
                                    Use the installation VM controls beside this lesson. The real installer opens in a
                                    separate QEMU window. Complete each checkpoint before continuing; guest
                                    configuration is self-reported.
                                </p>
                            </div>
                            <div v-else-if="lesson.environment !== 'container'" class="vm-notice">
                                <TrainerIcon name="info" />
                                <p>
                                    This guide requires
                                    {{
                                        lesson.environment === "vm"
                                            ? "a disposable RHEL virtual machine"
                                            : "multiple RHEL machines or a product-specific environment"
                                    }}. Commands in this guide are for that environment. The container shell cannot
                                    validate these tasks.
                                </p>
                            </div>
                            <nav class="step-navigation" aria-label="Lesson steps">
                                <button
                                    v-for="(item, index) in lesson.steps"
                                    :key="index"
                                    :class="{ current: stepIndex === index, past: stepIndex > index }"
                                    :aria-label="`Step ${index + 1}: ${item.title}`"
                                    :aria-current="stepIndex === index ? 'step' : undefined"
                                    :disabled="installationStepLocked(index)"
                                    @click="stepIndex = index"
                                >
                                    <TrainerIcon v-if="stepIndex > index" name="check" /><span v-else>{{
                                        index + 1
                                    }}</span>
                                </button>
                            </nav>
                            <article class="step-content" :key="`${lesson.id}-${stepIndex}`">
                                <span class="eyebrow">STEP {{ String(stepIndex + 1).padStart(2, "0") }}</span>
                                <h3>{{ step.title }}</h3>
                                <p>{{ step.instruction }}</p>
                                <template v-if="step.command"
                                    ><button
                                        class="hint-toggle"
                                        :aria-expanded="hintVisible"
                                        @click="hintVisible = !hintVisible"
                                    >
                                        <TrainerIcon name="terminal" />{{
                                            hintVisible ? "Hide command hint" : "Need a hint? Show command"
                                        }}
                                    </button>
                                    <div v-if="hintVisible" class="command-hint">
                                        <pre>{{ step.command }}</pre>
                                        <button
                                            v-if="lesson.environment === 'container'"
                                            class="text-button"
                                            @click="useCommand"
                                        >
                                            <TrainerIcon name="copy" />Use in shell</button
                                        ><span v-else>Run in your disposable VM environment.</span>
                                    </div></template
                                >
                            </article>
                            <label v-if="isInstallation" class="installation-checkpoint"
                                ><input v-model="installationCheckpoints" type="checkbox" :value="step.id" />I completed
                                this step in my installation lab (self-reported).</label
                            >
                            <div v-if="isLastStep" class="verification">
                                <h4>
                                    {{ lesson.checkId ? "Put your work to the test" : "Review your understanding" }}
                                </h4>
                                <p>{{ lesson.success }}</p>
                                <button
                                    v-if="lesson.checkId"
                                    class="button primary"
                                    :disabled="!isRunning || checking || busy"
                                    @click="checkLab"
                                >
                                    <TrainerIcon name="check" />{{ checking ? "Checking…" : "Check my work" }}</button
                                ><button
                                    v-else
                                    class="button secondary"
                                    :disabled="isInstallation && !installationComplete"
                                    @click="markComplete()"
                                >
                                    <TrainerIcon name="check" />{{
                                        completed.includes(lesson.id)
                                            ? "Reviewed"
                                            : isInstallation
                                              ? "Record installation practice"
                                              : "Mark guide reviewed"
                                    }}
                                </button>
                                <div
                                    v-if="feedback"
                                    class="check-feedback"
                                    :class="{ passed: feedback.passed }"
                                    role="status"
                                >
                                    <TrainerIcon :name="feedback.passed ? 'check' : 'info'" />{{ feedback.message }}
                                </div>
                            </div>
                            <div v-if="completed.includes(lesson.id)" class="completed-note">
                                <TrainerIcon name="check" />{{
                                    isInstallation
                                        ? "Installation practice completed · self-reported"
                                        : lesson.checkId
                                          ? "Lab successfully checked"
                                          : "Guide reviewed · self-reported"
                                }}
                            </div>
                            <button class="source-link" @click="openSource(lesson.sourceUrl)">
                                {{
                                    isInstallation
                                        ? "Official RHEL installation guide"
                                        : "Based on official exam objectives"
                                }}<TrainerIcon name="external" />
                            </button>
                        </div>
                        <footer class="lesson-footer">
                            <button class="button subtle" :disabled="stepIndex === 0" @click="stepIndex--">
                                Previous</button
                            ><span>{{ stepIndex + 1 }} of {{ lesson.steps.length }}</span
                            ><button
                                v-if="!isLastStep"
                                class="button dark"
                                :disabled="isInstallation && !currentInstallationStepDone"
                                @click="stepIndex++"
                            >
                                Next step<TrainerIcon name="arrow" /></button
                            ><button
                                v-else
                                class="button dark"
                                :disabled="
                                    selectedLesson === pathLessons[pathLessons.length - 1].id ||
                                    (isInstallation && !completed.includes(lesson.id))
                                "
                                @click="nextLesson"
                            >
                                Next lesson<TrainerIcon name="arrow" />
                            </button>
                        </footer>
                    </section>

                    <InstallationLab v-if="isInstallation" />
                    <section v-else class="terminal-pane" aria-label="Interactive Linux container shell">
                        <div class="terminal-header">
                            <div><TrainerIcon name="terminal" /><strong>Lab shell</strong><span>UBI 10</span></div>
                            <span class="terminal-state"
                                ><span class="status-dot" :class="{ online: isRunning }"></span
                                >{{ busy ? "Preparing" : isRunning ? "Connected" : "Offline" }}</span
                            >
                        </div>
                        <div class="terminal-tabs">
                            <span
                                ><span class="terminal-tab-dot"></span>root@rhelboat
                                <span class="terminal-tab-close">bash</span></span
                            ><button :disabled="!output && !rawBuffer" @click="clearTerminal">Clear output</button>
                        </div>
                        <div v-if="!isRunning && !output && !rawBuffer" class="terminal-welcome">
                            <div class="terminal-art">
                                <img src="/img/rhelboat.svg" alt="" width="84" height="84" />
                            </div>
                            <span class="terminal-eyebrow">THE RHELBOAT PRACTICE ENVIRONMENT</span>
                            <h3>Learn the system.<br />Command the shell.</h3>
                            <p>Practice in a real Enterprise Linux container, right beside your lesson.</p>
                            <template v-if="api"
                                ><label class="runtime-select"
                                    >Container runtime<select v-model="runtime" :disabled="busy">
                                        <option value="podman">Podman</option>
                                        <option value="docker">Docker</option>
                                    </select></label
                                ><button class="button terminal-start" :disabled="busy" @click="startLab">
                                    <TrainerIcon name="play" />{{
                                        busy ? "Preparing lab…" : "Start lab environment"
                                    }}</button
                                ><small>First start downloads the image. Your files stay in this lab.</small></template
                            >
                            <div v-else class="browser-notice">
                                You’re viewing the lesson preview.<br />Run the desktop app to start a real container.
                            </div>
                            <div class="sandbox-facts">
                                <span><TrainerIcon name="shield" />Isolated workspace</span
                                ><span><TrainerIcon name="reset" />Reset anytime</span>
                            </div>
                        </div>
                        <div
                            v-else
                            ref="terminalMount"
                            class="terminal-output xterm-screen"
                            aria-label="Shell output"
                            tabindex="0"
                        ></div>
                        <form v-if="isRunning" class="terminal-input" @submit.prevent="sendCommand">
                            <span>#</span
                            ><input
                                ref="commandInput"
                                v-model="command"
                                aria-label="Shell command"
                                placeholder="Type a command and press Enter"
                                autocomplete="off"
                                spellcheck="false"
                                @keydown="commandKey"
                            /><button type="submit" aria-label="Run command"><TrainerIcon name="arrow" /></button>
                        </form>
                        <div
                            v-if="status.state === 'error' || busy"
                            class="terminal-message"
                            :class="{ error: status.state === 'error' }"
                            role="status"
                        >
                            {{ status.message }}
                        </div>
                        <div v-if="resetConfirm" class="reset-confirm" role="alert">
                            <p>Delete this lab’s files and start fresh? Your learning progress is kept.</p>
                            <button class="button danger" :disabled="busy" @click="resetLab">Reset lab</button
                            ><button class="button subtle" @click="resetConfirm = false">Cancel</button>
                        </div>
                        <footer class="terminal-footer">
                            <span
                                ><span class="status-dot" :class="{ online: isRunning }"></span
                                >{{
                                    isRunning
                                        ? `${runtime} · no host folders mounted`
                                        : "Disposable container · local to your computer"
                                }}</span
                            >
                            <div v-if="isRunning">
                                <button :disabled="busy" @click="interrupt">Ctrl+C</button
                                ><button :disabled="busy" @click="resetConfirm = !resetConfirm">
                                    <TrainerIcon name="reset" />Reset</button
                                ><button :disabled="busy" @click="stopLab">Stop</button>
                            </div>
                            <div v-else-if="api">
                                <button :disabled="busy" @click="resetConfirm = !resetConfirm">Reset lab</button
                                ><button v-if="output" :disabled="busy" @click="startLab">
                                    {{ busy ? "Preparing…" : "Start lab" }}
                                </button>
                            </div>
                        </footer>
                    </section>
                </div>
                <footer class="workspace-footer">
                    <span><TrainerIcon name="shield" />Learn by doing. Break things. Try again.</span
                    ><span>Independent practice project · Not affiliated with Red Hat</span>
                </footer>
            </template>

            <RapidQuiz
                v-else-if="section === 'quiz'"
                :current-path-id="selectedPath"
                :current-lesson-id="selectedLesson"
                :completed-lesson-ids="completed"
                @select-lesson="id => selectedLesson = id"
                @copy-command="handleCopyCommand"
            />

            <section v-else-if="section === 'progress'" class="utility-page">
                <div class="eyebrow">EVERY STEP COUNTS</div>
                <h1>Your learning, at a glance.</h1>
                <p>Checked labs and reviewed guides are saved on this computer.</p>
                <div class="progress-summary">
                    <strong
                        >{{ totalComplete }}<span> / {{ lessons.length }}</span></strong
                    ><span>unique lessons complete</span>
                </div>

                <div class="progress-management-bar">
                    <div class="manage-text">
                        <strong>Manage Training Data</strong>
                        <p>Export your achievements and checkpoints as a JSON backup, or import to restore on a new machine.</p>
                        <span v-if="progressFeedback" class="progress-feedback-msg">{{ progressFeedback }}</span>
                    </div>
                    <div class="manage-actions">
                        <button class="button subtle" @click="exportProgress">
                            <TrainerIcon name="copy" />Export (.json)
                        </button>
                        <button class="button subtle" @click="triggerImport">
                            <TrainerIcon name="arrow" />Import (.json)
                        </button>
                        <input
                            ref="importInput"
                            type="file"
                            accept=".json,application/json"
                            style="display: none"
                            @change="handleImport"
                        />
                        <button
                            class="button danger"
                            :disabled="!totalComplete && !installationCheckpoints.length"
                            @click="resetAllProgress"
                        >
                            <TrainerIcon name="reset" />Reset
                        </button>
                    </div>
                </div>

                <div class="progress-grid">
                    <article v-for="item in paths" :key="item.id">
                        <span class="exam-badge">{{ item.code }}</span>
                        <h2>{{ item.title }}</h2>
                        <p>
                            {{ item.lessonIds.filter(id => completed.includes(id)).length }} of
                            {{ item.lessonIds.length }} lessons complete
                        </p>
                        <div class="progress-track">
                            <div
                                :style="{
                                    width: `${(item.lessonIds.filter(id => completed.includes(id)).length / item.lessonIds.length) * 100}%`,
                                }"
                            ></div>
                        </div>
                        <button class="text-button" @click="selectPath(item.id)">
                            Continue learning<TrainerIcon name="arrow" />
                        </button>
                    </article>
                </div>
            </section>

            <section v-else class="utility-page setup-page">
                <div class="eyebrow">A WORKSPACE YOU CAN EXPERIMENT IN</div>
                <h1>Your Linux lab.</h1>
                <p>
                    A disposable UBI 10 container for foundational practice. Podman is recommended; Docker also works.
                </p>
                <article class="setup-card">
                    <TrainerIcon name="terminal" />
                    <div>
                        <h2>Local container environment</h2>
                        <p>
                            {{
                                api ? status.message : "Open RHELboat as a desktop app to connect a container runtime."
                            }}
                        </p>
                        <label
                            >Runtime<select v-model="runtime" :disabled="busy || isRunning">
                                <option value="podman">Podman</option>
                                <option value="docker">Docker</option>
                            </select></label
                        ><button
                            class="button primary"
                            :disabled="!api || busy"
                            @click="isRunning ? stopLab() : startLab()"
                        >
                            {{ busy ? "Preparing…" : isRunning ? "Stop lab" : "Start lab" }}
                        </button>
                    </div>
                </article>
                <div class="setup-notes">
                    <article>
                        <TrainerIcon name="shield" />
                        <h2>Practice with a clean slate</h2>
                        <p>
                            The lab has no host directory mounts and no runtime network access. It is limited to 1 CPU
                            core, 768 MiB RAM, and 128 processes. Stop preserves the lab files; reset deletes only this
                            app’s lab container. Closing the app stops the lab.
                        </p>
                    </article>
                    <article>
                        <TrainerIcon name="book" />
                        <h2>Know your environment</h2>
                        <p>
                            UBI provides Enterprise Linux userspace. It does not replace a full RHEL VM for boot,
                            systemd, SELinux, storage, clustering, or product-specific exercises. VM guides are marked,
                            and their completion is self-reported.
                        </p>
                        <button
                            class="text-button"
                            @click="openSource('https://access.redhat.com/support/policy/rhel-container-compatibility')"
                        >
                            Container compatibility<TrainerIcon name="external" />
                        </button>
                    </article>
                </div>
                <p class="coverage-note">
                    The shell is a line console with command history and Ctrl+C. Full-screen editors and interactive
                    terminal applications require an external terminal. Independent introductory material; use the
                    official objectives to plan complete exam preparation.
                </p>
            </section>
        </main>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import TrainerIcon from "../components/TrainerIcon.vue";
import InstallationLab from "../components/InstallationLab.vue";
import RapidQuiz from "../components/RapidQuiz.vue";
import { categories, lessons, workbooks } from "../data/curriculum";
import { normalizeProgress } from "../data/progress";
import type { LabStatus, Runtime, CheckResult } from "../../shared/trainer.js";

const api = window.trainer;
const section = ref("learn");
const isDark = ref(false);
const search = ref("");
const selectedCategory = ref(categories[0].id);
const selectedLesson = ref(categories[0].lessonIds[0]);
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
const category = computed(() => categories.find(item => item.id === selectedCategory.value)!);
const categoryLessons = computed(() => category.value.lessonIds.map(id => lessons.find(item => item.id === id)!));
const lesson = computed(() => lessons.find(item => item.id === selectedLesson.value)!);
const step = computed(() => lesson.value.steps[stepIndex.value]);
const filteredCategories = computed(() =>
    categories.filter(item =>
        `${item.code} ${item.title} ${item.topics.join(" ")}`.toLowerCase().includes(search.value.toLowerCase()),
    ),
);
const percent = computed(() =>
    Math.round(
        (categoryLessons.value.filter(item => completed.value.includes(item.id)).length /
            categoryLessons.value.length) *
            100,
    ),
);
const totalComplete = computed(() => lessons.filter(item => completed.value.includes(item.id)).length);
const isRunning = computed(() => status.value.state === "running");
const isLastStep = computed(() => stepIndex.value === lesson.value.steps.length - 1);
const isInstallation = computed(() => lesson.value.id === "rhel-installation");
const needsCheckpoint = computed(() => lesson.value.environment !== "container");
const practiceCheckpoints = ref<Record<string, string[]>>({});
const currentCheckpoints = computed({
    get: () =>
        isInstallation.value ? installationCheckpoints.value : practiceCheckpoints.value[lesson.value.id] || [],
    set: (value: string[]) => {
        if (isInstallation.value) installationCheckpoints.value = value;
        else practiceCheckpoints.value = { ...practiceCheckpoints.value, [lesson.value.id]: value };
    },
});
function checkpointsComplete(id: string) {
    const item = lessons.find(item => item.id === id)!;
    const saved = id === "rhel-installation" ? installationCheckpoints.value : practiceCheckpoints.value[id] || [];
    return item.steps.every(step => saved.includes(step.id));
}
const practiceComplete = computed(() => checkpointsComplete(lesson.value.id));
const currentStepDone = computed(() => currentCheckpoints.value.includes(step.value.id));
const sourceVisible = ref(false);
const sourceError = ref("");
const commandVisible = ref(false);
const helpPanel = ref<HTMLDivElement | null>(null);
const lessonScroll = ref<HTMLDivElement | null>(null);
function toggleHelp() {
    hintVisible.value = !hintVisible.value;
    if (hintVisible.value) void nextTick(() => helpPanel.value?.scrollIntoView({ block: "nearest" }));
}
function practiceStepLocked(index: number) {
    return (
        needsCheckpoint.value &&
        lesson.value.steps.slice(0, index).some(item => !currentCheckpoints.value.includes(item.id))
    );
}
async function openWorkbook(id: string) {
    sourceError.value = "";
    try {
        await api?.openWorkbook(id);
    } catch (error) {
        sourceError.value = error instanceof Error ? error.message : String(error);
    }
}
function selectInstallation() {
    selectCategory("basics");
    selectedLesson.value = "rhel-installation";
}

function selectCategory(id: string) {
    selectedCategory.value = id;
    selectedLesson.value = category.value.lessonIds[0];
    section.value = "learn";
    overviewVisible.value = false;
}
watch(selectedLesson, () => {
    stepIndex.value = 0;
    hintVisible.value = false;
    feedback.value = null;
    sourceVisible.value = false;
    sourceError.value = "";
    commandVisible.value = false;
    void nextTick(() => lessonScroll.value?.scrollTo({ top: 0 }));
});
watch(stepIndex, () => {
    hintVisible.value = false;
    commandVisible.value = false;
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
        if (!checkpointsComplete("rhel-installation"))
            completed.value = completed.value.filter(id => id !== "rhel-installation");
        try {
            localStorage.setItem("rhelboat.installation.checkpoints.v1", JSON.stringify(value));
        } catch {
            /* Checkpoints remain available for this session. */
        }
    },
    { deep: true },
);

watch(
    practiceCheckpoints,
    value => {
        completed.value = completed.value.filter(
            id => lessons.find(item => item.id === id)?.checkId || checkpointsComplete(id),
        );
        try {
            localStorage.setItem("rhelboat.practice.checkpoints.v1", JSON.stringify(value));
        } catch {
            /* Session progress still works. */
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
watch(terminalMount, mount => {
    term?.dispose();
    term = null;
    if (mount && isRunning.value) setupTerminal();
});

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
        const saved = normalizeProgress({
            completed: JSON.parse(localStorage.getItem("rhelboat.progress.v1") || "[]"),
            installationCheckpoints: JSON.parse(localStorage.getItem("rhelboat.installation.checkpoints.v1") || "[]"),
            practiceCheckpoints: JSON.parse(localStorage.getItem("rhelboat.practice.checkpoints.v1") || "{}"),
        });
        completed.value = saved.completed;
        installationCheckpoints.value = saved.installationCheckpoints;
        practiceCheckpoints.value = saved.practiceCheckpoints;
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
    if (!lessons.find(item => item.id === id)?.checkId && !checkpointsComplete(id)) return;
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
    const index = categoryLessons.value.findIndex(item => item.id === selectedLesson.value);
    if (index < categoryLessons.value.length - 1) selectedLesson.value = categoryLessons.value[index + 1].id;
}
function openSource(url: string) {
    if (api) void api.openSource(url).catch(showError);
    else window.open(url, "_blank", "noopener,noreferrer");
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
        practiceCheckpoints: practiceCheckpoints.value,
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
            const saved = normalizeProgress(JSON.parse(String(e.target?.result || "{}")));
            completed.value = saved.completed;
            installationCheckpoints.value = saved.installationCheckpoints;
            practiceCheckpoints.value = saved.practiceCheckpoints;
            progressFeedback.value = "Progress imported successfully.";
        } catch {
            progressFeedback.value = "Choose a valid RHELboat progress JSON backup.";
        }
    };
    reader.readAsText(file);
    input.value = "";
}

function resetAllProgress() {
    if (confirm("Are you sure you want to reset all completed lessons and checkpoints? This cannot be undone.")) {
        completed.value = [];
        installationCheckpoints.value = [];
        practiceCheckpoints.value = {};
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
                    <TrainerIcon name="book" />Training library<span class="nav-count">{{ categories.length }}</span>
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
                <span class="sidebar-section-label">TRAINING CATEGORIES</span><span>{{ categories.length }}</span>
            </div>
            <label class="path-search"
                ><TrainerIcon name="search" /><input
                    v-model="search"
                    placeholder="Find a category or topic…"
                    aria-label="Find a training category"
            /></label>
            <nav class="path-nav" aria-label="Training categories">
                <button
                    v-for="item in filteredCategories"
                    :key="item.id"
                    :class="{ selected: selectedCategory === item.id && section === 'learn' }"
                    @click="selectCategory(item.id)"
                >
                    <span class="path-icon"><TrainerIcon :name="item.icon" /></span>
                    <span class="path-code">{{ item.code }}</span
                    ><span class="path-name">{{ item.title }}</span
                    ><TrainerIcon name="chevron" />
                </button>
                <p v-if="!filteredCategories.length" class="empty-search">No matching categories.</p>
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
                            ? "Training library"
                            : section === "quiz"
                              ? "Rapid topic quiz"
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
                        <div class="eyebrow">
                            <span class="track-marker"></span>ENTERPRISE LINUX / CATEGORY {{ category.code }}
                        </div>
                        <h1>{{ category.title }}</h1>
                        <p>{{ category.subtitle }}</p>
                        <div class="course-meta">
                            <span class="exam-badge">Category {{ category.code }}</span
                            ><span>Workbook practice</span><span class="meta-divider"></span
                            ><span>{{ categoryLessons.length }} guided lessons</span
                            ><span class="version-label">RHEL 9 / 10 source material</span>
                        </div>
                    </div>
                    <div class="course-progress">
                        <div class="progress-number">{{ percent }}<span>%</span></div>
                        <span>category progress</span>
                        <div class="progress-track"><div :style="{ width: percent + '%' }"></div></div>
                        <button class="text-button" @click="overviewVisible = !overviewVisible">
                            {{ overviewVisible ? "Hide" : "View" }} topics <TrainerIcon name="chevron" />
                        </button>
                    </div>
                </section>
                <section v-if="overviewVisible" class="objectives-panel">
                    <div>
                        <h2>Topics in {{ category.title }}</h2>
                        <p>{{ category.description }}</p>
                        <p class="coverage-note">
                            Original practice scenarios follow the workbook subjects. Read the linked source pages for
                            additional context and use the marked environment for each task.
                        </p>
                    </div>
                    <ul>
                        <li v-for="topic in category.topics" :key="topic">{{ topic }}</li>
                    </ul>
                </section>
                <div class="lesson-toolbar">
                    <div>
                        <TrainerIcon name="book" /><label for="lesson-select">Your lesson</label
                        ><select id="lesson-select" v-model="selectedLesson">
                            <option v-for="(item, index) in categoryLessons" :key="item.id" :value="item.id">
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
                                    ? "VM lab"
                                    : "Multiple-VM lab"
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
                        <div ref="lessonScroll" class="lesson-scroll">
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
                                    This lab requires
                                    {{
                                        lesson.environment === "vm"
                                            ? "a disposable RHEL virtual machine"
                                            : "multiple RHEL machines or a product-specific environment"
                                    }}. Tasks and command examples are for that environment. The container shell cannot
                                    validate these tasks.
                                </p>
                            </div>
                            <ul v-if="lesson.environment !== 'container'" class="lab-requirements">
                                <li v-for="requirement in lesson.requirements" :key="requirement">{{ requirement }}</li>
                            </ul>
                            <nav class="step-navigation" aria-label="Lesson steps">
                                <button
                                    v-for="(item, index) in lesson.steps"
                                    :key="index"
                                    :class="{ current: stepIndex === index, past: stepIndex > index }"
                                    :aria-label="`Step ${index + 1}: ${item.title}`"
                                    :aria-current="stepIndex === index ? 'step' : undefined"
                                    :disabled="practiceStepLocked(index)"
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
                                <button class="hint-toggle" :aria-expanded="hintVisible" @click="toggleHelp">
                                    <TrainerIcon name="info" />{{
                                        hintVisible ? "Hide step help" : "Help with this step"
                                    }}
                                </button>
                                <div
                                    v-if="hintVisible"
                                    ref="helpPanel"
                                    class="step-help"
                                    role="region"
                                    aria-label="Help for this step"
                                >
                                    <strong>Feature to use</strong>
                                    <p>{{ step.help.feature }}</p>
                                    <strong>Why it helps</strong>
                                    <p>{{ step.help.why }}</p>
                                    <button
                                        v-if="step.command"
                                        class="text-button"
                                        @click="commandVisible = !commandVisible"
                                    >
                                        {{ commandVisible ? "Hide command example" : "Show command example" }}
                                    </button>
                                    <div v-if="commandVisible && step.command" class="command-hint">
                                        <pre>{{ step.command }}</pre>
                                        <button
                                            v-if="lesson.environment === 'container'"
                                            class="text-button"
                                            @click="useCommand"
                                        >
                                            <TrainerIcon name="copy" />Use in shell
                                        </button>
                                        <span v-else>Run in the disposable RHEL guest console.</span>
                                    </div>
                                </div>
                            </article>
                            <label v-if="needsCheckpoint" class="installation-checkpoint"
                                ><input v-model="currentCheckpoints" type="checkbox" :value="step.id" />I completed this
                                step in the required lab environment (self-reported).</label
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
                                    :disabled="needsCheckpoint && !practiceComplete"
                                    @click="markComplete()"
                                >
                                    <TrainerIcon name="check" />{{
                                        completed.includes(lesson.id) ? "Practice recorded" : "Record lab practice"
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
                                          : "Lab practice completed · self-reported"
                                }}
                            </div>
                            <button
                                class="source-link"
                                :aria-expanded="sourceVisible"
                                @click="sourceVisible = !sourceVisible"
                            >
                                Workbook references <TrainerIcon name="book" />
                            </button>
                            <div v-if="sourceVisible" class="workbook-references">
                                <p>
                                    These lesson summaries and scenarios are original adaptations. Page numbers below
                                    are PDF page numbers.
                                </p>
                                <article
                                    v-for="reference in lesson.references"
                                    :key="reference.workbookId + reference.section"
                                >
                                    <strong>{{ workbooks[reference.workbookId].title }}</strong>
                                    <span
                                        >{{ workbooks[reference.workbookId].release }} · PDF pages
                                        {{ reference.pages[0] }}–{{ reference.pages[1] }}</span
                                    >
                                    <p>{{ reference.section }}</p>
                                    <button
                                        class="text-button"
                                        :disabled="!api"
                                        @click="openWorkbook(reference.workbookId)"
                                    >
                                        Open local PDF
                                    </button>
                                </article>
                                <p v-if="!api">Open the desktop app to read a local PDF from training/.</p>
                                <p v-if="sourceError" role="alert">{{ sourceError }}</p>
                            </div>
                        </div>
                        <footer class="lesson-footer">
                            <button class="button subtle" :disabled="stepIndex === 0" @click="stepIndex--">
                                Previous</button
                            ><span>{{ stepIndex + 1 }} of {{ lesson.steps.length }}</span
                            ><button
                                v-if="!isLastStep"
                                class="button dark"
                                :disabled="needsCheckpoint && !currentStepDone"
                                @click="stepIndex++"
                            >
                                Next step<TrainerIcon name="arrow" /></button
                            ><button
                                v-else
                                class="button dark"
                                :disabled="
                                    selectedLesson === categoryLessons[categoryLessons.length - 1].id ||
                                    (needsCheckpoint && !completed.includes(lesson.id))
                                "
                                @click="nextLesson"
                            >
                                Next lesson<TrainerIcon name="arrow" />
                            </button>
                        </footer>
                    </section>

                    <InstallationLab
                        v-if="lesson.environment === 'vm'"
                        :installing="isInstallation"
                        @open-installation="selectInstallation"
                    />
                    <section
                        v-else-if="lesson.environment === 'multi-node'"
                        class="terminal-pane environment-pane"
                        aria-label="Required lab environment"
                    >
                        <div class="terminal-header"><strong>Multiple-VM practice</strong></div>
                        <div class="environment-content">
                            <TrainerIcon name="cluster" />
                            <h3>Prepare your lab machines.</h3>
                            <p>This topic needs the systems listed below. Perform its tasks in their guest consoles.</p>
                            <ul>
                                <li v-for="requirement in lesson.requirements" :key="requirement">{{ requirement }}</li>
                            </ul>
                            <p>
                                Checkpoints record your own observations. These guests are not automatically provisioned
                                or graded.
                            </p>
                            <button class="button secondary" @click="selectInstallation">
                                Open installation practice
                            </button>
                        </div>
                    </section>
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
                :current-category-id="selectedCategory"
                :current-lesson-id="selectedLesson"
                :completed-lesson-ids="completed"
            />

            <section v-else-if="section === 'progress'" class="utility-page">
                <div class="eyebrow">EVERY STEP COUNTS</div>
                <h1>Your learning, at a glance.</h1>
                <p>Checked container labs and recorded VM practice are saved on this computer.</p>
                <div class="progress-summary">
                    <strong
                        >{{ totalComplete }}<span> / {{ lessons.length }}</span></strong
                    ><span>unique lessons complete</span>
                </div>

                <div class="progress-management-bar">
                    <div class="manage-text">
                        <strong>Manage Training Data</strong>
                        <p>
                            Export your achievements and checkpoints as a JSON backup, or import to restore on a new
                            machine.
                        </p>
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
                            :disabled="
                                !totalComplete &&
                                !installationCheckpoints.length &&
                                !Object.values(practiceCheckpoints).some(value => value.length)
                            "
                            @click="resetAllProgress"
                        >
                            <TrainerIcon name="reset" />Reset
                        </button>
                    </div>
                </div>

                <div class="progress-grid">
                    <article v-for="item in categories" :key="item.id">
                        <span class="exam-badge">Category {{ item.code }}</span>
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
                        <button class="text-button" @click="selectCategory(item.id)">
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
                            systemd, SELinux, storage, clustering, or product-specific exercises. VM labs are marked,
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
                    Use the shell for container lessons and the guest console for VM lessons. Source pages, tool
                    explanations and command examples are available beside each guided step.
                </p>
            </section>
        </main>
    </div>
</template>

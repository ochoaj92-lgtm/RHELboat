<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import TrainerIcon from "./TrainerIcon.vue";
import { questionsFor, type QuizQuestion, type QuizTarget } from "../data/quiz";
import { categories, lessons } from "../data/curriculum";

const props = defineProps<{
    currentCategoryId?: string;
    currentLessonId?: string;
    completedLessonIds: string[];
}>();

type QuizState = "config" | "active" | "summary";

const state = ref<QuizState>("config");
const target = ref<QuizTarget>("current");
const questionCount = ref<number>(5);

const activeQuestions = ref<QuizQuestion[]>([]);
const currentIndex = ref<number>(0);
const selectedAnswer = ref<number | null>(null);
const answered = ref<boolean>(false);
const score = ref<number>(0);
const userAnswers = ref<{ questionId: string; selected: number; correct: boolean }[]>([]);

// Stats tracking
const totalQuizzesTaken = ref<number>(0);
const highestScore = ref<number>(0);

onMounted(() => {
    try {
        const history = JSON.parse(localStorage.getItem("rhelboat.quiz.stats.v1") || "{}");
        if (history.total) totalQuizzesTaken.value = history.total;
        if (history.highest) highestScore.value = history.highest;
    } catch {
        /* Local storage unavailable */
    }
});

const currentLesson = computed(() => lessons.find(l => l.id === props.currentLessonId));
const currentCategory = computed(() => categories.find(p => p.id === props.currentCategoryId));

const availablePool = computed(() =>
    questionsFor(target.value, props.currentLessonId, props.currentCategoryId, props.completedLessonIds),
);

const currentQuestion = computed(() => activeQuestions.value[currentIndex.value]);

function startQuiz() {
    const pool = [...availablePool.value];
    if (!pool.length) return;
    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    activeQuestions.value = pool.slice(0, Math.min(questionCount.value, pool.length));
    currentIndex.value = 0;
    selectedAnswer.value = null;
    answered.value = false;
    score.value = 0;
    userAnswers.value = [];
    state.value = "active";
}

function selectOption(index: number) {
    if (answered.value) return;
    selectedAnswer.value = index;
    answered.value = true;
    const isCorrect = index === currentQuestion.value.correctIndex;
    if (isCorrect) score.value++;
    userAnswers.value.push({
        questionId: currentQuestion.value.id,
        selected: index,
        correct: isCorrect,
    });
}

function nextQuestion() {
    if (currentIndex.value < activeQuestions.value.length - 1) {
        currentIndex.value++;
        selectedAnswer.value = null;
        answered.value = false;
    } else {
        finishQuiz();
    }
}

function finishQuiz() {
    state.value = "summary";
    totalQuizzesTaken.value++;
    const currentPercent = Math.round((score.value / activeQuestions.value.length) * 100);
    if (currentPercent > highestScore.value) {
        highestScore.value = currentPercent;
    }
    try {
        localStorage.setItem(
            "rhelboat.quiz.stats.v1",
            JSON.stringify({
                total: totalQuizzesTaken.value,
                highest: highestScore.value,
                lastTaken: Date.now(),
            }),
        );
    } catch {
        /* Local storage unavailable */
    }
}
</script>

<template>
    <section class="rapid-quiz-container" aria-label="Workbook topic quiz">
        <!-- Configuration View -->
        <div v-if="state === 'config'" class="quiz-config-view">
            <div class="eyebrow">WORKBOOK TOPIC REVIEW</div>
            <h1>Rapid Knowledge Check.</h1>
            <p>Review concepts from the workbook topics you are learning or have completed.</p>

            <div class="quiz-stats-bar">
                <div>
                    <span class="stat-number">{{ totalQuizzesTaken }}</span>
                    <span class="stat-label">Quizzes Completed</span>
                </div>
                <div>
                    <span class="stat-number">{{ highestScore }}%</span>
                    <span class="stat-label">Best Score</span>
                </div>
                <div>
                    <span class="stat-number">{{ availablePool.length }}</span>
                    <span class="stat-label">Questions in Active Pool</span>
                </div>
            </div>

            <div class="quiz-setup-grid">
                <!-- Environment / Target -->
                <div class="config-card">
                    <h3><TrainerIcon name="compass" />Choose Review Topics</h3>
                    <p class="config-desc">Choose which topics the quiz should use:</p>
                    <div class="options-group">
                        <label class="radio-card" :class="{ selected: target === 'current' }">
                            <input v-model="target" type="radio" value="current" />
                            <div>
                                <strong>Current Lesson Topic</strong>
                                <small v-if="currentLesson"
                                    >{{ currentLesson.title }} ({{ currentLesson.topic }})</small
                                >
                                <small v-else>Active workspace lesson</small>
                            </div>
                        </label>

                        <label
                            class="radio-card"
                            :class="{ selected: target === 'completed', disabled: !completedLessonIds.length }"
                        >
                            <input
                                v-model="target"
                                type="radio"
                                value="completed"
                                :disabled="!completedLessonIds.length"
                            />
                            <div>
                                <strong>All Completed Lessons</strong>
                                <small>{{ completedLessonIds.length }} completed lessons</small>
                            </div>
                        </label>

                        <label class="radio-card" :class="{ selected: target === 'category' }">
                            <input v-model="target" type="radio" value="category" />
                            <div>
                                <strong>Current Category</strong><small>{{ currentCategory?.title }}</small>
                            </div>
                        </label>

                        <label class="radio-card" :class="{ selected: target === 'all' }">
                            <input v-model="target" type="radio" value="all" />
                            <div>
                                <strong>All Workbook Topics</strong>
                                <small>Randomized review across every training category</small>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- Simulation Settings -->
                <div class="config-card">
                    <h3><TrainerIcon name="settings" />Quiz Length</h3>

                    <div class="param-row">
                        <label>Drill Length</label>
                        <div class="pill-selector">
                            <button type="button" :class="{ active: questionCount === 5 }" @click="questionCount = 5">
                                5 Questions (Rapid)
                            </button>
                            <button type="button" :class="{ active: questionCount === 10 }" @click="questionCount = 10">
                                10 Questions (Standard)
                            </button>
                            <button type="button" :class="{ active: questionCount === 15 }" @click="questionCount = 15">
                                15 Questions (Sprint)
                            </button>
                        </div>
                    </div>

                    <div class="simulation-overview">
                        <div class="overview-item">
                            <TrainerIcon name="shield" />
                            <span>An explanation of each answer and its purpose</span>
                        </div>
                        <div class="overview-item">
                            <TrainerIcon name="terminal" />
                            <span>Practice the related task in its marked container or VM lab</span>
                        </div>
                    </div>

                    <p v-if="!availablePool.length" role="status">
                        No questions match this selection yet. Choose another review group.
                    </p>
                    <button class="button primary start-quiz-btn" :disabled="!availablePool.length" @click="startQuiz">
                        <TrainerIcon name="play" />Start Quiz ({{
                            Math.min(questionCount, availablePool.length)
                        }}
                        Questions)
                    </button>
                </div>
            </div>
        </div>

        <!-- Active Question View -->
        <div v-else-if="state === 'active' && currentQuestion" class="quiz-active-view">
            <header class="quiz-header">
                <div class="progress-indicator">
                    <span>Question {{ currentIndex + 1 }} of {{ activeQuestions.length }}</span>
                    <div class="quiz-progress-bar">
                        <div
                            class="quiz-progress-fill"
                            :style="{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }"
                        ></div>
                    </div>
                </div>
                <div class="quiz-badge">
                    <span class="topic-tag">{{
                        lessons.find(item => item.id === currentQuestion.lessonId)?.topic
                    }}</span>
                    <span class="diff-tag">{{ "Topic review" }}</span>
                </div>
            </header>

            <article class="question-card">
                <div class="scenario-banner">
                    <TrainerIcon name="terminal" />
                    <div>
                        <strong>Scenario</strong>
                        <p>{{ currentQuestion.scenario }}</p>
                    </div>
                </div>

                <h2 class="question-text">{{ currentQuestion.question }}</h2>

                <div class="options-list">
                    <button
                        v-for="(option, idx) in currentQuestion.options"
                        :key="idx"
                        class="option-item"
                        :class="{
                            selected: selectedAnswer === idx,
                            correct: answered && idx === currentQuestion.correctIndex,
                            incorrect: answered && selectedAnswer === idx && idx !== currentQuestion.correctIndex,
                            dimmed: answered && idx !== currentQuestion.correctIndex && selectedAnswer !== idx,
                        }"
                        :disabled="answered"
                        @click="selectOption(idx)"
                    >
                        <span class="option-prefix">{{ ["A", "B", "C", "D"][idx] }}</span>
                        <code class="option-content">{{ option }}</code>
                        <span v-if="answered && idx === currentQuestion.correctIndex" class="verdict-icon correct">
                            <TrainerIcon name="check" />
                        </span>
                        <span
                            v-else-if="answered && selectedAnswer === idx && idx !== currentQuestion.correctIndex"
                            class="verdict-icon incorrect"
                        >
                            ×
                        </span>
                    </button>
                </div>

                <!-- Explanation / Feedback Panel -->
                <div
                    v-if="answered"
                    class="explanation-box"
                    :class="{ correct: selectedAnswer === currentQuestion.correctIndex }"
                >
                    <div class="explanation-header">
                        <TrainerIcon :name="selectedAnswer === currentQuestion.correctIndex ? 'check' : 'info'" />
                        <strong>
                            {{ selectedAnswer === currentQuestion.correctIndex ? "Correct!" : "Incorrect" }}
                        </strong>
                    </div>
                    <p>{{ currentQuestion.explanation }}</p>
                </div>
            </article>

            <footer class="quiz-footer">
                <button class="button subtle" @click="state = 'config'">Abort Quiz</button>
                <button v-if="answered" class="button dark next-btn" @click="nextQuestion">
                    {{ currentIndex === activeQuestions.length - 1 ? "View Score" : "Next Question" }}
                    <TrainerIcon name="arrow" />
                </button>
            </footer>
        </div>

        <!-- Summary Scorecard View -->
        <div v-else-if="state === 'summary'" class="quiz-summary-view">
            <div class="eyebrow">QUIZ RESULTS</div>
            <h1>Performance Breakdown</h1>

            <div class="score-card">
                <div class="score-circle">
                    <span class="score-val">{{ Math.round((score / activeQuestions.length) * 100) }}%</span>
                    <span class="score-fraction">{{ score }} / {{ activeQuestions.length }} Correct</span>
                </div>
                <div class="score-feedback">
                    <h2>
                        {{
                            score === activeQuestions.length
                                ? "Flawless Performance!"
                                : score / activeQuestions.length >= 0.8
                                  ? "Strong recall."
                                  : "Good Effort — Keep Drilling."
                        }}
                    </h2>
                    <p>
                        {{
                            score === activeQuestions.length
                                ? "You recalled these concepts. Practice the related tasks to test how you apply them."
                                : "Review the question breakdowns below and practice unfamiliar tools in the environment marked for the related lesson."
                        }}
                    </p>
                    <div class="summary-actions">
                        <button class="button primary" @click="startQuiz">
                            <TrainerIcon name="reset" />Retry This Quiz
                        </button>
                        <button class="button secondary" @click="state = 'config'">New Configuration</button>
                    </div>
                </div>
            </div>

            <!-- Detailed Question Log -->
            <div class="review-log">
                <h3>Question Review</h3>
                <div
                    v-for="(ans, idx) in userAnswers"
                    :key="ans.questionId"
                    class="review-item"
                    :class="{ passed: ans.correct }"
                >
                    <div class="review-header">
                        <span class="review-status">
                            <TrainerIcon :name="ans.correct ? 'check' : 'info'" />
                            Question {{ idx + 1 }}: {{ ans.correct ? "Correct" : "Missed" }}
                        </span>
                        <span class="review-topic">{{
                            lessons.find(item => item.id === activeQuestions[idx]?.lessonId)?.topic
                        }}</span>
                    </div>
                    <p class="review-q">{{ activeQuestions[idx]?.question }}</p>
                    <div class="review-ans">
                        <span
                            >Your answer: <code>{{ activeQuestions[idx]?.options[ans.selected] }}</code></span
                        >
                        <span v-if="!ans.correct" class="correct-ans">
                            Correct:
                            <code>{{ activeQuestions[idx]?.options[activeQuestions[idx]?.correctIndex] }}</code>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

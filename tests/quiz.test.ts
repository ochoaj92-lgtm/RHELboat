import assert from "node:assert/strict";
import test from "node:test";
import { quizQuestions, questionsFor } from "../src/renderer/data/quiz.ts";
import { lessons, categories } from "../src/renderer/data/curriculum.ts";

test("every workbook topic has one unambiguous review question", () => {
    assert.equal(quizQuestions.length, lessons.length);
    assert.equal(new Set(quizQuestions.map(item => item.id)).size, quizQuestions.length);
    assert.deepEqual(quizQuestions.map(item => item.lessonId).sort(), lessons.map(item => item.id).sort());
    for (const question of quizQuestions) {
        assert.ok(question.scenario.length > 15 && question.question.length > 15 && question.explanation.length > 30);
        assert.equal(new Set(question.options).size, 4);
        assert.ok(Number.isInteger(question.correctIndex) && question.correctIndex >= 0 && question.correctIndex < 4);
    }
});

test("quiz filters honor the exact topic, category and completed topics without unrelated fallback", () => {
    assert.deepEqual(
        questionsFor("current", "lvm", "storage", []).map(item => item.lessonId),
        ["lvm"],
    );
    assert.deepEqual(
        questionsFor("completed", "lvm", "storage", []).map(item => item.lessonId),
        [],
    );
    assert.deepEqual(
        questionsFor("completed", "lvm", "storage", ["archive", "navigation"])
            .map(item => item.lessonId)
            .sort(),
        ["archive", "navigation"],
    );
    for (const category of categories) {
        assert.deepEqual(
            questionsFor("category", undefined, category.id, [])
                .map(item => item.lessonId)
                .sort(),
            category.lessonIds.toSorted(),
        );
    }
});

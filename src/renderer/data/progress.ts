import { lessons } from "./curriculum.ts";

export function normalizeProgress(value: unknown) {
    if (!value || typeof value !== "object" || !Array.isArray((value as Record<string, unknown>).completed)) {
        throw new Error("Choose a RHELboat progress backup containing a completed lesson list.");
    }
    const data = value as Record<string, unknown>;
    const validSteps = (id: string, saved: unknown): string[] => {
        const item = lessons.find(item => item.id === id);
        return Array.isArray(saved) && item
            ? [
                  ...new Set(
                      saved.filter(
                          (step): step is string => typeof step === "string" && item.steps.some(s => s.id === step),
                      ),
                  ),
              ]
            : [];
    };
    const installationCheckpoints = validSteps("rhel-installation", data.installationCheckpoints);
    const practiceCheckpoints: Record<string, string[]> = {};
    const practice = data.practiceCheckpoints;
    if (practice && typeof practice === "object" && !Array.isArray(practice)) {
        for (const item of lessons.filter(item => !item.checkId && item.id !== "rhel-installation")) {
            const saved = validSteps(item.id, (practice as Record<string, unknown>)[item.id]);
            if (saved.length) practiceCheckpoints[item.id] = saved;
        }
    }
    const completed = [
        ...new Set(
            (data.completed as unknown[]).filter((id): id is string => {
                const item = lessons.find(item => item.id === id);
                if (!item) return false;
                if (item.checkId) return true;
                const saved = id === "rhel-installation" ? installationCheckpoints : practiceCheckpoints[item.id] || [];
                return item.steps.every(step => saved.includes(step.id));
            }),
        ),
    ];
    return { completed, installationCheckpoints, practiceCheckpoints };
}

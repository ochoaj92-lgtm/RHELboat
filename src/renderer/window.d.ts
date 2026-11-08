interface Window {
    trainer?: import("../shared/trainer.js").TrainerAPI & { openSource: (url: string) => Promise<void> };
}

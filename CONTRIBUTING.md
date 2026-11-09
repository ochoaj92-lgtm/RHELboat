# Contributing to RHELboat

RHELboat is an independent Enterprise Linux training app. Contributions should help learners understand a topic, practice safely, or verify their work.

## Make a focused change

Fork this repository, create a descriptive branch, and keep each pull request centered on one problem. For a substantial new feature or training category, describe the learner's goal in an issue before implementation. Check existing issues first.

The active app uses TypeScript, Vue, and Electron. Reuse existing components and helpers, and avoid new dependencies when the platform or installed packages already solve the problem. Keep legacy integration sources separate from the trainer startup.

## Add or improve lessons

Curriculum lives in `src/renderer/data/curriculum.ts`; container checks live in `src/main/lab.ts`.

- Write original explanations and practice tasks, and cite the relevant local workbook section and PDF page range.
- State the required environment accurately: container, disposable VM, or multi-node infrastructure.
- Check the resulting system state for container labs. VM step confirmations must remain distinct from verified container results.
- Keep instructions repeatable and disclose commands that replace exercise files or alter a practice system.
- Every VM lesson uses stable step IDs for saved checkpoints. Preserve IDs when editing wording; do not rename or reuse them for different tasks without a progress migration. VM checkpoints are self-reported, not automatic guest validation.
- Do not submit exam questions, exam dumps, or copied commercial courseware.

Preserve the lab's host isolation, runtime ownership checks, accessibility, and local data. Never introduce a host-directory mount, privileged container, or destructive host command to make an exercise work. The installation VM must use only its app-owned virtual disk; keep ISO and resource validation at the main-process boundary. Do not automate Red Hat sign-in or acceptance of license terms, store guest credentials, or treat a requested graceful shutdown as proof that the guest has stopped.

## Check your work

Use Node.js 24+ and Podman or Docker as described in [README.md](README.md). Windows contributor and installer instructions are in [docs/WINDOWS.md](docs/WINDOWS.md). POSIX shell and QEMU fixture tests run on Linux; the Windows job runs the portable tests plus an installed-app smoke check.

```sh
npm run typecheck
npm test
npm run build
```

Use the opt-in Podman test for changes to container behavior:

```sh
RHELBOAT_LIVE_TEST=1 node --test tests/lab.test.ts
```

It requires that no `rhelboat-lab` container already exists. For installation changes, distinguish fixture tests from an actual ISO installation, and report any unavailable QEMU, KVM or entitled ISO coverage. Preserve the VM disk and confirm a clean guest shutdown; closing the app does not stop its separate QEMU process. For visual changes, include a screenshot and check the smaller desktop layout, keyboard navigation, focus indicators, and reduced-motion behavior. Follow [docs/BRANDING.md](docs/BRANDING.md) when changing icons or artwork.

## Open a pull request

Explain the concrete problem, the resulting behavior, and how you verified it. Link any relevant issue. Describe limits or untested environments, especially for VM, multi-node, or Docker changes. Use a draft pull request while work is incomplete.

Retain the upstream MIT copyright and license notices. Community participation follows [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Report security concerns through [SECURITY.md](SECURITY.md).

# Windows application and installer

The Windows x64 build includes the training categories, lessons, quizzes, saved progress, local workbook access and container-lab controls. It uses the same interface as Linux.

## Install and start

1. Download **rhelboat-windows-x64** from a successful run of the [Windows installer builder](https://github.com/ochoaj92-lgtm/RHELboat/actions/workflows/release.yml?query=branch%3Awindows-installer), extract the ZIP, and run `RHELboat-Setup-<version>-x64.exe` on a supported Windows x64 desktop. Windows 11 x64 is the initial target. ARM64 is not a native build target yet.
2. Follow the assisted installer. It defaults to a per-user installation and offers an installation-directory choice. Start-menu and desktop shortcuts are created. The app includes its own runtime; learners do not need Node.js.
3. Open RHELboat. Lessons and quizzes work without a container runtime. Container labs require the separate setup below.

Builds are currently unsigned unless the release environment supplies signing credentials. A production distribution should use a trusted Windows code-signing identity; see [electron-builder's signing instructions](https://www.electron.build/code-signing-win). Do not bypass Windows security prompts for an installer whose origin you have not verified.

## Prepare the Linux container labs

Install and start [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/) with the WSL 2 backend and Linux containers engine. Follow [Microsoft's WSL setup](https://learn.microsoft.com/en-us/windows/wsl/install) if required by Docker Desktop. Review Docker's current platform requirements and license terms yourself.

In PowerShell, verify:

```powershell
docker info --format '{{.OSType}}'
```

The result must be `linux`. Reopen RHELboat after installing the CLI so it inherits the updated PATH. Docker is selected by default on Windows. A configured, running Podman machine is an alternative; select Podman explicitly in Lab setup.

The app invokes `docker.exe` or `podman.exe` directly. Bash and the PTY helper run inside the UBI Linux container; a Windows Bash installation is not needed. The lab retains its no-host-mount, no-runtime-network and resource limits. The first image build needs network access.

The RHELboat installer does not install Docker, enable WSL, accept another product's terms, change virtualization settings or reboot Windows.

## RHEL VM lessons

The managed QEMU launcher currently supports Linux hosts. On Windows:

1. Prepare a disposable RHEL VM in your Windows virtualization tool with a dedicated virtual disk. Suggested sizing is 2 vCPUs, 4 GiB RAM and 40 GiB disk; check the selected RHEL release's actual requirements and CPU support.
2. Download the RHEL DVD ISO through your own Red Hat account. RHELboat can select the local ISO, compute SHA-256 and compare it with the value you obtained from Red Hat.
3. Attach the verified ISO in your virtualization tool. Perform the guided lesson in that guest console, then detach the ISO before booting the installed disk.
4. Use the same guest for suitable VM labs. Prepare extra disks, snapshots and additional guests when a lesson requires them. These environments and their completion are self-reported.

The Windows app hides Linux-only QEMU power and acceleration controls. It does not manage or delete your external VMs.

## Local books and learner data

Put personal copies of the registered PDFs in `Documents\RHELboat\training`. Required filenames are listed in [the workbook catalog](../src/main/workbook-catalog.ts); **Workbook references → Open local PDF** opens them in the default PDF reader. Missing books do not prevent the adapted lessons from working.

Progress and application settings are stored in Electron's user-data directory, normally `%APPDATA%\RHELboat`. Export progress from My progress to transfer it to another computer. Uninstalling the application preserves this data, your personal PDFs, container data and external VMs.

## Build with GitHub Actions

**[Open the Windows installer builder](https://github.com/ochoaj92-lgtm/RHELboat/actions/workflows/release.yml?query=branch%3Awindows-installer)**

1. Sign in with repository write access. If you do not have it, download an existing successful build or fork the repository with all branches, enable Actions in the fork, and use **Actions → Build RHELboat**.
2. Select **Run workflow**, choose **windows-installer** in the **Branch** dropdown, then select **Run workflow**. Select this branch explicitly: the repository's default branch still contains the older Linux-only workflow.
3. Open the new run and wait for the **windows** job to succeed. Manual runs on `windows-installer` build Windows only; pushes and pull requests continue to check both platforms.
4. In the run summary, select **Download the installer ZIP**, or download **rhelboat-windows-x64** under **Artifacts**. GitHub requires a signed-in account to download artifacts; these downloads expire according to the repository's artifact retention policy.
5. Extract the ZIP and run `RHELboat-Setup-<version>-x64.exe`. The blockmap beside it is build metadata; it is not the installer.

The workflow installs dependencies from the npm lockfile, checks types, runs the portable tests, builds the installer, tests installation/launch/uninstallation and uploads the installer ZIP. Its summary includes download and rebuild links plus local build commands. See [GitHub's manual workflow instructions](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow) for the web interface.

## Build on Windows

Use Node.js 24+ and npm:

```powershell
git clone --branch windows-installer https://github.com/ochoaj92-lgtm/RHELboat.git
cd RHELboat
npm ci
npm run typecheck
npm test
npm run build:win
```

Every package build checks that the application entry, preload, renderer and Containerfile are present and rejects personal PDFs or repository metadata in the archive.

The installer is written to `dist\RHELboat-Setup-<version>-x64.exe`. NSIS artwork and icons use the repository's RHELboat assets. `extraMetadata.main` points at the packaged `main/main.js`, while development uses `build/main/main.js`.

The npm lockfile replaces the obsolete Bun lockfile, which referenced removed Windows-guest dependencies. No extra runtime library is required for the installer.

## Validation and release

The GitHub Actions Windows job builds the installer, silently installs it into a path containing spaces, opens the installed app with a temporary profile, checks its lessons/preload/Docker default and workbook validation, then uninstalls it. Linux CI retains the POSIX fixtures and file exercises. Windows skips only those host-specific cases; local ISO hashing, curriculum, quiz and progress validation still run there.

Before a public release, verify on a Windows desktop:

- Assisted install, custom directory, shortcuts and normal startup.
- Docker Desktop's Linux engine and all 15 container checks, command history, Ctrl+C, stop and reset.
- Missing/stopped Docker and accidental Windows-container mode produce useful errors.
- ISO hashing, local PDF opening, saved progress, export/import and external VM instructions.
- Upgrade and uninstall preserve learner files.

The installer and native CI configuration alone do not establish that the complete Windows runtime workflow has passed. A Linux cross-build can produce the installer but cannot replace the Windows desktop checks above. Cross-build prerequisites are documented by [electron-builder](https://www.electron.build/v26/docs/features/multi-platform-build/).

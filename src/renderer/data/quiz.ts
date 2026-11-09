import { lessons } from "./curriculum.ts";
export interface QuizQuestion {
    id: string;
    lessonId: string;
    scenario: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}
export type QuizTarget = "current" | "category" | "completed" | "all";
export const quizQuestions: QuizQuestion[] = [
    {
        id: "rhel-installation-review",
        lessonId: "rhel-installation",
        scenario: "You downloaded an installer image and a publisher-provided digest.",
        question: "What should you do before starting the ISO?",
        options: [
            "Compare its computed SHA-256 with the exact publisher value.",
            "Trust the filename alone.",
            "Use any checksum from another release.",
            "Start writing the host disk to test the image.",
        ],
        correctIndex: 0,
        explanation:
            "The digest must match the exact release, architecture and image type; the filename does not verify its bytes.",
    },
    {
        id: "navigation-review",
        lessonId: "navigation",
        scenario: "A shell command uses a relative filename and reads the wrong file.",
        question: "Which observation establishes where the shell resolves that name?",
        options: [
            "The system timezone.",
            "The kernel release string.",
            "The account password expiry date.",
            "The output of pwd.",
        ],
        correctIndex: 3,
        explanation: "A relative path starts at the process’s current working directory. pwd shows that directory.",
    },
    {
        id: "documentation-review",
        lessonId: "documentation",
        scenario: "You need an option accepted by the command installed in the lab.",
        question: "Which is the best first source for its accepted options?",
        options: [
            "The filename extension of a data file.",
            "The permissions on the current directory.",
            "The installed command’s --help output or local manual.",
            "A similarly named option remembered from another tool.",
        ],
        correctIndex: 2,
        explanation:
            "Local help corresponds to the installed command; manual sections distinguish commands from file-format documentation.",
    },
    {
        id: "environment-review",
        lessonId: "environment",
        scenario: "A child shell does not see a variable assigned in its parent shell.",
        question: "Which feature makes the value available to a child process?",
        options: [
            "Run pwd before every command.",
            "Export the variable before starting the child.",
            "Change the file’s execute bit.",
            "Set the directory’s sticky bit.",
        ],
        correctIndex: 1,
        explanation: "Exported variables are included in the environment passed to newly created child processes.",
    },
    {
        id: "links-review",
        lessonId: "links",
        scenario: "A symbolic link exists, but reading it fails after the target is removed.",
        question: "What explains the failure?",
        options: [
            "The link stores a path and its target no longer exists.",
            "Every symbolic link includes a full independent copy.",
            "Removing a target always deletes all links automatically.",
            "Symbolic links are restricted to the same filesystem.",
        ],
        correctIndex: 0,
        explanation:
            "A symbolic link can remain as a dangling path after its target disappears; it is not a copy of the target data.",
    },
    {
        id: "archive-review",
        lessonId: "archive",
        scenario: "You need to inspect a backup before restoring it.",
        question: "Which action shows the archive member paths without extracting them?",
        options: [
            "Extract it over the root directory.",
            "Rename the archive extension.",
            "Set mode 777 on the archive.",
            "List it with tar -t.",
        ],
        correctIndex: 3,
        explanation:
            "Listing the archive reveals the paths it would create and helps you choose a separate restore directory.",
    },
    {
        id: "text-review",
        lessonId: "text",
        scenario: "A log line contains ERROR twice and another line contains it once.",
        question: "What does grep -c ERROR count?",
        options: [
            "Every byte in the file.",
            "Only lines that begin with ERROR.",
            "Matching lines, so the result is 2.",
            "Every occurrence, so the result is 3.",
        ],
        correctIndex: 2,
        explanation: "grep -c counts selected lines, not the number of repeated matches within each selected line.",
    },
    {
        id: "find-files-review",
        lessonId: "find-files",
        scenario: "The shell expands a wildcard before find receives it.",
        question: "How do you pass a filename pattern to find itself?",
        options: [
            "Redirect find output to its input file.",
            "Quote the pattern, for example -name '*.conf'.",
            "Append a slash to every pattern.",
            "Use chmod to disable expansion.",
        ],
        correctIndex: 1,
        explanation:
            "Quoting prevents the invoking shell from expanding the wildcard; find applies the pattern while walking its search tree.",
    },
    {
        id: "edit-files-review",
        lessonId: "edit-files",
        scenario: "You want to replace only the complete configuration line MODE=draft.",
        question: "Which pattern constrains the match to that complete line?",
        options: ["^MODE=draft$", "MODE", "draft*", ".*"],
        correctIndex: 0,
        explanation:
            "The start and end anchors prevent replacing a substring inside a different setting or longer value.",
    },
    {
        id: "users-review",
        lessonId: "users",
        scenario: "A user needs one additional supplementary group while retaining existing groups.",
        question: "Which usermod option pair expresses that?",
        options: ["-g only", "-d only", "-s only", "-aG"],
        correctIndex: 3,
        explanation:
            "-G supplies supplementary groups and -a appends them; omitting append can replace existing supplementary membership.",
    },
    {
        id: "permissions-review",
        lessonId: "permissions",
        scenario: "A private file should be readable and writable only by its owner.",
        question: "Which mode meets that requirement?",
        options: ["660", "777", "600", "644"],
        correctIndex: 2,
        explanation: "Mode 600 gives owner read and write access and grants no group or other permissions.",
    },
    {
        id: "shared-directory-review",
        lessonId: "shared-directory",
        scenario: "New files in a collaboration directory should inherit its group.",
        question: "Which directory feature provides that inheritance?",
        options: [
            "A symbolic link to the directory.",
            "The setgid bit.",
            "The sticky bit alone.",
            "The executable bit on an unrelated file.",
        ],
        correctIndex: 1,
        explanation:
            "Setgid on a directory makes new entries inherit that directory’s owning group; umask separately controls their permission bits.",
    },
    {
        id: "password-policy-review",
        lessonId: "password-policy",
        scenario: "A lab account should expire passwords after 90 days and warn 7 days before expiry.",
        question: "Which command sets those two fields?",
        options: ["chage -M 90 -W 7 trainee", "chmod 907 trainee", "usermod -d 90 trainee", "groupadd -g 7 trainee"],
        correctIndex: 0,
        explanation:
            "chage -M changes the maximum password age and -W changes the expiry warning interval; neither sets the account’s password.",
    },
    {
        id: "processes-review",
        lessonId: "processes",
        scenario: "You launched a harmless workload with an ampersand.",
        question: "What is the main effect of the ampersand?",
        options: [
            "The workload becomes a systemd service.",
            "The workload’s files become encrypted.",
            "The workload can never receive signals.",
            "The shell accepts more input while the workload runs in the background.",
        ],
        correctIndex: 3,
        explanation:
            "Background execution returns control to the shell; it does not automatically change service policy or protect the process from signals.",
    },
    {
        id: "scripting-review",
        lessonId: "scripting",
        scenario: "A script has not yet been run and you want to check its Bash syntax.",
        question: "Which command parses it without executing its actions?",
        options: ["chmod 777 script.sh", "cat script.sh > /dev/null", "bash -n script.sh", "bash script.sh"],
        correctIndex: 2,
        explanation:
            "bash -n checks parsing without executing the script. Reading or changing permissions does not perform a syntax check.",
    },
    {
        id: "shell-loops-review",
        lessonId: "shell-loops",
        scenario: "A script expands a variable containing spaces.",
        question: 'Why quote the expansion as "$name"?',
        options: [
            "To prevent every possible command error.",
            "To keep the value as one argument and avoid unwanted splitting and globbing.",
            "To force it to become a PID.",
            "To export it automatically.",
        ],
        correctIndex: 1,
        explanation:
            "Double quoting preserves the expanded value as a single argument while still allowing variable expansion.",
    },
    {
        id: "scheduling-review",
        lessonId: "scheduling",
        scenario: "A recurring job is listed but its expected output is absent.",
        question: "What provides evidence that it actually executed?",
        options: [
            "A corresponding scheduler log event and the intended output.",
            "The job’s presence in crontab alone.",
            "A filename containing the word scheduled.",
            "The size of the cron executable.",
        ],
        correctIndex: 0,
        explanation:
            "A valid definition is separate from execution; observe the scheduler and the result produced by the command.",
    },
    {
        id: "packages-review",
        lessonId: "packages",
        scenario: "An installed executable may have been modified.",
        question: "Which command compares package files against recorded RPM metadata?",
        options: ["rpm -q PACKAGE only", "dnf repolist", "uname -r", "rpm -V PACKAGE"],
        correctIndex: 3,
        explanation:
            "rpm verification compares recorded attributes and contents; query results alone only establish that the package is installed.",
    },
    {
        id: "repositories-review",
        lessonId: "repositories",
        scenario: "A package is available from more than one configured source.",
        question: "What should you inspect before installing it?",
        options: [
            "The number of user accounts.",
            "The file extension of a log.",
            "The selected repository, package details and proposed transaction.",
            "Only the name of the current directory.",
        ],
        correctIndex: 2,
        explanation:
            "Repository identity and transaction details explain the source and dependency changes that DNF proposes.",
    },
    {
        id: "flatpak-review",
        lessonId: "flatpak",
        scenario: "An app is installed for one learner but absent for another.",
        question: "Which distinction should you inspect first?",
        options: [
            "The file’s sticky bit.",
            "Per-user versus system installation scope.",
            "The kernel PID limit only.",
            "The filename of an RPM backup.",
        ],
        correctIndex: 1,
        explanation:
            "A user-scoped Flatpak installation belongs to that user; a system-scoped installation has a different availability and management scope.",
    },
    {
        id: "services-review",
        lessonId: "services",
        scenario: "A service is running now but is not configured to start at boot.",
        question: "Which pair of concepts explains this?",
        options: [
            "Active state and enabled state are independent.",
            "Running state always forces enabled state.",
            "A service without a PID cannot have succeeded.",
            "Every unit starts only through a login shell.",
        ],
        correctIndex: 0,
        explanation:
            "Active describes present runtime state; enabled describes startup links or policy. A successful oneshot may exit and become inactive.",
    },
    {
        id: "journal-time-review",
        lessonId: "journal-time",
        scenario: "You need events from one service in a recent interval.",
        question: "What gives the most focused journal query?",
        options: [
            "Read every boot with no filters.",
            "Search only for the word error in all files.",
            "Change the timezone until an event appears.",
            "Filter by unit and time.",
        ],
        correctIndex: 3,
        explanation:
            "Unit and time filters reduce unrelated evidence, and the clock’s synchronization status helps interpret the resulting timeline.",
    },
    {
        id: "boot-recovery-review",
        lessonId: "boot-recovery",
        scenario: "A VM fails before systemd starts.",
        question: "Why identify the boot stage before editing a service?",
        options: [
            "Every boot fault requires erasing the disk.",
            "Service enablement rewrites the firmware.",
            "A boot-loader, kernel or initramfs fault can prevent services from being reached at all.",
            "All startup failures come from SSH.",
        ],
        correctIndex: 2,
        explanation:
            "The startup chain has multiple stages; a correction must address the stage that failed and then be validated with a normal boot.",
    },
    {
        id: "kickstart-review",
        lessonId: "kickstart",
        scenario: "An automated installation plan contains a clearpart directive.",
        question: "What deserves special review before using it?",
        options: [
            "Whether the filename is short.",
            "Which disks the installer can erase.",
            "Only the display language.",
            "Only the login prompt color.",
        ],
        correctIndex: 1,
        explanation:
            "Partition-clearing and disk-selection directives define destructive scope; syntax validity alone cannot prove the selected destination is safe.",
    },
    {
        id: "mounts-review",
        lessonId: "mounts",
        scenario: "A disk’s device name may change after reboot.",
        question: "Which value is commonly used for a stable filesystem reference in fstab?",
        options: [
            "The filesystem UUID.",
            "The current process ID.",
            "The number of open terminals.",
            "A guessed future device letter.",
        ],
        correctIndex: 0,
        explanation:
            "A filesystem UUID identifies the filesystem instance independently of the device node assigned during a particular boot.",
    },
    {
        id: "lvm-review",
        lessonId: "lvm",
        scenario: "A logical volume was extended but df still shows the old filesystem capacity.",
        question: "Which operation may still be needed?",
        options: [
            "Shrink the physical disk.",
            "Change every file to mode 777.",
            "Rename the volume group.",
            "Grow the filesystem using the tool appropriate to its type.",
        ],
        correctIndex: 3,
        explanation:
            "The LV supplies block capacity and the filesystem manages its own structures; both layers must reflect the planned size.",
    },
    {
        id: "swap-review",
        lessonId: "swap",
        scenario: "A lab partition exists but the kernel is not using it for swap.",
        question: "Which two stages are required for a new dedicated swap area?",
        options: [
            "Rename it, then change its owner.",
            "Create a symbolic link to /tmp.",
            "Initialize its swap signature, then activate it.",
            "Mount it as XFS, then delete its UUID.",
        ],
        correctIndex: 2,
        explanation:
            "mkswap initializes a dedicated area and swapon activates it; verify the target’s identity and existing contents before initialization.",
    },
    {
        id: "nfs-review",
        lessonId: "nfs",
        scenario: "An AutoFS share is not visible until a learner accesses its map path.",
        question: "Which behavior is expected?",
        options: [
            "A local chmod creates the remote filesystem.",
            "Access to the mapped path triggers an on-demand mount.",
            "Every share must remain mounted forever.",
            "AutoFS replaces the NFS server’s export policy.",
        ],
        correctIndex: 1,
        explanation:
            "AutoFS automates client mounting when a path is accessed; the server’s export and network requirements still apply.",
    },
    {
        id: "encrypted-storage-review",
        lessonId: "encrypted-storage",
        scenario: "A lab LUKS volume needs an additional access credential.",
        question: "What should be established before changing a keyslot?",
        options: [
            "The occupied slots, a recovery plan and the exact lab target.",
            "A requirement to erase every existing slot.",
            "The desktop wallpaper name.",
            "The SSH client’s prompt color.",
        ],
        correctIndex: 0,
        explanation:
            "A slot change must preserve intended access; inventory the header and verify a recovery method before modifying the dedicated lab volume.",
    },
    {
        id: "networking-review",
        lessonId: "networking",
        scenario: "A guest can reach a service by IP address but not by hostname.",
        question: "Which layer should you investigate next?",
        options: [
            "Immediately reformat its root filesystem.",
            "Only the file creation umask.",
            "The tar archive compression level.",
            "Name resolution and resolver selection.",
        ],
        correctIndex: 3,
        explanation:
            "Working IP access narrows the next investigation to naming while resolver and NSS configuration determine how a hostname is looked up.",
    },
    {
        id: "ssh-review",
        lessonId: "ssh",
        scenario: "You changed SSH authentication settings while holding one working session.",
        question: "What should happen before closing that working session?",
        options: [
            "Delete every authorized key.",
            "Disable host-key checking.",
            "Validate configuration and test a second independent login.",
            "Assume the existing connection proves all future logins.",
        ],
        correctIndex: 2,
        explanation:
            "An established session can survive settings that prevent new logins; a new session tests the changed authentication path.",
    },
    {
        id: "secure-transfer-review",
        lessonId: "secure-transfer",
        scenario: "A file transfer reports success and you need to validate its contents.",
        question: "Which independent comparison is appropriate?",
        options: [
            "Count the open terminals.",
            "Compare SHA-256 values at source and destination.",
            "Compare only the two hostnames.",
            "Compare only the timezone names.",
        ],
        correctIndex: 1,
        explanation:
            "Matching digests verify matching bytes for the transferred file; SSH identity verification separately addresses the destination’s identity.",
    },
    {
        id: "selinux-review",
        lessonId: "selinux",
        scenario: "A standard-path file has an unexpected SELinux label.",
        question: "Which tool reapplies the expected path-based label?",
        options: ["restorecon", "chmod 777", "systemctl disable firewalld", "chage -M 90"],
        correctIndex: 0,
        explanation:
            "restorecon uses policy path mappings. Ordinary permission changes do not repair a mandatory access-control label mismatch.",
    },
    {
        id: "firewall-review",
        lessonId: "firewall",
        scenario: "A firewall exception works now but disappears after a reload.",
        question: "Which distinction explains the change?",
        options: [
            "The service name automatically changes at reload.",
            "A runtime rule always rewrites every zone file.",
            "Reloading cannot affect any firewall rule.",
            "Runtime and permanent firewall configurations are separate.",
        ],
        correctIndex: 3,
        explanation:
            "A runtime rule can be lost on reload unless the intended change is also present in the permanent configuration for the correct zone.",
    },
    {
        id: "containers-review",
        lessonId: "containers",
        scenario: "A demo container is removed but its named volume still exists.",
        question: "Which model explains that behavior?",
        options: [
            "Removing one container erases every image.",
            "A volume is only a display label.",
            "The container and named volume have separate lifetimes.",
            "All container data is always part of the immutable image.",
        ],
        correctIndex: 2,
        explanation:
            "A named volume is a distinct data resource; inspect its use and remove only the dedicated training volume when appropriate.",
    },
    {
        id: "performance-review",
        lessonId: "performance",
        scenario: "You want to justify a tuning change for a guest workload.",
        question: "What should you collect before changing the profile?",
        options: [
            "The number of workbook pages.",
            "A baseline under a known workload and measurement interval.",
            "Only a guess based on a profile name.",
            "A random screenshot from another server.",
        ],
        correctIndex: 1,
        explanation:
            "A controlled baseline allows comparison; a profile recommendation alone does not diagnose a bottleneck or prove improvement.",
    },
    {
        id: "troubleshooting-review",
        lessonId: "troubleshooting",
        scenario: "An application cannot create a file although df -h shows free space.",
        question: "What additional filesystem resource should you inspect?",
        options: [
            "Available inodes with df -i.",
            "Only the current shell prompt.",
            "Only the timezone abbreviation.",
            "The number of remote Git branches.",
        ],
        correctIndex: 0,
        explanation:
            "A filesystem can run out of inodes while still showing free data blocks; check both resource types before selecting a remedy.",
    },
    {
        id: "authentication-review",
        lessonId: "authentication",
        scenario: "getent resolves a user, but a new login still fails.",
        question: "What does the successful lookup prove?",
        options: [
            "Every password and key must be valid.",
            "PAM cannot be involved.",
            "SSH host keys can be ignored.",
            "Identity lookup works; authentication and account policy still need investigation.",
        ],
        correctIndex: 3,
        explanation:
            "Identity resolution, account eligibility and authentication are separate stages. Correlate the failed attempt with the appropriate logs.",
    },
    {
        id: "tracing-review",
        lessonId: "tracing",
        scenario: "A harmless lab program reports a missing file but does not name it.",
        question: "Which observation can reveal the attempted filename?",
        options: [
            "An unconditional kill of every listener.",
            "A change to all user passwords.",
            "A scoped system-call trace of the failing file operation.",
            "A recursive deletion of /etc.",
        ],
        correctIndex: 2,
        explanation:
            "A trace can show attempted open operations and their results. Trace only the lab program and keep possible private data in the guest.",
    },
    {
        id: "iscsi-review",
        lessonId: "iscsi",
        scenario: "An initiator discovers a target portal but cannot log in to its LUN.",
        question: "What should you inspect before formatting any device?",
        options: [
            "Disable every authentication control.",
            "Initiator identity, target access policy, authentication and session status.",
            "Immediately run mkfs on the first new device.",
            "Delete every saved node record.",
        ],
        correctIndex: 1,
        explanation:
            "Discovery is separate from authorized login and block-device visibility. Formatting does not correct a session authentication mismatch.",
    },
];
export function questionsFor(
    target: QuizTarget,
    lessonId: string | undefined,
    categoryId: string | undefined,
    completed: string[],
) {
    return quizQuestions.filter(question => {
        const lesson = lessons.find(lesson => lesson.id === question.lessonId);
        if (target === "current") return question.lessonId === lessonId;
        if (target === "category") return lesson?.categoryId === categoryId;
        if (target === "completed") return completed.includes(question.lessonId);
        return true;
    });
}

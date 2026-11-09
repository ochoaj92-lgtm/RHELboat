import { workbooks } from "../../main/workbook-catalog.ts";
import type { WorkbookId } from "../../main/workbook-catalog.ts";
export { workbooks };
export type LabEnvironment = "container" | "vm" | "multi-node";
export interface WorkbookReference {
    workbookId: WorkbookId;
    section: string;
    pages: [number, number];
}
export interface LessonStep {
    id: string;
    title: string;
    instruction: string;
    command?: string;
    help: { feature: string; why: string };
}
export interface Lesson {
    id: string;
    categoryId: string;
    title: string;
    topic: string;
    duration: number;
    objective: string;
    explanation: string;
    environment: LabEnvironment;
    requirements: string[];
    steps: LessonStep[];
    checkId?: string;
    success: string;
    references: WorkbookReference[];
}
export interface TrainingCategory {
    id: string;
    code: string;
    title: string;
    subtitle: string;
    description: string;
    icon: string;
    topics: string[];
    lessonIds: string[];
}
// Original practice scenarios adapted to workbook topics; complete PDFs stay in the local training folder.
export const lessons: Lesson[] = [
    {
        id: "rhel-installation",
        title: "Install RHEL from the official ISO",
        topic: "Installation and initial configuration",
        duration: 90,
        objective:
            "Download and verify a RHEL ISO, install it on a dedicated training virtual disk, and verify your configuration after reboot.",
        explanation:
            "A Linux distribution combines a kernel, system tools and packaged applications. Build a disposable RHEL system before practicing services, disks and networking. The workbooks use RHEL 9 and the study guide uses RHEL 10; follow the installer for the release you downloaded. Use the managed QEMU console on Linux or an external RHEL VM on Windows. These checkpoints record your own actions in the guest console.",
        environment: "vm",
        steps: [
            {
                id: "download-iso",
                title: "Get the ISO from Red Hat",
                instruction:
                    "Open the official download page from the VM panel. Sign in and review any membership or license terms yourself in the browser; RHELboat does not handle your Red Hat credentials. Choose the RHEL release matching your preparation and the x86_64 architecture used by this VM. Prefer DVD ISO for a self-contained install; Boot ISO needs an additional installation source. Keep the SHA-256 value for that exact release, architecture and ISO type.",
                help: {
                    feature: "RHEL DVD ISO",
                    why: "The DVD contains installation packages; a Boot ISO requires an additional package source.",
                },
            },
            {
                id: "verify-iso",
                title: "Verify your installation media",
                instruction:
                    "Select your completed .iso download in the VM panel. Paste its matching 64-character SHA-256 value from Red Hat's download page and run verification. Wait for a match before booting. If the values differ, recheck the selected release and ISO type or download again; do not continue with a mismatch.",
                help: {
                    feature: "SHA-256",
                    why: "Comparing against the publisher’s value detects incomplete or altered downloads.",
                },
            },
            {
                id: "configure-vm",
                title: "Allocate your practice machine",
                instruction:
                    "On Linux, configure the dedicated machine in the managed VM panel after installing QEMU, qemu-img and GTK display support. On Windows, create a disposable RHEL guest in your external virtualization tool. Start with 2 vCPUs, 4096 MiB RAM and a 40 GiB dedicated virtual disk; these are training suggestions, not Red Hat's minimum requirements. RHEL 10 x86_64 needs x86-64-v3 CPU features. Verify the selected virtual disk and keep host disks and shared folders outside this exercise.",
                help: {
                    feature: "Virtual hardware",
                    why: "A dedicated virtual disk lets you practice installation without selecting a host disk.",
                },
            },
            {
                id: "boot-install-media",
                title: "Boot the installer",
                instruction:
                    "Start the VM from the verified ISO. On Linux use the managed VM panel; on Windows attach the ISO in your external virtualization tool. Arrange the guest console beside this guide. Choose Test this media & install Red Hat Enterprise Linux from the guest boot menu, and let its media check finish. All installer actions happen in that VM console; the container shell is not the installation target.",
                help: {
                    feature: "Anaconda media check",
                    why: "Checking the media catches a damaged image before it writes an installation.",
                },
            },
            {
                id: "language-keyboard",
                title: "Set language and keyboard",
                instruction:
                    "In the RHEL welcome screen, select the language and region, then continue to Installation Summary. Open Keyboard to choose your actual layout and test characters you will use in passwords. The installer labels may vary with the RHEL minor release; use the linked version's documentation if a screen differs.",
                help: {
                    feature: "Language and keyboard",
                    why: "The keyboard mapping must match the keys you use when entering guest credentials.",
                },
            },
            {
                id: "destination-storage",
                title: "Plan the destination and storage",
                instruction:
                    "Open Installation Destination and select only the app-created virtual disk, confirming its capacity against the VM panel. For a first install, inspect the automatic layout before accepting it. To practice storage planning, use Custom partitioning to create the required boot partitions and LVM-backed root, home and swap areas, keeping some free space for later exercises. Firmware determines whether an EFI System Partition is needed. Record your choices and review every proposed disk change.",
                help: {
                    feature: "Installation destination",
                    why: "Partitioning applies to the selected virtual disk; inspect its identity and planned changes.",
                },
            },
            {
                id: "software-source",
                title: "Choose installation source and software",
                instruction:
                    "With a DVD ISO, confirm that Installation Source detects the local media. In Software Selection, choose Minimal Install or Server for command-line administration practice. A Boot ISO instead requires a working network and a valid repository source or your entitled Red Hat access. Select the software intentionally rather than accepting an unrelated desktop profile.",
                help: {
                    feature: "Software selection",
                    why: "The selected environment determines which packages and services exist after installation.",
                },
            },
            {
                id: "network-time",
                title: "Configure hostname, network and time",
                instruction:
                    "In Network & Host Name, enable the VM's virtual network interface and inspect its assigned address. Set a training hostname such as rhel-lab.example.test and apply it. Use private or NAT guest networking for this exercise; avoid changing host networking. In Time & Date, choose your region and inspect time synchronization. Write down the hostname, interface and timezone to verify after installation.",
                help: {
                    feature: "NetworkManager and time settings",
                    why: "Persistent networking, hostname and accurate time are prerequisites for later administration labs.",
                },
            },
            {
                id: "administrator-account",
                title: "Create your administrative login",
                instruction:
                    "In User Creation, create a dedicated learner account such as trainee and select Make this user administrator. Set a strong practice password directly in the guest installer. Review the root-account setting and keep SELinux protection in place. Do not save credentials in lesson notes, commands or RHELboat. Confirm that you have an administrative login before starting the installation.",
                help: {
                    feature: "Administrator account",
                    why: "A separate learner account with sudo gives you administrative access without using root for every task.",
                },
            },
            {
                id: "review-install",
                title: "Review and perform the installation",
                instruction:
                    "Return to Installation Summary and resolve incomplete items. Check destination, storage changes, source, software, hostname, time and account settings against your plan. Begin installation only after confirming that the destination is the dedicated training virtual disk. Let package installation complete without stopping the VM. Registration can be performed separately using your own eligible account and entitlement; RHELboat does not accept terms or register the guest for you.",
                help: {
                    feature: "Installation summary",
                    why: "Reviewing the plan before writing the disk prevents avoidable configuration mistakes.",
                },
            },
            {
                id: "boot-installed-system",
                title: "Start from the installed disk",
                instruction:
                    "After installation finishes, stop the guest before booting its disk without the ISO. On Windows, detach the ISO and start the installed disk using your virtualization tool. On Linux, use this managed VM procedure: In the QEMU console use Ctrl+Alt+F1, then press and release Ctrl+B followed by 2 to reach the installer shell; run poweroff. Wait for the panel to show Stopped, then choose Boot installed disk. Confirm that the installed system reaches its login prompt. If your release provides a different console layout, use its installer documentation to locate the shell.",
                help: {
                    feature: "Installer console and poweroff",
                    why: "Stop the guest before starting the disk without the ISO so the installer does not boot again.",
                },
            },
            {
                id: "verify-installed-system",
                title: "Inspect your new RHEL system",
                instruction:
                    "Log in as your learner account in the VM console. Run the commands below there, adapting trainee if you used another name. Confirm the RHEL release, hostname, timezone, filesystems, network state, administrator access, SELinux enforcement and default boot target against your plan. These results are for your own review; the app does not inspect or grade guest configuration.",
                command:
                    "cat /etc/redhat-release; hostnamectl; timedatectl; lsblk -f; findmnt /; nmcli device status; id trainee; sudo -v; getenforce; systemctl get-default",
                help: {
                    feature: "Post-install inspection",
                    why: "Compare the running system with your plan rather than assuming the installer applied every setting.",
                },
            },
            {
                id: "prove-persistence",
                title: "Reboot and prove persistence",
                instruction:
                    "Reboot the guest normally, log in again and repeat the checks for hostname, storage mounts, networking and administrative access. Record any mismatch and correct it in the VM. Mark the checkpoints you actually performed and review the guide only after the installed system works again. To stop later, shut down from the guest or use the power controls in your virtualization tool; the managed Linux VM panel can request a graceful shutdown. Wait for the guest to stop and do not force-close its console during disk writes.",
                command: "sudo systemctl reboot",
                help: {
                    feature: "Reboot validation",
                    why: "Runtime configuration and persistent configuration can differ; a reboot tests persistence.",
                },
            },
        ],
        success:
            "Self-review: your verified ISO produced a bootable RHEL installation on the dedicated virtual disk, and you checked its planned settings again after reboot. Checkpoints record your actions, not an automated installation grade.",
        categoryId: "basics",
        references: [
            {
                workbookId: "system2",
                section: "Chapter 10 · Interactive installation",
                pages: [303, 310],
            },
            {
                workbookId: "rhel10",
                section: "Chapter 1 · Local installation",
                pages: [45, 87],
            },
        ],
        requirements: [
            "Download a RHEL DVD ISO and its SHA-256 from Red Hat.",
            "Linux: QEMU with GTK support. Windows: an external virtualization tool and a disposable RHEL guest.",
        ],
    },
    {
        id: "navigation",
        title: "Find your way around the shell",
        topic: "Essential tools",
        duration: 10,
        objective: "Create a working directory and a note containing enterprise linux.",
        explanation:
            "The shell works in a current directory. Absolute paths begin at / and keep commands predictable when you move between directories. All practice files in these exercises belong inside the disposable container at /root/lab.",
        environment: "container",
        checkId: "navigation",
        steps: [
            {
                title: "Locate yourself",
                instruction: "Print your current directory, then inspect the root directory.",
                command: "pwd; ls /",
                id: "step-1",
                help: {
                    feature: "pwd and ls",
                    why: "Your current directory determines how relative paths are resolved.",
                },
            },
            {
                title: "Create a workspace",
                instruction: "Create the lab directory and make it your current directory.",
                command: "mkdir -p /root/lab; cd /root/lab",
                id: "step-2",
                help: {
                    feature: "mkdir and cd",
                    why: "Create a bounded practice directory and enter it before manipulating files.",
                },
            },
            {
                title: "Write a note",
                instruction:
                    "Use redirection to write a short note. This replaces this exercise file if it already exists.",
                command: "printf 'enterprise linux\\n' > /root/lab/notes.txt",
                id: "step-3",
                help: {
                    feature: "printf and output redirection",
                    why: "Redirection writes predictable content into a named file.",
                },
            },
            {
                title: "Read it back",
                instruction: "Check the file contents, then use Check work to verify the result.",
                command: "cat /root/lab/notes.txt; ls -l /root/lab/notes.txt",
                id: "step-4",
                help: {
                    feature: "cat and ls -l",
                    why: "Inspect both contents and metadata to verify the file you created.",
                },
            },
        ],
        success: "The lab contains /root/lab/notes.txt with enterprise linux in its contents.",
        categoryId: "basics",
        references: [
            {
                workbookId: "system1",
                section: "Chapters 2–3 · Command line and file hierarchy",
                pages: [31, 115],
            },
        ],
        requirements: ["Start the isolated container lab."],
    },
    {
        id: "documentation",
        categoryId: "basics",
        title: "Find an option using local help",
        topic: "Command documentation",
        duration: 15,
        explanation:
            "Command help explains accepted options; manual sections distinguish a user command from a configuration format. Practice looking up a feature before guessing its syntax. The container uses --help because it does not include the complete manual collection.",
        objective: "Save chmod help and identify how to copy a reference file’s permissions.",
        environment: "container",
        references: [
            {
                workbookId: "system1",
                section: "Chapter 4 · Read manual pages",
                pages: [117, 133],
            },
        ],
        requirements: ["Start the isolated container lab."],
        steps: [
            {
                title: "Read the command summary",
                instruction: "Read chmod’s help output. Identify its usage line and how options differ from operands.",
                help: {
                    feature: "chmod --help",
                    why: "The installed command documents the syntax supported by this environment.",
                },
                command: "chmod --help",
                id: "step-1",
            },
            {
                title: "Save a reference",
                instruction: "Save the help to /root/lab/chmod-help.txt. Find the --reference option in that file.",
                help: {
                    feature: "Redirection and grep",
                    why: "Saving output makes the evidence repeatable and grep locates the feature you need.",
                },
                command:
                    "mkdir -p /root/lab; chmod --help > /root/lab/chmod-help.txt; grep -- --reference /root/lab/chmod-help.txt",
                id: "step-2",
            },
            {
                title: "Explain your choice",
                instruction:
                    "Describe how --reference differs from a numeric mode. In a full VM also compare man 1 chmod with man 5 passwd.",
                help: {
                    feature: "Manual sections",
                    why: "A command and a file format can share a name while documenting different interfaces.",
                },
                command: "grep -n -- --reference /root/lab/chmod-help.txt",
                id: "step-3",
            },
        ],
        success: "The saved chmod help contains its --reference option.",
        checkId: "documentation",
    },
    {
        id: "environment",
        categoryId: "basics",
        title: "Inspect the system and shell environment",
        topic: "Shell environment",
        duration: 15,
        explanation:
            "The kernel version and the distribution release answer different questions. Shell variables are local until exported, while quoting controls expansion. Keep this exercise in a subshell so your interactive settings remain predictable.",
        objective: "Record an exported variable in a child shell without changing global settings.",
        environment: "container",
        references: [
            {
                workbookId: "system1",
                section: "Chapter 5 · Change the shell environment",
                pages: [152, 161],
            },
            {
                workbookId: "rhel10",
                section: "Chapter 2 · Initial system interaction",
                pages: [88, 122],
            },
        ],
        requirements: ["Start the isolated container lab."],
        steps: [
            {
                title: "Identify the environment",
                instruction:
                    "Compare /etc/os-release with uname output. A container has its own userspace but shares the host kernel.",
                help: {
                    feature: "os-release and uname",
                    why: "Distribution metadata describes userspace; uname describes the running kernel.",
                },
                command: "cat /etc/os-release; uname -r",
                id: "step-1",
            },
            {
                title: "Compare quoting",
                instruction: "Observe that single quotes preserve a variable name and double quotes expand it.",
                help: {
                    feature: "Bash quoting",
                    why: "Correct quoting prevents accidental splitting and unintended substitution.",
                },
                command: "(LAB_TOPIC=\"training shell\"; printf '%s\\n' \"$LAB_TOPIC\" '$LAB_TOPIC')",
                id: "step-2",
            },
            {
                title: "Export to a child shell",
                instruction: "In a subshell export LAB_TOPIC, start Bash and save its value in environment.txt.",
                help: {
                    feature: "export and subshells",
                    why: "An exported value is inherited by a child process; a subshell bounds the change.",
                },
                command:
                    'mkdir -p /root/lab; (export LAB_TOPIC="training shell"; bash -c \'printf "%s\\n" "$LAB_TOPIC"\' > /root/lab/environment.txt)',
                id: "step-3",
            },
        ],
        success: "environment.txt contains the child shell’s value: training shell.",
        checkId: "environment",
    },
    {
        id: "links",
        title: "Create a symbolic link",
        topic: "Files and links",
        duration: 8,
        objective: "Make latest point to /root/lab/notes.txt.",
        explanation:
            "A symbolic link stores a path to another file. It can cross filesystem boundaries and becomes dangling if its target disappears. Unlike copying a file, a link lets you reach the same current contents through another name.",
        environment: "container",
        checkId: "links",
        steps: [
            {
                title: "Prepare the target",
                instruction: "Create the note used as the link target.",
                command: "mkdir -p /root/lab; printf 'enterprise linux\\n' > /root/lab/notes.txt",
                id: "step-1",
                help: {
                    feature: "File preparation",
                    why: "A symbolic link stores a target path; it does not create the target’s contents.",
                },
            },
            {
                title: "Create the link",
                instruction: "Create or replace the exercise link named latest.",
                command: "ln -sfn /root/lab/notes.txt /root/lab/latest",
                id: "step-2",
                help: {
                    feature: "ln -s",
                    why: "A symbolic link offers another name for a target and may cross filesystems.",
                },
            },
            {
                title: "Compare the paths",
                instruction: "Inspect the stored target and read the note through its new name.",
                command: "readlink /root/lab/latest; cat /root/lab/latest; ls -l /root/lab/latest",
                id: "step-3",
                help: {
                    feature: "readlink and cat",
                    why: "Inspect the stored path and then verify that following it reaches the expected contents.",
                },
            },
        ],
        success: "latest is a symbolic link to /root/lab/notes.txt.",
        categoryId: "files",
        references: [
            {
                workbookId: "system1",
                section: "Chapter 3 · Links between files",
                pages: [90, 95],
            },
        ],
        requirements: ["Start the isolated container lab."],
    },
    {
        id: "archive",
        title: "Create and inspect a backup archive",
        topic: "Archives",
        duration: 10,
        objective: "Create backup.tar.gz containing notes.txt.",
        explanation:
            "tar combines files into an archive; gzip compresses it. The -C option selects the source directory without storing an absolute path. Listing an archive before extracting it helps you understand which paths it will create.",
        environment: "container",
        checkId: "archive",
        steps: [
            {
                title: "Prepare the source",
                instruction: "Create the note so this exercise also works in a fresh lab.",
                command: "mkdir -p /root/lab; printf 'enterprise linux\\n' > /root/lab/notes.txt",
                id: "step-1",
                help: {
                    feature: "A bounded source directory",
                    why: "Preparing known source content makes archive validation unambiguous.",
                },
            },
            {
                title: "Build the archive",
                instruction: "Create a gzip-compressed tar archive of the note.",
                command: "tar -czf /root/lab/backup.tar.gz -C /root/lab notes.txt",
                id: "step-2",
                help: {
                    feature: "tar -C and gzip compression",
                    why: "-C selects the source directory so member names need not contain absolute host paths.",
                },
            },
            {
                title: "Inspect before restoring",
                instruction:
                    "List the archive and confirm notes.txt is included. In a real restore, extract into a separate empty directory first.",
                command: "tar -tzf /root/lab/backup.tar.gz",
                id: "step-3",
                help: {
                    feature: "tar -t",
                    why: "Listing members before extraction exposes the paths an archive would create.",
                },
            },
        ],
        success: "backup.tar.gz is readable and includes notes.txt.",
        categoryId: "files",
        references: [
            {
                workbookId: "system1",
                section: "Chapter 13 · Compressed tar archives",
                pages: [462, 468],
            },
        ],
        requirements: ["Start the isolated container lab."],
    },
    {
        id: "text",
        title: "Filter a log with grep",
        topic: "Text processing",
        duration: 10,
        objective: "Create errors.log with exactly two lines that contain ERROR.",
        explanation:
            "Text tools turn a large log into evidence you can inspect. grep selects matching lines; -n includes line numbers and -c reports the number of matching lines. A count is useful, but always read the matching records before drawing a conclusion.",
        environment: "container",
        checkId: "text",
        steps: [
            {
                title: "Create a small log",
                instruction: "Write two error records and one informational record into a practice file.",
                command:
                    "mkdir -p /root/lab; printf '%s\\n' 'INFO service started' 'ERROR connection refused' 'ERROR retry exhausted' > /root/lab/errors.log",
                id: "step-1",
                help: {
                    feature: "printf and redirection",
                    why: "A small known dataset lets you predict which records should match.",
                },
            },
            {
                title: "Locate matching records",
                instruction: "Display each line containing the case-sensitive word ERROR.",
                command: "grep -n ERROR /root/lab/errors.log",
                id: "step-2",
                help: {
                    feature: "grep -n",
                    why: "Line numbers connect a match to its location in the original file.",
                },
            },
            {
                title: "Count the matches",
                instruction:
                    "Confirm two lines match. This exercise checks the file contents, so keep the log after running grep.",
                command: "grep -c ERROR /root/lab/errors.log",
                id: "step-3",
                help: {
                    feature: "grep -c",
                    why: "Count matching records rather than assuming every error string represents a different line.",
                },
            },
        ],
        success: "errors.log contains exactly two lines matching ERROR.",
        categoryId: "files",
        references: [
            {
                workbookId: "system1",
                section: "Chapter 5 · Redirection and pipelines",
                pages: [136, 145],
            },
            {
                workbookId: "system2",
                section: "Chapter 1 · Pattern matching",
                pages: [35, 44],
            },
        ],
        requirements: ["Start the isolated container lab."],
    },
    {
        id: "find-files",
        categoryId: "files",
        title: "Locate files by name and type",
        topic: "File searching",
        duration: 15,
        explanation:
            "find walks the current directory tree and evaluates predicates. Quote wildcard patterns so find, rather than the invoking shell, interprets them. Restrict the search root to the practice directory.",
        objective: "Produce a sorted list of the two .conf files in a fixture directory.",
        environment: "container",
        references: [
            {
                workbookId: "system1",
                section: "Chapter 15 · Locate files",
                pages: [542, 551],
            },
            {
                workbookId: "rhel10",
                section: "Chapter 4 · File searching",
                pages: [166, 182],
            },
        ],
        requirements: ["Start the isolated container lab."],
        steps: [
            {
                title: "Prepare a search tree",
                instruction: "Create two configuration files and a log file under search-lab.",
                help: {
                    feature: "mkdir and touch",
                    why: "A controlled tree gives the search a known expected result.",
                },
                command:
                    "mkdir -p /root/lab/search-lab/nested; touch /root/lab/search-lab/app.conf /root/lab/search-lab/nested/db.conf /root/lab/search-lab/app.log",
                id: "step-1",
            },
            {
                title: "Apply predicates",
                instruction: "Find regular files ending in .conf; store their paths in lexical order.",
                help: {
                    feature: "find -type -name and sort",
                    why: "The type predicate excludes directories and quoting preserves the wildcard for find.",
                },
                command: "find /root/lab/search-lab -type f -name '*.conf' | sort > /root/lab/found-configs.txt",
                id: "step-2",
            },
            {
                title: "Validate the set",
                instruction: "Read both paths and compare the number of results with the two fixtures.",
                help: {
                    feature: "cat and wc -l",
                    why: "A search result must contain the correct files, not merely the expected count.",
                },
                command: "cat /root/lab/found-configs.txt; wc -l /root/lab/found-configs.txt",
                id: "step-3",
            },
        ],
        success: "found-configs.txt lists exactly the two configuration file paths.",
        checkId: "find-files",
    },
    {
        id: "edit-files",
        categoryId: "files",
        title: "Edit and inspect a configuration file",
        topic: "Text editing",
        duration: 15,
        explanation:
            "Configuration changes should be small and inspectable. Practice a focused edit on an exercise file before editing system configuration. Use vi in an external VM console for interactive editor practice; this lab supplies a repeatable sed example.",
        objective: "Change MODE from draft to training while preserving OWNER=trainee.",
        environment: "container",
        references: [
            {
                workbookId: "system1",
                section: "Chapter 5 · Edit text files",
                pages: [146, 151],
            },
            {
                workbookId: "rhel10",
                section: "Chapter 3 · File management and editing",
                pages: [123, 165],
            },
        ],
        requirements: ["Start the isolated container lab."],
        steps: [
            {
                title: "Create a fixture and backup",
                instruction:
                    "Write two configuration keys and keep an untouched backup in the same practice directory.",
                help: {
                    feature: "printf and cp",
                    why: "The backup lets you explain precisely what changed.",
                },
                command:
                    "mkdir -p /root/lab; printf 'MODE=draft\\nOWNER=trainee\\n' > /root/lab/editor.conf; cp /root/lab/editor.conf /root/lab/editor.conf.bak",
                id: "step-1",
            },
            {
                title: "Make a focused replacement",
                instruction: "Replace only the complete MODE=draft line. Avoid replacing words in unrelated values.",
                help: {
                    feature: "sed with line anchors",
                    why: "Anchors constrain the edit to the intended setting.",
                },
                command: "sed -i 's/^MODE=draft$/MODE=training/' /root/lab/editor.conf",
                id: "step-2",
            },
            {
                title: "Inspect the difference",
                instruction:
                    "Read the edited file and compare it with the backup. A diff exit status of 1 means differences were found.",
                help: {
                    feature: "diff and cat",
                    why: "Reviewing the difference catches unintended changes before deployment.",
                },
                command: "diff -u /root/lab/editor.conf.bak /root/lab/editor.conf; cat /root/lab/editor.conf",
                id: "step-3",
            },
        ],
        success: "editor.conf contains MODE=training and OWNER=trainee on separate lines.",
        checkId: "edit-files",
    },
    {
        id: "users",
        title: "Add a user to an operations group",
        topic: "Users and groups",
        duration: 12,
        objective: "Create trainee and make it a member of the operators group.",
        explanation:
            "Groups let administrators assign shared access without granting every user full privileges. Supplementary group membership extends a user’s access. The -a flag preserves existing supplementary groups when -G supplies another group. Account changes here affect only the training container.",
        environment: "container",
        checkId: "users",
        steps: [
            {
                title: "Create the group",
                instruction: "Ensure an operators group exists. The -f option makes this repeatable.",
                command: "groupadd -f operators",
                id: "step-1",
                help: {
                    feature: "groupadd",
                    why: "A named group represents shared access independently from individual users.",
                },
            },
            {
                title: "Create the account",
                instruction: "Inspect an existing trainee account or create it with a home directory.",
                command: "id trainee || useradd -m trainee",
                id: "step-2",
                help: {
                    feature: "id and useradd",
                    why: "Inspect existing state before creating an account so the exercise remains repeatable.",
                },
            },
            {
                title: "Add supplementary membership",
                instruction: "Append operators to the user’s supplementary groups.",
                command: "usermod -aG operators trainee",
                id: "step-3",
                help: {
                    feature: "usermod -aG",
                    why: "Appending supplementary groups preserves the user’s existing memberships.",
                },
            },
            {
                title: "Verify the account database",
                instruction:
                    "Inspect trainee’s groups. A new login would be needed for an already running trainee shell to acquire the membership.",
                command: "id trainee; getent group operators",
                id: "step-4",
                help: {
                    feature: "getent and id",
                    why: "These tools query account databases and resolved memberships instead of relying on an edit alone.",
                },
            },
        ],
        success: "The trainee account exists and belongs to operators.",
        categoryId: "accounts",
        references: [
            {
                workbookId: "system1",
                section: "Chapter 6 · Local accounts and groups",
                pages: [171, 215],
            },
        ],
        requirements: ["Start the isolated container lab."],
    },
    {
        id: "permissions",
        title: "Keep a file private",
        topic: "File permissions",
        duration: 10,
        objective: "Give only the owner read and write access to private.txt.",
        explanation:
            "Each file has permissions for its owner, group and everyone else. In numeric notation, read is 4, write is 2 and execute is 1. Mode 600 grants the owner read and write access and grants no access to the other two classes.",
        environment: "container",
        checkId: "permissions",
        steps: [
            {
                title: "Create the practice file",
                instruction: "Create a file in the lab directory.",
                command: "mkdir -p /root/lab; printf 'private notes\\n' > /root/lab/private.txt",
                id: "step-1",
                help: {
                    feature: "File creation",
                    why: "Permissions apply to an existing inode, so first prepare a known exercise file.",
                },
            },
            {
                title: "Set the permission bits",
                instruction: "Apply mode 600 to this file only.",
                command: "chmod 600 /root/lab/private.txt",
                id: "step-2",
                help: {
                    feature: "chmod 600",
                    why: "Read and write for the owner with no group or other permissions protects the file’s contents.",
                },
            },
            {
                title: "Inspect the result",
                instruction: "The numeric mode should be 600 and the symbolic mode should start with -rw-------.",
                command: "stat -c '%a %A %n' /root/lab/private.txt",
                id: "step-3",
                help: {
                    feature: "stat",
                    why: "Inspect the numeric and symbolic mode to validate the actual permission bits.",
                },
            },
        ],
        success: "private.txt is a regular file with permission mode 600.",
        categoryId: "accounts",
        references: [
            {
                workbookId: "system1",
                section: "Chapter 7 · Access to files",
                pages: [217, 248],
            },
        ],
        requirements: ["Start the isolated container lab."],
    },
    {
        id: "shared-directory",
        categoryId: "accounts",
        title: "Build a group collaboration directory",
        topic: "Shared permissions",
        duration: 15,
        explanation:
            "A directory’s setgid bit makes newly created entries inherit its group. A umask removes permission bits from the base creation mode; it is a mask, not ordinary subtraction. Test ownership and permissions separately.",
        objective: "Create a setgid operators directory with group-writable team.txt.",
        environment: "container",
        references: [
            {
                workbookId: "system1",
                section: "Chapter 7 · Default permissions and special bits",
                pages: [233, 242],
            },
        ],
        requirements: ["Start the isolated container lab."],
        steps: [
            {
                title: "Prepare shared ownership",
                instruction: "Create operators if needed, create the exercise directory and assign its group.",
                help: {
                    feature: "groupadd and chgrp",
                    why: "Group ownership identifies the team that receives shared access.",
                },
                command: "groupadd -f operators; mkdir -p /root/lab/team; chgrp operators /root/lab/team",
                id: "step-1",
            },
            {
                title: "Set directory inheritance",
                instruction: "Give the owner and group access, deny other users and set the directory’s setgid bit.",
                help: {
                    feature: "sg and chmod 2770",
                    why: "Setgid makes new entries inherit the directory’s group. Run the mode change with that effective group so it can be set in this reduced-privilege lab.",
                },
                command: "sg operators -c 'chmod 2770 /root/lab/team'",
                id: "step-2",
            },
            {
                title: "Test a newly created file",
                instruction:
                    "Use a subshell with umask 007 to create team.txt. Confirm group operators and file mode 660.",
                help: {
                    feature: "umask and stat",
                    why: "The directory controls group inheritance; umask controls the new file’s permission bits.",
                },
                command:
                    "(umask 007; printf 'team notes\\n' > /root/lab/team/team.txt); stat -c '%a %G %n' /root/lab/team /root/lab/team/team.txt",
                id: "step-3",
            },
        ],
        success: "team is mode 2770; team.txt is group operators and mode 660.",
        checkId: "shared-directory",
    },
    {
        id: "password-policy",
        categoryId: "accounts",
        title: "Apply account password aging",
        topic: "Account policy",
        duration: 15,
        explanation:
            "Password aging controls validity intervals and warnings. It does not set a password, and password locking alone does not revoke every authentication method. Inspect policy without displaying the shadow database contents.",
        objective: "Set a 90-day maximum and 7-day warning for a practice account.",
        environment: "container",
        references: [
            {
                workbookId: "system1",
                section: "Chapter 6 · Manage passwords",
                pages: [201, 208],
            },
            {
                workbookId: "rhel10",
                section: "Chapter 6 · Advanced account management",
                pages: [216, 239],
            },
        ],
        requirements: ["Start the isolated container lab."],
        steps: [
            {
                title: "Create a practice identity",
                instruction:
                    "Inspect trainee or create the account in this disposable container. Do not set real credentials.",
                help: {
                    feature: "id and useradd",
                    why: "Policy should target a known lab account rather than an administrator account.",
                },
                command: "id trainee || useradd -m trainee",
                id: "step-1",
            },
            {
                title: "Apply the policy",
                instruction: "Set the maximum password age and warning interval.",
                help: {
                    feature: "chage -M and -W",
                    why: "The maximum controls expiry while the warning interval gives advance notice.",
                },
                command: "chage -M 90 -W 7 trainee",
                id: "step-2",
            },
            {
                title: "Review the recorded policy",
                instruction:
                    "Read the account’s aging summary and explain the difference between expiry and a locked password.",
                help: {
                    feature: "chage -l",
                    why: "An independent readback verifies the settings without exposing password hashes.",
                },
                command: "chage -l trainee",
                id: "step-3",
            },
        ],
        success: "trainee has a maximum age of 90 days and a warning interval of 7 days.",
        checkId: "password-policy",
    },
    {
        id: "processes",
        title: "Inspect a background process",
        topic: "Running systems",
        duration: 8,
        objective: "Start a background sleep process and inspect it while it runs.",
        explanation:
            "A process has an identifier, a parent and a state. Appending & starts a command in the background so the shell can accept more input. Distinguish inspecting a process from stopping it: this exercise checks that your process is still running.",
        environment: "container",
        checkId: "processes",
        steps: [
            {
                title: "Start a harmless workload",
                instruction: "Run a sleep process in the background. Run this once; extra copies are unnecessary.",
                command: "sleep 3600 >/dev/null 2>&1 &",
                id: "step-1",
                help: {
                    feature: "Background jobs",
                    why: "An ampersand returns control to the shell while the process continues to run.",
                },
            },
            {
                title: "Find the process",
                instruction: "List sleep processes with their command arguments.",
                command: "pgrep -a sleep",
                id: "step-2",
                help: {
                    feature: "pgrep -a",
                    why: "Match the process name and inspect arguments before choosing a PID.",
                },
            },
            {
                title: "Read the process table",
                instruction:
                    "Find the sleep entry and compare its PID, parent PID and state. Check work before stopping it.",
                command: "ps -eo pid,ppid,stat,comm",
                id: "step-3",
                help: {
                    feature: "ps",
                    why: "PID, parent PID and state describe the process relationship and current activity.",
                },
            },
        ],
        success: "A sleep process is running inside this container.",
        categoryId: "shell",
        references: [
            {
                workbookId: "system1",
                section: "Chapter 8 · Processes and jobs",
                pages: [249, 295],
            },
        ],
        requirements: ["Start the isolated container lab."],
    },
    {
        id: "scripting",
        title: "Write your first executable script",
        topic: "Shell scripting",
        duration: 12,
        objective: "Create executable hello.sh that prints hello enterprise linux.",
        explanation:
            "A script records commands so they can be repeated. The first line selects an interpreter when the file is executed directly. Executable permission controls whether the shell can launch it by path. printf gives predictable output without relying on echo options.",
        environment: "container",
        checkId: "scripting",
        steps: [
            {
                title: "Write the script",
                instruction: "Create a Bash script with one output command.",
                command:
                    "mkdir -p /root/lab; printf '%s\\n' '#!/bin/bash' 'printf \"hello enterprise linux\\n\"' > /root/lab/hello.sh",
                id: "step-1",
                help: {
                    feature: "A shebang and printf",
                    why: "The interpreter line and predictable output make the script’s contract explicit.",
                },
            },
            {
                title: "Inspect before executing",
                instruction: "Read the script and check its syntax.",
                command: "cat /root/lab/hello.sh; bash -n /root/lab/hello.sh",
                id: "step-2",
                help: {
                    feature: "bash -n",
                    why: "A syntax check catches parsing errors without running the script’s actions.",
                },
            },
            {
                title: "Allow direct execution",
                instruction: "Grant the owner executable permission.",
                command: "chmod u+x /root/lab/hello.sh",
                id: "step-3",
                help: {
                    feature: "chmod u+x",
                    why: "Execution permission is separate from a file containing valid shell syntax.",
                },
            },
            {
                title: "Run and check the output",
                instruction:
                    "Execute the script by its full path. It should print hello enterprise linux followed by a newline.",
                command: "/root/lab/hello.sh",
                id: "step-4",
                help: {
                    feature: "Direct execution",
                    why: "Running the saved script tests both its interpreter selection and actual output.",
                },
            },
        ],
        success: "hello.sh is executable and prints hello enterprise linux.",
        categoryId: "shell",
        references: [
            {
                workbookId: "system2",
                section: "Chapter 1 · Bash scripts",
                pages: [20, 34],
            },
            {
                workbookId: "rhel10",
                section: "Chapter 8 · Bash scripting",
                pages: [274, 300],
            },
        ],
        requirements: ["Start the isolated container lab."],
    },
    {
        id: "shell-loops",
        categoryId: "shell",
        title: "Combine a loop with a condition",
        topic: "Bash loops and tests",
        duration: 15,
        explanation:
            "Loops repeat a small operation and conditionals decide whether it should run. Quote expanded variables, use a test that matches the data type, and give scripts a predictable output contract.",
        objective: "Write an executable script that prints alpha and beta on separate lines.",
        environment: "container",
        references: [
            {
                workbookId: "system2",
                section: "Chapter 1 · Loops and conditionals",
                pages: [27, 34],
            },
            {
                workbookId: "rhel10",
                section: "Chapter 8 · Bash scripting",
                pages: [274, 300],
            },
        ],
        requirements: ["Start the isolated container lab."],
        steps: [
            {
                title: "Write a bounded loop",
                instruction: "Create names.sh. Loop over alpha and beta and print only nonempty values.",
                help: {
                    feature: "for and test -n",
                    why: "The loop expresses repetition while the condition documents the allowed input.",
                },
                command:
                    "mkdir -p /root/lab; printf '%s\\n' '#!/bin/bash' 'for name in alpha beta; do' '  if [ -n \"$name\" ]; then printf \"%s\\n\" \"$name\"; fi' 'done' > /root/lab/names.sh",
                id: "step-1",
            },
            {
                title: "Check before running",
                instruction: "Read the script, check Bash syntax and give the owner execute permission.",
                help: {
                    feature: "bash -n and chmod",
                    why: "Validate syntax before allowing direct execution.",
                },
                command: "cat /root/lab/names.sh; bash -n /root/lab/names.sh; chmod u+x /root/lab/names.sh",
                id: "step-2",
            },
            {
                title: "Validate the contract",
                instruction:
                    "Run the script twice. Each invocation should produce exactly two lines in the same order.",
                help: {
                    feature: "Exit status and stdout",
                    why: "A predictable contract makes the script useful in larger automation.",
                },
                command: "/root/lab/names.sh; printf 'exit status: %s\\n' \"$?\"",
                id: "step-3",
            },
        ],
        success: "names.sh is executable and prints alpha then beta on separate lines.",
        checkId: "shell-loops",
    },
    {
        id: "scheduling",
        categoryId: "shell",
        title: "Schedule and observe a recurring task",
        topic: "Job scheduling",
        duration: 30,
        explanation:
            "Scheduling needs both a valid schedule and an observable result. Cron expressions specify calendar fields; systemd timers have different calendar syntax. Do not assume a scheduled command ran merely because its definition exists.",
        objective: "Schedule a harmless timestamp append in a disposable VM and prove it ran.",
        environment: "vm",
        references: [
            {
                workbookId: "system2",
                section: "Chapter 2 · Future tasks and temporary files",
                pages: [53, 81],
            },
        ],
        requirements: [
            "Use a disposable RHEL VM with console access and an administrator account.",
            "Run these commands in the guest, not in the container shell.",
        ],
        steps: [
            {
                title: "Inspect the scheduler",
                instruction:
                    "Check cron’s service and your own existing jobs. Save a copy of the current crontab before editing it.",
                help: {
                    feature: "systemctl and crontab -l",
                    why: "The scheduler must run and existing user jobs should be preserved.",
                },
                command: "systemctl status crond --no-pager; crontab -l",
                id: "step-1",
            },
            {
                title: "Add a bounded training job",
                instruction:
                    "Use crontab -e to append a job that writes the current timestamp to your home directory once each minute. Use absolute command paths and a unique training filename.",
                help: {
                    feature: "crontab -e",
                    why: "A per-user job avoids changing system-wide schedules; an output file supplies evidence.",
                },
                id: "step-2",
            },
            {
                title: "Observe and clean up",
                instruction:
                    "After a scheduled minute, inspect the timestamps and journal. Remove only the job you added, then verify your earlier jobs remain. Also inspect systemd-tmpfiles configuration without deleting files.",
                help: {
                    feature: "Journal evidence and scoped cleanup",
                    why: "Separate execution evidence from schedule definition and leave the VM’s other jobs intact.",
                },
                command: "journalctl -u crond --since '10 minutes ago' --no-pager; systemd-tmpfiles --cat-config",
                id: "step-3",
            },
        ],
        success:
            "Self-review: the job ran at the planned time, its output was inspected, and only the training job was removed.",
    },
    {
        id: "packages",
        categoryId: "software",
        title: "Install and verify an RPM package",
        topic: "RPM and DNF",
        duration: 30,
        explanation:
            "RPM records installed package metadata; DNF resolves repositories and dependencies. Query ownership and verification results before replacing files. A configuration-file difference is evidence to investigate, not proof of damage.",
        objective: "Inspect, install and verify a small package in a subscribed or repository-enabled VM.",
        environment: "vm",
        references: [
            {
                workbookId: "system1",
                section: "Chapter 14 · RPM and DNF",
                pages: [493, 528],
            },
            {
                workbookId: "rhel10",
                section: "Chapter 10 · Basic package management",
                pages: [328, 351],
            },
        ],
        requirements: [
            "Use a disposable RHEL VM with console access and an administrator account.",
            "Run these commands in the guest, not in the container shell.",
        ],
        steps: [
            {
                title: "Inspect existing metadata",
                instruction: "Query Bash’s installed package and the package that owns its executable.",
                help: {
                    feature: "rpm -q and -qf",
                    why: "Ownership connects a file to the package that supplies it.",
                },
                command: "rpm -q bash; rpm -qf /usr/bin/bash",
                id: "step-1",
            },
            {
                title: "Resolve and install",
                instruction:
                    "Inspect DNF’s information for tree, review the transaction, then install it in the disposable VM. Repository access may require your own entitlement.",
                help: {
                    feature: "dnf info and install",
                    why: "DNF resolves dependencies and lets you review the proposed transaction.",
                },
                command: "dnf info tree; sudo dnf install tree",
                id: "step-2",
            },
            {
                title: "Verify files and behavior",
                instruction:
                    "Query and verify tree, then run it against an exercise directory. Explain any verification output instead of blindly reinstalling.",
                help: {
                    feature: "rpm -V",
                    why: "Verification compares installed files with package metadata.",
                },
                command: "rpm -q tree; rpm -V tree; tree --version",
                id: "step-3",
            },
        ],
        success:
            "Self-review: you reviewed the transaction, installed tree and interpreted its package verification result.",
    },
    {
        id: "repositories",
        categoryId: "software",
        title: "Inspect repository and package selection",
        topic: "Repositories",
        duration: 30,
        explanation:
            "A repository supplies metadata and packages. RHEL’s BaseOS and AppStream serve different software needs; the VM’s release and entitlement determine what is available. Keep signature checking enabled when adding a trusted training repository.",
        objective: "Explain which enabled repository would supply a chosen package.",
        environment: "vm",
        references: [
            {
                workbookId: "system1",
                section: "Chapter 14 · Enable repositories",
                pages: [515, 522],
            },
            {
                workbookId: "rhel10",
                section: "Chapter 11 · Repositories and package groups",
                pages: [352, 380],
            },
        ],
        requirements: [
            "Use a disposable RHEL VM with console access and an administrator account.",
            "Run these commands in the guest, not in the container shell.",
        ],
        steps: [
            {
                title: "Inventory enabled sources",
                instruction:
                    "List repository IDs and inspect their URLs and enabled status. Do not register or accept terms through this app.",
                help: {
                    feature: "dnf repolist",
                    why: "Repository IDs link configuration to available package metadata.",
                },
                command: "dnf repolist; dnf repoinfo",
                id: "step-1",
            },
            {
                title: "Trace a package provider",
                instruction:
                    "Search the enabled metadata for the package and identify its repository. Inspect package groups where supported by your release.",
                help: {
                    feature: "dnf info and group list",
                    why: "The package name alone does not explain which source and dependency set will be used.",
                },
                command: "dnf info tree; dnf group list",
                id: "step-2",
            },
            {
                title: "Review a configuration safely",
                instruction:
                    "Read a .repo file in the guest, identify baseurl or metalink, enabled and gpgcheck. If using a trainer-provided local repository, back up its configuration before a change and re-query metadata.",
                help: {
                    feature: "Repository configuration",
                    why: "Trust and enabled status must be checked before using a new software source.",
                },
                command: "ls /etc/yum.repos.d; dnf repolist --all",
                id: "step-3",
            },
        ],
        success:
            "Self-review: you identified the source for a package and explained repository trust and enabled status.",
    },
    {
        id: "flatpak",
        categoryId: "software",
        title: "Compare Flatpak apps, runtimes and remotes",
        topic: "Flatpak",
        duration: 30,
        explanation:
            "Flatpak separates an application from its runtime and uses named remotes as sources. Per-user and system installations have different scope. Review a remote’s origin and the app’s permissions before installing it.",
        objective: "Inspect a desktop application’s source, runtime and permissions in a RHEL 10 VM.",
        environment: "vm",
        references: [
            {
                workbookId: "rhel10",
                section: "Chapter 12 · Flatpak application management",
                pages: [381, 405],
            },
        ],
        requirements: [
            "Use a disposable RHEL 10 graphical VM with Flatpak and a trusted configured remote.",
            "An installation may require network access and review of third-party terms.",
        ],
        steps: [
            {
                title: "Identify scope and sources",
                instruction:
                    "Use a graphical disposable RHEL VM with Flatpak installed. List user and system remotes, noting that the two scopes can differ.",
                help: {
                    feature: "flatpak remotes",
                    why: "Knowing scope prevents assuming an application is installed for every user.",
                },
                command: "flatpak remotes --user; flatpak remotes --system",
                id: "step-1",
            },
            {
                title: "Inspect an application",
                instruction:
                    "Choose an app available in a trusted configured remote. Inspect its application ID, runtime and requested permissions before installing it through that remote.",
                help: {
                    feature: "remote-info and application IDs",
                    why: "An application ID and runtime make the dependency relationship explicit.",
                },
                id: "step-2",
            },
            {
                title: "Validate and remove the training app",
                instruction:
                    "Inspect the installed app and its permissions, launch it in the guest desktop, then remove only that training app if it was added for this lab.",
                help: {
                    feature: "flatpak info and list",
                    why: "Inspecting the installed record checks the actual scope and permissions.",
                },
                command: "flatpak list --app; flatpak list --runtime",
                id: "step-3",
            },
        ],
        success:
            "Self-review: you distinguished app, runtime, remote and installation scope, and tested a chosen application.",
    },
    {
        id: "services",
        categoryId: "services",
        title: "Create a small systemd service",
        topic: "Services and daemons",
        duration: 30,
        explanation:
            "A service’s active state describes now; its enabled state describes startup policy. Use a dedicated training unit so the exercise does not change a production daemon. A oneshot unit can demonstrate a successful task without a long-running process.",
        objective: "Create a training oneshot unit, start it and inspect its journal.",
        environment: "vm",
        references: [
            {
                workbookId: "system1",
                section: "Chapter 9 · Services and dependencies",
                pages: [297, 319],
            },
            {
                workbookId: "rhel10",
                section: "Chapter 14 · System initialization",
                pages: [437, 479],
            },
        ],
        requirements: [
            "Use a disposable RHEL VM with console access and an administrator account.",
            "Run these commands in the guest, not in the container shell.",
        ],
        steps: [
            {
                title: "Inspect unit state",
                instruction:
                    "Compare active and enabled status for an existing guest service. Read its unit rather than guessing how it starts.",
                help: {
                    feature: "systemctl status, is-enabled and cat",
                    why: "Running now and starting at boot are independent settings.",
                },
                command: "systemctl status chronyd --no-pager; systemctl is-enabled chronyd; systemctl cat chronyd",
                id: "step-1",
            },
            {
                title: "Create a dedicated unit",
                instruction:
                    "As the guest administrator, create /etc/systemd/system/rhelboat-demo.service with [Unit] Description=RHELboat demo, [Service] Type=oneshot and ExecStart=/usr/bin/echo training-service. Reload systemd and start this unit.",
                help: {
                    feature: "Unit files and daemon-reload",
                    why: "systemd must reload its unit definitions after you create or edit them.",
                },
                id: "step-2",
            },
            {
                title: "Prove execution and clean up",
                instruction:
                    "Read the demo journal and its result status. Remove only the demo unit, reload systemd and confirm it no longer exists. A successful oneshot can be inactive after it exits.",
                help: {
                    feature: "journalctl and systemctl show",
                    why: "The result and log prove execution even when there is no remaining process.",
                },
                command:
                    "journalctl -u rhelboat-demo.service --no-pager; systemctl show rhelboat-demo.service -p Result -p ExecMainStatus",
                id: "step-3",
            },
        ],
        success:
            "Self-review: your dedicated unit executed successfully and you removed only that unit after inspecting evidence.",
    },
    {
        id: "journal-time",
        categoryId: "services",
        title: "Correlate journal events and system time",
        topic: "Logging and time",
        duration: 30,
        explanation:
            "Reliable incident timelines depend on the clock and the log source. The journal can be filtered by boot, service and time. A timezone display and successful synchronization are different properties.",
        objective: "Record a tagged event, find it and inspect the guest’s time synchronization.",
        environment: "vm",
        references: [
            {
                workbookId: "system1",
                section: "Chapter 11 · Logs and time",
                pages: [357, 398],
            },
            {
                workbookId: "rhel10",
                section: "Chapter 19 · Name resolution and time",
                pages: [616, 639],
            },
        ],
        requirements: [
            "Use a disposable RHEL VM with console access and an administrator account.",
            "Run these commands in the guest, not in the container shell.",
        ],
        steps: [
            {
                title: "Record a recognizable event",
                instruction:
                    "Send a unique training event to the guest journal. Include a tag rather than searching all logs for a vague word.",
                help: {
                    feature: "logger",
                    why: "A distinctive tag makes the event easy to locate without changing a system service.",
                },
                command: "logger -t rhelboat-demo 'training timeline event'",
                id: "step-1",
            },
            {
                title: "Filter the evidence",
                instruction:
                    "Query only that tag and a recent interval. Compare wall-clock and monotonic output for the current boot.",
                help: {
                    feature: "journalctl -t, --since and -o",
                    why: "Filtering limits noise; monotonic times help order events within one boot.",
                },
                command:
                    "journalctl -t rhelboat-demo --since '10 minutes ago' --no-pager; journalctl -b -n 10 -o short-monotonic --no-pager",
                id: "step-2",
            },
            {
                title: "Check synchronization and retention",
                instruction:
                    "Inspect timezone, chrony status and journal disk usage. Read the journal retention configuration before making any persistent storage change.",
                help: {
                    feature: "timedatectl and chronyc",
                    why: "Clock configuration, synchronization health and log retention answer different operational questions.",
                },
                command: "timedatectl; chronyc tracking; journalctl --disk-usage",
                id: "step-3",
            },
        ],
        success:
            "Self-review: you located your event, interpreted its timestamp and checked synchronization and log retention.",
    },
    {
        id: "boot-recovery",
        categoryId: "services",
        title: "Trace startup and plan recovery",
        topic: "Boot and recovery",
        duration: 30,
        explanation:
            "Firmware, the boot loader, the kernel, initramfs and systemd form a chain. Diagnose the failing stage before changing a persistent boot configuration. Keep console access and a backup before practicing recovery.",
        objective: "Trace a successful boot and rehearse a reversible recovery plan.",
        environment: "vm",
        references: [
            {
                workbookId: "system2",
                section: "Chapter 8 · Boot targets and recovery",
                pages: [245, 273],
            },
            {
                workbookId: "rhel10",
                section: "Chapter 13 · Boot and kernel",
                pages: [406, 436],
            },
        ],
        requirements: [
            "Use a disposable VM with a snapshot and working hypervisor console.",
            "Recovery commands depend on firmware, release and the actual root filesystem.",
        ],
        steps: [
            {
                title: "Record the normal boot",
                instruction: "Record the running kernel, default target and any failed units.",
                help: {
                    feature: "uname, systemctl and journalctl",
                    why: "A baseline lets you distinguish a boot-loader failure from a later service failure.",
                },
                command: "uname -r; systemctl get-default; systemctl --failed; journalctl -b -p err --no-pager",
                id: "step-1",
            },
            {
                title: "Rehearse a temporary boot edit",
                instruction:
                    "Using the disposable VM console and a snapshot, inspect a boot-menu entry. Identify the kernel and initramfs. Rehearse a temporary target change using your release’s recovery instructions; do not overwrite a boot file from a generic example.",
                help: {
                    feature: "Boot-menu temporary parameters",
                    why: "A temporary edit limits the effect to one boot and teaches which startup stage is involved.",
                },
                id: "step-2",
            },
            {
                title: "Return and verify",
                instruction:
                    "Boot normally again and compare kernel, mounts and default target with your baseline. Describe when password recovery and an SELinux relabel would be necessary, using the workbook’s release-specific procedure.",
                help: {
                    feature: "Reboot validation",
                    why: "Recovery is complete only when ordinary startup and administrative access work again.",
                },
                command: "systemctl get-default; findmnt; systemctl --failed",
                id: "step-3",
            },
        ],
        success:
            "Self-review: you identified the boot stages, rehearsed recovery in a snapshot and returned to normal startup.",
    },
    {
        id: "kickstart",
        categoryId: "services",
        title: "Review an automated installation plan",
        topic: "Kickstart",
        duration: 30,
        explanation:
            "Kickstart records installation choices as data. Disk-selection and partition-clearing directives have a much larger effect than a cosmetic setting, so validate the plan before attaching it to a new disposable VM.",
        objective: "Inspect a generated Kickstart and explain its storage and credential directives.",
        environment: "vm",
        references: [
            {
                workbookId: "system2",
                section: "Chapter 10 · Kickstart installation",
                pages: [311, 322],
            },
        ],
        requirements: [
            "Use a disposable RHEL VM with console access and an administrator account.",
            "Run these commands in the guest, not in the container shell.",
        ],
        steps: [
            {
                title: "Inspect your installation record",
                instruction:
                    "In the installed guest, inspect /root/anaconda-ks.cfg with elevated access. Keep any credential hashes private and do not paste the file into this app.",
                help: {
                    feature: "Anaconda-generated Kickstart",
                    why: "The generated file connects the choices you made in the installer to their declarative form.",
                },
                id: "step-1",
            },
            {
                title: "Review the dangerous boundaries",
                instruction:
                    "Identify source, network, user, bootloader, ignoredisk, clearpart and partition directives. Explain precisely which virtual disks the plan could modify.",
                help: {
                    feature: "Disk-selection directives",
                    why: "Automated installation can erase every selected disk unless the plan bounds its destination.",
                },
                id: "step-2",
            },
            {
                title: "Validate a private draft",
                instruction:
                    "Make a private copy in the guest, adjust only your training settings and validate it with the release-appropriate ksvalidator if installed. Test it only in a separate disposable VM with a new disk.",
                help: {
                    feature: "ksvalidator and isolated test boot",
                    why: "Syntax validation catches errors but cannot prove your chosen disk or credentials are appropriate.",
                },
                id: "step-3",
            },
        ],
        success:
            "Self-review: you identified the installation source, disk scope and credential handling and validated a private draft.",
    },
    {
        id: "mounts",
        categoryId: "storage",
        title: "Mount a filesystem by stable identity",
        topic: "Filesystems and mounts",
        duration: 30,
        explanation:
            "A device node can change across boots. UUIDs identify filesystem instances, while mount points determine where their files appear. Validate fstab syntax and device identity before testing persistence.",
        objective: "Mount a newly prepared training filesystem and validate a persistent mount.",
        environment: "vm",
        references: [
            {
                workbookId: "system1",
                section: "Chapter 15 · Devices and mounts",
                pages: [530, 541],
            },
            {
                workbookId: "system2",
                section: "Chapter 5 · Basic storage",
                pages: [151, 181],
            },
        ],
        requirements: [
            "Use a disposable VM with a snapshot and an additional empty virtual disk.",
            "The app’s installation VM has one disk; attach extra training disks with your virtualization tools.",
        ],
        steps: [
            {
                title: "Identify the training device",
                instruction:
                    "Attach an additional empty virtual disk using your virtualization tools. Record its size, model, filesystem and mount state; confirm it is not the boot disk.",
                help: {
                    feature: "lsblk, blkid and findmnt",
                    why: "Partitioning or formatting the wrong disk destroys its data; identity must be established first.",
                },
                command: "lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINTS; findmnt; sudo blkid",
                id: "step-1",
            },
            {
                title: "Create a bounded mount",
                instruction:
                    "On that confirmed empty training disk, create one partition and an XFS filesystem using the workbook procedure. Create /mnt/rhelboat-data, mount the new filesystem and write a harmless marker file.",
                help: {
                    feature: "Partitioning, mkfs.xfs and mount",
                    why: "A partition, filesystem and mounted directory are distinct layers; verify each before the next.",
                },
                id: "step-2",
            },
            {
                title: "Validate persistence",
                instruction:
                    "Back up /etc/fstab inside the guest. Add a UUID-based entry for only the training filesystem. Validate it, test the mount and reboot with console access available.",
                help: {
                    feature: "UUID and findmnt --verify",
                    why: "A valid persistent entry must reference the intended filesystem and survive normal boot.",
                },
                command: "sudo blkid; findmnt --verify --verbose; findmnt /mnt/rhelboat-data",
                id: "step-3",
            },
        ],
        success:
            "Self-review: the intended training filesystem mounted by UUID and its marker remained accessible after reboot.",
    },
    {
        id: "lvm",
        categoryId: "storage",
        title: "Build and extend a logical volume",
        topic: "Logical volume management",
        duration: 30,
        explanation:
            "LVM separates physical capacity, a volume-group pool and logical volumes. Growing a logical volume and growing its filesystem are separate operations. Inspect free extents and filesystem type before choosing a growth command.",
        objective: "Create a small lab logical volume and extend it without losing its marker file.",
        environment: "vm",
        references: [
            {
                workbookId: "system2",
                section: "Chapter 6 · Storage stack",
                pages: [183, 218],
            },
            {
                workbookId: "rhel10",
                section: "Chapters 15–16 · LVM and filesystems",
                pages: [480, 555],
            },
        ],
        requirements: [
            "Use a disposable VM with a snapshot and a confirmed empty training disk.",
            "Create a separate lab VG; do not resize the installed system’s root volumes.",
        ],
        steps: [
            {
                title: "Map the layers",
                instruction:
                    "With an additional empty training disk, inspect physical volumes, groups and logical volumes. Record the root group so you can avoid modifying it.",
                help: {
                    feature: "pvs, vgs and lvs",
                    why: "The layer map prevents allocating or resizing the wrong storage object.",
                },
                command: "sudo pvs; sudo vgs; sudo lvs -o lv_name,vg_name,lv_size,devices; lsblk",
                id: "step-1",
            },
            {
                title: "Create a separate lab stack",
                instruction:
                    "Using only the confirmed training disk, create a physical volume, a distinct rhelboat_vg group and a small data logical volume. Format and mount it, then write a marker. Leave free extents in this group.",
                help: {
                    feature: "PV, VG and LV",
                    why: "A separate group bounds the exercise and retained free extents permit later growth.",
                },
                id: "step-2",
            },
            {
                title: "Grow and verify",
                instruction:
                    "Extend only the lab LV by a planned amount. Grow its XFS or ext4 filesystem with the appropriate tool, or use supported lvextend -r. Verify both sizes and the marker; do not attempt XFS shrink.",
                help: {
                    feature: "lvextend and filesystem growth",
                    why: "More block capacity does not automatically mean the mounted filesystem can use it.",
                },
                command: "sudo vgs; sudo lvs; df -hT; findmnt",
                id: "step-3",
            },
        ],
        success: "Self-review: the lab LV and filesystem both grew, and the marker was preserved.",
    },
    {
        id: "swap",
        categoryId: "storage",
        title: "Inspect and add temporary swap",
        topic: "Swap space",
        duration: 30,
        explanation:
            "Swap adds backing space for anonymous memory pages; it is not a replacement for RAM. A swap area must be initialized before activation. Practice on a dedicated extra partition or LV rather than an arbitrary existing disk.",
        objective: "Activate a dedicated lab swap area, inspect it and remove only that lab configuration.",
        environment: "vm",
        references: [
            {
                workbookId: "system2",
                section: "Chapter 5 · Swap",
                pages: [165, 181],
            },
            {
                workbookId: "rhel10",
                section: "Chapter 16 · Swap",
                pages: [517, 555],
            },
        ],
        requirements: [
            "Use a disposable VM with a snapshot, adequate free RAM and an unused training partition or LV.",
        ],
        steps: [
            {
                title: "Record current state",
                instruction:
                    "Inspect memory and existing swap. Identify an unused extra training partition or a small LV in a dedicated lab group.",
                help: {
                    feature: "swapon --show and free",
                    why: "A baseline distinguishes the new lab area from existing system swap.",
                },
                command: "swapon --show; free -h; lsblk",
                id: "step-1",
            },
            {
                title: "Initialize the confirmed lab area",
                instruction:
                    "On the selected unused training partition or LV, use mkswap and swapon. Confirm its UUID and activation before considering an fstab entry.",
                help: {
                    feature: "mkswap and swapon",
                    why: "Initialization writes a swap signature and activation makes the area available to the kernel.",
                },
                id: "step-2",
            },
            {
                title: "Validate and undo the lab addition",
                instruction:
                    "Inspect size and priority. If you made a persistent entry, back up fstab and remove only that entry. Deactivate only the added area after verifying adequate available RAM.",
                help: {
                    feature: "Scoped swapoff and UUID",
                    why: "Cleanup should preserve the guest’s original swap and avoid memory pressure.",
                },
                command: "swapon --show; free -h; findmnt --verify --verbose",
                id: "step-3",
            },
        ],
        success:
            "Self-review: you activated and inspected only a dedicated lab swap area and restored the original configuration.",
    },
    {
        id: "nfs",
        categoryId: "storage",
        title: "Mount a share on demand with AutoFS",
        topic: "NFS and AutoFS",
        duration: 30,
        explanation:
            "NFS makes a remote export available as a filesystem. AutoFS mounts it when a path is accessed and can unmount it after an idle timeout. Server export policy, client mount options and network reachability are separate controls.",
        objective: "Access a prepared read-only lab export through an indirect AutoFS map.",
        environment: "multi-node",
        references: [
            {
                workbookId: "system2",
                section: "Chapter 7 · NFS and automounting",
                pages: [219, 243],
            },
            {
                workbookId: "rhel10",
                section: "Chapter 18 · NFS and AutoFS",
                pages: [588, 615],
            },
        ],
        requirements: [
            "Prepare an NFS server and client on a private lab network.",
            "The app does not provision this second guest or the NFS export.",
        ],
        steps: [
            {
                title: "Establish prerequisites",
                instruction:
                    "Prepare two disposable RHEL guests on a private lab network. On the server, provide a dedicated read-only training export; on the client, verify DNS and install nfs-utils and autofs from trusted sources.",
                help: {
                    feature: "Export identity and reachability",
                    why: "The client must reach the intended server and know the exact export path.",
                },
                id: "step-1",
            },
            {
                title: "Create a bounded indirect map",
                instruction:
                    "On the client, back up relevant AutoFS configuration. Add a unique master entry and a map key pointing at the training export with read-only options. Reload or restart autofs after validating the map syntax.",
                help: {
                    feature: "AutoFS master and indirect maps",
                    why: "The master selects the mount root; the indirect key selects a share beneath it.",
                },
                id: "step-2",
            },
            {
                title: "Trigger and verify",
                instruction:
                    "Access the map key, read a known marker and inspect the resulting mount. Stop using the directory and observe the configured idle timeout. Remove only your lab map entries afterward.",
                help: {
                    feature: "Path access and findmnt",
                    why: "Access triggers mounting; examining the mount proves which server and options were used.",
                },
                command: "findmnt -t nfs,nfs4; systemctl status autofs --no-pager",
                id: "step-3",
            },
        ],
        success:
            "Self-review: accessing your map mounted the intended read-only export and you observed its idle behavior.",
    },
    {
        id: "encrypted-storage",
        categoryId: "storage",
        title: "Inspect an encrypted training volume",
        topic: "Encrypted storage",
        duration: 30,
        explanation:
            "LUKS keyslots hold encrypted copies of a volume key. Adding an access credential should preserve existing slots unless the plan explicitly calls for removal. A header backup and a tested recovery method are important before changing slots.",
        objective: "Inspect and test a dedicated encrypted volume without altering existing access methods.",
        environment: "vm",
        references: [
            {
                workbookId: "diagnostics",
                section: "Encrypted volume scenario · topic adaptation",
                pages: [1, 1],
            },
        ],
        requirements: [
            "Use a disposable VM with cryptsetup and an empty training image or extra disk.",
            "Legacy source notes provide the topic; use your installed cryptsetup manual for syntax.",
        ],
        steps: [
            {
                title: "Prepare an isolated target",
                instruction:
                    "Use an empty disposable disk image or a dedicated extra virtual disk created for encryption practice. Identify it and confirm that it contains no system or personal data.",
                help: {
                    feature: "cryptsetup and target identity",
                    why: "Encryption initialization and key operations must never be aimed at an unverified device.",
                },
                id: "step-1",
            },
            {
                title: "Inspect metadata before a key change",
                instruction:
                    "On your prepared lab LUKS volume, inspect luksDump, note the LUKS version and occupied slots, and create a private header backup following the installed cryptsetup documentation. Never save a passphrase in the app.",
                help: {
                    feature: "luksDump and header backup",
                    why: "The slot inventory and backup let you reason about what a change will affect.",
                },
                id: "step-2",
            },
            {
                title: "Test access and preservation",
                instruction:
                    "In the guest, practice adding a separate training credential to an unused slot using the installed manual. Open the volume, verify a marker and close its mapping. Test that the original credential still works; retain the recovery record privately.",
                help: {
                    feature: "Keyslot selection and luksOpen",
                    why: "A new credential is useful only if it opens the intended volume and existing access remains intact.",
                },
                id: "step-3",
            },
        ],
        success:
            "Self-review: you tested the lab volume’s new access method and verified that the original access still worked.",
    },
    {
        id: "networking",
        categoryId: "networking",
        title: "Trace addressing, routes and DNS",
        topic: "Network configuration",
        duration: 30,
        explanation:
            "NetworkManager connection profiles store persistent settings, while ip shows live kernel state. A reachable IP with a failing hostname suggests a different layer than a missing route. Change only a training interface while keeping console access.",
        objective: "Record a guest’s live and persistent network configuration and diagnose a naming failure.",
        environment: "vm",
        references: [
            {
                workbookId: "system1",
                section: "Chapter 12 · Networking and name resolution",
                pages: [399, 459],
            },
            {
                workbookId: "rhel10",
                section: "Chapter 17 · Networking",
                pages: [556, 587],
            },
        ],
        requirements: [
            "Use a disposable RHEL VM with console access and an administrator account.",
            "Run these commands in the guest, not in the container shell.",
        ],
        steps: [
            {
                title: "Inspect live state",
                instruction:
                    "Identify the guest interface, address and default route. Record active NetworkManager profile names instead of assuming eth0.",
                help: {
                    feature: "ip and nmcli",
                    why: "An interface name and a saved profile name can differ.",
                },
                command: "ip -brief address; ip route; nmcli connection show --active",
                id: "step-1",
            },
            {
                title: "Compare the saved profile",
                instruction:
                    "Inspect your actual profile’s IPv4, IPv6, DNS and autoconnect settings. If practicing static addressing, do so only on a separate lab interface with a documented private-network plan.",
                help: {
                    feature: "nmcli connection show",
                    why: "Persistent profile settings explain what returns after a reconnect or reboot.",
                },
                command: "nmcli device show; nmcli connection show",
                id: "step-2",
            },
            {
                title: "Test one layer at a time",
                instruction:
                    "Compare a known reachable address with its hostname. Inspect resolver and NSS configuration, then verify getent results. Correct only the faulty lab setting and retest after reconnect.",
                help: {
                    feature: "getent and resolver order",
                    why: "Name resolution can fail even when IP connectivity succeeds.",
                },
                command: "getent hosts localhost; cat /etc/nsswitch.conf; cat /etc/resolv.conf",
                id: "step-3",
            },
        ],
        success:
            "Self-review: you distinguished live state, saved profile settings, routes and name resolution and explained the fault.",
    },
    {
        id: "ssh",
        categoryId: "networking",
        title: "Establish and validate SSH key access",
        topic: "SSH authentication",
        duration: 30,
        explanation:
            "A public key can be shared; a private key must remain private. Server configuration validation and a second successful session should precede closing your working administrative connection.",
        objective: "Create a dedicated training key and test a non-root SSH login between lab guests.",
        environment: "multi-node",
        references: [
            {
                workbookId: "system1",
                section: "Chapter 10 · SSH",
                pages: [321, 356],
            },
            {
                workbookId: "rhel10",
                section: "Chapter 20 · Secure Shell",
                pages: [640, 660],
            },
        ],
        requirements: [
            "Prepare a client and server guest on a private network with a non-root account.",
            "Enter passphrases only in your guest console, never in lesson notes.",
        ],
        steps: [
            {
                title: "Verify the destination",
                instruction:
                    "Use two disposable guests on a private network. Check sshd status and its effective configuration on the destination. Verify its host-key fingerprint in that guest’s console.",
                help: {
                    feature: "sshd -t and host-key verification",
                    why: "Syntax validation protects service availability; the fingerprint confirms the destination’s identity.",
                },
                command: "sudo sshd -t; sudo systemctl status sshd --no-pager",
                id: "step-1",
            },
            {
                title: "Create and install a training public key",
                instruction:
                    "Generate a dedicated Ed25519 key as the learner in a guest, with a passphrase entered there. Copy only its .pub file to the intended account’s authorized_keys using ssh-copy-id or the workbook procedure.",
                help: {
                    feature: "ssh-keygen and authorized_keys",
                    why: "The private key proves identity while authorized_keys lists allowed public keys.",
                },
                id: "step-2",
            },
            {
                title: "Prove a new login",
                instruction:
                    "Open a second session using the training key and verify whoami and hostname. Keep the first session until the test succeeds, then remove only the temporary key entry if cleaning up.",
                help: {
                    feature: "A second independent SSH session",
                    why: "A successful existing session does not prove a new authentication method works.",
                },
                id: "step-3",
            },
        ],
        success: "Self-review: a new non-root session used the intended key and reached the verified guest.",
    },
    {
        id: "secure-transfer",
        categoryId: "networking",
        title: "Transfer and compare a file securely",
        topic: "Secure file transfer",
        duration: 30,
        explanation:
            "SFTP and rsync over SSH transfer files through an authenticated encrypted connection. Copying and synchronizing have different deletion semantics; inspect an rsync dry run before applying changes.",
        objective: "Transfer a harmless marker between guests and compare its checksum.",
        environment: "multi-node",
        references: [
            {
                workbookId: "system1",
                section: "Chapter 13 · Secure transfer and synchronization",
                pages: [469, 486],
            },
        ],
        requirements: ["Prepare two private lab guests with working, verified SSH access."],
        steps: [
            {
                title: "Prepare the source",
                instruction:
                    "In the source guest create a dedicated training file with known text. Verify the SSH destination and record the file’s SHA-256.",
                help: {
                    feature: "sha256sum and SSH identity",
                    why: "A known checksum gives you an independent content check after transfer.",
                },
                id: "step-1",
            },
            {
                title: "Copy into a lab destination",
                instruction:
                    "Use SFTP to copy the file into a new directory in the remote learner’s home. Alternatively inspect an rsync -n transfer over SSH; do not use --delete in this exercise.",
                help: {
                    feature: "SFTP or rsync dry run",
                    why: "A dedicated destination and dry run bound the operation before writing remote files.",
                },
                id: "step-2",
            },
            {
                title: "Compare both ends",
                instruction:
                    "Compute the destination checksum in that guest and compare it with the source. Explain what checksum agreement proves and how SSH authenticated the host. Remove only the training copies if cleaning up.",
                help: {
                    feature: "Checksum comparison",
                    why: "A successful transfer exit code should be supported by a check of the received contents.",
                },
                id: "step-3",
            },
        ],
        success: "Self-review: the file arrived at the intended guest and its checksum matched the source.",
    },
    {
        id: "selinux",
        categoryId: "security",
        title: "Diagnose a file-context mismatch",
        topic: "SELinux",
        duration: 30,
        explanation:
            "SELinux checks policy labels in addition to ordinary permissions. Restore a known default context before inventing policy. A persistent fcontext rule and a one-time chcon have different behavior after relabeling.",
        objective:
            "Inspect expected labels and repair a deliberate lab-only mismatch while keeping enforcement enabled.",
        environment: "vm",
        references: [
            {
                workbookId: "system2",
                section: "Chapter 4 · SELinux",
                pages: [113, 149],
            },
            {
                workbookId: "rhel10",
                section: "Chapter 22 · SELinux",
                pages: [681, 712],
            },
        ],
        requirements: [
            "Use an enforcing disposable RHEL VM with SELinux policy tools and audit logs.",
            "The isolated container cannot model the guest’s full SELinux policy.",
        ],
        steps: [
            {
                title: "Inspect mode and labels",
                instruction:
                    "Use an enforcing disposable RHEL VM. Inspect current mode and compare a training file’s current label with its expected default.",
                help: {
                    feature: "getenforce, ls -Z and matchpathcon",
                    why: "An access failure can involve discretionary permissions, policy labels or both.",
                },
                command: "getenforce; sestatus; ls -Zd /var/www/html; matchpathcon /var/www/html",
                id: "step-1",
            },
            {
                title: "Restore a standard-path context",
                instruction:
                    "Create a harmless file under the guest’s standard web-content training directory, inspect its label and use restorecon on that file. For a custom lab directory, review a narrowly scoped semanage fcontext rule before applying it.",
                help: {
                    feature: "restorecon and semanage fcontext",
                    why: "restorecon applies the policy’s path mapping; a persistent mapping survives relabeling.",
                },
                id: "step-2",
            },
            {
                title: "Correlate a denial with the action",
                instruction:
                    "If your controlled test produced a denial, inspect its time, subject, object and requested operation. Retest with the correct context and keep enforcement enabled.",
                help: {
                    feature: "AVC evidence and retesting",
                    why: "A targeted correction should resolve the tested action without broadening unrelated policy.",
                },
                command: "sudo ausearch -m AVC,USER_AVC -ts recent",
                id: "step-3",
            },
        ],
        success:
            "Self-review: you explained the expected context, applied a scoped correction and retested with enforcement enabled.",
    },
    {
        id: "firewall",
        categoryId: "security",
        title: "Compare runtime and persistent firewall rules",
        topic: "Firewalld",
        duration: 30,
        explanation:
            "Firewalld assigns interfaces and sources to zones. A runtime rule and a persistent rule have different lifetimes. Validate the zone actually handling your traffic and preserve administrative access before a reload.",
        objective: "Allow a dedicated lab service in its intended zone and verify its persistence.",
        environment: "multi-node",
        references: [
            {
                workbookId: "system2",
                section: "Chapter 9 · Network security",
                pages: [275, 302],
            },
            {
                workbookId: "rhel10",
                section: "Chapter 21 · Firewall",
                pages: [661, 680],
            },
        ],
        requirements: [
            "Use a disposable firewalld guest and a private-network client guest.",
            "Keep console access while changing firewall settings.",
        ],
        steps: [
            {
                title: "Map the active zone",
                instruction:
                    "In the disposable guest, inspect active zones, their interfaces and allowed services. Keep the guest console available.",
                help: {
                    feature: "firewall-cmd --get-active-zones",
                    why: "Editing the wrong zone can leave a service unreachable or expose a different interface.",
                },
                command: "sudo firewall-cmd --get-active-zones; sudo firewall-cmd --list-all",
                id: "step-1",
            },
            {
                title: "Add the narrow lab exception",
                instruction:
                    "Run a trainer-selected test service bound only to the private lab interface. Add its service or port to the actual lab zone at runtime; confirm from another guest that it responds.",
                help: {
                    feature: "Zone-scoped service or port rules",
                    why: "A rule should match the intended traffic and be proven by an actual client test.",
                },
                id: "step-2",
            },
            {
                title: "Check persistent behavior",
                instruction:
                    "Compare runtime and permanent settings, make only the lab exception persistent, reload and retest. Remove only your added rule afterward and recheck administrative access.",
                help: {
                    feature: "--permanent and reload",
                    why: "Persistence must be tested separately from a rule that currently works.",
                },
                command: "sudo firewall-cmd --list-all; sudo firewall-cmd --permanent --list-all",
                id: "step-3",
            },
        ],
        success:
            "Self-review: the intended private-network client worked before and after reload and only your lab rule was cleaned up.",
    },
    {
        id: "containers",
        categoryId: "operations",
        title: "Run and inspect a rootless container",
        topic: "Container operations",
        duration: 30,
        explanation:
            "An image is a template and a container is an instance with its own writable layer. Volumes have a separate lifetime. Practice Podman in the installed VM rather than nesting it inside the app’s restricted container.",
        objective: "Run a rootless training container and distinguish its configuration from its image.",
        environment: "vm",
        references: [
            {
                workbookId: "system2",
                section: "Chapter 11 · Containers, storage and services",
                pages: [337, 398],
            },
        ],
        requirements: [
            "Use Podman as a non-root learner inside the disposable RHEL VM.",
            "Do not mount a host container socket or try nested Podman in the app’s restricted lab.",
        ],
        steps: [
            {
                title: "Inspect runtime and images",
                instruction:
                    "As a non-root learner in the RHEL VM, inspect Podman’s configuration and locally available images. Use an explicitly named trusted registry if a pull is needed.",
                help: {
                    feature: "podman info and images",
                    why: "Rootless operation and a fully qualified image name make the execution context and source clear.",
                },
                command: "podman info; podman images",
                id: "step-1",
            },
            {
                title: "Create a bounded instance",
                instruction:
                    "Run a container named rhelboat-demo with no published ports, using a trusted UBI image. Inspect its image ID, network and mounts. If practicing persistence, use a newly named lab volume and keep it separate from the app’s lab.",
                help: {
                    feature: "podman run and inspect",
                    why: "The running instance can differ from the image and a volume is not part of its writable layer.",
                },
                id: "step-2",
            },
            {
                title: "Observe lifecycle and service integration",
                instruction:
                    "Stop and restart only rhelboat-demo and check its saved data. Inspect the installed release’s supported systemd integration method before configuring a user service. Remove only your demo container and lab volume when finished.",
                help: {
                    feature: "Lifecycle and systemd integration",
                    why: "Container, data volume and service definitions have independent lifetimes.",
                },
                command: "podman ps --all; podman volume ls",
                id: "step-3",
            },
        ],
        success:
            "Self-review: you identified the container’s image, mounts and lifecycle and tested data persistence in a scoped lab.",
    },
    {
        id: "performance",
        categoryId: "operations",
        title: "Measure before choosing a tuning profile",
        topic: "Performance",
        duration: 30,
        explanation:
            "A load average, CPU utilization, memory pressure and I/O latency measure different things. A tuning profile applies a collection of settings; it does not diagnose a bottleneck. Establish a baseline and change one factor at a time.",
        objective: "Capture a short baseline and justify a reversible tuning experiment.",
        environment: "vm",
        references: [
            {
                workbookId: "system2",
                section: "Chapter 3 · Tuning and scheduling",
                pages: [83, 111],
            },
            {
                workbookId: "diagnostics",
                section: "Performance archive scenario · topic adaptation",
                pages: [5, 5],
            },
        ],
        requirements: [
            "Use a disposable RHEL VM with console access and an administrator account.",
            "Run these commands in the guest, not in the container shell.",
        ],
        steps: [
            {
                title: "Capture a baseline",
                instruction:
                    "With no workload changes yet, record CPU, memory, load and I/O observations. Explain what each tool is measuring.",
                help: {
                    feature: "vmstat, free and uptime",
                    why: "A baseline is needed before attributing an effect to a tuning change.",
                },
                command: "uptime; free -h; vmstat 1 5",
                id: "step-1",
            },
            {
                title: "Inspect scheduling and profiles",
                instruction:
                    "Inspect process nice values and the active tuned profile if the service is installed. Choose a harmless guest workload and record the hypothesis for your experiment.",
                help: {
                    feature: "ps and tuned-adm",
                    why: "Scheduling priority and a tuning profile affect different parts of system behavior.",
                },
                command: "ps -eo pid,ni,comm; tuned-adm active; tuned-adm recommend",
                id: "step-2",
            },
            {
                title: "Compare and restore",
                instruction:
                    "Change only the planned guest setting, repeat the measurement for the same interval and compare. Restore the original profile or nice value; if using a supplied PCP archive, inspect its timestamps and metric definitions before interpreting it.",
                help: {
                    feature: "Controlled comparison",
                    why: "A result needs a consistent workload and interval to support the conclusion.",
                },
                id: "step-3",
            },
        ],
        success:
            "Self-review: you measured a baseline, explained one proposed change and restored the original lab setting.",
    },
    {
        id: "troubleshooting",
        categoryId: "operations",
        title: "Investigate a fault using evidence",
        topic: "Diagnostic workflow",
        duration: 30,
        explanation:
            "A symptom can come from several layers. Preserve observations, form a testable hypothesis and make the smallest correction that addresses the cause. A workaround can hide the fault, so validate the result after removing only a known lab workaround.",
        objective: "Produce an incident note with observations, hypothesis, correction and retest.",
        environment: "vm",
        references: [
            {
                workbookId: "system1",
                section: "Chapter 16 · Analyze servers and get support",
                pages: [559, 592],
            },
            {
                workbookId: "diagnostics",
                section: "Service, filesystem and support scenarios · topic adaptation",
                pages: [1, 8],
            },
        ],
        requirements: [
            "Use a disposable RHEL VM with console access and an administrator account.",
            "Run these commands in the guest, not in the container shell.",
        ],
        steps: [
            {
                title: "Capture the baseline",
                instruction:
                    "Choose a fault in a disposable guest or have a trainer introduce one. Record symptoms, time, recent changes, failed units, disk capacity and inode usage before editing anything.",
                help: {
                    feature: "journalctl, systemctl, df and df -i",
                    why: "Capacity, inode exhaustion and service failures can look similar to an application user.",
                },
                command: "systemctl --failed; df -hT; df -i; journalctl -b -p err --no-pager",
                id: "step-1",
            },
            {
                title: "Test one hypothesis",
                instruction:
                    "Trace the symptom to its service, scheduled job, package or mount. Compare configuration with a saved baseline and avoid disabling unrelated services just because their names look suspicious.",
                help: {
                    feature: "Scoped evidence collection",
                    why: "A hypothesis should predict an observation and a focused retest, not a broad reset.",
                },
                id: "step-2",
            },
            {
                title: "Correct and document",
                instruction:
                    "Apply the smallest change in the guest, repeat the original failing action and check persistence if relevant. Review support-report contents before sharing; support bundles can contain private configuration.",
                help: {
                    feature: "Retest and incident notes",
                    why: "A working command alone does not prove the original fault is resolved or that the fix persists.",
                },
                id: "step-3",
            },
        ],
        success:
            "Self-review: the incident note links evidence to a correction and demonstrates the original action succeeding again.",
    },
    {
        id: "authentication",
        categoryId: "operations",
        title: "Separate identity lookup from authentication",
        topic: "Login diagnostics",
        duration: 30,
        explanation:
            "Resolving an account does not prove it can authenticate. NSS finds identities, PAM applies authentication policy, and remote identity services introduce their own connectivity and time dependencies. Change one lab policy component at a time.",
        objective: "Diagnose a controlled login failure without bypassing authentication controls.",
        environment: "vm",
        references: [
            {
                workbookId: "diagnostics",
                section: "Identity and login scenarios · topic adaptation",
                pages: [2, 2],
            },
            {
                workbookId: "system1",
                section: "Chapters 6 and 10 · Accounts and SSH",
                pages: [171, 215],
            },
        ],
        requirements: [
            "Use a disposable VM and a known practice account with a trainer-controlled failure.",
            "Remote identity scenarios additionally need their own prepared identity infrastructure.",
        ],
        steps: [
            {
                title: "Resolve the identity",
                instruction:
                    "Use an existing practice account in a disposable VM. Confirm the account, groups, shell and expiry without dumping credential databases.",
                help: {
                    feature: "getent, id and chage",
                    why: "Identity lookup and account eligibility are prerequisites, separate from a successful password or key check.",
                },
                id: "step-1",
            },
            {
                title: "Correlate a failed attempt",
                instruction:
                    "Trigger one login attempt using the account’s legitimate method, then inspect only the relevant sshd or authentication journal interval. For a remote identity lab, also verify time and reachability.",
                help: {
                    feature: "Authentication logs",
                    why: "The rejection reason helps distinguish policy, account state, key permissions and a missing component.",
                },
                id: "step-2",
            },
            {
                title: "Repair the identified lab cause",
                instruction:
                    "Validate the relevant configuration or supplying package and make only the evidenced repair. Retest in a new session while preserving a working administrator console.",
                help: {
                    feature: "PAM, package ownership and a new login",
                    why: "Blindly replacing authentication policy can lock out the VM; a second session proves the repair.",
                },
                id: "step-3",
            },
        ],
        success:
            "Self-review: you distinguished lookup from authentication and verified a scoped repair in a new login.",
    },
    {
        id: "tracing",
        categoryId: "operations",
        title: "Trace an application’s missing resource",
        topic: "Application diagnostics",
        duration: 30,
        explanation:
            "A failed program may be missing a file, library or listener. Tracing reveals attempted operations, but trace logs can include secrets. Use a harmless program and keep traces inside the disposable guest.",
        objective: "Explain an application failure from an observed missing resource or conflicting listener.",
        environment: "vm",
        references: [
            {
                workbookId: "diagnostics",
                section: "Application and package scenarios · topic adaptation",
                pages: [3, 6],
            },
        ],
        requirements: ["Use a disposable VM with a harmless failing training program and optional strace."],
        steps: [
            {
                title: "Reproduce narrowly",
                instruction:
                    "Choose a harmless failing training program and record its exit status and error. Inspect its executable’s ownership and package metadata.",
                help: {
                    feature: "Exit status and rpm -qf",
                    why: "A repeatable failure and a known executable provide a bounded starting point.",
                },
                id: "step-1",
            },
            {
                title: "Observe attempted operations",
                instruction:
                    "If installed, run strace on the training program and look for failed file opens or connections. Check ss -lntp when the symptom involves a listener. Do not trace real credentials or kill unknown port owners.",
                help: {
                    feature: "strace and ss",
                    why: "Observed system calls and listeners support a specific explanation of the failure.",
                },
                id: "step-2",
            },
            {
                title: "Repair and rerun",
                instruction:
                    "Create or repair only the expected lab resource or configuration after checking its purpose. Rerun the original action, compare the trace and remove private trace files after review.",
                help: {
                    feature: "A focused correction and retest",
                    why: "Suppressing an error without confirming the required behavior can conceal the real problem.",
                },
                id: "step-3",
            },
        ],
        success:
            "Self-review: you linked a trace observation to the fault and showed the original program succeeding afterward.",
    },
    {
        id: "iscsi",
        categoryId: "operations",
        title: "Trace an iSCSI discovery and login",
        topic: "Network block storage",
        duration: 30,
        explanation:
            "iSCSI discovery, session authentication and filesystem mounting are separate stages. An initiator name and CHAP policy must match the target’s plan. Do not delete node records or format a discovered LUN to troubleshoot a login failure.",
        objective: "Inspect a prepared lab target and distinguish discovery, login and device visibility.",
        environment: "multi-node",
        references: [
            {
                workbookId: "diagnostics",
                section: "iSCSI authentication scenario · topic adaptation",
                pages: [2, 2],
            },
        ],
        requirements: [
            "Prepare a dedicated iSCSI target and initiator with a documented lab access policy.",
            "The app does not provision these nodes or their credentials.",
        ],
        steps: [
            {
                title: "Establish the target plan",
                instruction:
                    "Prepare a dedicated target and initiator on a private network. Record portal, target IQN, initiator IQN, allowed LUN and the intended authentication method. Keep secrets in the guest.",
                help: {
                    feature: "Target and initiator identities",
                    why: "A mismatch can block access even when the target portal is reachable.",
                },
                id: "step-1",
            },
            {
                title: "Inspect discovery and authentication",
                instruction:
                    "Using the installed iscsiadm manual, inspect existing discovery and node records. Discover only your lab portal and compare the selected node’s CHAP policy with the target. Do not replace unrelated records.",
                help: {
                    feature: "iscsiadm node and discovery records",
                    why: "Discovery finds a target; login still needs the correct access and authentication policy.",
                },
                id: "step-2",
            },
            {
                title: "Verify a session without formatting",
                instruction:
                    "Log in only to the prepared lab target, inspect session state and confirm that the intended LUN appears. Treat it as an existing block device; do not write a filesystem unless the trainer separately assigned an empty LUN.",
                help: {
                    feature: "Session state and lsblk",
                    why: "A visible session and the expected device demonstrate successful transport before any filesystem work.",
                },
                id: "step-3",
            },
        ],
        success:
            "Self-review: you explained each stage and verified the intended session and LUN without modifying unrelated storage.",
    },
];

const categoryDefinitions = [
    {
        id: "basics",
        code: "01",
        title: "Getting started",
        subtitle: "Installation, shell access and local documentation",
        description: "Build your practice system and learn to navigate it.",
        icon: "terminal",
    },
    {
        id: "files",
        code: "02",
        title: "Files & text",
        subtitle: "Search, edit, link and archive",
        description: "Work with files and text using small, inspectable changes.",
        icon: "book",
    },
    {
        id: "accounts",
        code: "03",
        title: "Users & permissions",
        subtitle: "Identity, access and account policy",
        description: "Create practice identities and verify who can access each resource.",
        icon: "key",
    },
    {
        id: "shell",
        code: "04",
        title: "Shell & processes",
        subtitle: "Scripts, jobs and scheduling",
        description: "Turn repeatable commands into controlled automation.",
        icon: "terminal",
    },
    {
        id: "software",
        code: "05",
        title: "Software management",
        subtitle: "RPM, DNF, repositories and Flatpak",
        description: "Understand where software comes from and how to verify it.",
        icon: "package",
    },
    {
        id: "services",
        code: "06",
        title: "Services & startup",
        subtitle: "systemd, logs, time and installation plans",
        description: "Observe services and startup before making persistent changes.",
        icon: "layers",
    },
    {
        id: "storage",
        code: "07",
        title: "Storage & filesystems",
        subtitle: "Disks, LVM, mounts, swap and remote files",
        description: "Map each storage layer and bound changes to dedicated lab devices.",
        icon: "layers",
    },
    {
        id: "networking",
        code: "08",
        title: "Networking & remote access",
        subtitle: "Profiles, name resolution, SSH and transfer",
        description: "Trace connectivity and validate an authenticated remote workflow.",
        icon: "cloud",
    },
    {
        id: "security",
        code: "09",
        title: "System security",
        subtitle: "SELinux and firewalld",
        description: "Apply narrow policy changes and prove that the intended action works.",
        icon: "shield",
    },
    {
        id: "operations",
        code: "10",
        title: "Operations & troubleshooting",
        subtitle: "Containers, performance and fault investigation",
        description: "Gather evidence, form a hypothesis and verify a focused correction.",
        icon: "search",
    },
];
export const categories: TrainingCategory[] = categoryDefinitions.map(category => ({
    ...category,
    topics: lessons.filter(lesson => lesson.categoryId === category.id).map(lesson => lesson.topic),
    lessonIds: lessons.filter(lesson => lesson.categoryId === category.id).map(lesson => lesson.id),
}));

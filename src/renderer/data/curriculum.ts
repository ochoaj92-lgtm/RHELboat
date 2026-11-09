export type LabEnvironment = "container" | "vm" | "multi-node";

export interface TrainingPath {
    id: string;
    code: string;
    title: string;
    subtitle: string;
    description: string;
    level: "Foundation" | "Advanced" | "Specialist";
    examUrl: string;
    topics: string[];
    environment: LabEnvironment;
    lessonIds: string[];
    version?: string;
}

export interface Lesson {
    id: string;
    title: string;
    topic: string;
    duration: number;
    objective: string;
    explanation: string;
    environment: LabEnvironment;
    steps: { id?: string; title: string; instruction: string; command?: string }[];
    checkId?: string;
    success: string;
    sourceUrl: string;
}

const ex200 = "https://www.redhat.com/en/services/training/ex200-red-hat-certified-system-administrator-rhcsa-exam";
const ex342 =
    "https://www.redhat.com/en/services/training/ex342-red-hat-certified-specialist-linux-diagnostics-and-troubleshooting";
const ex210 =
    "https://www.redhat.com/en/services/training/ex210-red-hat-certified-system-administrator-red-hat-openstack-exam";
const ex358 =
    "https://www.redhat.com/en/services/training/ex358-red-hat-certified-specialist-services-management-automation-exam";
const ex362 = "https://www.redhat.com/en/services/training/ex362-red-hat-certified-specialist-identity-management-exam";
const ex403 =
    "https://www.redhat.com/en/services/training/ex403-red-hat-certificate-expertise-deployment-systems-management-exam";
const ex415 = "https://www.redhat.com/en/services/training/ex415-red-hat-certified-specialist-security-linux-exam";
const ex436 =
    "https://www.redhat.com/en/services/training/ex436-red-hat-certificate-expertise-high-availability-clustering-exam";
const ex442 =
    "https://www.redhat.com/en/services/training/ex442-exame-do-red-hat-certified-specialist-linux-performance-tuning";
const certifications = "https://www.redhat.com/en/services/certifications";

// shortcut: advanced paths contain introductory guides, add provisioned VM labs before claiming full exam preparation.
export const paths: TrainingPath[] = [
    {
        id: "rhcsa",
        code: "EX200",
        title: "System administration",
        subtitle: "RHCSA · Enterprise Linux",
        description:
            "Install RHEL in a dedicated practice VM, complete eight checked container exercises, then plan further full-system practice. These lessons introduce selected objectives; they do not cover the complete exam.",
        level: "Foundation",
        examUrl: ex200,
        environment: "container",
        version: "Official EX200 objectives: RHEL 10",
        topics: [
            "RHEL ISO installation and initial configuration",
            "Shell and essential tools",
            "Files, links and archives",
            "Users and permissions",
            "Processes and shell scripts",
            "RPM and Flatpak software",
            "Services, scheduling and logs",
            "Networking and firewalld",
            "Storage, filesystems and boot",
            "SSH and SELinux",
        ],
        lessonIds: [
            "rhel-installation",
            "navigation",
            "permissions",
            "users",
            "processes",
            "archive",
            "links",
            "text",
            "scripting",
            "system-administration",
        ],
    },
    {
        id: "rhce",
        code: "EX342",
        title: "Diagnostics & troubleshooting",
        subtitle: "Advanced administrator · RHCE Enterprise Linux",
        description:
            "Learn a repeatable investigation workflow. In the current framework, EX200 plus EX342 leads to RHCE in Enterprise Linux. This guide is an introduction, with full-system practice still required.",
        level: "Advanced",
        examUrl: ex342,
        environment: "vm",
        version: "Official EX342 objectives: RHEL 10.2",
        topics: [
            "Evidence collection",
            "Startup and service failures",
            "Filesystem and LVM recovery",
            "RPM dependency problems",
            "Network and application diagnostics",
            "PAM and SELinux failures",
            "Crash dumps and support data",
        ],
        lessonIds: ["troubleshooting"],
    },
    {
        id: "cloud",
        code: "EX210",
        title: "Cloud infrastructure",
        subtitle: "Enterprise Linux specialist · OpenStack",
        description:
            "Trace a workload through an OpenStack environment. This introductory guide requires an existing disposable cloud; the local container does not supply one.",
        level: "Specialist",
        examUrl: ex210,
        environment: "multi-node",
        topics: [
            "Control plane operations",
            "Projects, identity and roles",
            "Images, flavors and instances",
            "Ceph and Swift storage",
            "OVN networking",
            "Telemetry and orchestration",
        ],
        lessonIds: ["cloud-infrastructure"],
    },
    {
        id: "services",
        code: "EX358",
        title: "Services & automation",
        subtitle: "Enterprise Linux specialist",
        description:
            "Follow an HTTP service from configuration to client access, then plan its automation. This is one introductory service guide, not the full services curriculum.",
        level: "Specialist",
        examUrl: ex358,
        environment: "vm",
        version: "Official EX358 objectives: RHEL 9.4 · AAP 2.4",
        topics: [
            "DNS and DHCP",
            "HTTP, TLS and load balancing",
            "Mail and print services",
            "MariaDB backup and restore",
            "NFS, SMB and iSCSI",
            "Network bonding",
            "Ansible service automation",
        ],
        lessonIds: ["services-automation"],
    },
    {
        id: "identity",
        code: "EX362",
        title: "Identity management",
        subtitle: "Enterprise Linux specialist",
        description:
            "Explore enrollment, Kerberos authentication and access policies using a prepared IdM environment. The guide needs separate server and client machines.",
        level: "Specialist",
        examUrl: ex362,
        environment: "multi-node",
        version: "Official EX362 objectives: RHEL 9 · IdM 4.8",
        topics: [
            "IdM server and replicas",
            "Client enrollment",
            "Kerberos and single sign-on",
            "Users, groups and access policies",
            "Certificates and vaults",
            "Backup and maintenance",
        ],
        lessonIds: ["identity-management"],
    },
    {
        id: "deployment",
        code: "EX403",
        title: "Deployment & systems management",
        subtitle: "Enterprise Linux specialist · Satellite",
        description:
            "Understand how content moves safely from repositories to managed hosts. Practice this guide in an entitled, prepared Satellite environment.",
        level: "Specialist",
        examUrl: ex403,
        environment: "multi-node",
        topics: [
            "Organizations, locations and roles",
            "Repositories and content views",
            "Lifecycle environments",
            "Activation keys and registration",
            "Capsules and remote execution",
            "Provisioning and backups",
        ],
        lessonIds: ["deployment-management"],
    },
    {
        id: "security",
        code: "EX415",
        title: "Linux security",
        subtitle: "Enterprise Linux specialist",
        description:
            "Investigate an SELinux denial without removing protection. This introductory VM guide is one part of a broader hardening curriculum.",
        level: "Specialist",
        examUrl: ex415,
        environment: "vm",
        topics: [
            "SELinux policy and diagnosis",
            "AIDE file integrity",
            "LUKS and network-bound encryption",
            "PAM and login policy",
            "USBGuard",
            "Audit rules and reports",
            "OpenSCAP compliance",
            "Automation access control",
        ],
        lessonIds: ["linux-security"],
    },
    {
        id: "availability",
        code: "EX436",
        title: "High availability",
        subtitle: "Enterprise Linux specialist",
        description:
            "Plan and inspect a small failover cluster. Reliable fencing and independent nodes are essential; a single training container cannot reproduce them.",
        level: "Specialist",
        examUrl: ex436,
        environment: "multi-node",
        topics: [
            "Cluster membership and quorum",
            "Fencing",
            "Resources and constraints",
            "Failover and alerts",
            "Shared iSCSI and LVM storage",
            "GFS2",
        ],
        lessonIds: ["high-availability"],
    },
    {
        id: "performance",
        code: "EX442",
        title: "Performance tuning",
        subtitle: "Enterprise Linux specialist",
        description:
            "Measure a bottleneck before changing a setting. Use a disposable VM for kernel and resource-control practice, with repeatable workloads.",
        level: "Specialist",
        examUrl: ex442,
        environment: "vm",
        version: "Official EX442 objectives: RHEL 10",
        topics: [
            "CPU, memory, disk and network baselines",
            "PCP and tracing tools",
            "Kernel parameters",
            "tuned and process priorities",
            "cgroups and systemd limits",
            "NUMA, memory and I/O tuning",
        ],
        lessonIds: ["performance-tuning"],
    },
    {
        id: "rhca",
        code: "RHCA",
        title: "Architect learning roadmap",
        subtitle: "Enterprise Linux · Core credentials + three specialists",
        description:
            "The current Enterprise Linux architect path combines EX200 and EX342 with three eligible specialist credentials. These introductory guides help you choose focus areas; app completion does not award certification.",
        level: "Advanced",
        examUrl: certifications,
        environment: "multi-node",
        topics: [
            "EX200 system administration",
            "EX342 advanced administration",
            "Choose three eligible specialist credentials",
            "Integrate security, availability and operations",
            "Confirm current requirements with Red Hat",
        ],
        lessonIds: [
            "troubleshooting",
            "cloud-infrastructure",
            "services-automation",
            "identity-management",
            "deployment-management",
            "linux-security",
            "high-availability",
            "performance-tuning",
        ],
    },
];

export const lessons: Lesson[] = [
    {
        id: "rhel-installation",
        title: "Install RHEL from the official ISO",
        topic: "Installation and initial configuration",
        duration: 90,
        objective:
            "Download and verify a RHEL ISO, install it on the app's dedicated virtual disk, and verify your configuration after reboot.",
        explanation:
            "Build the system you will administer. Follow this guide beside the real QEMU console, which opens in a separate window. Installation is foundational practice for storage, boot, networking and account skills; ISO installation itself is not explicitly listed in the current EX200 objectives. The app verifies the selected ISO checksum and manages its VM, while installer checkpoints and guest configuration remain self-reported.",
        environment: "vm",
        sourceUrl:
            "https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10/html-single/interactively_installing_rhel_from_installation_media/index",
        steps: [
            {
                id: "download-iso",
                title: "Get the ISO from Red Hat",
                instruction:
                    "Open the official download page from the VM panel. Sign in and review any membership or license terms yourself in the browser; RHELboat does not handle your Red Hat credentials. Choose the RHEL release matching your preparation and the x86_64 architecture used by this VM. Prefer DVD ISO for a self-contained install; Boot ISO needs an additional installation source. Keep the SHA-256 value for that exact release, architecture and ISO type.",
            },
            {
                id: "verify-iso",
                title: "Verify your installation media",
                instruction:
                    "Select your completed .iso download in the VM panel. Paste its matching 64-character SHA-256 value from Red Hat's download page and run verification. Wait for a match before booting. If the values differ, recheck the selected release and ISO type or download again; do not continue with a mismatch.",
            },
            {
                id: "configure-vm",
                title: "Allocate your practice machine",
                instruction:
                    "Use the VM panel to configure a dedicated machine. Start with 2 virtual CPUs, 4096 MiB RAM and a 40 GiB virtual disk; these are training suggestions, not Red Hat's minimum requirements. Install the host's QEMU system emulator, qemu-img and GTK display support first. RHEL 10 x86_64 requires x86-64-v3 CPU features. Compatible KVM hardware is preferred; software emulation is much slower. The app uses only its own virtual disk and does not attach host disks or shared folders.",
            },
            {
                id: "boot-install-media",
                title: "Boot the installer",
                instruction:
                    "Start the VM from the verified ISO. Arrange the QEMU console beside this guide. Choose Test this media & install Red Hat Enterprise Linux from the guest boot menu, and let its media check finish. All installer actions happen in that VM console; the container shell is not the installation target.",
            },
            {
                id: "language-keyboard",
                title: "Set language and keyboard",
                instruction:
                    "In the RHEL welcome screen, select the language and region, then continue to Installation Summary. Open Keyboard to choose your actual layout and test characters you will use in passwords. The installer labels may vary with the RHEL minor release; use the linked version's documentation if a screen differs.",
            },
            {
                id: "destination-storage",
                title: "Plan the destination and storage",
                instruction:
                    "Open Installation Destination and select only the app-created virtual disk, confirming its capacity against the VM panel. For a first install, inspect the automatic layout before accepting it. To practice storage planning, use Custom partitioning to create the required boot partitions and LVM-backed root, home and swap areas, keeping some free space for later exercises. Firmware determines whether an EFI System Partition is needed. Record your choices and review every proposed disk change.",
            },
            {
                id: "software-source",
                title: "Choose installation source and software",
                instruction:
                    "With a DVD ISO, confirm that Installation Source detects the local media. In Software Selection, choose Minimal Install or Server for command-line administration practice. A Boot ISO instead requires a working network and a valid repository source or your entitled Red Hat access. Select the software intentionally rather than accepting an unrelated desktop profile.",
            },
            {
                id: "network-time",
                title: "Configure hostname, network and time",
                instruction:
                    "In Network & Host Name, enable the VM's virtual network interface and inspect its assigned address. Set a training hostname such as rhel-lab.example.test and apply it. Use the VM's user-mode network for this exercise; avoid changing host networking. In Time & Date, choose your region and inspect time synchronization. Write down the hostname, interface and timezone to verify after installation.",
            },
            {
                id: "administrator-account",
                title: "Create your administrative login",
                instruction:
                    "In User Creation, create a dedicated learner account such as trainee and select Make this user administrator. Set a strong practice password directly in the guest installer. Review the root-account setting and keep SELinux protection in place. Do not save credentials in lesson notes, commands or RHELboat. Confirm that you have an administrative login before starting the installation.",
            },
            {
                id: "review-install",
                title: "Review and perform the installation",
                instruction:
                    "Return to Installation Summary and resolve incomplete items. Check destination, storage changes, source, software, hostname, time and account settings against your plan. Begin installation only after confirming that the destination is the app's virtual disk. Let package installation complete without stopping the VM. Registration can be performed separately using your own eligible account and entitlement; RHELboat does not accept terms or register the guest for you.",
            },
            {
                id: "boot-installed-system",
                title: "Start from the installed disk",
                instruction:
                    "When package installation finishes, do not choose Reboot System yet: the installation ISO stays attached and would start again. In the QEMU window press Ctrl+Alt+F2 to open the installer shell, run `poweroff`, then wait for the VM panel to show it is stopped. Choose Boot installed disk so QEMU starts without the ISO attached. Confirm that you reach the new system's login rather than returning to the installer. The virtual disk is persistent; closing RHELboat does not shut down this separate VM process.",
            },
            {
                id: "verify-installed-system",
                title: "Inspect your new RHEL system",
                instruction:
                    "Log in as your learner account in the VM console. Run the commands below there, adapting trainee if you used another name. Confirm the RHEL release, hostname, timezone, filesystems, network state, administrator access, SELinux enforcement and default boot target against your plan. These results are for your own review; the app does not inspect or grade guest configuration.",
                command:
                    "cat /etc/redhat-release; hostnamectl; timedatectl; lsblk -f; findmnt /; nmcli device status; id trainee; sudo -v; getenforce; systemctl get-default",
            },
            {
                id: "prove-persistence",
                title: "Reboot and prove persistence",
                instruction:
                    "Reboot the guest normally, log in again and repeat the checks for hostname, storage mounts, networking and administrative access. Record any mismatch and correct it in the VM. Mark the checkpoints you actually performed and review the guide only after the installed system works again. To stop later, shut down from the guest or request a graceful shutdown from the VM panel and wait for it to stop; do not force-close QEMU during disk writes.",
                command: "sudo systemctl reboot",
            },
        ],
        success:
            "Self-review: your verified ISO produced a bootable RHEL installation on the dedicated virtual disk, and you checked its planned settings again after reboot. Checkpoints record your actions, not an automated installation grade.",
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
        sourceUrl: ex200,
        steps: [
            {
                title: "Locate yourself",
                instruction: "Print your current directory, then inspect the root directory.",
                command: "pwd; ls /",
            },
            {
                title: "Create a workspace",
                instruction: "Create the lab directory and make it your current directory.",
                command: "mkdir -p /root/lab; cd /root/lab",
            },
            {
                title: "Write a note",
                instruction:
                    "Use redirection to write a short note. This replaces this exercise file if it already exists.",
                command: "printf 'enterprise linux\\n' > /root/lab/notes.txt",
            },
            {
                title: "Read it back",
                instruction: "Check the file contents, then use Check work to verify the result.",
                command: "cat /root/lab/notes.txt; ls -l /root/lab/notes.txt",
            },
        ],
        success: "The lab contains /root/lab/notes.txt with enterprise linux in its contents.",
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
        sourceUrl: ex200,
        steps: [
            {
                title: "Create the practice file",
                instruction: "Create a file in the lab directory.",
                command: "mkdir -p /root/lab; printf 'private notes\\n' > /root/lab/private.txt",
            },
            {
                title: "Set the permission bits",
                instruction: "Apply mode 600 to this file only.",
                command: "chmod 600 /root/lab/private.txt",
            },
            {
                title: "Inspect the result",
                instruction: "The numeric mode should be 600 and the symbolic mode should start with -rw-------.",
                command: "stat -c '%a %A %n' /root/lab/private.txt",
            },
        ],
        success: "private.txt is a regular file with permission mode 600.",
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
        sourceUrl: ex200,
        steps: [
            {
                title: "Create the group",
                instruction: "Ensure an operators group exists. The -f option makes this repeatable.",
                command: "groupadd -f operators",
            },
            {
                title: "Create the account",
                instruction: "Inspect an existing trainee account or create it with a home directory.",
                command: "id trainee || useradd -m trainee",
            },
            {
                title: "Add supplementary membership",
                instruction: "Append operators to the user’s supplementary groups.",
                command: "usermod -aG operators trainee",
            },
            {
                title: "Verify the account database",
                instruction:
                    "Inspect trainee’s groups. A new login would be needed for an already running trainee shell to acquire the membership.",
                command: "id trainee; getent group operators",
            },
        ],
        success: "The trainee account exists and belongs to operators.",
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
        sourceUrl: ex200,
        steps: [
            {
                title: "Start a harmless workload",
                instruction: "Run a sleep process in the background. Run this once; extra copies are unnecessary.",
                command: "sleep 3600 >/dev/null 2>&1 &",
            },
            {
                title: "Find the process",
                instruction: "List sleep processes with their command arguments.",
                command: "pgrep -a sleep",
            },
            {
                title: "Read the process table",
                instruction:
                    "Find the sleep entry and compare its PID, parent PID and state. Check work before stopping it.",
                command: "ps -eo pid,ppid,stat,comm",
            },
        ],
        success: "A sleep process is running inside this container.",
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
        sourceUrl: ex200,
        steps: [
            {
                title: "Prepare the source",
                instruction: "Create the note so this exercise also works in a fresh lab.",
                command: "mkdir -p /root/lab; printf 'enterprise linux\\n' > /root/lab/notes.txt",
            },
            {
                title: "Build the archive",
                instruction: "Create a gzip-compressed tar archive of the note.",
                command: "tar -czf /root/lab/backup.tar.gz -C /root/lab notes.txt",
            },
            {
                title: "Inspect before restoring",
                instruction:
                    "List the archive and confirm notes.txt is included. In a real restore, extract into a separate empty directory first.",
                command: "tar -tzf /root/lab/backup.tar.gz",
            },
        ],
        success: "backup.tar.gz is readable and includes notes.txt.",
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
        sourceUrl: ex200,
        steps: [
            {
                title: "Prepare the target",
                instruction: "Create the note used as the link target.",
                command: "mkdir -p /root/lab; printf 'enterprise linux\\n' > /root/lab/notes.txt",
            },
            {
                title: "Create the link",
                instruction: "Create or replace the exercise link named latest.",
                command: "ln -sfn /root/lab/notes.txt /root/lab/latest",
            },
            {
                title: "Compare the paths",
                instruction: "Inspect the stored target and read the note through its new name.",
                command: "readlink /root/lab/latest; cat /root/lab/latest; ls -l /root/lab/latest",
            },
        ],
        success: "latest is a symbolic link to /root/lab/notes.txt.",
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
        sourceUrl: ex200,
        steps: [
            {
                title: "Create a small log",
                instruction: "Write two error records and one informational record into a practice file.",
                command:
                    "mkdir -p /root/lab; printf '%s\\n' 'INFO service started' 'ERROR connection refused' 'ERROR retry exhausted' > /root/lab/errors.log",
            },
            {
                title: "Locate matching records",
                instruction: "Display each line containing the case-sensitive word ERROR.",
                command: "grep -n ERROR /root/lab/errors.log",
            },
            {
                title: "Count the matches",
                instruction:
                    "Confirm two lines match. This exercise checks the file contents, so keep the log after running grep.",
                command: "grep -c ERROR /root/lab/errors.log",
            },
        ],
        success: "errors.log contains exactly two lines matching ERROR.",
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
        sourceUrl: ex200,
        steps: [
            {
                title: "Write the script",
                instruction: "Create a Bash script with one output command.",
                command:
                    "mkdir -p /root/lab; printf '%s\\n' '#!/bin/bash' 'printf \"hello enterprise linux\\n\"' > /root/lab/hello.sh",
            },
            {
                title: "Inspect before executing",
                instruction: "Read the script and check its syntax.",
                command: "cat /root/lab/hello.sh; bash -n /root/lab/hello.sh",
            },
            {
                title: "Allow direct execution",
                instruction: "Grant the owner executable permission.",
                command: "chmod u+x /root/lab/hello.sh",
            },
            {
                title: "Run and check the output",
                instruction:
                    "Execute the script by its full path. It should print hello enterprise linux followed by a newline.",
                command: "/root/lab/hello.sh",
            },
        ],
        success: "hello.sh is executable and prints hello enterprise linux.",
    },
    {
        id: "system-administration",
        title: "Plan a persistent system change",
        topic: "Full-system administration",
        duration: 25,
        objective: "Practice service persistence on a disposable RHEL VM and identify remaining EX200 objectives.",
        explanation:
            "A container is useful for shell practice, but it shares its host’s kernel and does not reproduce the complete boot process. Use your completed RHEL installation VM or another disposable VM for startup, disks, networking and host security. This guide does not automatically grade guest configuration.",
        environment: "vm",
        sourceUrl: ex200,
        steps: [
            {
                title: "Prepare an isolated machine",
                instruction:
                    "Use the RHEL installation lesson's VM or prepare another disposable VM for the exam version you are studying. Back it up with your virtualization tools and confirm console access before changing services. Keep production disks and host networking outside the exercise.",
            },
            {
                title: "Inspect boot and services",
                instruction:
                    "On the VM, inspect the default boot target and the sshd service. Record whether the service is enabled and active; those are separate states.",
                command: "systemctl get-default; systemctl is-enabled sshd; systemctl is-active sshd",
            },
            {
                title: "Verify persistence",
                instruction:
                    "If appropriate for your disposable VM, enable sshd and reboot through the VM console. After startup, confirm the service state and inspect its journal. Never run this exercise on the host.",
                command: "systemctl enable --now sshd; journalctl -u sshd -b --no-pager",
            },
            {
                title: "Build your remaining practice list",
                instruction:
                    "Review the official objectives. Schedule separate VM exercises for storage/LVM/filesystems, repositories, timers, network addressing, firewalld, SSH keys and SELinux. Record evidence after a reboot for each configuration.",
            },
        ],
        success:
            "Self-review: you can explain enabled versus active, prove persistence after reboot, and name the full-system objectives still requiring practice.",
    },
    {
        id: "troubleshooting",
        title: "Investigate a failed service",
        topic: "Diagnostics and troubleshooting",
        duration: 25,
        objective: "Use evidence to narrow a failure before changing configuration.",
        explanation:
            "Good troubleshooting separates symptoms from causes. Form one hypothesis, collect relevant evidence, make one reversible change and compare the result. Startup, kernel and storage recovery need a real disposable VM; this guide has no automatic grading.",
        environment: "vm",
        sourceUrl: ex342,
        steps: [
            {
                title: "Establish a baseline",
                instruction:
                    "Use a snapshotted RHEL VM. Write down the symptom, last known working state and recent changes. Identify whether the failure affects one service or the whole system.",
            },
            {
                title: "Collect service evidence",
                instruction:
                    "Inspect failed units and boot errors. Choose a failed unit and read its own status and journal before restarting it.",
                command: "systemctl --failed; journalctl -b -p err --no-pager",
            },
            {
                title: "Test a hypothesis",
                instruction:
                    "For the selected service, inspect its unit, configuration syntax, listening sockets and permissions. Check SELinux audit records if access is denied. Change only the cause supported by evidence.",
                command: "ss -lntup; df -h; df -i",
            },
            {
                title: "Verify and retain evidence",
                instruction:
                    "Confirm the client-facing behavior, then repeat the check after a VM reboot. Record your cause, fix and validation. Explore sos collection, RPM verification and network tracing as separate follow-up exercises.",
            },
        ],
        success:
            "Self-review: you have a symptom-to-evidence-to-fix record, a working client check and a persistence check. Boot, storage and crash-dump recovery remain separate labs.",
    },
    {
        id: "cloud-infrastructure",
        title: "Trace an OpenStack instance",
        topic: "Cloud infrastructure",
        duration: 25,
        objective: "Explain how identity, networking, compute and storage cooperate to run a workload.",
        explanation:
            "An instance depends on several services. A successful API request does not prove the guest is reachable or its volume is healthy. This guide requires a prepared disposable OpenStack cloud, suitable credentials and a dedicated training project; the local container is not an OpenStack deployment.",
        environment: "multi-node",
        sourceUrl: ex210,
        steps: [
            {
                title: "Identify scope and credentials",
                instruction:
                    "Use an existing isolated training cloud. Select its dedicated project and inspect your assigned roles. Confirm you are using training credentials before issuing any mutating command.",
            },
            {
                title: "Trace compute resources",
                instruction:
                    "List available images, flavors and instances. Choose one training instance and relate its image, flavor, compute host and current state.",
                command: "openstack image list; openstack flavor list; openstack server list",
            },
            {
                title: "Trace network and storage",
                instruction:
                    "Inspect the chosen instance’s ports, network, security groups and attached volumes. Explain the intended guest-to-client route and the backend storing each volume.",
                command: "openstack network list; openstack port list; openstack volume list",
            },
            {
                title: "Diagnose one failed dependency",
                instruction:
                    "With the environment owner, introduce a reversible fault in the dedicated project, then collect relevant events and logs. Restore the setting and validate guest access. Plan separate exercises for control-plane recovery, OVN, telemetry and Heat.",
            },
        ],
        success:
            "Self-review: draw the instance dependency chain and explain how you isolated and restored one failure. This guide does not grade or provision the cloud.",
    },
    {
        id: "services-automation",
        title: "Follow a web request through a server",
        topic: "Services and automation",
        duration: 25,
        objective: "Distinguish application, socket, firewall and SELinux checks for an HTTP service.",
        explanation:
            "A running service can still be inaccessible. Test each layer separately, then automate a known working configuration. Use a disposable RHEL VM and a separate client. Required packages and entitlements depend on your selected exam version.",
        environment: "vm",
        sourceUrl: ex358,
        steps: [
            {
                title: "Prepare a service and client",
                instruction:
                    "In a snapshotted VM with appropriate repositories, install and configure an HTTP service using its product documentation. Decide the intended document root and listening port before changing anything.",
            },
            {
                title: "Inspect locally",
                instruction:
                    "For an Apache exercise, inspect its unit, validate configuration syntax and identify listening sockets. Adapt the unit and config test if you chose NGINX.",
                command: "systemctl status httpd --no-pager; apachectl configtest; ss -lntp",
            },
            {
                title: "Verify client access",
                instruction:
                    "Fetch a known test page from the separate client. If it fails, compare local HTTP access, firewall policy, SELinux contexts and application logs. Keep SELinux enforcing and open only the intended service.",
            },
            {
                title: "Automate and repeat",
                instruction:
                    "Capture the working packages, files, service state and security configuration in an Ansible playbook. Run twice, explain any second-run changes, then verify client access after reboot. DNS, databases and storage services require additional labs.",
            },
        ],
        success:
            "Self-review: a separate client can fetch the intended page after reboot, and you can explain each layer and the second playbook run. No automated VM check is provided.",
    },
    {
        id: "identity-management",
        title: "Trace an IdM login",
        topic: "Identity management",
        duration: 25,
        objective: "Separate identity lookup, Kerberos authentication and access policy.",
        explanation:
            "Finding a user in a directory, obtaining a ticket and being allowed to log in are different operations. IdM also depends on stable DNS and synchronized time. Use prepared disposable IdM server and client VMs; this app does not install or validate that infrastructure.",
        environment: "multi-node",
        sourceUrl: ex362,
        steps: [
            {
                title: "Check prerequisites",
                instruction:
                    "On the prepared client, confirm its fully qualified hostname, name resolution, time synchronization and enrollment in the training realm.",
                command: "hostname -f; timedatectl; realm list",
            },
            {
                title: "Verify identity lookup",
                instruction:
                    "Choose a dedicated training identity. On the enrolled client, run getent passwd USER and id USER, replacing USER with that account. Explain whether the returned identity is local or supplied through SSSD.",
            },
            {
                title: "Verify authentication",
                instruction:
                    "As the training user, obtain a Kerberos ticket using kinit, then inspect it with klist. Do not paste passwords into commands. If ticket acquisition fails, investigate time, DNS, realm and account state.",
            },
            {
                title: "Evaluate access policy",
                instruction:
                    "Inspect the training host’s host-based access and sudo rules on the IdM server. Test an intended allowed login and an intended denied login. Plan follow-up practice for replicas, certificates, vaults and backup restoration.",
            },
        ],
        success:
            "Self-review: distinguish identity lookup, a valid ticket and authorization, and document both an allowed and a denied training login.",
    },
    {
        id: "deployment-management",
        title: "Trace content to a managed host",
        topic: "Deployment and systems management",
        duration: 25,
        objective: "Understand how a Satellite content view controls the packages offered to a host.",
        explanation:
            "Managed content needs a repeatable promotion path. A host should receive an intentional content-view version in a lifecycle environment, rather than an accidental mixture of repositories. This guide needs an entitled disposable Satellite server and managed client.",
        environment: "multi-node",
        sourceUrl: ex403,
        steps: [
            {
                title: "Map the training organization",
                instruction:
                    "In a prepared Satellite training environment, identify the organization, location, products and repositories. Confirm your user role and avoid production subscriptions or hosts.",
            },
            {
                title: "Follow a content version",
                instruction:
                    "Inspect a content view and one published version. Trace which repositories and filters it includes, then identify the lifecycle environment to which it was promoted.",
            },
            {
                title: "Follow host registration",
                instruction:
                    "Inspect a training activation key and its content-view/lifecycle associations. On a registered disposable client, compare the enabled repositories with the intended content.",
                command: "subscription-manager identity; dnf repolist",
            },
            {
                title: "Plan a controlled update",
                instruction:
                    "In the training environment, publish and promote a test content version, refresh the client and compare available updates before applying them. Record a rollback plan. Practice capsules, provisioning and Satellite backup separately.",
            },
        ],
        success:
            "Self-review: explain which published content version the client receives, why it receives it, and how you would stage a change before production.",
    },
    {
        id: "linux-security",
        title: "Investigate an SELinux denial",
        topic: "Linux security",
        duration: 25,
        objective: "Correct a mislabeled training file while retaining SELinux enforcement.",
        explanation:
            "Unix permissions and SELinux policy are separate gates. An access failure can occur even when mode bits look correct. Diagnose the denial and restore an appropriate label instead of weakening enforcement. A dedicated SELinux-enabled RHEL VM is required.",
        environment: "vm",
        sourceUrl: ex415,
        steps: [
            {
                title: "Prepare the VM safely",
                instruction:
                    "Use a snapshotted RHEL VM with SELinux enforcing and a prepared nonproduction web-service exercise. Record the expected URL and file path. Do not change the host’s SELinux configuration.",
                command: "getenforce; sestatus",
            },
            {
                title: "Collect the denial",
                instruction:
                    "Reproduce the training failure once, then inspect recent audit denials. Relate the source process, target path, operation and security contexts.",
                command: "ausearch -m AVC,USER_AVC -ts recent",
            },
            {
                title: "Compare expected labels",
                instruction:
                    "For the exercise file, compare ls -Z output with matchpathcon. Preview a restorecon operation before applying it. A custom document root may require a persistent semanage fcontext rule; use the service documentation to choose it.",
            },
            {
                title: "Verify the smallest correction",
                instruction:
                    "Apply the appropriate persistent labeling correction on the training path, retry the request and verify enforcement remains enabled. Do not generate broad allow rules automatically. Schedule separate AIDE, auditing, encryption and OpenSCAP labs.",
            },
        ],
        success:
            "Self-review: the intended service works with enforcement enabled, and you can explain the denial and persistent label correction.",
    },
    {
        id: "high-availability",
        title: "Reason about a failover cluster",
        topic: "High availability",
        duration: 30,
        objective: "Explain membership, quorum, fencing and resource placement before testing failover.",
        explanation:
            "A cluster needs a reliable way to exclude a failed node before another node assumes access to shared resources. Quorum and fencing solve different problems. Use a purpose-built disposable multi-node environment with working fence devices; this guide does not create one.",
        environment: "multi-node",
        sourceUrl: ex436,
        steps: [
            {
                title: "Draw the topology",
                instruction:
                    "Identify each training node, cluster network, shared storage and fence device. Explain what happens during a network partition. Never attach production storage to this exercise.",
            },
            {
                title: "Inspect cluster state",
                instruction:
                    "On the prepared training cluster, inspect membership, quorum and configured fencing. Confirm that every node can be fenced using the environment’s documented procedure.",
                command: "pcs status; pcs quorum status; pcs stonith config",
            },
            {
                title: "Inspect resource behavior",
                instruction:
                    "List resources and placement constraints. Follow the resource group’s start order and identify its virtual address and storage dependencies.",
                command: "pcs resource config; pcs constraint config",
            },
            {
                title: "Plan and observe failover",
                instruction:
                    "With verified fencing and a recovery plan, follow the environment’s safe node-failure exercise. Observe service availability from a separate client and inspect cluster events. Explain the distinction between a controlled standby transition and a real failure test.",
            },
        ],
        success:
            "Self-review: explain why failover is safe, show the client result, and describe fencing evidence. Shared LVM and GFS2 require additional dedicated labs.",
    },
    {
        id: "performance-tuning",
        title: "Measure before you tune",
        topic: "Performance tuning",
        duration: 25,
        objective: "Identify a bottleneck with a baseline and compare one controlled change.",
        explanation:
            "High utilization alone is not proof of a problem. Define a workload outcome such as latency or throughput, collect a baseline and change one setting at a time. A disposable VM isolates kernel and resource-control experiments from your desktop.",
        environment: "vm",
        sourceUrl: ex442,
        steps: [
            {
                title: "Define the experiment",
                instruction:
                    "Choose a repeatable workload on a disposable RHEL VM. Record VM CPU/memory allocation, dataset, run duration and the application metric you want to improve. Keep the workload identical between runs.",
            },
            {
                title: "Collect a baseline",
                instruction:
                    "Capture CPU/run-queue, memory and storage observations while the workload runs. Install optional measurement tools only from the VM’s configured repositories.",
                command: "uptime; free -h; vmstat 1 5",
            },
            {
                title: "Test a supported hypothesis",
                instruction:
                    "Inspect available tuned profiles and the active profile. Use your evidence to decide whether a profile or resource-limit change is relevant. Record the original setting before making one reversible change.",
                command: "tuned-adm active; tuned-adm list",
            },
            {
                title: "Compare and restore",
                instruction:
                    "Repeat the same workload and compare both application results and resource metrics. Keep a change only when evidence supports it. Restore the original setting if results regress; plan separate PCP, eBPF, NUMA and network-tuning experiments.",
            },
        ],
        success:
            "Self-review: you have comparable before/after measurements, a supported explanation and a rollback record. The app does not grade VM performance.",
    },
];

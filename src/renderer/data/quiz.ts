export interface QuizQuestion {
    id: string;
    pathId: string;
    topic: string;
    topicLabel: string;
    difficulty: "Foundation" | "Advanced" | "Specialist";
    scenario: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    recommendedCommand?: string;
}

export interface QuizConfig {
    target: "current" | "completed" | "rhcsa" | "rhce" | "security" | "all";
    questionCount: 5 | 10 | 15;
    timed: boolean;
}

export const quizQuestions: QuizQuestion[] = [
    // RHCSA - File Navigation & Essentials
    {
        id: "nav-find-mmin",
        pathId: "rhcsa",
        topic: "navigation",
        topicLabel: "File Navigation",
        difficulty: "Foundation",
        scenario: "An incident occurred 20 minutes ago where a rogue process modified files in /etc.",
        question: "Which command lists all regular files in /etc modified in the last 30 minutes?",
        options: [
            "find /etc -type f -mmin -30",
            "find /etc -type f -mtime -30",
            "ls -la --time=30m /etc",
            "locate /etc -modified 30",
        ],
        correctIndex: 0,
        explanation: "-mmin -30 searches for files modified less than 30 minutes ago. -mtime measures in 24-hour days.",
        recommendedCommand: "find /etc -maxdepth 2 -type f -mmin -30",
    },
    {
        id: "nav-tar-exclude",
        pathId: "rhcsa",
        topic: "archive",
        topicLabel: "Archiving & Compression",
        difficulty: "Foundation",
        scenario: "You need to create a gzip-compressed archive of /var/log, but must exclude all .gz files to prevent nesting.",
        question: "Which command achieves this cleanly?",
        options: [
            "tar -czvf /root/logs.tar.gz --exclude='*.gz' /var/log",
            "tar -xzvf /root/logs.tar.gz -skip '*.gz' /var/log",
            "gzip -r /var/log --exclude '*.gz' > /root/logs.tar.gz",
            "zip -r /root/logs.tar.gz /var/log -not '*.gz'",
        ],
        correctIndex: 0,
        explanation: "tar -c (create) -z (gzip) -v (verbose) -f (file) with --exclude pattern creates the compressed tarball without matched files.",
        recommendedCommand: "tar -czvf /tmp/logs.tar.gz --exclude='*.gz' /var/log",
    },

    // RHCSA - Permissions & Ownership
    {
        id: "perm-setgid-dir",
        pathId: "rhcsa",
        topic: "permissions",
        topicLabel: "File Permissions",
        difficulty: "Foundation",
        scenario: "The finance team needs a shared folder /srv/finance where any newly created file automatically inherits the 'finance' group ownership.",
        question: "Which permission bit must you apply to /srv/finance?",
        options: [
            "chmod 2775 /srv/finance (SetGID)",
            "chmod 4775 /srv/finance (SetUID)",
            "chmod 1775 /srv/finance (Sticky Bit)",
            "chmod 0775 /srv/finance --inherit-group",
        ],
        correctIndex: 0,
        explanation: "The SetGID bit (octal 2xxx or g+s) on a directory causes all files created within it to inherit the directory's owning group rather than the creator's primary group.",
        recommendedCommand: "chmod 2775 /srv/finance",
    },
    {
        id: "perm-sticky-bit",
        pathId: "rhcsa",
        topic: "permissions",
        topicLabel: "File Permissions",
        difficulty: "Foundation",
        scenario: "In a world-writable collaboration directory /tmp/collab, users are accidentally deleting colleagues' files.",
        question: "Which command prevents users from deleting or renaming files they do not own?",
        options: [
            "chmod +t /tmp/collab (Sticky Bit)",
            "chmod +s /tmp/collab (SetGID)",
            "chmod 755 /tmp/collab",
            "chown root:nobody /tmp/collab",
        ],
        correctIndex: 0,
        explanation: "The Sticky Bit (+t or octal 1xxx) ensures only the file owner, directory owner, or root can delete or rename files in the directory.",
        recommendedCommand: "chmod +t /tmp/collab",
    },
    {
        id: "perm-umask",
        pathId: "rhcsa",
        topic: "permissions",
        topicLabel: "File Permissions",
        difficulty: "Foundation",
        scenario: "You want newly created files by a daemon user to have default permissions of 640 (rw-r-----).",
        question: "What umask value must be configured for this user?",
        options: [
            "027",
            "026",
            "037",
            "137",
        ],
        correctIndex: 0,
        explanation: "Default base for files is 666. 666 - 027 = 640 (rw-r-----). For directories (base 777), umask 027 results in 750 (rwxr-x---).",
        recommendedCommand: "umask 027",
    },

    // RHCSA - Users & Groups
    {
        id: "user-supplementary-group",
        pathId: "rhcsa",
        topic: "users",
        topicLabel: "User & Group Management",
        difficulty: "Foundation",
        scenario: "Developer 'alex' needs membership in the 'docker' and 'wheel' groups without losing their existing group memberships.",
        question: "Which command safely appends these groups?",
        options: [
            "usermod -aG docker,wheel alex",
            "usermod -g docker,wheel alex",
            "groupadd -u alex docker wheel",
            "useradd -G docker,wheel alex",
        ],
        correctIndex: 0,
        explanation: "usermod -aG appends (-a) supplementary groups (-G). Omitting -a removes the user from any other secondary groups not listed.",
        recommendedCommand: "usermod -aG docker,wheel alex",
    },
    {
        id: "user-password-aging",
        pathId: "rhcsa",
        topic: "users",
        topicLabel: "User & Group Management",
        difficulty: "Foundation",
        scenario: "Enterprise policy mandates that the password for user 'trainee' must expire every 90 days, with a warning 7 days prior.",
        question: "Which command configures these password aging parameters?",
        options: [
            "chage -M 90 -W 7 trainee",
            "passwd -x 90 -w 7 trainee",
            "usermod --max-days 90 --warn 7 trainee",
            "chage -d 90 -w 7 trainee",
        ],
        correctIndex: 0,
        explanation: "chage -M sets maximum password validity days, -W sets warning days before expiration.",
        recommendedCommand: "chage -M 90 -W 7 trainee",
    },

    // RHCSA - Storage & LVM
    {
        id: "storage-lvm-extend",
        pathId: "rhcsa",
        topic: "storage",
        topicLabel: "LVM & Filesystems",
        difficulty: "Foundation",
        scenario: "The XFS filesystem on logical volume /dev/vg_data/lv_app is out of space and you have 20 GiB free in volume group vg_data.",
        question: "Which single command extends the logical volume by 10 GiB and automatically grows the underlying XFS filesystem?",
        options: [
            "lvextend -L +10G -r /dev/vg_data/lv_app",
            "lvresize -L 10G /dev/vg_data/lv_app && resize2fs",
            "lvextend -l +100%FREE /dev/vg_data/lv_app",
            "xfs_growfs +10G /dev/vg_data/lv_app",
        ],
        correctIndex: 0,
        explanation: "lvextend -r (--resizefs) automatically calls the appropriate filesystem resizer (xfs_growfs for XFS or resize2fs for ext4) after resizing the LV.",
        recommendedCommand: "lvextend -L +10G -r /dev/vg_data/lv_app",
    },
    {
        id: "storage-vdo-stratis",
        pathId: "rhcsa",
        topic: "storage",
        topicLabel: "LVM & Filesystems",
        difficulty: "Advanced",
        scenario: "You need to identify the persistent UUID of block device /dev/vdb1 to add it to /etc/fstab safely.",
        question: "Which command outputs the UUID and filesystem type for block devices?",
        options: [
            "blkid /dev/vdb1",
            "lsblk -u /dev/vdb1",
            "fdisk -l /dev/vdb1",
            "findfs /dev/vdb1",
        ],
        correctIndex: 0,
        explanation: "blkid prints block device attributes including UUID, PARTUUID, and TYPE. lsblk -f is another valid approach.",
        recommendedCommand: "blkid /dev/vdb1",
    },

    // RHCSA - Processes & Services
    {
        id: "proc-nice-renice",
        pathId: "rhcsa",
        topic: "processes",
        topicLabel: "Process Management",
        difficulty: "Foundation",
        scenario: "A batch report script running with PID 4510 is consuming excessive CPU cycles on a production database node.",
        question: "Which command reduces its scheduling priority to the lowest possible favorable CPU priority?",
        options: [
            "renice -n 19 -p 4510",
            "renice -n -20 -p 4510",
            "nice -n 19 4510",
            "kill -SIGSTOP 4510",
        ],
        correctIndex: 0,
        explanation: "Nice values range from -20 (highest priority) to 19 (lowest priority / nicest to others). renice -n 19 -p 4510 lowers its priority.",
        recommendedCommand: "renice -n 19 -p 4510",
    },
    {
        id: "services-systemd-mask",
        pathId: "rhcsa",
        topic: "services",
        topicLabel: "Systemd & Services",
        difficulty: "Foundation",
        scenario: "You must ensure that the legacy telnet service can never be started, even as a dependency by another service.",
        question: "Which systemctl command completely prevents the service from being started by linking it to /dev/null?",
        options: [
            "systemctl mask telnet.socket",
            "systemctl disable --now telnet.socket",
            "systemctl stop telnet.socket",
            "systemctl isolate telnet.socket",
        ],
        correctIndex: 0,
        explanation: "systemctl mask links the unit file to /dev/null. Unlike disable, a masked unit cannot be started manually or activated as a dependency.",
        recommendedCommand: "systemctl mask telnet.socket",
    },
    {
        id: "services-systemd-failed",
        pathId: "rhcsa",
        topic: "services",
        topicLabel: "Systemd & Services",
        difficulty: "Foundation",
        scenario: "Several background units failed during system startup after a kernel update.",
        question: "Which command lists all failed systemd units across the system?",
        options: [
            "systemctl --failed",
            "systemctl list-errors",
            "journalctl -p err --units",
            "systemctl status -failed",
        ],
        correctIndex: 0,
        explanation: "systemctl --failed filters the unit list to display only units in a degraded or failed state.",
        recommendedCommand: "systemctl --failed",
    },

    // Security & SELinux (EX415 / RHCSA)
    {
        id: "selinux-context-restore",
        pathId: "security",
        topic: "selinux",
        topicLabel: "SELinux Security",
        difficulty: "Advanced",
        scenario: "You moved a custom web page from /tmp/index.html to /var/www/html/, and Nginx is receiving 403 Forbidden due to SELinux denial.",
        question: "Which command restores the default SELinux context for /var/www/html/index.html according to system policy?",
        options: [
            "restorecon -v /var/www/html/index.html",
            "chcon -t default_t /var/www/html/index.html",
            "setenforce 0",
            "semanage fcontext -d /var/www/html/index.html",
        ],
        correctIndex: 0,
        explanation: "restorecon reads default file context mappings from the SELinux policy database and reapplies them. Moving files (mv) preserves their original context, which causes denials.",
        recommendedCommand: "restorecon -v /var/www/html/index.html",
    },
    {
        id: "selinux-port-label",
        pathId: "security",
        topic: "selinux",
        topicLabel: "SELinux Security",
        difficulty: "Specialist",
        scenario: "Apache HTTPD is configured to listen on custom TCP port 8088, but fails to bind with 'Permission denied' while in Enforcing mode.",
        question: "Which command adds port 8088 to the HTTP port context in SELinux policy?",
        options: [
            "semanage port -a -t http_port_t -p tcp 8088",
            "setsebool -P httpd_port_8088 on",
            "chcon -p 8088 http_port_t",
            "firewall-cmd --add-port=8088/tcp --permanent",
        ],
        correctIndex: 0,
        explanation: "semanage port -a (add) -t <type> -p <proto> <port> labels network ports for SELinux. Firewall rules allow network traffic, but SELinux controls process binding.",
        recommendedCommand: "semanage port -a -t http_port_t -p tcp 8088",
    },

    // Networking & Firewall (RHCSA / Services)
    {
        id: "net-nmcli-static",
        pathId: "services",
        topic: "networking",
        topicLabel: "Network Management",
        difficulty: "Foundation",
        scenario: "You need to configure connection 'enp1s0' with static IP 192.168.1.50/24 and gateway 192.168.1.1 using NetworkManager CLI.",
        question: "Which commands correctly apply this configuration and bring the connection up?",
        options: [
            "nmcli con mod enp1s0 ipv4.addresses 192.168.1.50/24 ipv4.gateway 192.168.1.1 ipv4.method manual && nmcli con up enp1s0",
            "ifconfig enp1s0 192.168.1.50 netmask 255.255.255.0 gateway 192.168.1.1",
            "ip addr add 192.168.1.50/24 dev enp1s0 && ip route add default",
            "nmcli dev connect enp1s0 --static 192.168.1.50/24",
        ],
        correctIndex: 0,
        explanation: "nmcli con mod modifies connection settings persistently. ipv4.method manual is required for static configurations, followed by nmcli con up to activate.",
        recommendedCommand: "nmcli con show",
    },
    {
        id: "net-firewall-permanent",
        pathId: "services",
        topic: "networking",
        topicLabel: "Firewall & Security",
        difficulty: "Foundation",
        scenario: "You opened port 443 with 'firewall-cmd --add-service=https', but after a reboot the service is unreachable.",
        question: "What was missing to ensure the rule survives reboots?",
        options: [
            "The --permanent flag and running 'firewall-cmd --reload'",
            "Saving iptables with 'service iptables save'",
            "Adding the rule to /etc/services",
            "Enabling firewalld.target",
        ],
        correctIndex: 0,
        explanation: "firewall-cmd commands without --permanent only affect runtime state. Use --permanent and firewall-cmd --reload (or omit reload by adding both runtime and permanent).",
        recommendedCommand: "firewall-cmd --permanent --add-service=https && firewall-cmd --reload",
    },

    // RHCE - Diagnostics & Troubleshooting (EX342)
    {
        id: "diag-journalctl-boot",
        pathId: "rhce",
        topic: "diagnostics",
        topicLabel: "Diagnostics & Journal",
        difficulty: "Advanced",
        scenario: "A server crashed and rebooted unexpectedly last night. You need to inspect kernel log entries from the previous boot only.",
        question: "Which command shows systemd journal entries specifically from the boot prior to the current one?",
        options: [
            "journalctl -b -1 -k",
            "journalctl -u kernel --last-boot",
            "dmesg --previous",
            "cat /var/log/dmesg.old",
        ],
        correctIndex: 0,
        explanation: "journalctl -b -1 inspects the previous boot (-b 0 is current, -b -1 is previous), and -k restricts output to kernel messages.",
        recommendedCommand: "journalctl -b -1 -k",
    },
    {
        id: "diag-network-ss",
        pathId: "rhce",
        topic: "diagnostics",
        topicLabel: "Diagnostics & Network",
        difficulty: "Advanced",
        scenario: "A customer reports port 3306 is not accepting connections. You need to check if mysqld is actively listening on TCP ports and view its PID.",
        question: "Which modern command displays listening TCP sockets along with numeric ports and associated process names?",
        options: [
            "ss -tulpn",
            "netstat -l",
            "lsof -i tcp",
            "ip sock --listening",
        ],
        correctIndex: 0,
        explanation: "ss (socket statistics) -t (TCP) -u (UDP) -l (listening) -p (process) -n (numeric) replaces netstat in Enterprise Linux.",
        recommendedCommand: "ss -tulpn",
    },

    // Scripting & Text Processing (RHCSA)
    {
        id: "script-awk-column",
        pathId: "rhcsa",
        topic: "text",
        topicLabel: "Text Processing",
        difficulty: "Foundation",
        scenario: "You need to extract usernames (field 1) and login shells (field 7) from /etc/passwd separated by a colon.",
        question: "Which awk command prints fields 1 and 7 from /etc/passwd?",
        options: [
            "awk -F: '{print $1, $7}' /etc/passwd",
            "cut -d: -f 1-7 /etc/passwd",
            "grep -o ':.*:' /etc/passwd",
            "sed 's/:/ /g' /etc/passwd | print $1 $7",
        ],
        correctIndex: 0,
        explanation: "awk -F: sets the field separator to colon and {print $1, $7} outputs the first and seventh columns.",
        recommendedCommand: "awk -F: '{print $1, $7}' /etc/passwd | head -n 5",
    },
    {
        id: "script-exit-code",
        pathId: "rhcsa",
        topic: "scripting",
        topicLabel: "Shell Scripting",
        difficulty: "Foundation",
        scenario: "In an automated backup script, you must check whether the previous command succeeded before continuing.",
        question: "Which special variable holds the exit status code of the immediately preceding command?",
        options: [
            "$?",
            "$#",
            "$$",
            "$!",
        ],
        correctIndex: 0,
        explanation: "$? contains the exit code of the last executed command (0 for success, non-zero for errors). $$ is current PID, $# is argument count, $! is background job PID.",
        recommendedCommand: "echo $?",
    },
];


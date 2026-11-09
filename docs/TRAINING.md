# Workbook topic coverage

The catalog groups original practice by subject. It uses the local Linux PDFs without bundling them. Page numbers are physical PDF pages. Each step has a feature explanation and rationale; command examples are optional. Container results are checked, while VM work uses self-reported checkpoints.

## Getting started

| Topic                                    | Practice           | Sources                                                                                                                                                                                          |
| ---------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Install RHEL from the official ISO       | VM · self-reported | System Administration II workbook, Chapter 10 · Interactive installation, PDF 303–310<br>RHEL 10 administration study guide · Asghar Ghori, Chapter 1 · Local installation, PDF 45–87            |
| Find your way around the shell           | Checked container  | System Administration I workbook, Chapters 2–3 · Command line and file hierarchy, PDF 31–115                                                                                                     |
| Find an option using local help          | Checked container  | System Administration I workbook, Chapter 4 · Read manual pages, PDF 117–133                                                                                                                     |
| Inspect the system and shell environment | Checked container  | System Administration I workbook, Chapter 5 · Change the shell environment, PDF 152–161<br>RHEL 10 administration study guide · Asghar Ghori, Chapter 2 · Initial system interaction, PDF 88–122 |

## Files & text

| Topic                                 | Practice          | Sources                                                                                                                                                                               |
| ------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create a symbolic link                | Checked container | System Administration I workbook, Chapter 3 · Links between files, PDF 90–95                                                                                                          |
| Create and inspect a backup archive   | Checked container | System Administration I workbook, Chapter 13 · Compressed tar archives, PDF 462–468                                                                                                   |
| Filter a log with grep                | Checked container | System Administration I workbook, Chapter 5 · Redirection and pipelines, PDF 136–145<br>System Administration II workbook, Chapter 1 · Pattern matching, PDF 35–44                    |
| Locate files by name and type         | Checked container | System Administration I workbook, Chapter 15 · Locate files, PDF 542–551<br>RHEL 10 administration study guide · Asghar Ghori, Chapter 4 · File searching, PDF 166–182                |
| Edit and inspect a configuration file | Checked container | System Administration I workbook, Chapter 5 · Edit text files, PDF 146–151<br>RHEL 10 administration study guide · Asghar Ghori, Chapter 3 · File management and editing, PDF 123–165 |

## Users & permissions

| Topic                                 | Practice          | Sources                                                                                                                                                                                |
| ------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add a user to an operations group     | Checked container | System Administration I workbook, Chapter 6 · Local accounts and groups, PDF 171–215                                                                                                   |
| Keep a file private                   | Checked container | System Administration I workbook, Chapter 7 · Access to files, PDF 217–248                                                                                                             |
| Build a group collaboration directory | Checked container | System Administration I workbook, Chapter 7 · Default permissions and special bits, PDF 233–242                                                                                        |
| Apply account password aging          | Checked container | System Administration I workbook, Chapter 6 · Manage passwords, PDF 201–208<br>RHEL 10 administration study guide · Asghar Ghori, Chapter 6 · Advanced account management, PDF 216–239 |

## Shell & processes

| Topic                                 | Practice           | Sources                                                                                                                                                                        |
| ------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Inspect a background process          | Checked container  | System Administration I workbook, Chapter 8 · Processes and jobs, PDF 249–295                                                                                                  |
| Write your first executable script    | Checked container  | System Administration II workbook, Chapter 1 · Bash scripts, PDF 20–34<br>RHEL 10 administration study guide · Asghar Ghori, Chapter 8 · Bash scripting, PDF 274–300           |
| Combine a loop with a condition       | Checked container  | System Administration II workbook, Chapter 1 · Loops and conditionals, PDF 27–34<br>RHEL 10 administration study guide · Asghar Ghori, Chapter 8 · Bash scripting, PDF 274–300 |
| Schedule and observe a recurring task | VM · self-reported | System Administration II workbook, Chapter 2 · Future tasks and temporary files, PDF 53–81                                                                                     |

## Software management

| Topic                                      | Practice           | Sources                                                                                                                                                                                         |
| ------------------------------------------ | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Install and verify an RPM package          | VM · self-reported | System Administration I workbook, Chapter 14 · RPM and DNF, PDF 493–528<br>RHEL 10 administration study guide · Asghar Ghori, Chapter 10 · Basic package management, PDF 328–351                |
| Inspect repository and package selection   | VM · self-reported | System Administration I workbook, Chapter 14 · Enable repositories, PDF 515–522<br>RHEL 10 administration study guide · Asghar Ghori, Chapter 11 · Repositories and package groups, PDF 352–380 |
| Compare Flatpak apps, runtimes and remotes | VM · self-reported | RHEL 10 administration study guide · Asghar Ghori, Chapter 12 · Flatpak application management, PDF 381–405                                                                                     |

## Services & startup

| Topic                                    | Practice           | Sources                                                                                                                                                                                    |
| ---------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Create a small systemd service           | VM · self-reported | System Administration I workbook, Chapter 9 · Services and dependencies, PDF 297–319<br>RHEL 10 administration study guide · Asghar Ghori, Chapter 14 · System initialization, PDF 437–479 |
| Correlate journal events and system time | VM · self-reported | System Administration I workbook, Chapter 11 · Logs and time, PDF 357–398<br>RHEL 10 administration study guide · Asghar Ghori, Chapter 19 · Name resolution and time, PDF 616–639         |
| Trace startup and plan recovery          | VM · self-reported | System Administration II workbook, Chapter 8 · Boot targets and recovery, PDF 245–273<br>RHEL 10 administration study guide · Asghar Ghori, Chapter 13 · Boot and kernel, PDF 406–436      |
| Review an automated installation plan    | VM · self-reported | System Administration II workbook, Chapter 10 · Kickstart installation, PDF 311–322                                                                                                        |

## Storage & filesystems

| Topic                                 | Practice                     | Sources                                                                                                                                                                           |
| ------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mount a filesystem by stable identity | VM · self-reported           | System Administration I workbook, Chapter 15 · Devices and mounts, PDF 530–541<br>System Administration II workbook, Chapter 5 · Basic storage, PDF 151–181                       |
| Build and extend a logical volume     | VM · self-reported           | System Administration II workbook, Chapter 6 · Storage stack, PDF 183–218<br>RHEL 10 administration study guide · Asghar Ghori, Chapters 15–16 · LVM and filesystems, PDF 480–555 |
| Inspect and add temporary swap        | VM · self-reported           | System Administration II workbook, Chapter 5 · Swap, PDF 165–181<br>RHEL 10 administration study guide · Asghar Ghori, Chapter 16 · Swap, PDF 517–555                             |
| Mount a share on demand with AutoFS   | Multiple VMs · self-reported | System Administration II workbook, Chapter 7 · NFS and automounting, PDF 219–243<br>RHEL 10 administration study guide · Asghar Ghori, Chapter 18 · NFS and AutoFS, PDF 588–615   |
| Inspect an encrypted training volume  | VM · self-reported           | Legacy diagnostic practice notes, Encrypted volume scenario · topic adaptation, PDF 1–1                                                                                           |

## Networking & remote access

| Topic                                 | Practice                     | Sources                                                                                                                                                                               |
| ------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trace addressing, routes and DNS      | VM · self-reported           | System Administration I workbook, Chapter 12 · Networking and name resolution, PDF 399–459<br>RHEL 10 administration study guide · Asghar Ghori, Chapter 17 · Networking, PDF 556–587 |
| Establish and validate SSH key access | Multiple VMs · self-reported | System Administration I workbook, Chapter 10 · SSH, PDF 321–356<br>RHEL 10 administration study guide · Asghar Ghori, Chapter 20 · Secure Shell, PDF 640–660                          |
| Transfer and compare a file securely  | Multiple VMs · self-reported | System Administration I workbook, Chapter 13 · Secure transfer and synchronization, PDF 469–486                                                                                       |

## System security

| Topic                                         | Practice                     | Sources                                                                                                                                                               |
| --------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Diagnose a file-context mismatch              | VM · self-reported           | System Administration II workbook, Chapter 4 · SELinux, PDF 113–149<br>RHEL 10 administration study guide · Asghar Ghori, Chapter 22 · SELinux, PDF 681–712           |
| Compare runtime and persistent firewall rules | Multiple VMs · self-reported | System Administration II workbook, Chapter 9 · Network security, PDF 275–302<br>RHEL 10 administration study guide · Asghar Ghori, Chapter 21 · Firewall, PDF 661–680 |

## Operations & troubleshooting

| Topic                                        | Practice                     | Sources                                                                                                                                                                                                |
| -------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Run and inspect a rootless container         | VM · self-reported           | System Administration II workbook, Chapter 11 · Containers, storage and services, PDF 337–398                                                                                                          |
| Measure before choosing a tuning profile     | VM · self-reported           | System Administration II workbook, Chapter 3 · Tuning and scheduling, PDF 83–111<br>Legacy diagnostic practice notes, Performance archive scenario · topic adaptation, PDF 5–5                         |
| Investigate a fault using evidence           | VM · self-reported           | System Administration I workbook, Chapter 16 · Analyze servers and get support, PDF 559–592<br>Legacy diagnostic practice notes, Service, filesystem and support scenarios · topic adaptation, PDF 1–8 |
| Separate identity lookup from authentication | VM · self-reported           | Legacy diagnostic practice notes, Identity and login scenarios · topic adaptation, PDF 2–2<br>System Administration I workbook, Chapters 6 and 10 · Accounts and SSH, PDF 171–215                      |
| Trace an application’s missing resource      | VM · self-reported           | Legacy diagnostic practice notes, Application and package scenarios · topic adaptation, PDF 3–6                                                                                                        |
| Trace an iSCSI discovery and login           | Multiple VMs · self-reported | Legacy diagnostic practice notes, iSCSI authentication scenario · topic adaptation, PDF 2–2                                                                                                            |

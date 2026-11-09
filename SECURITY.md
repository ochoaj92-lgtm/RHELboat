# RHELboat security policy

Security reports for this project belong with the RHELboat maintainers. Do not post exploit details, credentials, or sensitive logs in public issues.

If private vulnerability reporting is enabled for this repository, use [Report a vulnerability](https://github.com/ochoaj92-lgtm/RHELboat/security/advisories/new). If that option is unavailable, open an issue asking for a private reporting channel without including vulnerability details.

A useful private report includes the affected version, environment, reproduction steps, expected boundary, and observed impact. Share only the minimum information needed to reproduce the problem, using a disposable lab and sanitized data.

The active security boundaries include the Electron preload API, container ownership checks, runtime selection, host isolation, and lab lifecycle. Containers share the host kernel; use disposable VMs or separate infrastructure for the full-system exercises identified in the app. The lab should never mount host directories or the runtime socket, or request privileged execution.

Keep your app, container runtime, and host system updated. There is no separate long-term support branch; report the affected version so maintainers can assess it.

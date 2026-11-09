#!/bin/sh
# RHELboat launcher for Arch Linux using system electron
ELECTRON=/usr/bin/electron
if [ ! -x "$ELECTRON" ]; then
    # Fallback to versioned electron binaries if default alias isn't set
    for candidate in /usr/bin/electron[0-9]*; do
        if [ -x "$candidate" ]; then
            ELECTRON="$candidate"
            break
        fi
    done
fi

exec "$ELECTRON" /usr/lib/rhelboat "$@"

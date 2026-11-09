#!/usr/bin/env bash
# RHELboat: Helper script to export and import the lab image for offline/air-gapped practice.
set -euo pipefail

IMAGE="localhost/rhelboat-lab:v1"
ARCHIVE="${2:-rhelboat-lab-v1.tar}"

usage() {
    echo "Usage: $0 [export|import] [archive-path.tar] [runtime: podman|docker]"
    echo ""
    echo "Commands:"
    echo "  export [path.tar]   Save the built lab image to a tarball archive"
    echo "  import [path.tar]   Load a saved lab image tarball into your local runtime"
    exit 1
}

if [ $# -lt 1 ]; then
    usage
fi

COMMAND="$1"
RUNTIME="${3:-}"

# Detect runtime if not explicitly provided
if [ -z "$RUNTIME" ]; then
    if command -v podman >/dev/null 2>&1; then
        RUNTIME="podman"
    elif command -v docker >/dev/null 2>&1; then
        RUNTIME="docker"
    else
        echo "Error: Neither podman nor docker was found in PATH." >&2
        exit 1
    fi
fi

case "$COMMAND" in
    export)
        echo "Exporting $IMAGE from $RUNTIME to $ARCHIVE..."
        "$RUNTIME" save -o "$ARCHIVE" "$IMAGE"
        echo "Image exported successfully to $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"
        ;;
    import)
        if [ ! -f "$ARCHIVE" ]; then
            echo "Error: Archive file '$ARCHIVE' does not exist." >&2
            exit 1
        fi
        echo "Importing $ARCHIVE into $RUNTIME..."
        "$RUNTIME" load -i "$ARCHIVE"
        echo "Image successfully imported to $IMAGE in $RUNTIME."
        ;;
    *)
        usage
        ;;
esac


<template>
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.65"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
    >
        <path :d="paths[name] || paths.book" />
    </svg>
</template>
<script setup lang="ts">
defineProps<{ name: string }>();
const paths: Record<string, string> = {
    terminal: "M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 5 3 3-3 3m6 0h4",
    book: "M5 4h13a1 1 0 0 1 1 1v14H6a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2Zm-2 12a2 2 0 0 1 2-2h14M8 8h7m-7 3h5",
    grid: "M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z",
    chart: "M4 4v16h16M7 14l4-4 4 2 5-7m-4 0h4v4",
    settings: "M4 6h7m4 0h5M4 12h2m4 0h10M4 18h11m4 0h1M11 3v6M6 9v6m9 0v6",
    arrow: "M4 12h16m-6-6 6 6-6 6",
    chevron: "m9 5 7 7-7 7",
    check: "m5 12 4 4L19 6",
    clock: "M12 8v4l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
    external: "M14 3h7v7m0-7L11 13M10 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6",
    reset: "M3 10a9 9 0 1 1 2 8M3 4v6h6",
    shield: "m12 2 8 4v7c0 4-5 7-8 9-3-2-8-5-8-9V6l8-4Zm-4 10 3 3 5-6",
    search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm6-2 4 4",
    copy: "M9 8h11v13H9V8Zm-5 8H3V3h11v1",
    play: "m8 4 13 8-13 8V4Z",
    info: "M12 11v6m0-10v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
    cloud: "M7 18a5 5 0 1 1 0-10 6 6 0 0 1 11-1 5 5 0 0 1 0 11H7Zm2-5h6m-3-3v6",
    layers: "m12 3 10 5-10 5L2 8l10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5",
    key: "M14 3a7 7 0 0 0-6 10l-5 5v3h4v-3h3l3-3a7 7 0 1 0 1-12Zm3 4h.01",
    package: "m12 2 9 5v10l-9 5-9-5V7l9-5Zm-9 5 9 5 9-5M12 12v10M7 5l10 5",
    cluster: "M9 3h6v5H9V3ZM2 16h6v5H2v-5Zm14 0h6v5h-6v-5ZM12 8v4m-7 4v-4h14v4",
    compass: "m16 8-2 6-6 2 2-6 6-2ZM22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
};
</script>

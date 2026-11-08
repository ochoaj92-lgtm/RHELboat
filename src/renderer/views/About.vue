<template>
    <section class="utility-page">
        <img src="/img/rhelboat.svg" alt="RHELboat sailboat and terminal mark" width="96" height="96" />
        <div class="eyebrow">ENTERPRISE LINUX TRAINING LAB</div>
        <h1>RHELboat</h1>
        <p>Enterprise Linux practice, one command at a time.</p>
        <p>Version {{ appVer }} · Guided lessons and isolated local container labs.</p>
        <p>Independent community project. Not affiliated with or endorsed by Red Hat.</p>
    </section>
</template>

<script setup lang="ts">
const appVer = import.meta.env.VITE_APP_VERSION;
</script>

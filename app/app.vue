<script setup lang="ts">
useSeoMeta({
 title: 'Kick.com Clip Downloader | Save & Grab Clips Fast',
 description: 'The fastest way to download clips from Kick.com. Easily save, grab, and share your favorite Kick stream highlights in high quality.'
})
</script>

<template>
 <div>
 <NuxtLoadingIndicator :throttle="0" />
 <BackToTop />
 <NuxtPage />
 </div>
</template>
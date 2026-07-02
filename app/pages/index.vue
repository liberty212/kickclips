<script setup lang="ts">
useSeoMeta({
  title: SITE.name,
  description: SITE.description,
  // Open Graph
  ogType: SEO.og.type as MaybeRef,
  ogTitle: SEO.og.title,
  ogDescription: SEO.og.description,
  ogUrl: SEO.og.url,
  ogImage: SEO.og.image,
  // Twitter
  twitterCard: SEO.twitter.card as MaybeRef,
  twitterTitle: SEO.twitter.title,
  twitterDescription: SEO.twitter.description
});

useHead({
  link: [
    { rel: "canonical", href: SITE.url }
  ],
  script: [{
    type: "application/ld+json",
    innerHTML: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": SITE.name,
      "url": SITE.url
    })
  }]
});

const { query } = useRoute();
const queryParams = query as { channel?: string, id: string };
</script>

<template>
  <main class="text-white">
    <div id="home" class="text-center container overflow-hidden">
      <div class="my-5">
        <SearchChannelInput :align="'end'" class="mb-4" />
        <img class="mb-4" src="/kickclips-logo.png" style="width: 350px;">
        <h3 class="mb-4" style="color: #10b981 !important;">Ultimate Kick Clip Tool</h3>
        <h5 class="mb-4 text-emerald-600">Download Free HD Clips From kick.com.</h5>
        <DownloadClip :channel="queryParams.channel" :clip-id="queryParams.id" />
        <DownloadGuide />
      </div>
    </div>
  </main>
</template>

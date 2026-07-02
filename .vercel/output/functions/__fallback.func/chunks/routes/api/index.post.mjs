import { d as defineEventHandler, b as readBody, u as useRuntimeConfig, R as RESOURCES, S as SITE } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'vue';
import '@iconify/utils';
import 'consola';
import 'fast-xml-parser';

const index_post = defineEventHandler(async (event) => {
  const { url } = await readBody(event);
  const config = useRuntimeConfig(event);
  const kickToken = config.kickToken;
  const idRegex = /^https?:\/\/kick\.com\/[^\\/]+(?:\/clips\/(clip_\w+)|\?clip=(clip_\w+))(?:&.*|\?.*)?$/;
  const match = idRegex.exec(url);
  if (!match) return null;
  const id = match[1] || match[2];
  console.info(`Downloading clip URL: ${url}`);
  const triggerTmp = await $fetch(`${RESOURCES.apiV2}/clips/${id}/download`, {
    headers: {
      "User-Agent": SITE.userAgent,
      "Authorization": `Bearer ${kickToken}`
    }
  }).catch((e) => {
    console.info("API v2 download failed:", e.message);
    return null;
  });
  if (triggerTmp == null ? void 0 : triggerTmp.url) {
    console.info("Downloaded using API v2");
    return { url: triggerTmp.url };
  }
  const worker = await $fetch(`${RESOURCES.worker}/kick/clip`, {
    query: { url }
  }).catch(() => null);
  if (worker == null ? void 0 : worker.url) {
    console.info("Downloaded using worker");
    return { url: worker.url };
  }
  return null;
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map

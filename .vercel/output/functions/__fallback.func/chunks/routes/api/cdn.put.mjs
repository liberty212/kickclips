import { d as defineEventHandler, u as useRuntimeConfig, r as readFormData, R as RESOURCES } from '../../nitro/nitro.mjs';
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

const cdn_put = defineEventHandler(async (event) => {
  const { cloudflare } = event.context;
  const config = useRuntimeConfig(event);
  const fd = await readFormData(event);
  fd.append("prefix", "tmp/videos/kick");
  fd.append("httpMetadata", JSON.stringify({
    "Content-Type": "video/mp4",
    "Content-Disposition": "inline",
    "Cache-Control": "public, max-age=86400"
  }));
  if (!config.cdnToken || false) {
    return null;
  }
  const cdn = async () => {
    return await $fetch(`${RESOURCES.worker}/cdn`, {
      method: "PUT",
      headers: { "x-cdn-auth": config.cdnToken },
      body: fd
    }).catch(() => null);
  };
  cloudflare.context.waitUntil(cdn());
  return null;
});

export { cdn_put as default };
//# sourceMappingURL=cdn.put.mjs.map

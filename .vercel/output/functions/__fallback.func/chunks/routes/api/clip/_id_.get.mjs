import { d as defineEventHandler, g as getRouterParams, u as useRuntimeConfig, R as RESOURCES, S as SITE } from '../../../nitro/nitro.mjs';
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

const _id__get = defineEventHandler(async (event) => {
  const { id } = getRouterParams(event);
  const config = useRuntimeConfig(event);
  const kickToken = config.kickToken;
  const data = await $fetch(`${RESOURCES.apiV2}/clips/${id}`, {
    headers: {
      "User-Agent": SITE.userAgent,
      "Authorization": `Bearer ${kickToken}`
    }
  }).catch(() => null);
  return data;
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map

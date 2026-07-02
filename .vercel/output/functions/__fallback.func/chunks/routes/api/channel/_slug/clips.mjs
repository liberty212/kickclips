import { d as defineEventHandler, g as getRouterParams, a as getQuery, u as useRuntimeConfig, R as RESOURCES, S as SITE } from '../../../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'entities/decode';
import 'estree-walker';
import 'source-map-js';
import '@iconify/utils';
import 'consola';
import 'fast-xml-parser';

const clips = defineEventHandler(async (event) => {
  const { slug } = getRouterParams(event);
  const { sort, time } = getQuery(event);
  const config = useRuntimeConfig(event);
  const kickToken = config.kickToken;
  const data = await $fetch(`${RESOURCES.apiV2}/channels/${slug}/clips`, {
    query: { sort, time },
    headers: {
      "User-Agent": SITE.userAgent,
      "Authorization": `Bearer ${kickToken}`
    }
  }).catch(() => null);
  return data;
});

export { clips as default };
//# sourceMappingURL=clips.mjs.map

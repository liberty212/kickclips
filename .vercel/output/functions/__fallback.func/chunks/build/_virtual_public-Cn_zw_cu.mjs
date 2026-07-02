import { e as __nuxt_component_0$1, _ as __nuxt_component_1$1, g as useNuxtApp } from './server.mjs';
import { defineComponent, ref, watch, resolveDirective, unref, mergeProps, withCtx, createVNode, toDisplayString, openBlock, createBlock, createCommentVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderClass, ssrRenderAttr, ssrRenderStyle, ssrGetDirectiveProps, ssrRenderComponent, ssrRenderList, ssrInterpolate } from 'vue/server-renderer';
import { watchDebounced } from '@vueuse/core';
import { p as publicAssetsURL } from '../nitro/nitro.mjs';

const formatTime = (durationSeconds) => {
  const minutes = Math.floor(durationSeconds / 60).toString().padStart(2, "0");
  const seconds = (durationSeconds % 60).toString().padStart(2, "0");
  const formattedTime = minutes + ":" + seconds;
  return formattedTime;
};
const formatViews = (views) => {
  if (views >= 1e6) {
    return (views / 1e6).toFixed(1) + "M";
  } else if (views >= 1e3) {
    return (views / 1e3).toFixed(1) + "K";
  } else {
    return views.toString();
  }
};
const getDate = (datetime) => {
  const date = new Date(datetime);
  const isoDate = date.toISOString().split("T")[0];
  const time = date.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: true });
  const formattedDate = `${isoDate}, ${time}`;
  return formattedDate;
};
const processClip = async (playlist, id) => {
  const baseUrl = playlist.replace("/playlist.m3u8", "");
  const m3u8Data = await $fetch(playlist, { responseType: "text" }).catch(() => null);
  const rangeRegex = /#EXT-X-BYTERANGE:(\d+)@(\d+)/g;
  const fileRegex = /(\w+\.ts)/g;
  const segments = Array.from(m3u8Data.matchAll(rangeRegex)).map((match) => ({
    file: "",
    start: Number(match[2]),
    end: Number(match[2]) + Number(match[1])
  }));
  segments.forEach((segment, index) => {
    const match = m3u8Data.match(fileRegex);
    if (match) {
      const fileMatch = match[index];
      if (fileMatch) {
        const file = fileMatch.trim();
        segment.file = file;
      }
    }
  });
  const streams = await Promise.all(segments.map(async (seg) => {
    const rangeBytes = `bytes=${seg.start}-${seg.end}`;
    const response = await $fetch(`${baseUrl}/${seg.file}`, { responseType: "stream", headers: { Range: rangeBytes } }).catch(() => null);
    return response;
  }));
  const combinedStream = new ReadableStream({
    async start(controller) {
      for (const stream of streams) {
        if (stream) {
          const reader = stream.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        }
      }
      controller.close();
    }
  });
  const combinedBlob = await new Response(combinedStream).arrayBuffer();
  const { $ffmpeg } = useNuxtApp();
  const unpkg = "https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.9/dist/esm";
  try {
    $ffmpeg.on("log", ({ message }) => {
      console.info(message);
    });
    await $ffmpeg.load({
      coreURL: await $ffmpeg.toBlobURL(`${unpkg}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await $ffmpeg.toBlobURL(`${unpkg}/ffmpeg-core.wasm`, "application/wasm"),
      workerURL: await $ffmpeg.toBlobURL(`${unpkg}/ffmpeg-core.worker.js`, "text/javascript")
    });
    console.info("FFmpeg loaded");
    await $ffmpeg.writeFile(`${id}.ts`, new Uint8Array(combinedBlob));
    console.info("File has been written");
    const timeout = await $ffmpeg.exec(["-i", `${id}.ts`, "-preset", "ultrafast", "-threads", "5", `${id}.mp4`], 12e4);
    if (timeout) return null;
    console.info("Successful transformation");
    const data = await $ffmpeg.readFile(`${id}.mp4`);
    console.info("File has been read");
    return new Blob([data], { type: "video/mp4" });
  } catch (e) {
    console.info(e);
    return null;
  }
};
const searchChannel = async (text) => {
  const data = await $fetch("https://search.kick.com/multi_search", {
    method: "POST",
    headers: {
      "X-Typesense-Api-Key": "nXIMW0iEN6sMujFYjFuhdrSwVow3pDQu"
    },
    body: {
      searches: [
        { preset: "channel_search", q: text }
      ]
    }
  }).catch(() => null);
  return data?.results?.[0]?.hits.map((hit) => ({
    ...hit?.document
  })) || [];
};
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "SearchChannelInput",
  __ssrInlineRender: true,
  props: {
    align: {}
  },
  setup(__props) {
    const channel = ref("");
    const channelResults = ref([]);
    const searching = ref(false);
    const loading = ref(false);
    watch(channel, () => {
      searching.value = true;
    });
    watchDebounced(channel, async () => {
      if (!channel.value) {
        channelResults.value = [];
        loading.value = false;
        searching.value = false;
        return;
      }
      loading.value = true;
      channelResults.value = await searchChannel(channel.value);
      searching.value = false;
      loading.value = false;
    }, { debounce: 500 });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Icon = __nuxt_component_0$1;
      const _component_NuxtLink = __nuxt_component_1$1;
      const _directive_ripple = resolveDirective("ripple");
      _push(`<form${ssrRenderAttrs(_attrs)}><div class="${ssrRenderClass([`justify-content-md-${__props.align || "center"}`, "d-flex justify-content-center"])}"><div class="d-flex position-relative"><input id="search"${ssrRenderAttr("value", unref(channel))} class="form-control search-input" type="text" placeholder="Search channel clips" style="${ssrRenderStyle({ "max-width": "200px" })}" autocomplete="off"><button${ssrRenderAttrs(mergeProps({
        id: "download",
        type: "submit",
        class: "col-3 col-lg-2 col-sm-4 btn fw-bold d-flex align-items-center justify-content-center",
        style: { "background-color": "#10b981 !important", "border-color": "#10b981 !important", "color": "white !important" }
      }, ssrGetDirectiveProps(_ctx, _directive_ripple)))}>`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "ph:magnifying-glass-bold",
        size: "1.2em"
      }, null, _parent));
      _push(`</button>`);
      if (unref(channelResults).length || unref(searching)) {
        _push(`<div class="position-absolute border border-secondary rounded-1 overflow-hidden w-100" style="${ssrRenderStyle({ "top": "45px" })}"><ul class="list-group w-100 bg-dark">`);
        if (unref(searching)) {
          _push(ssrRenderComponent(_component_Icon, {
            name: "eos-icons:loading",
            class: "m-2 align-self-center",
            size: "1.4em"
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(unref(channelResults), (result) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: result.slug,
            to: `/${result.slug}`,
            class: "text-decoration-none"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<li class="list-group-item list-group-item-action list-group-item-dark d-flex align-items-center gap-2"${_scopeId}><span${_scopeId}>${ssrInterpolate(result.username || result.slug)}</span>`);
                if (result.verified) {
                  _push2(ssrRenderComponent(_component_Icon, {
                    name: "ph:check-circle-fill",
                    class: "text-primary"
                  }, null, _parent2, _scopeId));
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</li>`);
              } else {
                return [
                  createVNode("li", { class: "list-group-item list-group-item-action list-group-item-dark d-flex align-items-center gap-2" }, [
                    createVNode("span", null, toDisplayString(result.username || result.slug), 1),
                    result.verified ? (openBlock(), createBlock(_component_Icon, {
                      key: 0,
                      name: "ph:check-circle-fill",
                      class: "text-primary"
                    })) : createCommentVNode("", true)
                  ])
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></ul></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></form>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/SearchChannelInput.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_0 = Object.assign(_sfc_main$1, { __name: "SearchChannelInput" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "LoadingSpinner",
  __ssrInlineRender: true,
  props: {
    text: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "d-flex justify-content-center align-items-center" }, _attrs))}><div class="spinner-border spinner-lg" role="status"><span class="visually-hidden">Loading...</span></div><span class="ms-2">${ssrInterpolate(__props.text || "Processing...")}</span></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/LoadingSpinner.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main, { __name: "LoadingSpinner" });
const _imports_0 = publicAssetsURL("/kickclips-logo.png");

export { __nuxt_component_0 as _, _imports_0 as a, formatViews as b, __nuxt_component_1 as c, formatTime as f, getDate as g, processClip as p };
//# sourceMappingURL=_virtual_public-Cn_zw_cu.mjs.map

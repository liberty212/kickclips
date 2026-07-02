import { _ as __nuxt_component_0, a as _imports_0$1, c as __nuxt_component_1$1, f as formatTime, g as getDate, p as processClip } from './_virtual_public-Cn_zw_cu.mjs';
import { b as useSeoMeta, d as useHead, u as useRoute, f as _export_sfc, e as __nuxt_component_0$1 } from './server.mjs';
import { defineComponent, mergeProps, unref, ref, resolveDirective, useSSRContext } from 'vue';
import { I as SEO, S as SITE, R as RESOURCES, p as publicAssetsURL } from '../nitro/nitro.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrRenderStyle, ssrGetDirectiveProps, ssrInterpolate } from '@vue/server-renderer';
import '@vueuse/core';
import 'vue-router';
import 'perfect-debounce';
import '@vue/shared';
import '@iconify/vue';
import '@iconify/utils/lib/css/icon';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '@iconify/utils';
import 'consola';
import 'fast-xml-parser';

const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "DownloadClip",
  __ssrInlineRender: true,
  props: {
    channel: {},
    clipId: {}
  },
  setup(__props) {
    const props = __props;
    const url = ref(props.channel && props.clipId ? `https://kick.com/${props.channel}/clips/${props.clipId}` : "");
    const clip = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const blob = ref(null);
    const blobUrl = ref(null);
    const getClip = async () => {
      error.value = null;
      const idRegex = /^https?:\/\/kick\.com\/[^\\/]+(?:\/clips\/(clip_\w+)|\?clip=(clip_\w+))(?:&.*|\?.*)?$/;
      const match = idRegex.exec(url.value);
      if (!match) {
        error.value = { message: "Error: The URL you entered is invalid" };
        return;
      }
      if (blobUrl.value) {
        URL.revokeObjectURL(blobUrl.value);
      }
      const id = match[1] || match[2];
      loading.value = true;
      const data = await $fetch(`${RESOURCES.apiV2}/clips/${id}`).catch(() => null);
      if (!data?.clip) {
        loading.value = false;
        error.value = { message: "Error: Clip not found - Make sure you entered the correct URL" };
        return;
      }
      const tmpVideo = await $fetch(`${RESOURCES.clipsTmp}/${id}.mp4`).catch(() => null) || await $fetch(`${RESOURCES.cdn}/${id}.mp4?t=${Date.now()}`).catch(() => null);
      if (!tmpVideo) {
        if (data?.clip.clip_url.includes(".mp4")) {
          blob.value = await $fetch(data.clip.clip_url).catch(() => null);
        } else {
          const fromApi = await $fetch("/api/clip", { method: "POST", body: { url: url.value } }).catch(() => null);
          if (fromApi) blob.value = await $fetch(fromApi?.url).catch(() => null);
          else {
            blob.value = data?.clip.clip_url.includes("/playlist.m3u8") ? await processClip(data.clip.clip_url, id) : null;
            if (blob.value) {
              const fd = new FormData();
              fd.append("file", blob.value, `${id}.mp4`);
              await $fetch("/api/cdn", { method: "PUT", body: fd }).catch(() => null);
            }
          }
        }
      } else blob.value = tmpVideo;
      if (!blob.value) {
        loading.value = false;
        error.value = { message: "Error: The clip processing time was extended - Please try again" };
        return;
      }
      blobUrl.value = URL.createObjectURL(blob.value);
      const picture = data?.clip.channel?.profile_picture ? data.clip.channel.profile_picture : "/images/user-default-pic.png";
      loading.value = false;
      clip.value = {
        filename: data.clip.title + ".mp4",
        channel: data.clip.channel.username,
        slug: data.clip.channel.slug,
        channelPicture: picture,
        title: data.clip.title,
        views: data.clip.view_count,
        likes: data.clip.likes_count,
        blob: blobUrl.value,
        creator: data.clip.creator.username,
        creatorSlug: data.clip.creator.slug,
        date: data.clip.created_at,
        duration: data.clip.duration
      };
    };
    if (props.channel && props.clipId) getClip();
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Icon = __nuxt_component_0$1;
      const _component_LoadingSpinner = __nuxt_component_1$1;
      const _directive_ripple = resolveDirective("ripple");
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "downloader-body justify-content-center mb-5 p-3 p-sm-4" }, _attrs))}><form><h2 class="col-12 fw-normal title mb-3 mb-sm-4">Enter clip URL</h2><div class="col-12 row input-body p-2 mb-3 mb-sm-4 mx-0 flex-nowrap"><input id="input"${ssrRenderAttr("value", unref(url))} class="col-9 col-lg-10 col-sm-8" type="url" placeholder="https://kick.com/user/clips/clip_01A2BCD3EF4GHI5JKMNLOP67QR" required><button${ssrRenderAttrs(mergeProps({
        id: "download",
        type: "submit",
        class: "col-3 col-lg-2 col-sm-4 btn fw-bold d-flex align-items-center justify-content-center",
        style: { "background-color": "#10b981 !important", "border-color": "#10b981 !important", "color": "white !important" }
      }, ssrGetDirectiveProps(_ctx, _directive_ripple)))}>`);
      _push(ssrRenderComponent(_component_Icon, {
        name: "ph:download-simple-bold",
        size: "1.8em"
      }, null, _parent));
      _push(`<span class="ms-1 download-txt">Download</span></button></div></form>`);
      if (unref(loading)) {
        _push(ssrRenderComponent(_component_LoadingSpinner, null, null, _parent));
      } else if (unref(error)) {
        _push(`<h5 class="error">${ssrInterpolate(unref(error).message)}</h5>`);
      } else if (unref(clip)?.channel) {
        _push(`<div id="clip" class="p-0"><div class="row"><div class="col-12 col-lg-4 info text-start mb-4"><div class="channel_profile"><img class="mb-1 img-fluid"${ssrRenderAttr("src", unref(clip).channelPicture)}><a${ssrRenderAttr("href", `https://kick.com/${unref(clip).slug}`)} class="text-decoration-underline" target="_blank"><h3 class="mb-3">${ssrInterpolate(unref(clip).channel)}</h3></a><h5 class="mb-3">${ssrInterpolate(unref(clip).title)}</h5><div class="clip_info d-flex gap-2 align-items-center">`);
        _push(ssrRenderComponent(_component_Icon, { name: "ph:heart-fill" }, null, _parent));
        _push(`<p><span class="fw-bold">${ssrInterpolate(unref(clip).likes)}</span></p><p>likes</p></div><div class="d-flex gap-2 align-items-center">`);
        _push(ssrRenderComponent(_component_Icon, { name: "ph:eye-bold" }, null, _parent));
        _push(`<p><span class="fw-bold">${ssrInterpolate(unref(clip).views)}</span></p><p>views</p></div><div class="d-flex gap-2 align-items-center">`);
        _push(ssrRenderComponent(_component_Icon, { name: "ph:clock-bold" }, null, _parent));
        _push(`<p><span class="fw-bold">${ssrInterpolate(("formatTime" in _ctx ? _ctx.formatTime : unref(formatTime))(unref(clip).duration))}</span></p><p>duration</p></div><div class="d-flex gap-2 align-items-center">`);
        _push(ssrRenderComponent(_component_Icon, { name: "ph:user-bold" }, null, _parent));
        _push(`<p><a${ssrRenderAttr("href", `https://kick.com/${unref(clip).creatorSlug}`)} class="text-decoration-underline" target="_blank">${ssrInterpolate(unref(clip).creator)}</a></p></div><div class="d-flex gap-2 align-items-center">`);
        _push(ssrRenderComponent(_component_Icon, { name: "ph:calendar-bold" }, null, _parent));
        _push(`<p><span>${ssrInterpolate(("getDate" in _ctx ? _ctx.getDate : unref(getDate))(unref(clip).date))}</span></p></div></div></div><div class="col-12 col-lg-8 video mb-4"><video class="img-fluid" width="1280" height="720" controls autoplay muted><source${ssrRenderAttr("src", unref(clip).blob)} type="video/mp4"></video></div><div class="save"><a class="col-12 btn fw-bold mb-0"${ssrRenderAttr("href", unref(clip).blob)} target="_blank"${ssrRenderAttr("download", unref(clip).filename)}>Save file</a></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/DownloadClip.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main$2, { __name: "DownloadClip" });
const _imports_0 = publicAssetsURL("/images/example.png");
const _sfc_main$1 = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  const _component_Icon = __nuxt_component_0$1;
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "guide-body mx-1" }, _attrs))}><h3 class="mb-4">How to download a Kick clip?</h3><div class="row g-4"><div class="col-12 col-lg-4"><div class="guide p-4" style="${ssrRenderStyle({ "background-color": "#065f46 !important" })}"><h1>`);
  _push(ssrRenderComponent(_component_Icon, { name: "ph:film-slate-duotone" }, null, _parent));
  _push(`</h1><h5>Step 1: Get clip URL</h5><h5 class="fw-light mb-3">On the Kick.com website, search for the clip you wish to download, press the share button, and then copy the clip&#39;s URL.</h5><img class="img-fluid"${ssrRenderAttr("src", _imports_0)}></div></div><div class="col-12 col-lg-4"><div class="guide p-4" style="${ssrRenderStyle({ "background-color": "#065f46 !important" })}"><h1>`);
  _push(ssrRenderComponent(_component_Icon, { name: "uiw:copy" }, null, _parent));
  _push(`</h1><h5>Step 2: Paste clip URL</h5><h5 class="fw-light">Simply paste the URL into the designated text box on Kickclips, and proceed by clicking the <b>&quot;Download&quot;</b> button.</h5></div></div><div class="col-12 col-lg-4"><div class="guide p-4" style="${ssrRenderStyle({ "background-color": "#065f46 !important" })}"><h1>`);
  _push(ssrRenderComponent(_component_Icon, { name: "ph:download-simple-duotone" }, null, _parent));
  _push(`</h1><h5>Step 3: Download MP4 clip</h5><h5 class="fw-light">After obtaining the video, you can easily download it by simply <b>right-clicking</b> on the displayed video and selecting <b>&quot;Save video as&quot;</b> or, click on the <b>&quot;Save File&quot;</b> button to initiate the direct download.</h5></div></div></div></div>`);
}
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/DownloadGuide.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_2 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$1, [["ssrRender", _sfc_ssrRender]]), { __name: "DownloadGuide" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    useSeoMeta({
      title: SITE.name,
      description: SITE.description,
      // Open Graph
      ogType: SEO.og.type,
      ogTitle: SEO.og.title,
      ogDescription: SEO.og.description,
      ogUrl: SEO.og.url,
      ogImage: SEO.og.image,
      // Twitter
      twitterCard: SEO.twitter.card,
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
    const queryParams = query;
    return (_ctx, _push, _parent, _attrs) => {
      const _component_SearchChannelInput = __nuxt_component_0;
      const _component_DownloadClip = __nuxt_component_1;
      const _component_DownloadGuide = __nuxt_component_2;
      _push(`<main${ssrRenderAttrs(mergeProps({ class: "text-white" }, _attrs))}><div id="home" class="text-center container overflow-hidden"><div class="my-5">`);
      _push(ssrRenderComponent(_component_SearchChannelInput, {
        align: "end",
        class: "mb-4"
      }, null, _parent));
      _push(`<img class="mb-4"${ssrRenderAttr("src", _imports_0$1)} style="${ssrRenderStyle({ "width": "350px" })}"><h3 class="mb-4" style="${ssrRenderStyle({ "color": "#10b981 !important" })}">Ultimate Kick Clip Tool</h3><h5 class="mb-4 text-emerald-600">Download Free HD Clips From kick.com.</h5>`);
      _push(ssrRenderComponent(_component_DownloadClip, {
        channel: unref(queryParams).channel,
        "clip-id": unref(queryParams).id
      }, null, _parent));
      _push(ssrRenderComponent(_component_DownloadGuide, null, null, _parent));
      _push(`</div></div></main>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-BUQ4VJLN.mjs.map

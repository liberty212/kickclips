import { _ as __nuxt_component_0, a as _imports_0, f as formatTime, b as formatViews, c as __nuxt_component_1 } from './_virtual_public-Cn_zw_cu.mjs';
import { u as useRoute, a as useFetch, c as createError, b as useSeoMeta, d as useHead, _ as __nuxt_component_1$1, e as __nuxt_component_0$1 } from './server.mjs';
import { useInfiniteScroll, watchDebounced, useTimeAgo } from '@vueuse/core';
import { v as vueExports, S as SITE, K as SEO, R as RESOURCES } from '../nitro/nitro.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrInterpolate, ssrRenderStyle, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList } from '@vue/server-renderer';
import 'perfect-debounce';
import '@vue/shared';
import '@iconify/vue';
import '@iconify/utils/lib/css/icon';
import '../routes/renderer.mjs';
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
import '@vue/compiler-dom';
import '@vue/runtime-dom';
import '@iconify/utils';
import 'consola';
import 'fast-xml-parser';

const _sfc_main = /* @__PURE__ */ vueExports.defineComponent({
  __name: "[channel]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { params } = useRoute();
    const { query } = useRoute();
    const { channel } = params;
    const clips = vueExports.ref([]);
    const username = vueExports.ref("");
    const userimage = vueExports.ref("");
    const { sort, time } = query;
    vueExports.useTemplateRef("element");
    const sortBy = vueExports.ref(sort || "view");
    const timeBy = vueExports.ref(time || "week");
    const nextCursor = vueExports.ref();
    const loading = vueExports.ref(false);
    const searchQuery = vueExports.ref("");
    const { data: response } = ([__temp, __restore] = vueExports.withAsyncContext(() => useFetch(
      `/api/channel/${channel}/clips`,
      {
        query: {
          sort: sortBy.value,
          time: timeBy.value
        }
      },
      "$UjejtFdFS6"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    if (!response.value) {
      throw createError({
        statusCode: 404,
        statusMessage: "This channel does not exist.",
        fatal: true
      });
    }
    clips.value = response.value?.clips || [];
    nextCursor.value = response.value?.nextCursor || null;
    username.value = response.value?.clips?.[0]?.channel?.username || "";
    userimage.value = response.value?.clips?.[0]?.channel?.profile_picture || "";
    const fetchClips = async () => {
      loading.value = true;
      const response2 = await $fetch(`${RESOURCES.apiV2}/channels/${channel}/clips`, {
        query: {
          sort: sortBy.value,
          time: timeBy.value,
          ...nextCursor.value && { cursor: nextCursor.value }
        },
        headers: { "Cache-Control": "no-cache" },
        parseResponse: JSON.parse
      }).catch(() => {
        loading.value = false;
        return null;
      });
      if (response2?.clips && !nextCursor.value) {
        clips.value = response2.clips;
      } else if (response2?.clips) {
        clips.value = [...new Map([...clips.value, ...response2.clips].map((clip) => [clip.id, clip])).values()];
      }
      username.value = username.value || (response2?.clips[0]?.channel?.username || "");
      userimage.value = userimage.value || (response2?.clips[0]?.channel?.profile_picture || "");
      nextCursor.value = response2?.nextCursor || null;
      loading.value = false;
    };
    vueExports.watch([sortBy, timeBy], async () => {
      nextCursor.value = null;
      clips.value = [];
      await fetchClips();
      (void 0).history.replaceState({}, "", `/${channel}?sort=${sortBy.value}&time=${timeBy.value}`);
    });
    useInfiniteScroll(void 0, async () => {
      if (!nextCursor.value) return;
      await fetchClips();
    }, { distance: 100 });
    const seoTitle = `${username.value} Clips`;
    const seoUrl = `${SITE.url}/${channel.toLowerCase()}`;
    useSeoMeta({
      title: `${seoTitle} | ${SITE.name}`,
      description: seoTitle,
      // Open Graph
      ogType: SEO.og.type,
      ogTitle: seoTitle,
      ogDescription: seoTitle,
      ogUrl: seoUrl,
      ogImage: SEO.og.image,
      // Twitter
      twitterCard: SEO.twitter.card,
      twitterTitle: seoTitle,
      twitterDescription: seoTitle
    });
    useHead({
      link: [
        { rel: "canonical", href: seoUrl }
      ]
    });
    const computedClips = vueExports.computed(() => {
      return clips.value.filter((clip) => {
        const titleMatch = clip.title.toLowerCase().includes(searchQuery.value.toLowerCase());
        const usernameMatch = clip.creator.username.toLowerCase().includes(searchQuery.value.toLowerCase());
        return titleMatch || usernameMatch;
      });
    });
    watchDebounced([sortBy, timeBy, searchQuery], async () => {
      while (searchQuery.value && computedClips.value.length < 10 && nextCursor.value) {
        await fetchClips();
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }, { debounce: 1e3 });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_SearchChannelInput = __nuxt_component_0;
      const _component_NuxtLink = __nuxt_component_1$1;
      const _component_Icon = __nuxt_component_0$1;
      const _component_LoadingSpinner = __nuxt_component_1;
      _push(`<main${ssrRenderAttrs(vueExports.mergeProps({ class: "text-white" }, _attrs))}><div class="text-center container overflow-hidden"><div class="my-5">`);
      _push(ssrRenderComponent(_component_SearchChannelInput, {
        align: "end",
        class: "mb-4"
      }, null, _parent));
      _push(`<div class="mb-4">`);
      _push(ssrRenderComponent(_component_NuxtLink, { to: "/" }, {
        default: vueExports.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<img class="logo"${ssrRenderAttr("src", _imports_0)}${_scopeId}>`);
          } else {
            return [
              vueExports.createVNode("img", {
                class: "logo",
                src: _imports_0
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="d-flex justify-content-center align-items-center mb-2">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: `https://kick.com/${vueExports.unref(channel)}`,
        target: "_blank",
        external: ""
      }, {
        default: vueExports.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<img${ssrRenderAttr("src", vueExports.unref(userimage) || "/user-default-pic.png")} class="rounded-circle" width="60" height="60"${_scopeId}>`);
          } else {
            return [
              vueExports.createVNode("img", {
                src: vueExports.unref(userimage) || "/user-default-pic.png",
                class: "rounded-circle",
                width: "60",
                height: "60"
              }, null, 8, ["src"])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><h3 class="mb-4">${ssrInterpolate(vueExports.unref(username) || vueExports.unref(channel))} Clips</h3><div class="d-flex flex-wrap justify-content-center gap-1 mb-4"><div class="d-flex flex-column align-items-center justify-content-center"><label>Sort by:</label><select class="form-select me-2" style="${ssrRenderStyle({ "max-width": "150px" })}"><option value="view"${ssrIncludeBooleanAttr(Array.isArray(vueExports.unref(sortBy)) ? ssrLooseContain(vueExports.unref(sortBy), "view") : ssrLooseEqual(vueExports.unref(sortBy), "view")) ? " selected" : ""}>Most Viewed</option><option value="date"${ssrIncludeBooleanAttr(Array.isArray(vueExports.unref(sortBy)) ? ssrLooseContain(vueExports.unref(sortBy), "date") : ssrLooseEqual(vueExports.unref(sortBy), "date")) ? " selected" : ""}>Latest</option></select></div><div class="d-flex flex-column align-items-center justify-content-center"><label>Filter by:</label><select class="form-select" style="${ssrRenderStyle({ "max-width": "150px" })}"><option value="all"${ssrIncludeBooleanAttr(Array.isArray(vueExports.unref(timeBy)) ? ssrLooseContain(vueExports.unref(timeBy), "all") : ssrLooseEqual(vueExports.unref(timeBy), "all")) ? " selected" : ""}>All Time</option><option value="month"${ssrIncludeBooleanAttr(Array.isArray(vueExports.unref(timeBy)) ? ssrLooseContain(vueExports.unref(timeBy), "month") : ssrLooseEqual(vueExports.unref(timeBy), "month")) ? " selected" : ""}>Last Month</option><option value="week"${ssrIncludeBooleanAttr(Array.isArray(vueExports.unref(timeBy)) ? ssrLooseContain(vueExports.unref(timeBy), "week") : ssrLooseEqual(vueExports.unref(timeBy), "week")) ? " selected" : ""}>Last Week</option><option value="day"${ssrIncludeBooleanAttr(Array.isArray(vueExports.unref(timeBy)) ? ssrLooseContain(vueExports.unref(timeBy), "day") : ssrLooseEqual(vueExports.unref(timeBy), "day")) ? " selected" : ""}>Last Day</option></select></div><div class="d-flex flex-column align-items-center justify-content-center" style="${ssrRenderStyle({ "width": "240px" })}"><label>Search</label><input${ssrRenderAttr("value", vueExports.unref(searchQuery))} type="text" class="form-control" placeholder="Search by title or username..."></div></div><div class="row g-4"><!--[-->`);
      ssrRenderList(vueExports.unref(computedClips), (clip) => {
        _push(`<div class="col-12 col-sm-6 col-md-4 col-lg-4 col-xl-3"${ssrRenderAttr("title", clip?.title?.trim() || "")}>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/?channel=${clip.channel.slug}&id=${clip.id}`,
          class: "text-decoration-none text-white"
        }, {
          default: vueExports.withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<div class="card bg-dark text-white rounded-1 overflow-hidden"${_scopeId}><div class="position-relative"${_scopeId}><img${ssrRenderAttr("src", clip.thumbnail_url)} class="w-100"${_scopeId}><span class="badge bg-black position-absolute top-0 start-0 m-2 opacity-75"${_scopeId}>${ssrInterpolate(("formatTime" in _ctx ? _ctx.formatTime : vueExports.unref(formatTime))(clip.duration))}</span><span class="badge bg-black position-absolute bottom-0 start-0 m-2 opacity-75"${_scopeId}>${ssrInterpolate(("formatViews" in _ctx ? _ctx.formatViews : vueExports.unref(formatViews))(clip.view_count))} views </span></div><div class="card-body text-start d-flex flex-column gap-1 p-2"${_scopeId}><h6 class="card-title m-0 fw-bold text-truncate"${_scopeId}>${ssrInterpolate(clip?.title?.trim() || "")}</h6><small class="d-block card-text text-muted text-truncate"${_scopeId}>${ssrInterpolate(clip?.category?.name?.trim() || "")}</small><small class="d-block card-text text-muted text-truncate"${ssrRenderAttr("title", new Date(clip.created_at).toLocaleString())}${_scopeId}>${ssrInterpolate(vueExports.unref(useTimeAgo)(clip.created_at))}</small><small class="d-flex card-text text-muted justify-content-start align-items-center gap-1"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_Icon, { name: "ph:user-bold" }, null, _parent2, _scopeId));
              _push2(`<span class="text-truncate"${_scopeId}>${ssrInterpolate(clip?.creator?.username?.trim() || "")}</span></small></div></div>`);
            } else {
              return [
                vueExports.createVNode("div", { class: "card bg-dark text-white rounded-1 overflow-hidden" }, [
                  vueExports.createVNode("div", { class: "position-relative" }, [
                    vueExports.createVNode("img", {
                      src: clip.thumbnail_url,
                      class: "w-100"
                    }, null, 8, ["src"]),
                    vueExports.createVNode("span", { class: "badge bg-black position-absolute top-0 start-0 m-2 opacity-75" }, vueExports.toDisplayString(("formatTime" in _ctx ? _ctx.formatTime : vueExports.unref(formatTime))(clip.duration)), 1),
                    vueExports.createVNode("span", { class: "badge bg-black position-absolute bottom-0 start-0 m-2 opacity-75" }, vueExports.toDisplayString(("formatViews" in _ctx ? _ctx.formatViews : vueExports.unref(formatViews))(clip.view_count)) + " views ", 1)
                  ]),
                  vueExports.createVNode("div", { class: "card-body text-start d-flex flex-column gap-1 p-2" }, [
                    vueExports.createVNode("h6", { class: "card-title m-0 fw-bold text-truncate" }, vueExports.toDisplayString(clip?.title?.trim() || ""), 1),
                    vueExports.createVNode("small", { class: "d-block card-text text-muted text-truncate" }, vueExports.toDisplayString(clip?.category?.name?.trim() || ""), 1),
                    vueExports.createVNode("small", {
                      class: "d-block card-text text-muted text-truncate",
                      title: new Date(clip.created_at).toLocaleString()
                    }, vueExports.toDisplayString(vueExports.unref(useTimeAgo)(clip.created_at)), 9, ["title"]),
                    vueExports.createVNode("small", { class: "d-flex card-text text-muted justify-content-start align-items-center gap-1" }, [
                      vueExports.createVNode(_component_Icon, { name: "ph:user-bold" }),
                      vueExports.createVNode("span", { class: "text-truncate" }, vueExports.toDisplayString(clip?.creator?.username?.trim() || ""), 1)
                    ])
                  ])
                ])
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`</div>`);
      });
      _push(`<!--]--></div>`);
      if (vueExports.unref(loading)) {
        _push(ssrRenderComponent(_component_LoadingSpinner, {
          class: "mt-4",
          text: "Loading..."
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></main>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = vueExports.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/[channel].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_channel_-CJY7jcyq.mjs.map

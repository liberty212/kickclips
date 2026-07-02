import { w as withLeadingSlash, v as vueExports, c as buildAssetsURL, p as publicAssetsURL, u as useRuntimeConfig, e as useStorage, f as getResponseStatusText, h as getResponseStatus, i as encodePath, j as defineRenderHandler, a as getQuery, k as createError, l as destr, m as getRouteRules, n as joinURL, o as useNitroApp } from '../nitro/nitro.mjs';
import { createHead as createHead$1, propsToString, renderSSRHead } from 'unhead/server';
import { renderToString } from '@vue/server-renderer';
import { stringify, uneval } from 'devalue';
import { FlatMetaPlugin } from 'unhead/plugins';
import { walkResolver } from 'unhead/utils';

//#region src/runtime.ts
function createRendererContext({ manifest, precomputed, buildAssetsURL, dependencySetsCacheSize }) {
	if (!manifest && !precomputed) throw new Error("Either manifest or precomputed data must be provided");
	const ctx = {
		buildAssetsURL: buildAssetsURL || withLeadingSlash,
		manifest,
		precomputed,
		updateManifest,
		_dependencies: {},
		_dependencySets: /* @__PURE__ */ new Map(),
		_dependencySetsCacheSize: typeof dependencySetsCacheSize === "number" && Number.isFinite(dependencySetsCacheSize) && dependencySetsCacheSize > 0 ? Math.floor(dependencySetsCacheSize) : dependencySetsCacheSize === void 0 ? 1e3 : 0,
		_entrypoints: []
	};
	function updateManifest(manifest) {
		const manifestEntries = Object.entries(manifest);
		ctx.manifest = manifest;
		ctx._dependencies = {};
		ctx._dependencySets.clear();
		ctx._entrypoints = manifestEntries.filter((e) => e[1].isEntry).map(([module]) => module);
	}
	if (precomputed) {
		ctx._dependencies = precomputed.dependencies;
		ctx._entrypoints = precomputed.entrypoints;
	} else if (manifest) updateManifest(manifest);
	return ctx;
}
function getModuleDependencies(id, rendererContext) {
	if (rendererContext._dependencies[id]) return rendererContext._dependencies[id];
	const dependencies = rendererContext._dependencies[id] = {
		scripts: {},
		styles: {},
		preload: {},
		prefetch: {}
	};
	if (!rendererContext.manifest) return dependencies;
	const meta = rendererContext.manifest[id];
	if (!meta) return dependencies;
	if (meta.file) {
		dependencies.preload[id] = meta;
		if (meta.isEntry || meta.sideEffects) dependencies.scripts[id] = meta;
	}
	for (const css of meta.css || []) dependencies.styles[css] = dependencies.preload[css] = dependencies.prefetch[css] = rendererContext.manifest[css];
	for (const asset of meta.assets || []) dependencies.preload[asset] = dependencies.prefetch[asset] = rendererContext.manifest[asset];
	for (const depId of meta.imports || []) {
		const depDeps = getModuleDependencies(depId, rendererContext);
		for (const key in depDeps.styles) dependencies.styles[key] = depDeps.styles[key];
		for (const key in depDeps.preload) dependencies.preload[key] = depDeps.preload[key];
		for (const key in depDeps.prefetch) dependencies.prefetch[key] = depDeps.prefetch[key];
	}
	const filteredPreload = {};
	for (const id in dependencies.preload) {
		const dep = dependencies.preload[id];
		if (dep.preload) filteredPreload[id] = dep;
	}
	dependencies.preload = filteredPreload;
	return dependencies;
}
function getAllDependencies(ids, rendererContext) {
	const cacheSize = rendererContext._dependencySetsCacheSize;
	const useCache = cacheSize > 0;
	let cacheKey = "";
	if (useCache) {
		if (ids.size <= 1) for (const id of ids) cacheKey = id;
		else cacheKey = [...ids].sort().join(",");
		const cached = rendererContext._dependencySets.get(cacheKey);
		if (cached !== void 0) {
			if (rendererContext._dependencySets.size >= cacheSize) {
				rendererContext._dependencySets.delete(cacheKey);
				rendererContext._dependencySets.set(cacheKey, cached);
			}
			return cached;
		}
	}
	const allDeps = {
		scripts: {},
		styles: {},
		preload: {},
		prefetch: {}
	};
	for (const id of ids) {
		const deps = getModuleDependencies(id, rendererContext);
		for (const key in deps.scripts) allDeps.scripts[key] = deps.scripts[key];
		for (const key in deps.styles) allDeps.styles[key] = deps.styles[key];
		for (const key in deps.preload) allDeps.preload[key] = deps.preload[key];
		for (const key in deps.prefetch) allDeps.prefetch[key] = deps.prefetch[key];
		for (const dynamicDepId of rendererContext.manifest?.[id]?.dynamicImports || []) {
			const dynamicDeps = getModuleDependencies(dynamicDepId, rendererContext);
			for (const key in dynamicDeps.scripts) allDeps.prefetch[key] = dynamicDeps.scripts[key];
			for (const key in dynamicDeps.styles) allDeps.prefetch[key] = dynamicDeps.styles[key];
			for (const key in dynamicDeps.preload) allDeps.prefetch[key] = dynamicDeps.preload[key];
		}
	}
	const filteredPrefetch = {};
	for (const id in allDeps.prefetch) {
		const dep = allDeps.prefetch[id];
		if (dep.prefetch) filteredPrefetch[id] = dep;
	}
	allDeps.prefetch = filteredPrefetch;
	for (const id in allDeps.preload) delete allDeps.prefetch[id];
	for (const style in allDeps.styles) {
		delete allDeps.preload[style];
		delete allDeps.prefetch[style];
	}
	if (useCache) {
		rendererContext._dependencySets.set(cacheKey, allDeps);
		if (rendererContext._dependencySets.size > cacheSize) {
			const oldest = rendererContext._dependencySets.keys().next().value;
			if (oldest !== void 0) rendererContext._dependencySets.delete(oldest);
		}
	}
	return allDeps;
}
function getRequestDependencies(ssrContext, rendererContext, options) {
	const excluded = options?.exclude ? new Set(options.exclude) : void 0;
	const hasExcluded = excluded && excluded.size > 0;
	if (!hasExcluded && ssrContext._requestDependencies) return ssrContext._requestDependencies;
	let ids;
	const requestIds = ssrContext.modules || ssrContext._registeredComponents;
	if (hasExcluded) {
		ids = /* @__PURE__ */ new Set();
		for (const id of rendererContext._entrypoints) if (!excluded.has(id)) ids.add(id);
		if (requestIds) {
			for (const id of requestIds) if (!excluded.has(id)) ids.add(id);
		}
	} else {
		ids = new Set(rendererContext._entrypoints);
		if (requestIds) for (const id of requestIds) ids.add(id);
	}
	const deps = getAllDependencies(ids, rendererContext);
	if (!hasExcluded) ssrContext._requestDependencies = deps;
	return deps;
}
function renderStyles(ssrContext, rendererContext) {
	const { styles } = getRequestDependencies(ssrContext, rendererContext);
	let result = "";
	for (const key in styles) {
		const resource = styles[key];
		result += `<link rel="stylesheet" href="${rendererContext.buildAssetsURL(resource.file)}" crossorigin>`;
	}
	return result;
}
function renderResourceHints(ssrContext, rendererContext, options) {
	const { preload, prefetch } = getRequestDependencies(ssrContext, rendererContext, options);
	let result = "";
	for (const key in preload) {
		const resource = preload[key];
		const href = rendererContext.buildAssetsURL(resource.file);
		const rel = resource.module ? "modulepreload" : "preload";
		const crossorigin = resource.resourceType === "style" || resource.resourceType === "font" || resource.resourceType === "script" || resource.module ? " crossorigin" : "";
		if (resource.resourceType && resource.mimeType) result += `<link rel="${rel}" as="${resource.resourceType}" type="${resource.mimeType}"${crossorigin} href="${href}">`;
		else if (resource.resourceType) result += `<link rel="${rel}" as="${resource.resourceType}"${crossorigin} href="${href}">`;
		else result += `<link rel="${rel}"${crossorigin} href="${href}">`;
	}
	for (const key in prefetch) {
		const resource = prefetch[key];
		const href = rendererContext.buildAssetsURL(resource.file);
		const crossorigin = resource.resourceType === "style" || resource.resourceType === "font" || resource.resourceType === "script" || resource.module ? " crossorigin" : "";
		if (resource.resourceType && resource.mimeType) result += `<link rel="prefetch" as="${resource.resourceType}" type="${resource.mimeType}"${crossorigin} href="${href}">`;
		else if (resource.resourceType) result += `<link rel="prefetch" as="${resource.resourceType}"${crossorigin} href="${href}">`;
		else result += `<link rel="prefetch"${crossorigin} href="${href}">`;
	}
	return result;
}
function renderResourceHeaders(ssrContext, rendererContext, options) {
	const { preload, prefetch } = getRequestDependencies(ssrContext, rendererContext, options);
	const links = [];
	for (const key in preload) {
		const resource = preload[key];
		let header = `<${rendererContext.buildAssetsURL(resource.file)}>; rel="${resource.module ? "modulepreload" : "preload"}"`;
		if (resource.resourceType) header += `; as="${resource.resourceType}"`;
		if (resource.mimeType) header += `; type="${resource.mimeType}"`;
		if (resource.resourceType === "style" || resource.resourceType === "font" || resource.resourceType === "script" || resource.module) header += "; crossorigin";
		links.push(header);
	}
	for (const key in prefetch) {
		const resource = prefetch[key];
		let header = `<${rendererContext.buildAssetsURL(resource.file)}>; rel="prefetch"`;
		if (resource.resourceType) header += `; as="${resource.resourceType}"`;
		if (resource.mimeType) header += `; type="${resource.mimeType}"`;
		if (resource.resourceType === "style" || resource.resourceType === "font" || resource.resourceType === "script" || resource.module) header += "; crossorigin";
		links.push(header);
	}
	return { link: links.join(", ") };
}
function getPreloadLinks(ssrContext, rendererContext, options) {
	const { preload } = getRequestDependencies(ssrContext, rendererContext, options);
	const result = [];
	for (const key in preload) {
		const resource = preload[key];
		result.push({
			rel: resource.module ? "modulepreload" : "preload",
			as: resource.resourceType,
			type: resource.mimeType ?? null,
			crossorigin: resource.resourceType === "style" || resource.resourceType === "font" || resource.resourceType === "script" || resource.module ? "" : null,
			href: rendererContext.buildAssetsURL(resource.file)
		});
	}
	return result;
}
function getPrefetchLinks(ssrContext, rendererContext, options) {
	const { prefetch } = getRequestDependencies(ssrContext, rendererContext, options);
	const result = [];
	for (const key in prefetch) {
		const resource = prefetch[key];
		result.push({
			rel: "prefetch",
			as: resource.resourceType,
			type: resource.mimeType ?? null,
			crossorigin: resource.resourceType === "style" || resource.resourceType === "font" || resource.resourceType === "script" || resource.module ? "" : null,
			href: rendererContext.buildAssetsURL(resource.file)
		});
	}
	return result;
}
function renderScripts(ssrContext, rendererContext) {
	const { scripts } = getRequestDependencies(ssrContext, rendererContext);
	let result = "";
	for (const key in scripts) {
		const resource = scripts[key];
		if (resource.module) result += `<script type="module" src="${rendererContext.buildAssetsURL(resource.file)}" crossorigin><\/script>`;
		else result += `<script src="${rendererContext.buildAssetsURL(resource.file)}" defer crossorigin><\/script>`;
	}
	return result;
}
function createRenderer(createApp, renderOptions) {
	const rendererContext = createRendererContext(renderOptions);
	return {
		rendererContext,
		async renderToString(ssrContext) {
			ssrContext._registeredComponents = ssrContext._registeredComponents || /* @__PURE__ */ new Set();
			const app = await (await Promise.resolve(createApp).then((r) => "default" in r ? r.default : r))(ssrContext);
			const html = await renderOptions.renderToString(app, ssrContext);
			const wrap = (fn) => () => fn(ssrContext, rendererContext);
			return {
				html,
				renderResourceHeaders: wrap(renderResourceHeaders),
				renderResourceHints: wrap(renderResourceHints),
				renderStyles: wrap(renderStyles),
				renderScripts: wrap(renderScripts)
			};
		}
	};
}

const VueResolver = (_, value) => {
  return vueExports.isRef(value) ? vueExports.toValue(value) : value;
};

const headSymbol = "usehead";
// @__NO_SIDE_EFFECTS__
function vueInstall(head) {
  const plugin = {
    install(app) {
      app.config.globalProperties.$unhead = head;
      app.config.globalProperties.$head = head;
      app.provide(headSymbol, head);
    }
  };
  return plugin.install;
}

// @__NO_SIDE_EFFECTS__
function injectHead() {
  if (vueExports.hasInjectionContext()) {
    const instance = vueExports.inject(headSymbol);
    if (instance) {
      return instance;
    }
  }
  throw new Error("useHead() was called without provide context, ensure you call it through the setup() function.");
}
function useHead(input, options = {}) {
  const head = options.head || /* @__PURE__ */ injectHead();
  return head.ssr ? head.push(input || {}, options) : clientUseHead(head, input, options);
}
function clientUseHead(head, input, options = {}) {
  const deactivated = vueExports.ref(false);
  let entry;
  vueExports.watchEffect(() => {
    const i = deactivated.value ? {} : walkResolver(input, VueResolver);
    if (entry) {
      entry.patch(i);
    } else {
      entry = head.push(i, options);
    }
  });
  const vm = vueExports.getCurrentInstance();
  if (vm) {
    vueExports.onBeforeUnmount(() => {
      entry.dispose();
    });
    vueExports.onDeactivated(() => {
      deactivated.value = true;
    });
    vueExports.onActivated(() => {
      deactivated.value = false;
    });
  }
  return entry;
}
function useSeoMeta(input = {}, options = {}) {
  const head = options.head || /* @__PURE__ */ injectHead();
  head.use(FlatMetaPlugin);
  const { title, titleTemplate, ...meta } = input;
  return useHead({
    title,
    titleTemplate,
    _flatMeta: meta
  }, options);
}

// @__NO_SIDE_EFFECTS__
function createHead(options = {}) {
  const head = createHead$1({
    ...options,
    propResolvers: [VueResolver]
  });
  head.install = vueInstall(head);
  return head;
}

const NUXT_PAYLOAD_INLINE = false;

const appHead = {"meta":[{"name":"viewport","content":"width=device-width, initial-scale=1"},{"charset":"utf-8"},{"name":"robots","content":"index, follow"},{"property":"og:site:name","content":"KickClips"}],"link":[{"rel":"apple-touch-icon","sizes":"180x180","href":"/apple-touch-icon.png"},{"rel":"icon","type":"image/png","sizes":"512x512","href":"/android-chrome-512x512.png"},{"rel":"icon","type":"image/png","sizes":"192x192","href":"/android-chrome-192x192.png"},{"rel":"icon","type":"image/png","sizes":"32x32","href":"/favicon-32x32.png"},{"rel":"icon","type":"image/png","sizes":"16x16","href":"/favicon-16x16.png"},{"rel":"manifest","href":"/site.webmanifest"},{"rel":"mask-icon","href":"/safari-pinned-tab.svg","color":"#0b0e0f"}],"style":[],"script":[],"noscript":[],"charset":"utf-8","viewport":"width=device-width, initial-scale=1","htmlAttrs":{"lang":"en"}};

const appRootTag = "div";

const appRootAttrs = {"id":"__nuxt"};

const appTeleportTag = "div";

const appTeleportAttrs = {"id":"teleports"};

const appSpaLoaderTag = "div";

const appSpaLoaderAttrs = {"id":"__nuxt-loader"};

const appId = "nuxt-app";

// @ts-expect-error private property consumed by vite-generated url helpers
globalThis.__buildAssetsURL = buildAssetsURL;
// @ts-expect-error private property consumed by vite-generated url helpers
globalThis.__publicAssetsURL = publicAssetsURL;
const APP_ROOT_OPEN_TAG = `<${appRootTag}${propsToString(appRootAttrs)}>`;
const APP_ROOT_CLOSE_TAG = `</${appRootTag}>`;
// @ts-expect-error file will be produced after app build
const getServerEntry = () => import('../build/server.mjs').then((r) => r.default || r);
// @ts-expect-error file will be produced after app build
const getPrecomputedDependencies = () => import('../build/client.precomputed.mjs').then((r) => r.default || r).then((r) => typeof r === "function" ? r() : r);

const getSSRRenderer = lazyCachedFunction(async () => {
	
	const createSSRApp = await getServerEntry();
	if (!createSSRApp) {
		throw new Error("Server bundle is not available");
	}
	
	const precomputed = await getPrecomputedDependencies();
	
	const renderer = createRenderer(createSSRApp, {
		precomputed,
		manifest: undefined,
		renderToString: renderToString$1,
		buildAssetsURL
	});
	async function renderToString$1(input, context) {
		const html = await renderToString(input, context);
		return APP_ROOT_OPEN_TAG + html + APP_ROOT_CLOSE_TAG;
	}
	return renderer;
});

const getSPARenderer = lazyCachedFunction(async () => {
	const precomputed = await getPrecomputedDependencies();
	// @ts-expect-error virtual file
	const spaTemplate = await import('../virtual/_virtual_spa-template.mjs').then((r) => r.template).catch(() => "").then((r) => {
		{
			const APP_SPA_LOADER_OPEN_TAG = `<${appSpaLoaderTag}${propsToString(appSpaLoaderAttrs)}>`;
			const APP_SPA_LOADER_CLOSE_TAG = `</${appSpaLoaderTag}>`;
			const appTemplate = APP_ROOT_OPEN_TAG + APP_ROOT_CLOSE_TAG;
			const loaderTemplate = r ? APP_SPA_LOADER_OPEN_TAG + r + APP_SPA_LOADER_CLOSE_TAG : "";
			return appTemplate + loaderTemplate;
		}
	});
	
	const renderer = createRenderer(() => () => {}, {
		precomputed,
		manifest: undefined,
		renderToString: () => spaTemplate,
		buildAssetsURL
	});
	const result = await renderer.renderToString({});
	const renderToString = (ssrContext) => {
		const config = useRuntimeConfig(ssrContext.event);
		ssrContext.modules ||= new Set();
		ssrContext.payload.serverRendered = false;
		ssrContext.config = {
			public: config.public,
			app: config.app
		};
		return Promise.resolve(result);
	};
	return {
		rendererContext: renderer.rendererContext,
		renderToString
	};
});
function lazyCachedFunction(fn) {
	let res = null;
	return () => {
		if (res === null) {
			res = fn().catch((err) => {
				res = null;
				throw err;
			});
		}
		return res;
	};
}
function getRenderer(ssrContext) {
	return ssrContext.noSSR ? getSPARenderer() : getSSRRenderer();
}

const payloadCache = useStorage("cache:nuxt:payload") ;

function renderPayloadResponse(ssrContext) {
	return {
		body: encodeForwardSlashes(stringify(splitPayload(ssrContext).payload, ssrContext["~payloadReducers"])) ,
		statusCode: getResponseStatus(ssrContext.event),
		statusMessage: getResponseStatusText(ssrContext.event),
		headers: {
			"content-type": "application/json;charset=utf-8" ,
			"x-powered-by": "Nuxt"
		}
	};
}
function renderPayloadJsonScript(opts) {
	const contents = opts.data ? encodeForwardSlashes(stringify(opts.data, opts.ssrContext["~payloadReducers"])) : "";
	const payload = {
		"type": "application/json",
		"innerHTML": contents,
		"data-nuxt-data": appId,
		"data-ssr": !(opts.ssrContext.noSSR)
	};
	{
		payload.id = "__NUXT_DATA__";
	}
	if (opts.src) {
		payload["data-src"] = opts.src;
	}
	const config = uneval(opts.ssrContext.config);
	return [payload, { innerHTML: `window.__NUXT__={};window.__NUXT__.config=${config}` }];
}

function encodeForwardSlashes(str) {
	return str.replaceAll("/", "\\u002F");
}
function splitPayload(ssrContext) {
	const { data, prerenderedAt, ...initial } = ssrContext.payload;
	return {
		initial: {
			...initial,
			prerenderedAt
		},
		payload: {
			data,
			prerenderedAt
		}
	};
}

const unheadOptions = {
  disableDefaults: true,
};

function encodeEventPath(path) {
	const queryIndex = path.indexOf("?");
	if (queryIndex === -1) {
		return encodePath(path);
	}
	return encodePath(path.slice(0, queryIndex)) + path.slice(queryIndex);
}
function createSSRContext(event) {
	const url = encodeEventPath(event.path);
	const ssrContext = {
		url,
		event,
		runtimeConfig: useRuntimeConfig(event),
		noSSR: event.context.nuxt?.noSSR || (false),
		head: createHead(unheadOptions),
		error: false,
		nuxt: undefined,
		payload: {},
		["~payloadReducers"]: Object.create(null),
		modules: new Set()
	};
	return ssrContext;
}
function setSSRError(ssrContext, error) {
	ssrContext.error = true;
	ssrContext.payload = { error };
	ssrContext.url = error.url;
}

const renderSSRHeadOptions = {"omitLineBreaks":true};

// @ts-expect-error private property consumed by vite-generated url helpers
globalThis.__buildAssetsURL = buildAssetsURL;
// @ts-expect-error private property consumed by vite-generated url helpers
globalThis.__publicAssetsURL = publicAssetsURL;
const HAS_APP_TELEPORTS = !!(appTeleportAttrs.id);
const APP_TELEPORT_OPEN_TAG = HAS_APP_TELEPORTS ? `<${appTeleportTag}${propsToString(appTeleportAttrs)}>` : "";
const APP_TELEPORT_CLOSE_TAG = HAS_APP_TELEPORTS ? `</${appTeleportTag}>` : "";
const PAYLOAD_URL_RE = /^[^?]*\/_payload.json(?:\?.*)?$/ ;
const PAYLOAD_FILENAME = "_payload.json" ;
const handler = defineRenderHandler((event) => {
	
	const ssrError = event.path.startsWith("/__nuxt_error") ? getQuery(event) : null;
	if (ssrError && !("__unenv__" in event.node.req)) {
		throw createError({
			status: 404,
			statusText: "Page Not Found: /__nuxt_error",
			message: "Page Not Found: /__nuxt_error"
		});
	}
	return renderRoute(event, ssrError);
});
async function renderRoute(event, ssrError) {
	const nitroApp = useNitroApp();
	
	const ssrContext = createSSRContext(event);
	
	const headEntryOptions = { mode: "server" };
	ssrContext.head.push(appHead, headEntryOptions);
	if (ssrError) {
		
		const status = ssrError.status || ssrError.statusCode;
		if (status) {
			
			ssrError.status = ssrError.statusCode = Number.parseInt(status);
		}
		if (typeof ssrError.data === "string") {
			try {
				ssrError.data = destr(ssrError.data);
			} catch {}
		}
		setSSRError(ssrContext, ssrError);
	}
	
	const routeOptions = getRouteRules(event);
	if (routeOptions.ssr === false) {
		ssrContext.noSSR = true;
	}
	
	const _PAYLOAD_EXTRACTION = !ssrContext.noSSR && ((routeOptions.isr || routeOptions.cache));
	
	
	
	const _PAYLOAD_INLINE = !_PAYLOAD_EXTRACTION || NUXT_PAYLOAD_INLINE;
	const isRenderingPayload = (_PAYLOAD_EXTRACTION || false) && PAYLOAD_URL_RE.test(ssrContext.url);
	if (isRenderingPayload) {
		const url = ssrContext.url.substring(0, ssrContext.url.lastIndexOf("/")) || "/";
		ssrContext.url = url;
		event._path = event.node.req.url = url;
		if (payloadCache && await payloadCache.hasItem(url + ".json")) {
			return payloadCache.getItem(url + ".json");
		}
	}
	const payloadURL = _PAYLOAD_EXTRACTION ? joinURL(ssrContext.runtimeConfig.app.cdnURL || ssrContext.runtimeConfig.app.baseURL, ssrContext.url.replace(/\?.*$/, ""), PAYLOAD_FILENAME) + "?" + ssrContext.runtimeConfig.app.buildId : undefined;
	
	const renderer = await getRenderer(ssrContext);
	const _rendered = await renderer.renderToString(ssrContext).catch(async (error) => {
		
		
		if ((ssrContext["~renderResponse"] || ssrContext._renderResponse) && error.message === "skipping render") {
			return {};
		}
		
		const _err = !ssrError && ssrContext.payload?.error || error;
		await ssrContext.nuxt?.hooks.callHook("app:error", _err);
		throw _err;
	});
	
	
	const inlinedStyles = [];
	await ssrContext.nuxt?.hooks.callHook("app:rendered", {
		ssrContext,
		renderResult: _rendered
	});
	if (ssrContext["~renderResponse"] || ssrContext._renderResponse) {
		
		return ssrContext["~renderResponse"] || ssrContext._renderResponse;
	}
	
	if (ssrContext.payload?.error && !ssrError) {
		throw ssrContext.payload.error;
	}
	
	if (isRenderingPayload) {
		const response = renderPayloadResponse(ssrContext);
		if (payloadCache) {
			await payloadCache.setItem(ssrContext.url + ".json", response);
		}
		return response;
	}
	if (_PAYLOAD_EXTRACTION) {
		
		
		if (payloadCache) {
			await payloadCache.setItem((ssrContext.url === "/" ? "/" : ssrContext.url.replace(/\/$/, "")) + ".json", renderPayloadResponse(ssrContext));
		}
	}
	const NO_SCRIPTS = routeOptions.noScripts;
	
	const { styles, scripts } = getRequestDependencies(ssrContext, renderer.rendererContext);
	
	
	if (_PAYLOAD_EXTRACTION && !_PAYLOAD_INLINE && !NO_SCRIPTS) {
		ssrContext.head.push({ link: [{
			rel: "preload",
			as: "fetch",
			crossorigin: "anonymous",
			href: payloadURL
		} ] }, headEntryOptions);
	}
	
	if (inlinedStyles.length) {
		ssrContext.head.push({ style: inlinedStyles });
	}
	const link = [];
	for (const resource of Object.values(styles)) {
		
		
		
		link.push({
			rel: "stylesheet",
			href: renderer.rendererContext.buildAssetsURL(resource.file),
			crossorigin: ""
		});
	}
	if (link.length) {
		ssrContext.head.push({ link }, headEntryOptions);
	}
	if (!NO_SCRIPTS) {
		
		
		
		if (ssrContext["~lazyHydratedModules"]) {
			for (const id of ssrContext["~lazyHydratedModules"]) {
				ssrContext.modules?.delete(id);
			}
		}
		ssrContext.head.push({ link: getPreloadLinks(ssrContext, renderer.rendererContext) }, headEntryOptions);
		ssrContext.head.push({ link: getPrefetchLinks(ssrContext, renderer.rendererContext) }, headEntryOptions);
		
		ssrContext.head.push({ script: _PAYLOAD_INLINE ? renderPayloadJsonScript({
			ssrContext,
			data: ssrContext.payload
		})  : renderPayloadJsonScript({
			ssrContext,
			data: splitPayload(ssrContext).initial,
			src: payloadURL
		})  }, {
			...headEntryOptions,
			
			tagPosition: "bodyClose",
			tagPriority: "high"
		});
	}
	
	if (!routeOptions.noScripts) {
		const tagPosition = "head";
		ssrContext.head.push({ script: Object.values(scripts).map((resource) => ({
			type: resource.module ? "module" : null,
			src: renderer.rendererContext.buildAssetsURL(resource.file),
			defer: resource.module ? null : true,
			
			
			tagPosition,
			crossorigin: ""
		})) }, headEntryOptions);
	}
	const { headTags, bodyTags, bodyTagsOpen, htmlAttrs, bodyAttrs } = await renderSSRHead(ssrContext.head, renderSSRHeadOptions);
	
	const htmlContext = {
		htmlAttrs: htmlAttrs ? [htmlAttrs] : [],
		head: normalizeChunks([headTags]),
		bodyAttrs: bodyAttrs ? [bodyAttrs] : [],
		bodyPrepend: normalizeChunks([bodyTagsOpen, ssrContext.teleports?.body]),
		body: [_rendered.html, APP_TELEPORT_OPEN_TAG + (HAS_APP_TELEPORTS ? joinTags([ssrContext.teleports?.[`#${appTeleportAttrs.id}`]]) : "") + APP_TELEPORT_CLOSE_TAG],
		bodyAppend: [bodyTags]
	};
	
	await nitroApp.hooks.callHook("render:html", htmlContext, { event });
	
	return {
		body: renderHTMLDocument(htmlContext),
		statusCode: getResponseStatus(event),
		statusMessage: getResponseStatusText(event),
		headers: {
			"content-type": "text/html;charset=utf-8",
			"x-powered-by": "Nuxt"
		}
	};
}
function normalizeChunks(chunks) {
	const result = [];
	for (const _chunk of chunks) {
		const chunk = _chunk?.trim();
		if (chunk) {
			result.push(chunk);
		}
	}
	return result;
}
function joinTags(tags) {
	return tags.join("");
}
function joinAttrs(chunks) {
	if (chunks.length === 0) {
		return "";
	}
	return " " + chunks.join(" ");
}
function renderHTMLDocument(html) {
	return "<!DOCTYPE html>" + `<html${joinAttrs(html.htmlAttrs)}>` + `<head>${joinTags(html.head)}</head>` + `<body${joinAttrs(html.bodyAttrs)}>${joinTags(html.bodyPrepend)}${joinTags(html.body)}${joinTags(html.bodyAppend)}</body>` + "</html>";
}

const renderer = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: handler
}, Symbol.toStringTag, { value: 'Module' }));

export { useHead as a, headSymbol as h, renderer as r, useSeoMeta as u };
//# sourceMappingURL=renderer.mjs.map

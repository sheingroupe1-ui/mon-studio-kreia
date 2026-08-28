//#region node_modules/.nitro/vite/services/ssr/assets/_tanstack-start-manifest_v-1t62k5V1.js
var tsrStartManifest = () => ({ routes: {
	__root__: {
		filePath: "/workspace/src/routes/__root.tsx",
		children: [
			"/",
			"/new",
			"/projects",
			"/kreia/jobs"
		],
		preloads: ["/assets/index-BkXKQs96.js", "/assets/useStore-DkUXc2QZ.js"],
		scripts: [{ attrs: {
			type: "module",
			async: !0,
			src: "/assets/index-BkXKQs96.js"
		} }]
	},
	"/": {
		filePath: "/workspace/src/routes/index.tsx",
		children: void 0,
		preloads: [
			"/assets/routes-j1rzulym.js",
			"/assets/store-DDqBOTJq.js",
			"/assets/clapperboard-Blcv31dJ.js"
		]
	},
	"/new": {
		filePath: "/workspace/src/routes/new.tsx",
		children: void 0,
		preloads: [
			"/assets/new-nPbh9PaL.js",
			"/assets/store-DDqBOTJq.js",
			"/assets/job-client-B8d2-_6r.js",
			"/assets/kinds-C75jLX4k.js"
		]
	},
	"/projects": {
		filePath: "/workspace/src/routes/projects.tsx",
		children: ["/projects/$id", "/projects/"],
		preloads: ["/assets/projects-C4ZMhPy1.js"]
	},
	"/projects/$id": {
		filePath: "/workspace/src/routes/projects.$id.tsx",
		children: void 0,
		preloads: [
			"/assets/projects._id-Cgu4Zahh.js",
			"/assets/store-DDqBOTJq.js",
			"/assets/job-client-B8d2-_6r.js",
			"/assets/kinds-C75jLX4k.js"
		]
	},
	"/projects/": {
		filePath: "/workspace/src/routes/projects.index.tsx",
		children: void 0,
		preloads: [
			"/assets/projects.index-Zr1BhWov.js",
			"/assets/store-DDqBOTJq.js",
			"/assets/clapperboard-Blcv31dJ.js",
			"/assets/kinds-C75jLX4k.js"
		]
	}
} });
//#endregion
export { tsrStartManifest };

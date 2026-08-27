//#region node_modules/.nitro/vite/services/ssr/assets/_tanstack-start-manifest_v-q58kMPMY.js
var tsrStartManifest = () => ({ routes: {
	__root__: {
		filePath: "/workspace/src/routes/__root.tsx",
		children: [
			"/",
			"/new",
			"/projects"
		],
		preloads: ["/assets/index-DtaugdH4.js", "/assets/useStore-DkUXc2QZ.js"],
		scripts: [{ attrs: {
			type: "module",
			async: !0,
			src: "/assets/index-DtaugdH4.js"
		} }]
	},
	"/": {
		filePath: "/workspace/src/routes/index.tsx",
		children: void 0,
		preloads: [
			"/assets/routes-CprI5Raz.js",
			"/assets/store-CRnHxqCS.js",
			"/assets/clapperboard-Wj4vEHI9.js"
		]
	},
	"/new": {
		filePath: "/workspace/src/routes/new.tsx",
		children: void 0,
		preloads: [
			"/assets/new-ByNJB3bg.js",
			"/assets/rpc-5ErbK5uN.js",
			"/assets/store-CRnHxqCS.js",
			"/assets/kinds-Da0tu453.js"
		]
	},
	"/projects": {
		filePath: "/workspace/src/routes/projects.tsx",
		children: ["/projects/$id", "/projects/"],
		preloads: ["/assets/projects-CynlOiNP.js"]
	},
	"/projects/$id": {
		filePath: "/workspace/src/routes/projects.$id.tsx",
		children: void 0,
		preloads: [
			"/assets/projects._id-CwP-ChLR.js",
			"/assets/rpc-5ErbK5uN.js",
			"/assets/store-CRnHxqCS.js",
			"/assets/kinds-Da0tu453.js"
		]
	},
	"/projects/": {
		filePath: "/workspace/src/routes/projects.index.tsx",
		children: void 0,
		preloads: [
			"/assets/projects.index-Uqck2P7f.js",
			"/assets/store-CRnHxqCS.js",
			"/assets/clapperboard-Wj4vEHI9.js",
			"/assets/kinds-Da0tu453.js"
		]
	}
} });
//#endregion
export { tsrStartManifest };

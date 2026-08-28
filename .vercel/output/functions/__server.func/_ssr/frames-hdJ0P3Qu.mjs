//#region node_modules/.nitro/vite/services/ssr/assets/frames-hdJ0P3Qu.js
var MAX_WIDTH = 640;
var JPEG_QUALITY = .52;
function capturePlan(duration) {
	if (duration <= 8) return {
		display: 6,
		analysis: 6
	};
	if (duration <= 16) return {
		display: 10,
		analysis: 10
	};
	return {
		display: 12,
		analysis: 12
	};
}
function wait(el, event, timeoutMs = 12e3) {
	return new Promise((resolve, reject) => {
		const t = window.setTimeout(() => {
			cleanup();
			reject(/* @__PURE__ */ new Error("Lecture vidéo trop longue à démarrer."));
		}, timeoutMs);
		const onOk = () => {
			cleanup();
			resolve();
		};
		const onErr = () => {
			cleanup();
			reject(/* @__PURE__ */ new Error("Fichier vidéo incompatible ou corrompu."));
		};
		const cleanup = () => {
			window.clearTimeout(t);
			el.removeEventListener(event, onOk);
			el.removeEventListener("error", onErr);
		};
		el.addEventListener(event, onOk, { once: true });
		el.addEventListener("error", onErr, { once: true });
	});
}
async function loadVideoElement(src) {
	const video = document.createElement("video");
	video.muted = true;
	video.playsInline = true;
	video.preload = "auto";
	video.crossOrigin = "anonymous";
	video.src = src;
	video.load();
	await wait(video, "loadedmetadata");
	if (!Number.isFinite(video.duration) || video.duration < .4) throw new Error("Cette vidéo est trop courte pour être analysée.");
	try {
		await video.play();
		video.pause();
	} catch {}
	return video;
}
function frameTimes(duration) {
	const { display } = capturePlan(duration);
	const count = Math.max(4, display);
	const start = .12;
	const end = Math.max(.42, duration - .18);
	const raw = [];
	for (let i = 0; i < count; i += 1) raw.push(start + (end - start) * i / Math.max(1, count - 1));
	return uniqueTimes(raw, duration, count);
}
function uniqueTimes(values, duration, cap) {
	const all = values.map((t) => Math.min(duration - .05, Math.max(.05, t))).sort((a, b) => a - b);
	const unique = [];
	const minGap = duration <= 12 ? .35 : .22;
	for (const t of all) if (!unique.some((u) => Math.abs(u - t) < minGap)) unique.push(t);
	return unique.slice(0, cap);
}
async function seek(video, t) {
	if (Math.abs(video.currentTime - t) < .04) return;
	await new Promise((resolve, reject) => {
		const timer = window.setTimeout(() => {
			video.removeEventListener("seeked", onSeeked);
			reject(/* @__PURE__ */ new Error("Impossible d'extraire les images de cette vidéo."));
		}, 8e3);
		const onSeeked = () => {
			window.clearTimeout(timer);
			video.removeEventListener("seeked", onSeeked);
			resolve();
		};
		video.addEventListener("seeked", onSeeked);
		video.currentTime = t;
	});
}
function capture(video) {
	const w = video.videoWidth || 640;
	const h = video.videoHeight || 360;
	const scale = Math.min(1, MAX_WIDTH / w);
	const canvas = document.createElement("canvas");
	canvas.width = Math.max(2, Math.round(w * scale));
	canvas.height = Math.max(2, Math.round(h * scale));
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Capture d'image impossible sur cet appareil.");
	ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
	return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}
async function extractFrames(video, onProgress) {
	const times = frameTimes(video.duration);
	const frames = [];
	for (let i = 0; i < times.length; i += 1) {
		await seek(video, times[i]);
		await new Promise((r) => requestAnimationFrame(() => r(null)));
		frames.push({
			t: times[i],
			dataUrl: capture(video)
		});
		onProgress?.(i + 1, times.length);
	}
	return frames;
}
function pickFrameIndices(length, count) {
	if (length <= 0) return [];
	if (count <= 1) return [0];
	if (length <= count) return Array.from({ length }, (_, i) => i);
	const set = /* @__PURE__ */ new Set();
	set.add(0);
	set.add(length - 1);
	for (let i = 1; i < count - 1; i += 1) set.add(Math.round(i * (length - 1) / (count - 1)));
	return [...set].sort((a, b) => a - b).slice(0, count);
}
function loadImage(src) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(/* @__PURE__ */ new Error("Image illisible."));
		img.src = src;
	});
}
async function recodeDataUrl(dataUrl, opts) {
	if (!dataUrl.startsWith("data:image/")) return dataUrl;
	const img = await loadImage(dataUrl);
	const scale = Math.min(1, opts.maxWidth / Math.max(1, img.width));
	const canvas = document.createElement("canvas");
	canvas.width = Math.max(2, Math.round(img.width * scale));
	canvas.height = Math.max(2, Math.round(img.height * scale));
	const ctx = canvas.getContext("2d");
	if (!ctx) return dataUrl;
	ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
	return canvas.toDataURL("image/jpeg", opts.quality);
}
async function toAnalysisFrames(frames, opts) {
	const planned = capturePlan(frames.length ? frames[frames.length - 1].t : 0).analysis;
	const maxFrames = opts?.maxFrames ?? Math.max(4, planned);
	const maxWidth = opts?.maxWidth ?? 384;
	const quality = opts?.quality ?? .32;
	const maxChars = opts?.maxChars ?? 22e3;
	const indices = pickFrameIndices(frames.length, maxFrames);
	const out = [];
	for (const i of indices) {
		const f = frames[i];
		try {
			let dataUrl = await recodeDataUrl(f.dataUrl, {
				maxWidth,
				quality
			});
			if (dataUrl.length > maxChars) dataUrl = await recodeDataUrl(f.dataUrl, {
				maxWidth: Math.min(maxWidth, 320),
				quality: Math.min(quality, .26)
			});
			if (dataUrl.length > maxChars) dataUrl = await recodeDataUrl(f.dataUrl, {
				maxWidth: 256,
				quality: .22
			});
			out.push({
				t: f.t,
				dataUrl
			});
		} catch {
			out.push(f);
		}
	}
	return out;
}
function videoMetaFromElement(video, fileName, source, sourceUrl) {
	return {
		durationSeconds: video.duration,
		width: video.videoWidth,
		height: video.videoHeight,
		fileName,
		source,
		sourceUrl
	};
}
function formatDuration(seconds) {
	if (!Number.isFinite(seconds) || seconds < 0) return "—";
	const s = Math.round(seconds);
	const m = Math.floor(s / 60);
	const r = s % 60;
	return m > 0 ? `${m} min ${String(r).padStart(2, "0")} s` : `${r} s`;
}
function formatTimecode(seconds) {
	const s = Math.max(0, seconds);
	const m = Math.floor(s / 60);
	const r = s - m * 60;
	return `${String(m).padStart(2, "0")}:${r.toFixed(1).padStart(4, "0")}`;
}
//#endregion
export { toAnalysisFrames as a, loadVideoElement as i, formatDuration as n, videoMetaFromElement as o, formatTimecode as r, extractFrames as t };

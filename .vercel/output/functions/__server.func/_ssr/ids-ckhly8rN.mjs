//#region node_modules/.nitro/vite/services/ssr/assets/ids-ckhly8rN.js
function createId(prefix = "prj") {
	const rand = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
	return `${prefix}_${Date.now().toString(36)}_${rand}`;
}
function characterId(index) {
	return `CHARACTER_${String(index).padStart(2, "0")}`;
}
function fruitCharacterId(index) {
	return `FRUIT_CHARACTER_${String(index).padStart(2, "0")}`;
}
function angelCharacterId(index) {
	return `ANGEL_CHARACTER_${String(index).padStart(2, "0")}`;
}
//#endregion
export { fruitCharacterId as i, characterId as n, createId as r, angelCharacterId as t };

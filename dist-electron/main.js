import { BrowserWindow as e, app as t } from "electron";
import n from "node:path";
import { fileURLToPath as r } from "node:url";
//#region electron/main.ts
var i = n.dirname(r(import.meta.url));
process.env.DIST = n.join(i, "../dist"), process.env.VITE_PUBLIC = t.isPackaged ? process.env.DIST : n.join(process.env.DIST, "../public");
var a, o = process.env.VITE_DEV_SERVER_URL;
function s() {
	a = new e({
		width: 1200,
		height: 800,
		transparent: !0,
		titleBarStyle: "hiddenInset",
		vibrancy: "fullscreen-ui",
		backgroundColor: "#00000000",
		webPreferences: {
			preload: n.join(i, "preload.mjs"),
			nodeIntegration: !1,
			contextIsolation: !0
		}
	}), o ? a.loadURL(o) : a.loadFile(n.join(process.env.DIST, "index.html"));
}
t.on("window-all-closed", () => {
	process.platform !== "darwin" && (t.quit(), a = null);
}), t.whenReady().then(s);
//#endregion

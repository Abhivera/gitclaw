// Sandboxed Electron preloads support CommonJS, not ESM imports.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("gitclawDesktop", {
  platform: process.platform,
  configPath: ipcRenderer.sendSync("desktop:get-config-path"),
  getFirstRunComplete: () => ipcRenderer.invoke("desktop:get-first-run-complete"),
  openConfigFolder: () => ipcRenderer.invoke("desktop:open-config-folder"),
  openEnvFile: () => ipcRenderer.invoke("desktop:open-env-file"),
  restartApp: () => ipcRenderer.invoke("desktop:restart-app"),
  markFirstRunComplete: () => ipcRenderer.invoke("desktop:mark-first-run-complete"),
  chooseReviewFolder: () => ipcRenderer.invoke("desktop:choose-review-folder"),
  reviewLocalFolder: (confirmation) => ipcRenderer.invoke("desktop:review-local-folder", confirmation),
});

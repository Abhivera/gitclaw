import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("gitclawDesktop", {
  platform: process.platform,
  configPath: ipcRenderer.sendSync("desktop:get-config-path"),
  getFirstRunComplete: () => ipcRenderer.invoke("desktop:get-first-run-complete"),
  openConfigFolder: () => ipcRenderer.invoke("desktop:open-config-folder"),
  openEnvFile: () => ipcRenderer.invoke("desktop:open-env-file"),
  restartApp: () => ipcRenderer.invoke("desktop:restart-app"),
  markFirstRunComplete: () => ipcRenderer.invoke("desktop:mark-first-run-complete"),
});

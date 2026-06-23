import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("gitclawDesktop", {
  platform: process.platform,
});

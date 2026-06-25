import { app, BrowserWindow, Menu, Tray, dialog, shell, ipcMain, nativeImage } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getConfigDir, getEnvPath } from "./env.mjs";
import { isFirstRunComplete, markFirstRunComplete } from "./first-run.mjs";
import { getTrayIconPath } from "./paths.mjs";
import { CONFIGURATION_PATH } from "./routes.mjs";
import {
  NEXT_PORT,
  restartNextServer,
  startGitClawServer,
  stopGitClawServer,
  watchEnvFile,
} from "./server.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {BrowserWindow | null} */
let mainWindow = null;
/** @type {BrowserWindow | null} */
let splashWindow = null;
/** @type {Tray | null} */
let tray = null;
/** @type {{ port: number } | null} */
let serverInfo = null;
let isQuitting = false;
let isReloadingFromEnv = false;

function restartApp() {
  app.relaunch();
  app.exit(0);
}

function openConfigurationFile() {
  void shell.openPath(getEnvPath());
}

function openConfigurationFolder() {
  void shell.openPath(getConfigDir());
}

function showMainWindow() {
  if (!mainWindow) {
    return;
  }

  if (!mainWindow.isVisible()) {
    mainWindow.show();
  }

  mainWindow.focus();
}

function navigateInApp(routePath) {
  const port = serverInfo?.port ?? NEXT_PORT;
  showMainWindow();
  void mainWindow?.loadURL(`http://127.0.0.1:${port}${routePath}`);
}

function openConfigurationPage() {
  navigateInApp(CONFIGURATION_PATH);
}

function buildConfigurationMenuItems({ includePageLink = true } = {}) {
  const items = [];

  if (includePageLink) {
    items.push({
      label: "Configuration…",
      click: openConfigurationPage,
    });
    items.push({ type: "separator" });
  }

  items.push(
    {
      label: "Open configuration file",
      click: openConfigurationFile,
    },
    {
      label: "Open configuration folder",
      click: openConfigurationFolder,
    },
    { type: "separator" },
    {
      label: "Restart GitClaw",
      click: restartApp,
    },
  );

  return items;
}

function registerDesktopIpc() {
  ipcMain.on("desktop:get-config-path", (event) => {
    event.returnValue = getEnvPath();
  });

  ipcMain.handle("desktop:get-first-run-complete", () => isFirstRunComplete());

  ipcMain.handle("desktop:open-config-folder", async () => {
    await shell.openPath(getConfigDir());
  });

  ipcMain.handle("desktop:open-env-file", async () => {
    await shell.openPath(getEnvPath());
  });

  ipcMain.handle("desktop:restart-app", () => {
    restartApp();
  });

  ipcMain.handle("desktop:mark-first-run-complete", () => {
    markFirstRunComplete();
  });
}

function buildMenu() {
  const template = [
    {
      label: "File",
      submenu: [process.platform === "darwin" ? { role: "close" } : { role: "quit" }],
    },
    {
      label: "Settings",
      submenu: buildConfigurationMenuItems(),
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "GitClaw documentation",
          click: () => {
            shell.openExternal("https://github.com/Abhivera/gitclaw#readme");
          },
        },
        {
          label: "Report an issue",
          click: () => {
            shell.openExternal("https://github.com/Abhivera/gitclaw/issues");
          },
        },
      ],
    },
  ];

  if (process.platform === "darwin") {
    template.unshift({
      label: app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        {
          label: "Settings…",
          accelerator: "CmdOrCtrl+,",
          click: openConfigurationPage,
        },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createTray() {
  if (process.platform === "darwin") {
    return;
  }

  const iconPath = getTrayIconPath();
  const icon = nativeImage.createFromPath(iconPath);

  if (icon.isEmpty()) {
    console.warn(`[gitclaw] Tray icon not found at ${iconPath}`);
    return;
  }

  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip("GitClaw");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Show GitClaw",
        click: showMainWindow,
      },
      { type: "separator" },
      ...buildConfigurationMenuItems(),
      { type: "separator" },
      {
        label: "Quit GitClaw",
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]),
  );

  tray.on("click", showMainWindow);
}

async function reloadFromEnvChange() {
  if (isReloadingFromEnv || isQuitting) {
    return;
  }

  isReloadingFromEnv = true;

  try {
    serverInfo = await restartNextServer();
    if (mainWindow && !mainWindow.isDestroyed()) {
      let route = "/dashboard";
      try {
        const currentUrl = mainWindow.webContents.getURL();
        if (currentUrl.startsWith("http")) {
          route = new URL(currentUrl).pathname || "/dashboard";
        }
      } catch {
        // Keep default route.
      }

      await mainWindow.loadURL(`http://127.0.0.1:${serverInfo.port}${route}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[gitclaw] Failed to reload configuration: ${message}`);
    await showReloadError(message);
  } finally {
    isReloadingFromEnv = false;
  }
}

async function showReloadError(message) {
  const response = await dialog.showMessageBox({
    type: "error",
    title: "Configuration reload failed",
    message: "GitClaw could not reload your configuration",
    detail: message,
    buttons: ["Open configuration folder", "OK"],
    defaultId: 1,
    cancelId: 1,
    noLink: true,
  });

  if (response.response === 0) {
    await shell.openPath(getConfigDir());
  }
}

async function showStartupError(message) {
  const response = await dialog.showMessageBox({
    type: "error",
    title: "GitClaw could not start",
    message: "GitClaw could not start",
    detail: message,
    buttons: ["Open configuration folder", "Quit"],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });

  if (response.response === 0) {
    await shell.openPath(getConfigDir());
  }

  app.quit();
}

async function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 280,
    frame: false,
    resizable: false,
    center: true,
    show: true,
    backgroundColor: "#0a0a0a",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  await splashWindow.loadFile(path.join(__dirname, "splash.html"));
}

async function createWindow() {
  const port = serverInfo?.port ?? NEXT_PORT;

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: process.platform !== "darwin",
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost")) {
      return { action: "allow" };
    }

    shell.openExternal(url);
    return { action: "deny" };
  });

  await mainWindow.loadURL(`http://127.0.0.1:${port}`);
}

async function bootstrap() {
  registerDesktopIpc();

  try {
    await createSplashWindow();
    serverInfo = await startGitClawServer();
    buildMenu();
    createTray();
    watchEnvFile(() => {
      void reloadFromEnvChange();
    });
    splashWindow?.close();
    splashWindow = null;
    await createWindow();
  } catch (error) {
    splashWindow?.close();
    splashWindow = null;
    const message = error instanceof Error ? error.message : String(error);
    await showStartupError(message);
  }
}

app.whenReady().then(bootstrap);

app.on("before-quit", async (event) => {
  if (isQuitting) {
    return;
  }

  event.preventDefault();
  isQuitting = true;
  tray?.destroy();
  tray = null;
  await stopGitClawServer();
  app.quit();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0 && serverInfo) {
    await createWindow();
  }
});

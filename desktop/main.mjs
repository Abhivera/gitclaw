import { app, BrowserWindow, Menu, Tray, dialog, shell, ipcMain } from "electron";
import path from "node:path";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { collectLocalSources } from "./local-files.mjs";
import { fileURLToPath } from "node:url";
import { getConfigDir, getEnvPath } from "./env.mjs";
import { isFirstRunComplete, markFirstRunComplete } from "./first-run.mjs";
import { getAppIconPath, loadAppIcon, loadTrayIcon } from "./paths.mjs";
import { CONFIGURATION_PATH } from "./routes.mjs";
import { isExternalWebUrl, isLocalAppUrl, isTrustedDesktopSender } from "./security.mjs";
import {
  NEXT_PORT,
  desktopToken,
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
let localSelection = null;
let localReviewRunning = false;
const smokeTest = process.argv.includes("--gitclaw-smoke-test");
if (smokeTest && process.env.GITCLAW_SMOKE_TEST_DATA_DIR) {
  fs.mkdirSync(process.env.GITCLAW_SMOKE_TEST_DATA_DIR, { recursive: true });
  app.setPath("userData", process.env.GITCLAW_SMOKE_TEST_DATA_DIR);
  app.disableHardwareAcceleration();
}

const primaryInstance = app.requestSingleInstanceLock();
if (!primaryInstance) app.quit();
app.on("second-instance", showMainWindow);

function restartApp() {
  app.relaunch();
  app.quit();
}

function openConfigurationFile() {
  void shell.openPath(getEnvPath());
}

function openConfigurationFolder() {
  void shell.openPath(getConfigDir());
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();

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
  const trustedSender = (event) => isTrustedDesktopSender(
    event, mainWindow?.webContents, serverInfo?.port ?? NEXT_PORT,
  );
  const requireTrustedSender = (event) => {
    if (!trustedSender(event)) throw new Error("Untrusted desktop IPC sender");
  };
  ipcMain.handle("desktop:choose-review-folder", async (event) => {
    requireTrustedSender(event);
    if (localReviewRunning) throw new Error("Wait for the current review to finish.");
    const picked = await dialog.showOpenDialog(mainWindow, { title: "Choose source folder to review", properties: ["openDirectory"] });
    if (picked.canceled || !picked.filePaths[0]) return null;
    const snapshot = await collectLocalSources(picked.filePaths[0]);
    const id = createHash("sha256").update(JSON.stringify({ folderName: snapshot.folderName, files: snapshot.files })).digest("hex");
    localSelection = { id, snapshot, expires: Date.now() + 10 * 60_000 };
    return {
      ...snapshot,
      id,
      files: snapshot.files.map(({ filePath, patch }) => ({ filePath, lines: patch.split("\n").length - 1 })),
    };
  });
  ipcMain.handle("desktop:review-local-folder", async (event, confirmation) => {
    requireTrustedSender(event);
    if (localReviewRunning) throw new Error("A local review is already running.");
    if (!localSelection || localSelection.expires < Date.now() ||
        confirmation?.confirmed !== true || confirmation.snapshotId !== localSelection.id ||
        typeof confirmation.destinationId !== "string") {
      throw new Error("Choose a folder and confirm the files and AI destination first.");
    }
    const { id, snapshot } = localSelection;
    localSelection = null; // Each confirmation authorizes only one request.
    localReviewRunning = true;
    try {
      const origin = `http://127.0.0.1:${serverInfo?.port ?? NEXT_PORT}`;
      const response = await fetch(`${origin}/api/desktop/local-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: origin, "x-gitclaw-desktop-token": desktopToken },
        body: JSON.stringify({ folderName: snapshot.folderName, files: snapshot.files,
          consent: { confirmed: true, snapshotId: id, destinationId: confirmation.destinationId } }),
        signal: AbortSignal.timeout(90_000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Local review failed.");
      return result;
    } finally { localReviewRunning = false; }
  });
  ipcMain.on("desktop:get-config-path", (event) => {
    event.returnValue = trustedSender(event) ? getEnvPath() : null;
  });

  ipcMain.handle("desktop:get-first-run-complete", (event) => {
    requireTrustedSender(event);
    return isFirstRunComplete();
  });

  ipcMain.handle("desktop:open-config-folder", async (event) => {
    requireTrustedSender(event);
    await shell.openPath(getConfigDir());
  });

  ipcMain.handle("desktop:open-env-file", async (event) => {
    requireTrustedSender(event);
    await shell.openPath(getEnvPath());
  });

  ipcMain.handle("desktop:restart-app", (event) => {
    requireTrustedSender(event);
    restartApp();
  });

  ipcMain.handle("desktop:mark-first-run-complete", (event) => {
    requireTrustedSender(event);
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

  const icon = loadTrayIcon();
  if (!icon) {
    console.warn(`[gitclaw] Tray icon not found at ${getAppIconPath()}`);
    return;
  }

  tray = new Tray(icon);
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
    show: !smokeTest,
    backgroundColor: "#0a0a0a",
    icon: loadAppIcon() ?? undefined,
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
    icon: loadAppIcon() ?? undefined,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.on("ready-to-show", () => {
    if (!smokeTest) mainWindow?.show();
  });
  mainWindow.on("closed", () => { mainWindow = null; localSelection = null; });

  mainWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    if (isLocalAppUrl(details.url, port)) {
      details.requestHeaders["x-gitclaw-desktop-token"] = desktopToken;
    } else {
      for (const key of Object.keys(details.requestHeaders)) {
        if (key.toLowerCase() === "x-gitclaw-desktop-token") delete details.requestHeaders[key];
      }
    }
    callback({ requestHeaders: details.requestHeaders });
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isLocalAppUrl(url, port)) {
      return { action: "allow" };
    }

    if (isExternalWebUrl(url)) void shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("did-create-window", (child) => {
    child.webContents.on("did-navigate", (_event, url) => {
      if (isLocalAppUrl(url, port) && new URL(url).pathname === "/dashboard/integrations") {
        void mainWindow?.loadURL(`http://127.0.0.1:${port}/dashboard/integrations`);
        child.close();
      }
    });
  });

  await mainWindow.loadURL(`http://127.0.0.1:${port}/dashboard/local-review`);
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
    if (smokeTest) {
      const bridgeReady = await mainWindow.webContents.executeJavaScript(
        "Boolean(window.gitclawDesktop && window.gitclawDesktop.configPath && typeof window.gitclawDesktop.restartApp === 'function')",
      );
      if (!bridgeReady) throw new Error("Desktop preload did not initialize");
      console.log("[desktop-smoke] PASS: database, migrations, server and sandboxed preload");
      app.quit();
    }
  } catch (error) {
    splashWindow?.close();
    splashWindow = null;
    const message = error instanceof Error ? error.message : String(error);
    if (smokeTest) {
      console.error(`[desktop-smoke] FAIL: ${message}`);
      await stopGitClawServer();
      app.exit(1);
      return;
    }
    await showStartupError(message);
  }
}

if (primaryInstance) app.whenReady().then(bootstrap);

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

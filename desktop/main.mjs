import { app, BrowserWindow, Menu, dialog, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getConfigDir } from "./env.mjs";
import { startGitClawServer, stopGitClawServer } from "./server.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {BrowserWindow | null} */
let mainWindow = null;
/** @type {{ port: number } | null} */
let serverInfo = null;
let isQuitting = false;

function buildMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Open configuration folder",
          click: () => {
            shell.openPath(getConfigDir());
          },
        },
        { type: "separator" },
        process.platform === "darwin" ? { role: "close" } : { role: "quit" },
      ],
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

async function createWindow() {
  const port = serverInfo?.port ?? 13100;

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
  try {
    serverInfo = await startGitClawServer();
    buildMenu();
    await createWindow();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    dialog.showErrorBox(
      "GitClaw could not start",
      `${message}\n\nCheck the configuration folder (File menu) and try again.`,
    );
    app.quit();
  }
}

app.whenReady().then(bootstrap);

app.on("before-quit", async (event) => {
  if (isQuitting) {
    return;
  }

  event.preventDefault();
  isQuitting = true;
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

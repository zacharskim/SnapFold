// filepath: /Users/mattzacharski/Desktop/my-electron-app/src/main.ts
import { app, Tray, Menu, BrowserWindow, nativeImage } from "electron";
import * as path from "path";

let tray: Tray | null = null;
let window: BrowserWindow | null = null;

app.whenReady().then(() => {
  const icon = nativeImage.createFromPath(path.join(__dirname, "tray-icon.png"));
  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    { label: "Item1", type: "radio" },
    { label: "Item2", type: "radio" },
    { label: "Item3", type: "radio", checked: true },
    { label: "Item4", type: "radio" }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip("This is my application");

  createWindow();
});

function createWindow() {
  window = new BrowserWindow({
    width: 300,
    height: 400,
    show: false,
    frame: false,
    resizable: false,
    fullscreenable: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  window.loadFile("index.html");
}

app.on("window-all-closed", () => {
  // Prevent the app from quitting when all windows are closed
});

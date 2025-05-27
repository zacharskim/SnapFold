import { app, Tray, Menu, BrowserWindow, nativeImage, ipcRenderer, ipcMain, screen } from "electron";
import * as path from "path";

let tray: Tray | null = null;
let controlBar: BrowserWindow | null = null;
let overlay: BrowserWindow | null = null;

app.whenReady().then(() => {
  const icon = nativeImage.createFromPath(path.join(__dirname, "../tray-icon.png"));
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Capture Bar",
      click: () => {
        if (!controlBar) {
          createControlBar();
        } else {
          controlBar.isVisible() ? controlBar.hide() : controlBar.show();
        }
      }
    },
    { label: "Quit", role: "quit" }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip("SnapFold OCR");
});

function createControlBar() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize; // Get screen dimensions

  controlBar = new BrowserWindow({
    width: 650,
    height: 220,
    frame: false,
    alwaysOnTop: true,
    focusable: true,
    resizable: false,
    show: false,
    transparent: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  controlBar.webContents.openDevTools();
  controlBar.loadFile("src/control-bar.html");
  controlBar.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  controlBar?.showInactive();
  controlBar?.showInactive(); // show first so OS accepts it
  controlBar?.setFocusable(false); // now it's unfocusable
  controlBar?.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  controlBar?.setAlwaysOnTop(true, "screen-saver");
  console.log(width, height, "ah");

  controlBar.on("closed", () => {
    controlBar = null;
  });

  // Listen for the close button event
  ipcMain.on("close-control-bar", () => {
    controlBar?.close();
  });

  // Listen for the export-to event and handle file export
  ipcMain.on("export-to", async () => {
    const { dialog } = require("electron");
    const fs = require("fs");

    // Temporarily hide the control bar
    if (controlBar) {
      controlBar.hide();
    }

    const result = await dialog.showSaveDialog({
      title: "Export File",
      defaultPath: "exported-file.txt",
      buttonLabel: "Save",
      filters: [
        { name: "Text Files", extensions: ["txt"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });

    // Show the control bar again after the dialog is closed
    if (controlBar) {
      controlBar.show();
    }

    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, "This is a randomly generated file content.");
    }
  });
}

ipcMain.on("show-overlay", () => {
  if (!overlay) {
    const { width, height } = screen.getPrimaryDisplay().bounds; // Get full screen dimensions
    console.log(width, height, "oh");

    overlay = new BrowserWindow({
      width: width,
      height: height,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    overlay.loadFile("src/overlay.html"); // Load the overlay HTML file
    overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    overlay.on("closed", () => {
      overlay = null;
    });
  }
});

app.on("window-all-closed", () => {
  // do nothing, we want tray to keep app alive
});

//control bar should have
//x button (icon)
//entire screen (icon)
//frame  (icon)
//export to....
//record (clickable text / button, but no button styling)

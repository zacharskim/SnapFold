import {
  app,
  Tray,
  Menu,
  BrowserWindow,
  nativeImage,
  ipcRenderer,
  ipcMain,
  screen,
  session,
} from "electron";
import * as path from "path";

const { desktopCapturer } = require("electron");

let tray: Tray | null = null;
let controlBar: BrowserWindow | null = null;
let overlay: BrowserWindow | null = null;
let windowSelected = false;

const updateContextMenu = () => {
  const contextMenu = Menu.buildFromTemplate([
    {
      label:
        controlBar && controlBar.isVisible()
          ? "Hide Capture Bar"
          : "Open Capture Bar",
      click: () => {
        if (!controlBar) {
          createControlBar();
        } else {
          controlBar.isVisible() ? controlBar.hide() : controlBar.show();
        }
        updateContextMenu(); // Update menu after action
      },
    },
    { label: "Quit", role: "quit" },
  ]);

  tray?.setContextMenu(contextMenu);
};

function createControlBar() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize; // Get screen dimensions

  controlBar = new BrowserWindow({
    width: 650,
    height: 75, //75
    frame: false,
    alwaysOnTop: true,
    focusable: true,
    resizable: false,
    show: false,
    transparent: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  controlBar.webContents.openDevTools();
  controlBar.loadFile("src/control-bar.html");
  controlBar.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  controlBar?.showInactive();
  controlBar?.showInactive(); // show first so OS accepts it
  controlBar?.setFocusable(false); // now it's unfocusable
  controlBar?.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  controlBar?.setAlwaysOnTop(true, "screen-saver");
  // console.log(width, height, "ah");

  controlBar.on("closed", () => {
    controlBar = null;
  });

  // Listen for the close button event
  ipcMain.on("close-control-bar", () => {
    if (controlBar) {
      controlBar.close();
      controlBar = null;
    }

    if (overlay) {
      overlay.close();
      overlay = null;
    }
  });

  ipcMain.on("close-overlay", () => {
    if (overlay) {
      overlay.close();
      overlay = null;
    }
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
        { name: "All Files", extensions: ["*"] },
      ],
    });

    // Show the control bar again after the dialog is closed
    if (controlBar) {
      controlBar.show();
    }

    if (!result.canceled && result.filePath) {
      fs.writeFileSync(
        result.filePath,
        "This is a randomly generated file content.",
      );
    }
  });
}

app.whenReady().then(() => {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, "assets", "tray-icon.png") // Path for packaged app
    : path.join(__dirname, "..", "assets", "tray-icon.png"); // Path for development mode

  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);
  tray.setToolTip("SnapFold OCR");

  session.defaultSession.setDisplayMediaRequestHandler(
    (request, callback) => {
      desktopCapturer
        .getSources({ types: ["screen"] })
        .then((sources: Electron.DesktopCapturerSource[]) => {
          // Grant access to the first screen found.
          callback({ video: sources[0], audio: "loopback" });
        });
      // If true, use the system picker if available.
      // Note: this is currently experimental. If the system picker
      // is available, it will be used and the media request handler
      // will not be invoked.
    },
    { useSystemPicker: true },
  );

  updateContextMenu();
});

ipcMain.on("toggle-selection", (event, selection) => {
  windowSelected = selection === "show-overlay" || selection === "full-screen";

  if (!overlay) {
    const { width, height } = screen.getPrimaryDisplay().bounds; // Get full screen dimensions
    // console.log(width, height, "oh");

    overlay = new BrowserWindow({
      width: width,
      height: height,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    // overlay.webContents.openDevTools();
    overlay.loadFile("src/overlay.html").then(() => {
      overlay?.webContents.send("set-mode", selection);
    });

    overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    //this should be only when the thing is recording...
    if (selection === "full-screen") {
      overlay.setIgnoreMouseEvents(true, { forward: true });
    }

    overlay.on("closed", () => {
      overlay = null;
      windowSelected = false; // Reset windowSelected when overlay is closed
    });
  } else {
    // Update windowSelected
    windowSelected =
      selection === "show-overlay" || selection === "full-screen";

    // Send mode change to existing overlay

    // Update mouse events if necessary
    if (selection === "full-screen") {
      //trigger a tooltip...
      // overlay.setIgnoreMouseEvents(true, { forward: true });
    } else {
      overlay.webContents.send("set-mode", selection);
      overlay.setIgnoreMouseEvents(false);
    }
  }
});

ipcMain.on("start-recording", () => {});

ipcMain.on("close-overlay", () => {
  if (overlay) {
    overlay.close();
    overlay = null;
  }
  windowSelected = false; // Reset windowSelected when overlay is closed
});

ipcMain.handle("get-window-selected", async () => {
  return windowSelected; // Return the current state of windowSelected
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

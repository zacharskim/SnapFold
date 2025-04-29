// // filepath: /Users/mattzacharski/Desktop/my-electron-app/src/main.ts
// import { app, Tray, Menu, BrowserWindow, nativeImage, globalShortcut } from "electron";
// import * as path from "path";

// let tray: Tray | null = null;
// let window: BrowserWindow | null = null;

// app.whenReady().then(() => {
//   const icon = nativeImage.createFromPath(path.join(__dirname, "../tray-icon.png"));
//   tray = new Tray(icon);
//   const contextMenu = Menu.buildFromTemplate([
//     { label: "Item1 howdy", type: "radio" },
//     { label: "Item2", type: "radio", click: () => {
//       if(!controlBar) {
//       }
//     } },
//     { label: "Item3", type: "radio", checked: true },
//     { label: "Item4", type: "radio" }

//   ]);

//   tray.setContextMenu(contextMenu);
//   tray.setToolTip("This is my application");

//   createWindow();
// });

// // function createWindow() {
// //   window = new BrowserWindow({
// //     width: 300,
// //     height: 400,
// //     show: false,
// //     frame: false,
// //     resizable: false,
// //     fullscreenable: false,
// //     transparent: true,
// //     alwaysOnTop: true,
// //     skipTaskbar: true,
// //     webPreferences: {
// //       nodeIntegration: true,
// //       contextIsolation: false
// //     }
// //   });

// //   window.loadFile("index.html");
// // }

// app.whenReady().then(() => {
//   globalShortcut.register("CommandOrControl+Shift+5", () => {
//     controlBar.show();
//   });
// });

// const controlBar = new BrowserWindow({
//   width: 400,
//   height: 50,
//   frame: false,
//   alwaysOnTop: true,
//   resizable: false,
//   transparent: true,
//   skipTaskbar: true,
//   webPreferences: {
//     nodeIntegration: true,
//     contextIsolation: false
//   }
// });
// controlBar.loadFile("control-bar.html");

// app.on("window-all-closed", () => {
//   // Prevent the app from quitting when all windows are closed
// });

import { app, Tray, Menu, BrowserWindow, nativeImage } from "electron";
import * as path from "path";

let tray: Tray | null = null;
let controlBar: BrowserWindow | null = null;

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

  controlBar.loadFile("src/control-bar.html");
  controlBar.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  controlBar?.showInactive();
  controlBar?.showInactive(); // show first so OS accepts it
  controlBar?.setFocusable(false); // now it's unfocusable
  controlBar?.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  controlBar?.setAlwaysOnTop(true, "screen-saver");

  controlBar.on("closed", () => {
    controlBar = null;
  });
}

app.on("window-all-closed", () => {
  // do nothing, we want tray to keep app alive
});

//control bar should have
//x button (icon)
//entire screen (icon)
//frame  (icon)
//export to....
//record (clickable text / button, but no button styling)

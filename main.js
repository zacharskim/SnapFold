// main.js
const { app, Tray, Menu, nativeImage } = require("electron");
const path = require("path");

let tray = null;
let window = null;

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
  //   tray.setTitle("This is my title");
});

// app.whenReady().then(() => {
//   try {
//     const trayIconPath = ;
//     console.log("Resolved tray icon path:", trayIconPath);
//     tray = new Tray(trayIconPath);G
//     console.log("Tray initialized successfully");
//   } catch (error) {
//     console.error("Failed to initialize tray icon:", error);
//   }

//   const contextMenu = Menu.buildFromTemplate([
//     { label: "Show App", click: toggleWindow },
//     { label: "Quit", click: () => app.quit() }
//   ]);

//   tray.setToolTip("SnapFold");
//   tray.setContextMenu(contextMenu);

//   tray.on("click", toggleWindow);

//   createWindow();
// });

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

function toggleWindow() {
  if (window.isVisible()) {
    window.hide();
  } else {
    const { x, y } = tray.getBounds();
    const { width, height } = window.getBounds();

    window.setBounds({
      x: x - Math.floor(width / 2),
      y: y + 25,
      width,
      height
    });

    window.show();
    window.focus();
  }
}

app.on("window-all-closed", (e) => {
  e.preventDefault(); // don't quit when window is closed
});

// Modules to control application life and create native browser window
const {app, BrowserWindow, Menu, ipcMain} = require('electron')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let jsonData
let fileName

const template = [
  { 
    label: 'File',
    submenu: [
      { 
        label: 'Save',
        accelerator: 'CmdOrCtrl+S',
        click() {
          mainWindow.send('request-to-save')
        }
      },
      { 
        label: 'Save As', 
        click() {
          mainWindow.send('request-to-saveas')
        }
      },
      { type: 'separator' },
      { 
        label: 'Open',
        accelerator: 'CmdOrCtrl+O',
        click() {
          mainWindow.send('request-to-open')
        }
      },
      { 
        label: 'New',
        accelerator: 'CommandOrControl+N',
        click() {
          mainWindow.send('new-table')
        }
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { label: 'Undo Table Change' },
      { role: 'redo' },
      { label: 'Redo Table Change' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'pasteandmatchstyle' },
      {
        label: 'Paste Table',
        accelerator: 'CommandOrControl+t',
        click() {
          mainWindow.send('paste-table')
        }
      },
      { type: 'separator'},
      { 
        label: 'Add Row',
        click() {
          mainWindow.send('new-row')
        }
      },
      {
        label: 'Add Column',
        click() {
          mainWindow.send('new-col')
        }
      },
      { type: 'separator'},
      { role: 'delete' },
      { role: 'selectall' }
    ]
  },
  {
    label: 'Settings',
    submenu: [
      { 
        type: 'radio',
        id: 'convert-to-js-object',
        label: 'Format as Javascript Object',
        checked: true,
        click(menuItem) {
          mainWindow.webContents.send('convert-to-js-object')
          console.log(menuItem.checked, menuItem.id)
        }
       },
      { 
        type: 'radio',
        id: 'convert-to-json',
        label: 'Format as JSON',
        checked: false,
        click(menuItem) {
          mainWindow.webContents.send('convert-to-json')
          console.log(menuItem.checked, menuItem.id)
        }
       },
       { type: 'separator' },
       { 
         label: 'More Settings',
         click() {
           settingsWin ? settingsWin.focus() : openSettingsWin()
         }
        }
    ]
  },
  {
    label: 'View',
    submenu: [
      { 
        label: 'Preview File',
        id: 'preview',
        accelerator: 'CommandOrControl+shift+p',
        click() {
          previewWin ? previewWin.focus() : openPreviewWin();
        }
      },
      {
        label: 'Show in Folder',
        id: 'open-in-file-explorer',
        accelerator: 'CommandOrControl+shift+o',
        click() {
          mainWindow.send('open-in-editor')
        }
      },
      { type: 'separator' },
      {
        role: 'reload',
        id: 'reload'
      },
      { role: 'forcereload' },
      { role: 'toggledevtools' },
      { type: 'separator' },
      { role: 'resetzoom' },
      { role: 'zoomin' },
      { role: 'zoomout' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    role: 'window',
    submenu: [
      { role: 'minimize' },
      { role: 'close' }
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click () { require('electron').shell.openExternal('https://electronjs.org') }
      }
    ]
  }
]

if (process.platform === 'darwin') {
  template.unshift({
    label: app.getName(),
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  })

  // Edit menu
  template[1].submenu.push(
    { type: 'separator' },
    {
      label: 'Speech',
      submenu: [
        { role: 'startspeaking' },
        { role: 'stopspeaking' }
      ]
    }
  )

  // Window menu
  template[3].submenu = [
    { role: 'close' },
    { role: 'minimize' },
    { role: 'zoom' },
    { type: 'separator' },
    { role: 'front' }
  ]
}

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

let mainWindow
let previewWin
let settingsWin

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  mainWindow.loadFile('index.html')

  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.send('reload-data', jsonData, fileName)
  })
  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

function openPreviewWin () {
  previewWin = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  previewWin.webContents.on('dom-ready', () => {
    mainWindow.send('request-json-preview')
  })

  previewWin.on('focus', () => {
    mainWindow.send('request-json-preview')
  })

  const previewMenu = Menu.buildFromTemplate([
    { role: 'reload' },
    menu.getMenuItemById('open-in-file-explorer')
  ])
  previewWin.setMenu(previewMenu)

  previewWin.loadFile('./views/previewWin.html')

  previewWin.on('closed', function () {
    previewWin = null
  })
}

function openSettingsWin () {
  settingsWin = new BrowserWindow({
    width: 300,
    height: 400,
    webPreferences: {
      nodeIntegration: true
    }
  })

  settingsWin.webContents.on('dom-ready', () => {
    mainWindow.send('request-settings-data')
  })

  const settingsMenu =  Menu.buildFromTemplate([
    menu.getMenuItemById('preview'),
    menu.getMenuItemById('open-in-file-explorer'),
    { role: 'toggledevtools' }
  ])

  settingsWin.setMenu(settingsMenu)

  settingsWin.loadFile('./views/settingsWin.html')

  settingsWin.on('closed', function () {
    settingsWin = null
  })
}

ipcMain.on('json-data', (e, jsonData) => {
  previewWin.send('json-data', jsonData);
})

ipcMain.on('settings-data', (e, settings) => {
  settingsWin.send('settings-data', settings)
})

ipcMain.on('update-settings-data', (e, settings) => {
  mainWindow.send('update-settings-data', settings)
  settingsWin.close()
})

app.on('open-file', (e) => {
  e.preventDefault();
  console.log(e);
  console.log(process.argv);
})

ipcMain.on('reload-data', (e, data, name) => {
  jsonData = data;
  fileName = name;
})

ipcMain.on('open-settings', () => {
  settingsWin ? settingsWin.focus() : openSettingsWin()
})

ipcMain.on('convert-to-js-object', () => {
  menu.getMenuItemById('convert-to-js-object').checked = true;
})

ipcMain.on('convert-to-json', () => {
  menu.getMenuItemById('convert-to-json').checked = true;
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

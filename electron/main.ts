import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null
let previewWin: BrowserWindow | null
let controlsWin: BrowserWindow | null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
const MODULAR_WINDOWS = process.env.MODULAR_WINDOWS === '1'

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    transparent: true,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'fullscreen-ui',
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }
}

function loadPanelWindow(target: BrowserWindow, panel: 'preview' | 'controls') {
  if (VITE_DEV_SERVER_URL) {
    const url = new URL(VITE_DEV_SERVER_URL)
    url.searchParams.set('panel', panel)
    target.loadURL(url.toString())
  } else {
    target.loadFile(path.join(process.env.DIST, 'index.html'), {
      search: `panel=${panel}`,
    })
  }
}

function createModularWindows() {
  previewWin = new BrowserWindow({
    width: 980,
    height: 760,
    x: 420,
    y: 70,
    transparent: true,
    title: 'Camo Preview',
    titleBarStyle: 'hiddenInset',
    vibrancy: 'fullscreen-ui',
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  controlsWin = new BrowserWindow({
    width: 380,
    height: 760,
    x: 20,
    y: 70,
    transparent: true,
    title: 'Camo Controls',
    titleBarStyle: 'hiddenInset',
    vibrancy: 'fullscreen-ui',
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  loadPanelWindow(previewWin, 'preview')
  loadPanelWindow(controlsWin, 'controls')
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.whenReady().then(() => {
  if (MODULAR_WINDOWS) {
    createModularWindows()
  } else {
    createWindow()
  }
})

import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // expose electron API if needed
})
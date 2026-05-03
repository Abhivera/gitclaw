import { contextBridge, ipcRenderer } from 'electron'
import { ALLOWED_INVOKE_CHANNELS, ALLOWED_SEND_CHANNELS } from './utils/constants'

const invokeSet = new Set<string>(ALLOWED_INVOKE_CHANNELS)
const sendSet = new Set<string>(ALLOWED_SEND_CHANNELS)

contextBridge.exposeInMainWorld('api', {
  invoke: (channel: string, ...args: unknown[]) => {
    if (!invokeSet.has(channel)) {
      throw new Error(`IPC channel "${channel}" is not allowed`)
    }
    return ipcRenderer.invoke(channel, ...args)
  },
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    if (!sendSet.has(channel)) {
      throw new Error(`IPC channel "${channel}" is not allowed`)
    }
    const handler = (_event: Electron.IpcRendererEvent, ...args: unknown[]) =>
      callback(...args)
    ipcRenderer.on(channel, handler)
    return () => {
      ipcRenderer.removeListener(channel, handler)
    }
  },
})

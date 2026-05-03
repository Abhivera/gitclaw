import { useEffect } from 'react'

export function ipcInvoke<T = unknown>(
  channel: string,
  ...args: unknown[]
): Promise<T> {
  return window.api.invoke(channel, ...args) as Promise<T>
}

export function useIpcListener(
  channel: string,
  callback: (...args: unknown[]) => void,
) {
  useEffect(() => {
    const unsubscribe = window.api.on(channel, callback)
    return unsubscribe
  }, [channel, callback])
}

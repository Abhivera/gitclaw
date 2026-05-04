import { useState, useEffect, useCallback } from 'react'
import { ipcInvoke } from './useIpc'
import type { AppSettings } from '../types'

const IPC = {
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
}

const defaultSettings: AppSettings = {
  gitProvider: 'github',
  gitToken: '',
  gitlabBaseUrl: 'https://gitlab.com',
  bitbucketUsername: '',
  backupPath: '',
  repoFilters: {
    owned: true,
    organization: false,
    starred: false,
    forked: false,
    collaborator: false,
  },
  selectedRepoIds: [],
  schedule: {
    enabled: false,
    frequency: 'daily',
    time: '02:00',
  },
  concurrencyLimit: 5,
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ipcInvoke<AppSettings>(IPC.SETTINGS_GET).then((s) => {
      setSettings({ ...defaultSettings, ...s })
      setLoading(false)
    })
  }, [])

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    await ipcInvoke(IPC.SETTINGS_SET, partial)
    setSettings((prev) => ({ ...prev, ...partial }))
  }, [])

  return { settings, updateSettings, loading }
}

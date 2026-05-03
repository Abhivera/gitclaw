import path from 'path'
import os from 'os'
import { app } from 'electron'
import Store from 'electron-store'
import type { GitProvider } from '../src/types'

/** Fallback when `electron` APIs are unavailable (e.g. `ELECTRON_RUN_AS_NODE` set). Matches typical `userData` for productName GitClaw. */
function fallbackConfigDir(): string {
  const name = 'GitClaw'
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', name)
  }
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), name)
  }
  return path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), name)
}

function storeCwd(): string {
  try {
    if (typeof app?.getPath === 'function') return app.getPath('userData')
  } catch {
    /* ignore */
  }
  return fallbackConfigDir()
}

interface StoreSchema {
  /** @deprecated use gitToken; kept for migration */
  githubToken: string
  gitProvider: GitProvider
  gitToken: string
  gitlabBaseUrl: string
  bitbucketUsername: string
  backupPath: string
  cloudProvider: 's3' | 'r2' | 'none'
  cloudConfig: {
    bucket: string
    region: string
    accessKeyId: string
    secretAccessKey: string
    endpoint?: string
    pathPrefix?: string
  }
  repoFilters: {
    owned: boolean
    organization: boolean
    starred: boolean
    forked: boolean
    collaborator: boolean
  }
  selectedRepoIds: string[] | number[]
  schedule: {
    enabled: boolean
    frequency: 'daily' | 'weekly' | 'monthly'
    time: string
    dayOfWeek?: number
    dayOfMonth?: number
  }
  concurrencyLimit: number
}

const store = new Store<StoreSchema>({
  name: 'gitclaw-config',
  cwd: storeCwd(),
  encryptionKey: 'gitclaw-v1-enc',
  defaults: {
    githubToken: '',
    gitProvider: 'github',
    gitToken: '',
    gitlabBaseUrl: 'https://gitlab.com',
    bitbucketUsername: '',
    backupPath: '',
    cloudProvider: 'none',
    cloudConfig: {
      bucket: '',
      region: 'us-east-1',
      accessKeyId: '',
      secretAccessKey: '',
    },
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
  },
})

export default store

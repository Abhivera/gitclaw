import { app } from 'electron'
import Store from 'electron-store'
import type { GitProvider } from '../src/types'

interface StoreSchema {
  gitProvider: GitProvider
  gitToken: string
  gitlabBaseUrl: string
  bitbucketUsername: string
  backupPath: string
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
  cwd: app.getPath('userData'),
  encryptionKey: 'gitclaw-v1-enc',
  defaults: {
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
  },
})

export default store

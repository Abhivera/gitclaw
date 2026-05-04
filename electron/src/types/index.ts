export type GitProvider = 'github' | 'gitlab' | 'bitbucket'

export interface AppSettings {
  gitProvider: GitProvider
  gitToken: string
  gitlabBaseUrl: string
  bitbucketUsername: string
  backupPath: string
  repoFilters: RepoFilterSet
  selectedRepoIds: string[]
  schedule: ScheduleConfig
  concurrencyLimit: number
}

export interface RepoFilterSet {
  owned: boolean
  organization: boolean
  starred: boolean
  forked: boolean
  collaborator: boolean
}

export interface RepoInfo {
  id: string
  name: string
  fullName: string
  cloneUrl: string
  isPrivate: boolean
  isFork: boolean
  owner: string
  description: string | null
  updatedAt: string
  size: number
  source: 'owned' | 'org' | 'starred' | 'forked' | 'collaborator'
}

export type RepoBackupStage =
  | 'pending'
  | 'cloning'
  | 'updating'
  | 'compressing'
  | 'done'
  | 'failed'
  | 'skipped'

export interface RepoBackupStatus {
  repoId: string
  repoName: string
  stage: RepoBackupStage
  progress: number
  error?: string
  startedAt?: number
  completedAt?: number
}

export interface BackupProgress {
  totalRepos: number
  completed: number
  failed: number
  skipped: number
  currentBatch: RepoBackupStatus[]
  overallPercent: number
}

export interface LogEntry {
  timestamp: number
  level: 'info' | 'warn' | 'error'
  message: string
  repoName?: string
}

export interface BackupSummary {
  totalRepos: number
  succeeded: number
  failed: number
  skipped: number
  duration: number
  errors: Array<{ repoName: string; error: string }>
}

export interface ScheduleConfig {
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  time: string
  dayOfWeek?: number
  dayOfMonth?: number
}

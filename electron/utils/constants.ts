export const IPC = {
  REMOTE_VALIDATE_TOKEN: 'remote:validate-token',
  REMOTE_FETCH_REPOS: 'remote:fetch-repos',

  GIT_CLONE: 'git:clone',
  GIT_PULL: 'git:pull',

  BACKUP_START: 'backup:start',
  BACKUP_CANCEL: 'backup:cancel',
  BACKUP_PROGRESS: 'backup:progress',
  BACKUP_LOG: 'backup:log',
  BACKUP_COMPLETE: 'backup:complete',

  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  SCHEDULE_SET: 'schedule:set',
  SCHEDULE_GET: 'schedule:get',

  DIALOG_SELECT_FOLDER: 'dialog:select-folder',
} as const

export const ALLOWED_SEND_CHANNELS = [
  IPC.BACKUP_PROGRESS,
  IPC.BACKUP_LOG,
  IPC.BACKUP_COMPLETE,
] as const

export const ALLOWED_INVOKE_CHANNELS = [
  IPC.REMOTE_VALIDATE_TOKEN,
  IPC.REMOTE_FETCH_REPOS,
  IPC.GIT_CLONE,
  IPC.GIT_PULL,
  IPC.BACKUP_START,
  IPC.BACKUP_CANCEL,
  IPC.SETTINGS_GET,
  IPC.SETTINGS_SET,
  IPC.SCHEDULE_SET,
  IPC.SCHEDULE_GET,
  IPC.DIALOG_SELECT_FOLDER,
] as const

export const DEFAULTS = {
  CONCURRENCY_LIMIT: 5,
  BACKUP_PATH: '',
} as const

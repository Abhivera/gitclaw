import { useState, useCallback, useRef, useEffect } from 'react'
import { useIpcListener } from './useIpc'
import type { RepoBackupStatus, LogEntry, BackupSummary } from '../types'

export function useBackupProgress() {
  const [statuses, setStatuses] = useState<Map<string, RepoBackupStatus>>(new Map())
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [summary, setSummary] = useState<BackupSummary | null>(null)
  const [running, setRunning] = useState(false)
  const statusesRef = useRef(statuses)

  useEffect(() => {
    statusesRef.current = statuses
  }, [statuses])

  const handleProgress = useCallback((...args: unknown[]) => {
    const status = args[0] as RepoBackupStatus
    setStatuses((prev) => {
      const next = new Map(prev)
      next.set(status.repoId, status)
      return next
    })
  }, [])

  const handleLog = useCallback((...args: unknown[]) => {
    const entry = args[0] as LogEntry
    setLogs((prev) => [...prev, entry])
  }, [])

  const handleComplete = useCallback((...args: unknown[]) => {
    const sum = args[0] as BackupSummary
    setSummary(sum)
    setRunning(false)
  }, [])

  useIpcListener('backup:progress', handleProgress)
  useIpcListener('backup:log', handleLog)
  useIpcListener('backup:complete', handleComplete)

  const reset = useCallback(() => {
    setStatuses(new Map())
    setLogs([])
    setSummary(null)
  }, [])

  const start = useCallback(() => {
    reset()
    setRunning(true)
  }, [reset])

  return {
    statuses: Array.from(statuses.values()),
    logs,
    summary,
    running,
    start,
    reset,
    setRunning,
  }
}

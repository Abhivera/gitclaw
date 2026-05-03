import * as cron from 'node-cron'
import type { ScheduleConfig } from '../src/types'

export class SchedulerService {
  private task: ReturnType<typeof cron.schedule> | null = null
  private onTrigger: (() => void) | null = null

  setTrigger(fn: () => void) {
    this.onTrigger = fn
  }

  start(config: ScheduleConfig) {
    this.stop()

    if (!config.enabled) return

    const expression = this.toCronExpression(config)

    this.task = cron.schedule(expression, () => {
      this.onTrigger?.()
    })
  }

  stop() {
    if (this.task) {
      this.task.stop()
      this.task = null
    }
  }

  getNextRun(config: ScheduleConfig): string | null {
    if (!config.enabled) return null
    // Return a human-readable description
    const time = config.time || '02:00'
    switch (config.frequency) {
      case 'daily':
        return `Daily at ${time}`
      case 'weekly': {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        return `${days[config.dayOfWeek ?? 0]} at ${time}`
      }
      case 'monthly':
        return `${config.dayOfMonth ?? 1}th of each month at ${time}`
      default:
        return null
    }
  }

  private toCronExpression(config: ScheduleConfig): string {
    const [hour, minute] = (config.time || '02:00').split(':').map(Number)

    switch (config.frequency) {
      case 'daily':
        return `${minute} ${hour} * * *`
      case 'weekly':
        return `${minute} ${hour} * * ${config.dayOfWeek ?? 0}`
      case 'monthly':
        return `${minute} ${hour} ${config.dayOfMonth ?? 1} * *`
      default:
        return `${minute} ${hour} * * *`
    }
  }
}

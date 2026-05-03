import {
  AlarmClock,
  Calendar,
  CalendarDays,
  CalendarRange,
  Clock,
  Loader2,
  PanelTop,
  Shield,
  Zap,
} from 'lucide-react'
import { useSettings } from '../hooks/useSettings'
import { InstallGitSection } from '../components/InstallGitSection'
import { PageHeader } from '../components/ui/PageHeader'
import { SectionIcon } from '../components/ui/SectionIcon'
import type { ScheduleConfig } from '../types'

const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function formatTimeDisplay(time: string): string {
  if (!time?.includes(':')) return time || '—'
  const [hs, ms] = time.split(':')
  const h = Number(hs)
  const m = Number(ms)
  if (Number.isNaN(h) || Number.isNaN(m)) return time
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

function scheduleSummaryText(s: ScheduleConfig): string {
  const t = formatTimeDisplay(s.time)
  if (s.frequency === 'daily') return `Backs up every day at ${t}.`
  if (s.frequency === 'weekly') {
    const day = WEEKDAY_FULL[s.dayOfWeek ?? 0]
    return `Backs up every ${day} at ${t}.`
  }
  const dom = s.dayOfMonth ?? 1
  return `Backs up on the ${ordinal(dom)} of each month at ${t}.`
}

function ordinal(n: number): string {
  const j = n % 10
  const k = n % 100
  if (j === 1 && k !== 11) return `${n}st`
  if (j === 2 && k !== 12) return `${n}nd`
  if (j === 3 && k !== 13) return `${n}rd`
  return `${n}th`
}

const FREQUENCY_OPTIONS: {
  id: ScheduleConfig['frequency']
  label: string
  hint: string
  Icon: typeof Calendar
}[] = [
  { id: 'daily', label: 'Daily', hint: 'Same time every day', Icon: Calendar },
  { id: 'weekly', label: 'Weekly', hint: 'Pick a weekday', Icon: CalendarDays },
  { id: 'monthly', label: 'Monthly', hint: 'Pick a calendar day', Icon: CalendarRange },
]

export default function SettingsPage() {
  const { settings, updateSettings, loading } = useSettings()

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-zinc-500">
        <Loader2 className="h-8 w-8 animate-spin text-[#8d6e9e]/80" strokeWidth={1.75} aria-hidden />
        <span className="text-sm">Loading…</span>
      </div>
    )
  }

  const schedule = settings.schedule
  const updateSchedule = (partial: Partial<ScheduleConfig>) => {
    updateSettings({ schedule: { ...schedule, ...partial } })
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Schedule automatic backups and tune how many repositories run in parallel."
      />

      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0e141c] shadow-xl shadow-black/25">
          <div className="border-b border-white/[0.05] bg-gradient-to-r from-[#8d6e9e]/[0.07] via-transparent to-transparent px-5 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <SectionIcon icon={Clock} variant="accent" />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-100">Scheduled backups</h3>
                  <p className="mt-1 max-w-md text-xs leading-relaxed text-zinc-500">
                    Runs in the background while GitClaw stays open. Keep it running (menu bar on macOS, system tray
                    on Windows and Linux) so the schedule can fire.
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3 self-end sm:self-center">
                <span
                  className={`text-xs font-medium tabular-nums ${
                    schedule.enabled ? 'text-[#c4b5ce]' : 'text-zinc-600'
                  }`}
                >
                  {schedule.enabled ? 'On' : 'Off'}
                </span>
                <button
                  type="button"
                  onClick={() => updateSchedule({ enabled: !schedule.enabled })}
                  className={`relative h-8 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8d6e9e]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e141c] ${
                    schedule.enabled ? 'bg-[#8d6e9e] shadow-inner shadow-[#502f4c]/40' : 'bg-zinc-800 ring-1 ring-zinc-700'
                  }`}
                  aria-pressed={schedule.enabled}
                  aria-label={schedule.enabled ? 'Turn off scheduled backups' : 'Turn on scheduled backups'}
                >
                  <span
                    className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ease-out ${
                      schedule.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="p-5">
            {!schedule.enabled && (
              <div className="flex gap-3 rounded-xl border border-dashed border-zinc-700/80 bg-zinc-950/30 px-4 py-4">
                <PanelTop className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" strokeWidth={2} aria-hidden />
                <p className="text-xs leading-relaxed text-zinc-500">
                  Turn scheduling on to choose how often backups run. Nothing runs on a schedule until you enable it
                  here.
                </p>
              </div>
            )}

            {schedule.enabled && (
              <div className="space-y-5">
                <div
                  className="flex gap-3 rounded-xl border border-[#8d6e9e]/20 bg-[#8d6e9e]/[0.08] px-4 py-3"
                  role="status"
                >
                  <AlarmClock className="mt-0.5 h-4 w-4 shrink-0 text-[#b29bbd]" strokeWidth={2} aria-hidden />
                  <p className="text-sm leading-snug text-[#e8e0ec]">{scheduleSummaryText(schedule)}</p>
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                    How often
                  </p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {FREQUENCY_OPTIONS.map(({ id, label, hint, Icon }) => {
                      const active = schedule.frequency === id
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => updateSchedule({ frequency: id })}
                          className={`flex flex-col items-start gap-2 rounded-xl border px-3 py-3 text-left transition-all ${
                            active
                              ? 'border-[#8d6e9e]/45 bg-[#8d6e9e]/12 shadow-[0_0_0_1px_rgba(141,110,158,0.12)]'
                              : 'border-white/[0.06] bg-zinc-950/25 hover:border-zinc-600/80 hover:bg-zinc-900/40'
                          }`}
                        >
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-lg ring-1 ${
                              active
                                ? 'bg-[#8d6e9e]/20 text-[#d1c6d6] ring-[#8d6e9e]/30'
                                : 'bg-zinc-900/80 text-zinc-500 ring-zinc-700/60'
                            }`}
                          >
                            <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                          </span>
                          <span>
                            <span className={`block text-sm font-medium ${active ? 'text-zinc-100' : 'text-zinc-400'}`}>
                              {label}
                            </span>
                            <span className="mt-0.5 block text-[11px] leading-tight text-zinc-600">{hint}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
                  <div>
                    <label
                      htmlFor="schedule-time"
                      className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500"
                    >
                      Run at
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-zinc-950/50 px-3 py-2 ring-1 ring-transparent transition-shadow focus-within:border-[#8d6e9e]/40 focus-within:ring-[#8d6e9e]/25">
                      <Clock className="h-4 w-4 shrink-0 text-zinc-500" strokeWidth={2} aria-hidden />
                      <input
                        id="schedule-time"
                        type="time"
                        value={schedule.time}
                        onChange={(e) => updateSchedule({ time: e.target.value })}
                        className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none [color-scheme:dark]"
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-zinc-600">Local time on this computer.</p>
                  </div>

                  {schedule.frequency === 'weekly' && (
                    <div className="sm:col-span-1">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                        Weekday
                      </p>
                      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Day of week">
                        {WEEKDAY_SHORT.map((label, i) => {
                          const active = (schedule.dayOfWeek ?? 0) === i
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() => updateSchedule({ dayOfWeek: i })}
                              className={`min-w-[2.75rem] rounded-lg px-2 py-2 text-center text-[11px] font-semibold transition-all ${
                                active
                                  ? 'bg-[#8d6e9e]/25 text-[#e8dff0] ring-1 ring-[#8d6e9e]/45'
                                  : 'bg-zinc-900/60 text-zinc-500 ring-1 ring-white/[0.06] hover:text-zinc-300'
                              }`}
                            >
                              {label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {schedule.frequency === 'monthly' && (
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                        Day of month
                      </p>
                      <div
                        className="grid max-w-[280px] grid-cols-7 gap-1.5"
                        role="group"
                        aria-label="Day of month"
                      >
                        {Array.from({ length: 28 }, (_, idx) => idx + 1).map((d) => {
                          const active = (schedule.dayOfMonth ?? 1) === d
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => updateSchedule({ dayOfMonth: d })}
                              className={`aspect-square rounded-md text-[11px] font-semibold tabular-nums transition-all ${
                                active
                                  ? 'bg-[#8d6e9e]/25 text-[#e8dff0] ring-1 ring-[#8d6e9e]/45'
                                  : 'bg-zinc-900/60 text-zinc-500 ring-1 ring-white/[0.06] hover:text-zinc-300'
                              }`}
                            >
                              {d}
                            </button>
                          )
                        })}
                      </div>
                      <p className="mt-2 text-[11px] leading-relaxed text-zinc-600">
                        Days 1–28 only (scheduler limit). Pick a day that exists every month.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#0e141c] p-5 shadow-xl shadow-black/25">
          <div className="mb-5 flex items-center gap-3">
            <SectionIcon icon={Zap} variant="accent" />
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Performance</h3>
              <p className="text-xs text-zinc-500">Parallel repo operations (balance speed vs. CPU / disk).</p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Concurrency{' '}
              <span className="text-[#b29bbd]">{settings.concurrencyLimit}</span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={settings.concurrencyLimit}
              onChange={(e) => updateSettings({ concurrencyLimit: Number(e.target.value) })}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-[#8d6e9e]"
            />
            <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
              <span>1 — gentle</span>
              <span>10 — fast</span>
            </div>
          </div>
        </div>

        <InstallGitSection />

        <div className="rounded-2xl border border-white/[0.06] bg-[#0e141c] p-5 shadow-xl shadow-black/25">
          <div className="flex items-center gap-3">
            <SectionIcon icon={Shield} variant="accent" />
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">GitClaw v1.0.0</h3>
              <p className="text-xs leading-relaxed text-zinc-500">
                Settings are stored locally and encrypted. Your token stays on this machine.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

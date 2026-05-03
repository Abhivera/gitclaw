import type { LucideIcon } from 'lucide-react'

const variants = {
  default: 'bg-zinc-800/90 text-zinc-300 ring-zinc-600/40 shadow-inner',
  muted: 'bg-zinc-900/80 text-zinc-400 ring-zinc-800/60',
  accent:
    'bg-[#8d6e9e]/15 text-[#d1c6d6] ring-[#8d6e9e]/35 shadow-[0_0_20px_-8px_rgba(141,110,158,0.6)]',
  success: 'bg-[#8d6e9e]/15 text-[#d1c6d6] ring-[#8d6e9e]/30',
  danger: 'bg-[#502f4c]/40 text-[#d1c6d6] ring-[#502f4c]/60',
} as const

export function SectionIcon({
  icon: Icon,
  variant = 'default',
  className = '',
}: {
  icon: LucideIcon
  variant?: keyof typeof variants
  className?: string
}) {
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${variants[variant]} ${className}`}
    >
      <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.85} aria-hidden />
    </div>
  )
}

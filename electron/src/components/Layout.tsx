import { ReactNode } from 'react'
import Sidebar from './Sidebar'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#070a0f] text-zinc-100">
      <Sidebar />
      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 80% 55% at 50% -15%, rgba(141, 110, 158, 0.18), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(80, 47, 76, 0.16), transparent 45%)',
          }}
        />
        <div className="relative flex-1 overflow-y-auto px-6 py-8 sm:px-10 sm:py-10">
          <div className="mx-auto max-w-4xl">{children}</div>
        </div>
      </main>
    </div>
  )
}

interface PageHeaderProps {
  title: string
  description?: string
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-10">
      <h1 className="text-[1.65rem] font-semibold tracking-tight text-zinc-50">{title}</h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-zinc-500">{description}</p>
      ) : null}
    </header>
  )
}

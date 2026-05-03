// p-limit is ESM-only, so we use a simple implementation
export function createLimiter(concurrency: number) {
  let active = 0
  const queue: Array<() => void> = []

  const next = () => {
    if (queue.length > 0 && active < concurrency) {
      active++
      const resolve = queue.shift()!
      resolve()
    }
  }

  return async <T>(fn: () => Promise<T>): Promise<T> => {
    await new Promise<void>((resolve) => {
      queue.push(resolve)
      next()
    })

    try {
      return await fn()
    } finally {
      active--
      next()
    }
  }
}

import type { GitProvider } from '../src/types'

/** Build an HTTPS clone URL with embedded credentials for the given host. */
export function buildAuthenticatedCloneUrl(
  cloneUrl: string,
  provider: GitProvider,
  token: string,
  bitbucketUsername: string,
): string {
  const u = new URL(cloneUrl)
  if (u.protocol !== 'https:') {
    return cloneUrl
  }
  switch (provider) {
    case 'github':
      u.username = token
      u.password = 'x-oauth-basic'
      break
    case 'gitlab':
      u.username = 'oauth2'
      u.password = token
      break
    case 'bitbucket':
      u.username = bitbucketUsername || ''
      u.password = token
      break
    default:
      break
  }
  return u.toString()
}

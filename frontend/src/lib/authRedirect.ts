type RedirectLocation = {
  pathname?: unknown
  search?: unknown
  hash?: unknown
}

type LocationState = {
  from?: RedirectLocation
}

export function getLoginRedirectPath(state: unknown): string {
  const from = (state as LocationState | null)?.from

  if (
    !from ||
    typeof from.pathname !== 'string' ||
    !from.pathname.startsWith('/') ||
    from.pathname.startsWith('//')
  ) {
    return '/'
  }

  const search =
    typeof from.search === 'string' && from.search.startsWith('?')
      ? from.search
      : ''
  const hash =
    typeof from.hash === 'string' && from.hash.startsWith('#')
      ? from.hash
      : ''

  return `${from.pathname}${search}${hash}`
}

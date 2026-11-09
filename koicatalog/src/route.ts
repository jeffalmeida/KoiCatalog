export type Route =
  | { name: 'inventory' }
  | { name: 'new' }
  | { name: 'edit'; id: string }
  | { name: 'settings' }

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/'
  if (path === '/settings') return { name: 'settings' }
  if (path === '/new') return { name: 'new' }
  const edit = /^\/fish\/([^/]+)$/.exec(path)
  if (edit?.[1]) return { name: 'edit', id: decodeURIComponent(edit[1]) }
  return { name: 'inventory' }
}

export function navigate(hash: string) {
  if (window.location.hash !== hash) window.location.hash = hash
}

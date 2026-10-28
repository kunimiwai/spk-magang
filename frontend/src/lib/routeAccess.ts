/**
 * Role requirement for each role-protected route group in the current UI.
 *
 * This mirrors the allowedRoles values passed to RoleRoute in App.tsx. It is
 * used to reject a stale "return to" path after login when the new account has
 * a different role, without inventing any new permission.
 */
export const ROUTE_ROLE_GROUPS = {
  adminOnly: ['admin'],
  adminProdi: ['admin', 'prodi'],
  mahasiswaOnly: ['mahasiswa'],
  dpmOnly: ['dpm'],
} as const

type RoleGroup = (typeof ROUTE_ROLE_GROUPS)[keyof typeof ROUTE_ROLE_GROUPS]

type RouteRule = {
  pattern: RegExp
  roles: RoleGroup
}

const routeRules: RouteRule[] = [
  { pattern: /^\/mitra(?:\/|$)/, roles: ROUTE_ROLE_GROUPS.adminOnly },
  { pattern: /^\/kriteria(?:\/|$)/, roles: ROUTE_ROLE_GROUPS.adminProdi },
  { pattern: /^\/mata-kuliah(?:\/|$)/, roles: ROUTE_ROLE_GROUPS.adminProdi },
  { pattern: /^\/admin(?:\/|$)/, roles: ROUTE_ROLE_GROUPS.adminProdi },
  { pattern: /^\/mahasiswa(?:\/|$)/, roles: ROUTE_ROLE_GROUPS.mahasiswaOnly },
  { pattern: /^\/dpm(?:\/|$)/, roles: ROUTE_ROLE_GROUPS.dpmOnly },
]

const authenticatedOnlyPaths = new Set(['/', '/profil'])

export function isPathAllowedForRole(
  path: string,
  role: string,
): boolean {
  if (!path.startsWith('/') || path.startsWith('//')) {
    return false
  }

  const pathname = path.split(/[?#]/, 1)[0]

  if (authenticatedOnlyPaths.has(pathname)) {
    return true
  }

  const rule = routeRules.find(({ pattern }) => pattern.test(pathname))

  return rule ? (rule.roles as readonly string[]).includes(role) : false
}

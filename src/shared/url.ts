export function normalizePageUrl(href: string): string {
  try {
    const u = new URL(href)
    u.hash = ''
    return u.href.replace(/\/$/, '') || u.href
  } catch {
    return href
  }
}

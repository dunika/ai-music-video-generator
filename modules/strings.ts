export function toTitleCase(str: string) {
  return str
    .split(/[-_]/) // Split on hyphens or underscores
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

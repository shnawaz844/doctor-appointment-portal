export function resolveImageUrl(image?: string | null): string {
  if (!image) return ""

  const value = image.trim()
  if (!value) return ""

  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:")) {
    return value
  }

  // Normalize legacy values saved without a leading slash.
  if (value.startsWith("api/")) return `/${value}`
  if (value.startsWith("/")) return value

  return `/${value}`
}

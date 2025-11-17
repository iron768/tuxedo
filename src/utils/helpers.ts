/**
 * Parse a scene path into name and folder
 */
export interface ParsedScenePath {
  path: string
  name: string
  folder: string
}

export function parseScenePath(scenePath: string): ParsedScenePath {
  const parts = scenePath.split('/')
  const name = parts[parts.length - 1]
  const folder = parts.slice(0, -1).join('/')
  return { path: scenePath, name, folder }
}

/**
 * Format error message for display
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unknown error occurred'
}

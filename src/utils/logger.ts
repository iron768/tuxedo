/**
 * Centralized logging utility for the Tuxedo editor
 * Provides consistent logging with namespaces and log levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

class Logger {
  private level: LogLevel = LogLevel.INFO
  private enabledNamespaces: Set<string> = new Set(['*'])

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void {
    this.level = level
  }

  /**
   * Enable specific namespaces (e.g., 'phaser', 'api', 'scene')
   * Use '*' to enable all
   */
  enableNamespaces(...namespaces: string[]): void {
    this.enabledNamespaces.clear()
    namespaces.forEach(ns => this.enabledNamespaces.add(ns))
  }

  /**
   * Check if a namespace is enabled
   */
  private isNamespaceEnabled(namespace: string): boolean {
    return this.enabledNamespaces.has('*') || this.enabledNamespaces.has(namespace)
  }

  /**
   * Format log message with namespace and timestamp
   */
  private format(namespace: string, message: string): string {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
    return `[${timestamp}] [${namespace}] ${message}`
  }

  /**
   * Debug level logging
   */
  debug(namespace: string, message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG && this.isNamespaceEnabled(namespace)) {
      console.debug(this.format(namespace, message), ...args)
    }
  }

  /**
   * Info level logging
   */
  info(namespace: string, message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO && this.isNamespaceEnabled(namespace)) {
      console.log(this.format(namespace, message), ...args)
    }
  }

  /**
   * Warning level logging
   */
  warn(namespace: string, message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.WARN && this.isNamespaceEnabled(namespace)) {
      console.warn(this.format(namespace, message), ...args)
    }
  }

  /**
   * Error level logging
   */
  error(namespace: string, message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.ERROR && this.isNamespaceEnabled(namespace)) {
      console.error(this.format(namespace, message), ...args)
    }
  }

  /**
   * Group multiple log statements
   */
  group(namespace: string, title: string, collapsed: boolean = false): void {
    if (this.isNamespaceEnabled(namespace)) {
      if (collapsed) {
        console.groupCollapsed(this.format(namespace, title))
      } else {
        console.group(this.format(namespace, title))
      }
    }
  }

  /**
   * End a log group
   */
  groupEnd(): void {
    console.groupEnd()
  }
}

// Singleton instance
export const logger = new Logger()

// Development mode configuration
if (import.meta.env.DEV) {
  logger.setLevel(LogLevel.DEBUG)
  // Enable specific namespaces for debugging
  // logger.enableNamespaces('phaser', 'api', 'scene')
}

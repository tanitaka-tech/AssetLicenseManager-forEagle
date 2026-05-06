type FsPromises = typeof import("node:fs/promises");
type PathModule = typeof import("node:path");
type OsModule = typeof import("node:os");

type NodeRequireLike = (id: string) => unknown;

declare global {
  interface Window {
    require?: NodeRequireLike;
  }
}

function getRequire(): NodeRequireLike | null {
  if (typeof window === "undefined") return null;
  return window.require ?? null;
}

function safeRequire<T>(...candidates: string[]): T | null {
  const req = getRequire();
  if (!req) return null;
  for (const id of candidates) {
    try {
      return req(id) as T;
    } catch {
      // try next
    }
  }
  return null;
}

export function getFs(): FsPromises | null {
  return safeRequire<FsPromises>("node:fs/promises", "fs/promises");
}

export function getPath(): PathModule | null {
  return safeRequire<PathModule>("node:path", "path");
}

export function getOs(): OsModule | null {
  return safeRequire<OsModule>("node:os", "os");
}

export function isEagleAvailable(): boolean {
  return typeof eagle !== "undefined";
}

export function isNodeAvailable(): boolean {
  return getFs() !== null;
}

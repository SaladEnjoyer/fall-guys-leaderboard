import { mkdir, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

export function dataDirCandidates(
  env: NodeJS.ProcessEnv = process.env,
  cwd = process.cwd(),
) {
  const dirs: string[] = []
  const configured = env.DATA_DIR?.trim()
  if (configured) dirs.push(configured)
  dirs.push(path.join(cwd, "data"))
  dirs.push(path.join(os.tmpdir(), "liga-fall-guys"))
  return dirs
}

export async function pickWritableDir(candidates: string[]) {
  let lastError: unknown = new Error("No writable folder for the league file.")
  for (const dir of candidates) {
    const probe = path.join(dir, `.write-probe-${process.pid}`)
    try {
      await mkdir(dir, { recursive: true })
      await writeFile(probe, "ok")
      await rm(probe, { force: true })
      return dir
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

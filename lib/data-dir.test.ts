import assert from "node:assert/strict"
import { mkdtemp, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { dataDirCandidates, pickWritableDir } from "./data-dir.ts"

test("a blocked folder is skipped for a writable one", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "liga-dir-"))
  const blocked = path.join(root, "blocked")
  await writeFile(blocked, "not a directory")
  const writable = path.join(root, "ok")
  const chosen = await pickWritableDir([blocked, writable])
  assert.equal(chosen, writable)
})

test("the configured folder comes first", () => {
  const dirs = dataDirCandidates({ DATA_DIR: "/data" }, "/app")
  assert.equal(dirs[0], "/data")
  assert.equal(dirs[1], path.join("/app", "data"))
})

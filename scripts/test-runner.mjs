// Forces Rollup to use the JS implementation (no native binary) and runs Vitest
process.env.ROLLUP_USE_NODE_JS = 'true'

import path from 'node:path'
import { pathToFileURL } from 'node:url'

const vitestEntrypoint = path.resolve('./node_modules/vitest/vitest.mjs')
try {
  const mod = await import(pathToFileURL(vitestEntrypoint).href)
  const code = await mod.run() // equivalent to `vitest run`
  if (typeof code === 'number' && code !== 0) process.exit(code)
} catch (err) {
  console.error(err)
  process.exit(1)
}

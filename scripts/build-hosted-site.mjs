import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

// Cloudflare Pages publishes the static Vite output directly.
if (process.env.CF_PAGES === '1') process.exit(0)

const client = 'tmp/hosting-client'
const files = ['index.html', ...(await readdir(join(client, 'assets'))).map(name => `assets/${name}`)]
const assets = Object.fromEntries(await Promise.all(files.map(async file => [
  file === 'index.html' ? '/' : `/${file}`,
  (await readFile(join(client, file))).toString('base64'),
])))
const worker = await readFile('worker/index.js', 'utf8')
await mkdir('dist', { recursive: true })
const output = await readdir('dist')
if (output.some(name => name !== 'server')) throw new Error('The output directory contains a build for another host. Move dist aside and build again.')

const bundle = `const assets = ${JSON.stringify(assets)};\n${worker}`
await mkdir('dist/server', { recursive: true })
await writeFile('dist/server/index.js', bundle)

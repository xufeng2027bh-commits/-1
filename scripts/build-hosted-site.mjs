import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const client = 'tmp/hosting-client'
const files = ['index.html', ...(await readdir(join(client, 'assets'))).map(name => `assets/${name}`)]
const assets = Object.fromEntries(await Promise.all(files.map(async file => [
  file === 'index.html' ? '/' : `/${file}`,
  (await readFile(join(client, file))).toString('base64'),
])))
const worker = await readFile('worker/index.js', 'utf8')
await mkdir('dist/server', { recursive: true })
const output = await readdir('dist')
if (output.some(name => name !== 'server')) throw new Error('Keep dist for the hosted Worker only; move the old static build before deploying.')
await writeFile('dist/server/index.js', `const assets = ${JSON.stringify(assets)};\n${worker}`)

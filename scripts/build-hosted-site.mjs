import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const client = 'tmp/hosting-client'
const files = ['index.html', ...(await readdir(join(client, 'assets'))).map(name => `assets/${name}`)]
const assets = Object.fromEntries(await Promise.all(files.map(async file => [
  file === 'index.html' ? '/' : `/${file}`,
  (await readFile(join(client, file))).toString('base64'),
])))
const worker = await readFile('worker/index.js', 'utf8')
const pages = process.env.CF_PAGES === '1'
const allowed = pages ? ['_worker.js', 'index.html'] : ['server']
await mkdir('dist', { recursive: true })
const output = await readdir('dist')
if (output.some(name => !allowed.includes(name))) throw new Error('The output directory contains a build for another host. Move dist aside and build again.')

const bundle = `const assets = ${JSON.stringify(assets)};\n${worker}`
if (pages) {
  // If Pages serves static files without the Worker, only this fallback is available.
  await writeFile('dist/index.html', '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>作品集暂不可用</title><p>作品集暂不可用，请稍后再试。</p></html>\n')
  await writeFile('dist/_worker.js', bundle)
} else {
  await mkdir('dist/server', { recursive: true })
  await writeFile('dist/server/index.js', bundle)
}

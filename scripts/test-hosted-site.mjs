import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'

const pages = process.env.CF_PAGES === '1'
if (pages) {
  const dir = new URL('../dist/', import.meta.url)
  assert.deepEqual((await readdir(dir)).sort(), ['_headers', '_redirects', 'assets', 'index.html'])
  const html = await readFile(new URL('./index.html', dir), 'utf8')
  assert.match(html, /id="root"/)
  assert.doesNotMatch(html, /type="password"|PORTFOLIO_PASSWORD/)
  const paths = [...html.matchAll(/(?:href|src)="(\/assets\/[^"]+)"/g)].map(([, path]) => path)
  assert.ok(paths.some(path => path.endsWith('.js')) && paths.some(path => path.endsWith('.css')))
  for (const path of [...paths, '/assets/project-review-demo.mp4']) {
    assert.ok((await readFile(new URL(`.${path}`, dir))).byteLength > 0)
  }
  console.log('Static, password-free Pages output and portfolio assets passed.')
  process.exit(0)
}
const { default: worker } = await import('../dist/server/index.js')

const origin = process.env.PORTFOLIO_TEST_URL || 'https://example.com'
const password = '230586490172'
const env = { PORTFOLIO_PASSWORD: password, PORTFOLIO_SESSION_KEY: 'test-only-session-key-not-a-real-secret' }
const call = (path, options) => process.env.PORTFOLIO_TEST_URL
  ? fetch(new URL(path, origin), { ...options, redirect: 'manual', signal: AbortSignal.timeout(15000) })
  : worker.fetch(new Request(new URL(path, origin), options), env)

const home = await call('/')
assert.equal(home.status, 200)
assert.equal(home.headers.get('Referrer-Policy'), 'same-origin')
assert.match(await home.text(), /type="password" inputmode="numeric"/)
assert.equal((await call('/assets/xufeng-hero-cutout.webp')).status, 401)
assert.equal((await call('/assets/project-review-demo.mp4')).status, 401)
const unlock = value => call('/', { method: 'POST', headers: { Origin: origin }, body: new URLSearchParams({ password: value }) })
const wrong = await unlock('123')
assert.equal(wrong.status, 303)
assert.ok(!wrong.headers.getSetCookie().some(cookie => cookie.startsWith('__Host-xf_portfolio=')))
assert.match(await (await call(wrong.headers.get('Location'))).text(), /role="alert"/)
const success = await unlock('2305-8649-0172')
assert.equal(success.status, 303)
const session = success.headers.getSetCookie().find(cookie => cookie.startsWith('__Host-xf_portfolio='))
assert.ok(session)
assert.match(session, /Secure; HttpOnly; SameSite=Lax/)
const headers = { Cookie: session.split(';')[0] }
const html = await (await call('/', { headers })).text()
assert.match(html, /id="root"/)
assert.doesNotMatch(html, /type="password"/)
const js = html.match(/src="(\/assets\/[^"\s]+\.js)"/)?.[1]
const css = html.match(/href="(\/assets\/[^"\s]+\.css)"/)?.[1]
assert.ok(js && css, 'Portfolio entry files are missing')
for (const [path, type] of [[js, /javascript/], [css, /text\/css/], ['/assets/xufeng-hero-cutout.webp', /image\/webp/]]) {
  assert.equal((await call(path)).status, 401)
  const res = await call(path, { headers })
  assert.equal(res.status, 200)
  assert.match(res.headers.get('Content-Type'), type)
  assert.ok((await res.arrayBuffer()).byteLength > 0)
}
const video = await call('/assets/project-review-demo.mp4', { headers: { ...headers, Range: 'bytes=0-63' } })
assert.equal(video.status, 206)
assert.equal((await video.arrayBuffer()).byteLength, 64)
const legacy = await call('/unlock')
assert.equal(legacy.status, 303)
assert.equal(legacy.headers.get('Location'), '/')
assert.equal((await call('/server/index.js', { headers })).status, 404)
console.log('Numeric password, retry, protected assets, legacy redirect and authenticated video passed.')

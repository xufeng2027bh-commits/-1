const encoder = new TextEncoder()
const cookieName = '__Host-xf_portfolio'
const duration = 8 * 60 * 60
const contentTypes = {
  js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8',
  webp: 'image/webp', mp4: 'video/mp4', html: 'text/html; charset=utf-8',
}

function response(body, status = 200, extra = {}) {
  return new Response(body, { status, headers: {
    'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow, noarchive', 'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY', ...extra,
  } })
}

function gate(method, error = false) {
  const message = error ? '<p class="error" role="alert">密码不正确，请重新输入。</p>' : ''
  return response(method === 'HEAD' ? null : `<!doctype html><html lang="zh-CN"><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#0c0c0c">
<title>徐锋｜作品集访问</title><style>
*{box-sizing:border-box}body{min-height:100svh;margin:0;display:grid;place-items:center;padding:24px;background:#0c0c0c;color:#f2f1ed;font-family:system-ui,"PingFang SC","Microsoft YaHei",sans-serif}main{position:relative;overflow:hidden;width:min(100%,460px);padding:clamp(24px,6vw,48px);border:1px solid #333;border-top:2px solid #e1252c;background:radial-gradient(ellipse at top right,#31171a,#121212 65%)}small{color:#ff7a80;letter-spacing:.15em}h1{font-size:clamp(30px,7vw,46px);margin:16px 0 12px}p{color:#bcb8b8;font-size:14px;line-height:1.7}form{margin-top:28px}label{display:block;margin-bottom:8px;font-size:14px}input,button{width:100%;min-height:48px;font:inherit;border-radius:0}input{background:#0e0e0e;color:white;border:1px solid #666;padding:10px 12px}button{margin-top:12px;border:0;background:#d32129;color:white;cursor:pointer;font-weight:600}input:focus-visible,button:focus-visible{outline:2px solid #ff8a90;outline-offset:3px}.error{color:#ff9297}
</style><main><small>XF / PRIVATE PORTFOLIO</small><h1>作品集访问</h1><p>请输入访问密码，查看徐锋的项目与作品。</p>
<form action="/" method="post"><label for="password">访问密码</label><input id="password" name="password" type="password" inputmode="numeric" autocomplete="current-password" required maxlength="20" ${error ? 'aria-invalid="true"' : ''}>${message}<button type="submit">解锁作品集 →</button></form></main></html>`, 200, {
    'Content-Type': contentTypes.html,
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
    'Referrer-Policy': 'same-origin',
  })
}

async function signature(secret, expiry) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const hash = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(`xf-portfolio:v1:${expiry}`)))
  return Array.from(hash, byte => byte.toString(16).padStart(2, '0')).join('')
}

function equal(a, b) {
  const x = encoder.encode(a)
  const y = encoder.encode(b)
  let diff = x.length ^ y.length
  for (let i = 0; i < y.length; i++) diff |= (x[i] ?? 0) ^ y[i]
  return diff === 0
}

async function unlocked(request, secret) {
  const cookies = request.headers.get('Cookie') ?? ''
  const token = cookies.split(';').map(part => part.trim()).find(part => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1)
  const match = token?.match(/^(\d{1,12})\.([0-9a-f]{64})$/)
  if (!match || Number(match[1]) <= Math.floor(Date.now() / 1000)) return false
  return equal(match[2], await signature(secret, match[1]))
}

async function passwordFrom(request) {
  if (!request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded') || !request.body) return ''
  const reader = request.body.getReader()
  const decoder = new TextDecoder()
  let size = 0
  let body = ''
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.length
      if (size > 1024) { await reader.cancel(); return '' }
      body += decoder.decode(value, { stream: true })
    }
    return new URLSearchParams(body + decoder.decode()).get('password') ?? ''
  } finally {
    reader.releaseLock()
  }
}

function serveAsset(request, path) {
  if (!Object.hasOwn(assets, path)) return response(null, 404)
  const data = Uint8Array.from(atob(assets[path]), char => char.charCodeAt(0))
  const ext = path === '/' ? 'html' : path.split('.').pop()
  const headers = { 'Content-Type': contentTypes[ext] ?? 'application/octet-stream', 'Content-Length': String(data.length) }
  const range = request.headers.get('Range')
  if (ext === 'mp4') {
    headers['Accept-Ranges'] = 'bytes'
    if (range) {
      const match = range.match(/^bytes=(\d*)-(\d*)$/)
      const start = match?.[1] ? Number(match[1]) : Math.max(0, data.length - Number(match?.[2]))
      const end = match?.[1] && match[2] ? Math.min(data.length - 1, Number(match[2])) : data.length - 1
      if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(start) || start > end || start >= data.length) {
        return response(null, 416, { 'Content-Range': `bytes */${data.length}` })
      }
      return response(request.method === 'HEAD' ? null : data.subarray(start, end + 1), 206, {
        ...headers, 'Content-Length': String(end - start + 1), 'Content-Range': `bytes ${start}-${end}/${data.length}`,
      })
    }
  }
  return response(request.method === 'HEAD' ? null : data, 200, headers)
}

export default {
  async fetch(request, env) {
    const passwordSecret = env.PORTFOLIO_PASSWORD
    const sessionSecret = env.PORTFOLIO_SESSION_KEY
    if (!/^\d{12}$/.test(passwordSecret ?? '') || typeof sessionSecret !== 'string' || sessionSecret.length < 32) {
      return response('Service unavailable', 503)
    }
    const url = new URL(request.url)
    const { pathname } = url
    if ((pathname === '/' || pathname === '/unlock') && request.method === 'POST') {
      const origin = request.headers.get('Origin')
      if (origin && origin !== url.origin) return response(null, 403)
      const password = (await passwordFrom(request)).replace(/[\s-]/g, '')
      if (!equal(password, passwordSecret)) return response(null, 303, { Location: '/?password=incorrect' })
      const expiry = Math.floor(Date.now() / 1000) + duration
      return response(null, 303, {
        Location: '/',
        'Set-Cookie': `${cookieName}=${expiry}.${await signature(sessionSecret, expiry)}; Max-Age=${duration}; Path=/; Secure; HttpOnly; SameSite=Lax`,
      })
    }
    if (!['GET', 'HEAD'].includes(request.method)) return response(null, 405)
    if (pathname === '/unlock') return response(null, 303, { Location: '/' })
    if (!(await unlocked(request, sessionSecret))) return pathname === '/' || pathname === '/index.html'
      ? gate(request.method, url.searchParams.get('password') === 'incorrect')
      : response(null, 401)
    return serveAsset(request, pathname === '/index.html' ? '/' : pathname)
  },
}

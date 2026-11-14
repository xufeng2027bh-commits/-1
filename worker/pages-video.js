// Pages' static video response does not honor Range. Keep this handler off every
// other route so the homepage, scripts and images are still served directly.
const videoPath = '/assets/project-review-demo.mp4'

export default {
  async fetch(request, env) {
    const range = request.headers.get('Range')
    if (request.method !== 'GET' || new URL(request.url).pathname !== videoPath || !range) {
      return env.ASSETS.fetch(request)
    }

    const requestHeaders = new Headers(request.headers)
    for (const name of ['Range', 'If-Range', 'If-None-Match', 'If-Modified-Since']) requestHeaders.delete(name)
    const source = await env.ASSETS.fetch(new Request(request, { headers: requestHeaders }))
    if (source.status !== 200) return source

    const headers = new Headers(source.headers)
    const ifRange = request.headers.get('If-Range')
    if (ifRange && ifRange !== headers.get('ETag') && ifRange !== headers.get('Last-Modified')) return source

    const data = await source.arrayBuffer()
    const match = /^bytes=(\d*)-(\d*)$/i.exec(range)
    const start = match?.[1] ? Number(match[1]) : Math.max(0, data.byteLength - Number(match?.[2]))
    const end = match?.[1] && match[2] ? Math.min(data.byteLength - 1, Number(match[2])) : data.byteLength - 1
    headers.set('Accept-Ranges', 'bytes')
    headers.delete('Content-Encoding')

    if (!match || (!match[1] && !match[2]) || start > end || !Number.isSafeInteger(start)) {
      headers.delete('Content-Length')
      headers.set('Content-Range', `bytes */${data.byteLength}`)
      return new Response(null, { status: 416, headers })
    }

    headers.set('Content-Length', String(end - start + 1))
    headers.set('Content-Range', `bytes ${start}-${end}/${data.byteLength}`)
    return new Response(data.slice(start, end + 1), { status: 206, headers })
  },
}

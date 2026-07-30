const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')
const { chromium } = require('playwright')

async function main() {
  const htmlPath = path.resolve(__dirname, 'echoflow-promo.html')
  const framesDir = path.resolve(__dirname, 'frames')
  fs.mkdirSync(framesDir, { recursive: true })
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--allow-file-access-from-files'],
  })
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' })
  await page.waitForFunction(() => typeof window.draw === 'function')
  await page.waitForTimeout(800)
  for (const second of [1.1, 3.1, 6.1, 8.5, 10.8]) {
    await page.evaluate((time) => window.draw(time * 1000), second)
    await page.screenshot({ path: path.join(framesDir, `frame-${String(second).replace('.', '-')}.png`) })
  }
  await page.goto(pathToFileURL(path.resolve(__dirname, 'player.html')).href, { waitUntil: 'load' })
  await page.waitForFunction(() => {
    const video = document.querySelector('video')
    return video && Number.isFinite(video.duration) && video.videoWidth > 0
  }, { timeout: 15000 })
  const meta = await page.evaluate(() => {
    const video = document.querySelector('video')
    return { duration: video.duration, width: video.videoWidth, height: video.videoHeight, readyState: video.readyState }
  })
  console.log(JSON.stringify(meta))
  await browser.close()
}
main().catch((error) => { console.error(error); process.exit(1) })

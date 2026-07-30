const path = require('path')
const { pathToFileURL } = require('url')
const { chromium } = require('playwright')

async function main() {
  const html = path.resolve(__dirname, 'echoflow-promo.html')
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--allow-file-access-from-files'],
  })
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    acceptDownloads: true,
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  await page.goto(pathToFileURL(html).href, { waitUntil: 'load' })
  const downloadPromise = page.waitForEvent('download', { timeout: 60000 })
  const result = await page.evaluate(() => window.startRecording())
  const download = await downloadPromise
  const output = path.resolve(__dirname, `echoflow-promo-16x9.${result.ext}`)
  await download.saveAs(output)
  console.log(JSON.stringify({ ...result, output }))
  await browser.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

import { chromium } from 'playwright'
async function main() {
  const browser = await chromium.launch({
    executablePath: '/Users/bear/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell',
  })
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } })
  await page.goto('http://localhost:4174/', { waitUntil: 'networkidle', timeout: 20000 })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: '/tmp/landing-top.png' })
  console.log('DONE', await page.title())
  await browser.close()
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
